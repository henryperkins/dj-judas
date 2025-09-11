#!/usr/bin/env python3
"""
rename_to_md.py
---------------
Clone (optionally), sparsify, and convert selected source files to
`.md` while wrapping their contents in language-tagged code fences.

Notable features
----------------
* Sparse / partial clone via `git clone --filter=blob:none --sparse`.
* `--include` (repeatable) → cherry-pick subtrees to materialize.
* Full `.gitignore` support via `pathspec` when available (fallback included).
* Extra excludes via `--exclude`.
* Collision-safe renaming with `--ext-policy`:
    - replace:  foo.ts  -> foo.md
    - suffix:   foo.ts  -> foo.ts.md
    - smart:    try replace, then suffix if a collision would occur
* Skips binary / huge files (configurable threshold).
* Preserves file mtime / permissions (copy2 + unlink).
* Generates a non-Git “export” directory by default.
* End-of-run summary.

Requires Git ≥ 2.43 for cone-mode sparse-checkout.
"""

from __future__ import annotations

# stdlib
import argparse
import fnmatch
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path
from typing import Callable, Iterable, List, Optional

# ---------------------------------------------------------------------------
# Optional dependency: pathspec for full .gitignore fidelity (single impl)
# ---------------------------------------------------------------------------
try:  # pragma: no cover - optional import
    import pathspec as _pathspec_mod  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    _pathspec_mod = None


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger("rename_to_md")
_handler = logging.StreamHandler()
_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
logger.addHandler(_handler)
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
EXTENSIONS = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".cjs": "javascript",
    ".mjs": "javascript",
    ".jsx": "javascript",  # treat JSX as JS for highlight-compat
    ".json": "json",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".toml": "toml",
    ".ini": "ini",
    ".env": "dotenv",
    ".sh": "bash",
    ".bash": "bash",
    ".html": "html",
    ".css": "css",
    ".log": "text",
    ".txt": "text",
    ".mdx": "mdx",
    ".rs": "rust",
}

DEFAULT_BINARY_SIZE_LIMIT = 100_000  # bytes


# ---------------------------------------------------------------------------
# .gitignore helpers (unified implementation)
# ---------------------------------------------------------------------------

def _collect_gitignore_patterns(root: Path) -> List[str]:
    """Gather raw pattern lines from all .gitignore files under *root*."""
    patterns: List[str] = []
    for gitignore in root.rglob(".gitignore"):
        try:
            for line in gitignore.read_text("utf-8").splitlines():
                stripped = line.rstrip("\n")
                if stripped and not stripped.lstrip().startswith("#"):
                    patterns.append(stripped)
        except Exception:  # pragma: no cover
            continue
    return patterns


def build_ignore_spec(root: Path):  # noqa: D401 - concise
    """Return a matcher honoring .gitignore (pathspec or fallback)."""
    patterns = _collect_gitignore_patterns(root)
    if _pathspec_mod is not None:  # fast path using pathspec
        return _pathspec_mod.PathSpec.from_lines("gitwildmatch", patterns)

    glob_re = re.compile(r"[*?\[]")

    def _match_one(string: str, pattern: str) -> bool:
        if pattern.endswith("/"):
            return string.startswith(pattern.rstrip("/"))
        if glob_re.search(pattern):  # contains glob chars
            return fnmatch.fnmatch(string, pattern)
        return string == pattern

    positive: list[str] = []
    negative: list[str] = []
    for pat in patterns:
        (negative if pat.startswith("!") else positive).append(pat.lstrip("!"))

    def _matches(path: Path) -> bool:
        rel = path.relative_to(root)
        rel_str = str(rel)
        matched = any(_match_one(rel_str, p) for p in positive)
        if matched and any(_match_one(rel_str, n) for n in negative):
            matched = False
        return matched

    return _matches


def is_ignored(path: Path, root: Path, ignore_spec) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:  # pragma: no cover
        return False
    if _pathspec_mod is not None:
        return ignore_spec.match_file(str(rel))
    return ignore_spec(path)


# ---------------------------------------------------------------------------
# Extra excludes (user-provided)
# ---------------------------------------------------------------------------

def compile_extra_excludes(
    root: Path,
    patterns: list[str],
) -> Callable[[Path], bool]:
    if not patterns:
        return lambda p: False

    def _excluded(p: Path) -> bool:
        rel = str(p.relative_to(root))
        return any(fnmatch.fnmatch(rel, pat) for pat in patterns)

    return _excluded


# ---------------------------------------------------------------------------
# Git helpers – sparse clone
# ---------------------------------------------------------------------------

def _run(cmd: list[str], cwd: Optional[Path] = None) -> tuple[int, str, str]:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.returncode, proc.stdout, proc.stderr


def sparse_clone(
    url: str,
    dest: Path,
    includes: Iterable[str],
    ref: str | None,
    log: Callable[[str], None],
) -> bool:
    """Perform sparse clone & materialize includes. Return True on success."""
    base_cmd = [
        "git",
        "clone",
        "--filter=blob:none",
        "--depth",
        "1",
        "--sparse",
    ]
    if ref:
        base_cmd += ["--branch", ref]
    base_cmd += [url, str(dest)]

    rc, out, err = _run(base_cmd)
    if rc != 0:
        log(f"sparse-clone failed (clone):\n{err.strip() or out.strip()}")
        return False

    rc, out, err = _run(
        [
            "git",
            "sparse-checkout",
            "set",
            "--cone",
            *includes,
        ],
        cwd=dest,
    )
    if rc != 0:
        log(
            "sparse-clone failed (sparse-checkout):\n"
            f"{err.strip() or out.strip()}"
        )
        return False
    return True


# ---------------------------------------------------------------------------
# Workspace preparation
# ---------------------------------------------------------------------------

def prepare_work_dir(
    source: str,
    *,
    is_url: bool,
    includes: List[str],
    ref: str | None,
    output: str | None,
    log: Callable[[str], None],
) -> Path | None:
    """Prepare working directory; returns path or None on error."""
    if is_url:  # clone → tmp
        tmp = Path(tempfile.mkdtemp(prefix="rename_to_md_"))
        if not sparse_clone(source, tmp, includes, ref, log):
            return None
        src_dir = tmp
    else:
        src_dir = Path(source).expanduser().resolve()
        if not src_dir.is_dir():
            log(f"error: '{src_dir}' is not a directory.")
            return None

    out_dir = (
        Path(output).expanduser().resolve()
        if output
        else src_dir.parent / f"{src_dir.name}_export"
    )
    if out_dir.exists():
        log(f"Removing existing '{out_dir}'.")
        shutil.rmtree(out_dir)

    shutil.copytree(
        src_dir,
        out_dir,
        ignore=shutil.ignore_patterns(".git*", ".hg*", ".svn*"),
        symlinks=True,
        dirs_exist_ok=False,
    )
    log(f"Working tree ready → '{out_dir}'.")
    return out_dir


# ---------------------------------------------------------------------------
# Core conversion
# ---------------------------------------------------------------------------

def _has_sibling_same_stem(src: Path, exts: dict[str, str]) -> bool:
    stem = src.stem
    parent = src.parent
    for p in parent.iterdir():
        if (
            p.is_file()
            and p.stem == stem
            and p.suffix.lower() in exts
            and p != src
        ):
            return True
    return False


def _dst_path_for(src: Path, policy: str, ext: str) -> Path:
    """Compute destination path based on policy. ext includes leading dot."""
    if policy == "replace":
        return src.with_suffix(".md")
    if policy == "suffix":
        return src.with_name(src.name + ".md")
    # smart
    candidate = src.with_suffix(".md")
    if candidate.exists() or _has_sibling_same_stem(src, EXTENSIONS):
        return src.with_name(src.name + ".md")
    return candidate


def rename_and_wrap(
    directory: Path,
    *,
    recursive: bool,
    dry_run: bool,
    ext_policy: str,
    max_bytes: int,
    honor_gitignore: bool,
    extra_excludes: list[str],
    log: Callable[[str], None],
) -> None:
    """Rename & wrap supported files inside *directory*."""
    root = directory.resolve()
    if not root.is_dir():
        log(f"error: '{root}' is not a directory.")
        return

    ignore_spec = build_ignore_spec(root) if honor_gitignore else None
    excluded = compile_extra_excludes(root, extra_excludes)

    # Decide walker strategy
    walker = (
        os.walk(root)
        if recursive
        else [
            (
                str(root),
                [],
                [p.name for p in root.iterdir() if p.is_file()],
            )
        ]
    )

    stats = Counter()

    for curr_root, dirs, files in walker:
        curr_root_path = Path(curr_root)

        # prune ignored/excluded dirs
        pruned_dirs = []
        for d in dirs:
            p = curr_root_path / d
            ign = (
                (ignore_spec and is_ignored(p, root, ignore_spec))
                or excluded(p)
            )
            if not ign:
                pruned_dirs.append(d)
            else:
                stats["dirs_ignored"] += 1
        dirs[:] = pruned_dirs

        for fname in files:
            src = curr_root_path / fname
            if excluded(src):
                stats["skip_excluded"] += 1
                log(f"skip (excluded)  {src}")
                continue
            if ignore_spec and is_ignored(src, root, ignore_spec):
                stats["skip_ignored"] += 1
                log(f"skip (ignored)   {src}")
                continue
            if not src.is_file():
                continue

            ext = src.suffix.lower()
            if ext not in EXTENSIONS:
                stats["skip_ext"] += 1
                continue

            dst = _dst_path_for(src, ext_policy, ext)
            if dst.exists():
                stats["skip_exists"] += 1
                log(f"skip (exists)    {dst}")
                continue

            if dry_run:
                stats["dry_would_convert"] += 1
                log(f"[DRY] would convert {src} → {dst.name}")
                continue

            # read + size/binary guard
            try:
                raw = src.read_bytes()
            except Exception as exc:  # pragma: no cover - rare IO error
                stats["read_error"] += 1
                log(f"read error       {src}: {exc}")
                continue

            if len(raw) > max_bytes or b"\x00" in raw:
                stats["skip_binary_or_large"] += 1
                log(f"skip (bin/large) {src}")
                continue

            # decode with fallbacks
            tried = ("utf-8", "latin-1", "cp1252", "iso-8859-1")
            text: Optional[str] = None
            for enc in tried:
                try:
                    text = raw.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
            if text is None:
                text = raw.decode("utf-8", errors="replace")
                stats["decode_replace"] += 1

            # copy-then-unlink to preserve metadata
            try:
                shutil.copy2(src, dst)  # keeps mode/time
                src.unlink()
            except Exception as exc:  # pragma: no cover - unlikely
                stats["copy_unlink_error"] += 1
                log(f"copy/unlink err  {src}: {exc}")
                try:
                    if dst.exists():
                        dst.unlink(missing_ok=True)
                except Exception:  # pragma: no cover
                    pass
                continue

            fenced = f"```{EXTENSIONS[ext]}\n{text}\n```"
            try:
                dst.write_text(fenced, "utf-8")
            except Exception as exc:  # pragma: no cover
                stats["write_error"] += 1
                log(f"write error      {dst}: {exc}")
                try:
                    shutil.copy2(dst, src)
                    dst.unlink(missing_ok=True)
                except Exception:  # pragma: no cover
                    pass
                continue

            stats["converted"] += 1
            log(f"converted        {src} → {dst.name}")

    # Summary
    total = sum(
        v
        for k, v in stats.items()
        if k in {
            "converted",
            "skip_ignored",
            "skip_excluded",
            "skip_ext",
            "skip_exists",
            "skip_binary_or_large",
            "read_error",
            "copy_unlink_error",
            "write_error",
            "dry_would_convert",
        }
    )
    log(
        "Summary: "
        + ", ".join(f"{k}={v}" for k, v in stats.items() if v)
        + (f", total_seen={total}" if total else "")
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def run_cli() -> None:
    p = argparse.ArgumentParser(
        description=(
            "Clone/sparsify (optional) and convert source files to fenced "
            "Markdown, respecting .gitignore."
        )
    )
    src_group = p.add_mutually_exclusive_group(required=True)
    src_group.add_argument("-d", "--directory", help="Local project directory")
    src_group.add_argument("-u", "--url", help="Git URL to sparse-clone")
    p.add_argument(
        "--include",
        action="append",
        default=[],
        metavar="DIR",
        help=(
            "Directory to include in sparse checkout (repeatable, default: "
            "backend & frontend/src)"
        ),
    )
    p.add_argument(
        "--ref",
        help=(
            "Branch, tag, or commit to checkout when cloning (default: repo "
            "default)"
        ),
    )
    p.add_argument(
        "-o",
        "--output",
        help="Destination directory (default: <source>_export)",
    )
    p.add_argument(
        "-r",
        "--recursive",
        action="store_true",
        help="Recurse into sub-directories",
    )
    p.add_argument("--dry-run", action="store_true", help="Preview only")
    p.add_argument(
        "--ext-policy",
        choices=["replace", "suffix", "smart"],
        default="smart",
        help="How to name .md files (default: smart).",
    )
    p.add_argument(
        "--max-bytes",
        type=int,
        default=DEFAULT_BINARY_SIZE_LIMIT,
        help=(
            "Max file size to convert (default: "
            f"{DEFAULT_BINARY_SIZE_LIMIT} bytes)."
        ),
    )
    p.add_argument(
        "--exclude",
        action="append",
        default=[],
        metavar="GLOB",
        help="Extra exclude pattern(s), relative to root (repeatable).",
    )
    p.add_argument(
        "--no-gitignore",
        action="store_true",
        help="Ignore .gitignore files (process everything unless --exclude).",
    )
    args = p.parse_args()

    includes = args.include or ["backend", "frontend/src"]

    work_dir = prepare_work_dir(
        args.directory or args.url,
        is_url=bool(args.url),
        includes=includes,
        ref=args.ref,
        output=args.output,
        log=logger.info,
    )
    if work_dir is None:
        sys.exit(1)

    rename_and_wrap(
        work_dir,
        recursive=args.recursive,
        dry_run=args.dry_run,
        ext_policy=args.ext_policy,
        max_bytes=args.max_bytes,
        honor_gitignore=not args.no_gitignore,
        extra_excludes=args.exclude,
        log=logger.info,
    )


if __name__ == "__main__":  # pragma: no cover
    run_cli()
