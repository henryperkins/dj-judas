# Agent Responses — September 11, 2025

## Response 1

Nice work on the plan. I reviewed it against the codebase and began the lowest‑risk cleanup it calls for.

**What I changed**
- Removed the deprecated `/social` route mapping
  - Edited `src/react-app/App.tsx` to drop the `SocialHub` lazy import and the `path === '/social'` branch.
- Updated in‑app navigation to target the Social section on the landing page
  - Mobile bottom nav: changed Social item to `href '#social'` (`src/react-app/components/MobileBottomNav.tsx`).
  - “View All Social Updates” CTA: now smooth‑scrolls to `#social` instead of navigating to `/social` (`src/react-app/components/EnhancedLandingPageV2.tsx`).
- Checked off the plan item “Delete `/social` route from App.tsx” in `SOCIAL_CONSOLIDATION_PLAN.md`.

**Why this aligns with the plan**
- Keeps CreatorMediaPanel and the landing page as the main hub.
- Eliminates duplicate entry points without removing any functionality (DynamicSocialFeed and FacebookEvents remain on landing and can be expanded there).

**What I verified**
- No remaining references to `navigate('/social')` or `path === '/social'`.
- `SocialHub.tsx` remains in the tree but is now unused; safe to delete once consolidation completes.

**Next steps I can take**
- Create social module barrel: add `src/react-app/components/social/index.ts` exporting `DynamicSocialFeed` and `FacebookEvents` to standardize imports.
- Consolidate Instagram: decide whether to keep the existing `InstagramEmbed.tsx` or adopt `SocialEmbed.tsx` as the single entry, then deprecate `InstagramHub.tsx`.
- Consolidate Facebook: unify `FacebookPage`/`FacebookVideo`/`FacebookPageEmbed` via a single `FacebookEmbed` component and centralize `useFacebookEmbed` initialization.
- Extract share UI: factor `CreatorMediaPanel` share logic into `components/social/sharing/ShareButton.tsx` with UTM tracking and meta pixel hooks, then re-use in panel.
- Remove dead components: delete `SocialHub.tsx` and, after consolidation, `FacebookHub.tsx` and `InstagramHub.tsx`.
- Update docs and imports: point all social imports to `components/social/*` and adjust references in `EnhancedLandingPageV2` and anywhere else.

Want me to proceed with the `social/index.ts` barrel and a quick “unused component” sweep, or jump straight into the Instagram consolidation first?

---

## Response 2

You should see these exact diffs in-place:

- `src/react-app/App.tsx`
  - Removed `SocialHub` import and route branch
  - Diff:

```diff
--- a/src/react-app/App.tsx
+++ b/src/react-app/App.tsx
-const SocialHub = lazy(() => import('./pages/SocialHub'));
 …
-            : path === '/social' ? <SocialHub />
+            /* /social removed per consolidation plan */
```

- `src/react-app/components/MobileBottomNav.tsx`
  - Social item now scrolls to the Social section
  - Diff:

```diff
--- a/src/react-app/components/MobileBottomNav.tsx
+++ b/src/react-app/components/MobileBottomNav.tsx
-    action: () => navigate('/social')
+    href: '#social'
```

- `src/react-app/components/EnhancedLandingPageV2.tsx`
  - “View All Social Updates →” now smooth‑scrolls to `#social`
  - Diff:

```diff
--- a/src/react-app/components/EnhancedLandingPageV2.tsx
+++ b/src/react-app/components/EnhancedLandingPageV2.tsx
-  onClick={() => navigate('/social')}
+  onClick={() => {
+    const el = document.getElementById('social');
+    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
+  }}
-  View All Social Updates →
+  View Social Updates
```

If you’re not seeing this in the UI:
- Restart the dev server so Vite picks up the changes.
- Confirm you’re opening `dj-judas/src/react-app/*` (not another copy).
- The `/social` page is no longer routed; the “Social” bottom tab and CTA now stay on the landing page and scroll to the Social section.

Do you want me to:
- commit these changes on a `feature/social-consolidation` branch, and
- remove the now-unused `src/react-app/pages/SocialHub.tsx` to avoid confusion?

