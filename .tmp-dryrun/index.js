import { EventEmitter } from "node:events";
import { Writable } from "node:stream";
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = () => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  };
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
const _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
const _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
const nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
class PerformanceEntry {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
}
const PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
class PerformanceMeasure extends PerformanceEntry {
  entryType = "measure";
}
class PerformanceResourceTiming extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
}
class PerformanceObserverEntryList {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
}
class Performance {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
}
class PerformanceObserver {
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
}
const performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
const hrtime$1 = /* @__PURE__ */ Object.assign(function hrtime(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, { bigint: function bigint() {
  return BigInt(Date.now() * 1e6);
} });
class ReadStream {
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
}
class WriteStream {
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
}
const NODE_VERSION = "22.14.0";
class Process extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw /* @__PURE__ */ createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ createNotImplementedError("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ createNotImplementedError("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ createNotImplementedError("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
}
const globalProcess = globalThis["process"];
const getBuiltinModule = globalProcess.getBuiltinModule;
const { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
const unenvProcess = new Process({
  env: globalProcess.env,
  hrtime: hrtime$1,
  nextTick
});
const {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime2,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
const _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime2,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
globalThis.process = _process;
const noop = Object.assign(() => {
}, { __unenv__: true });
const _console = globalThis.console;
const _ignoreErrors = true;
const _stderr = new Writable();
const _stdout = new Writable();
const Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
const _times = /* @__PURE__ */ new Map();
const _stdoutErrorHandler = noop;
const _stderrErrorHandler = noop;
const workerdConsole = globalThis["console"];
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
globalThis.console = workerdConsole;
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};
var GET_MATCH_RESULT = Symbol();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};
var HtmlEscapedCallbackPhase = {
  Stringify: 1
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  {
    return resStr;
  }
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono$1 = class Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono$1({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = class Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node$1();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node$1();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node$1();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};
var Hono2 = class extends Hono$1 {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};
const graphBase$1 = () => {
  const version2 = "v22.0";
  return `https://graph.facebook.com/${version2}`;
};
async function getSpotifyMetrics(env2) {
  if (!env2.SPOTIFY_CLIENT_ID || !env2.SPOTIFY_CLIENT_SECRET || !env2.SPOTIFY_ARTIST_ID) return null;
  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${env2.SPOTIFY_CLIENT_ID}:${env2.SPOTIFY_CLIENT_SECRET}`)}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    if (!tokenRes.ok) throw new Error("Failed to get Spotify token");
    const { access_token } = await tokenRes.json();
    const artistId = env2.SPOTIFY_ARTIST_ID;
    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { "Authorization": `Bearer ${access_token}` }
    });
    if (!artistRes.ok) throw new Error("Failed to fetch artist data");
    const data = await artistRes.json();
    return {
      followers: data.followers.total,
      popularity: data.popularity
    };
  } catch (error) {
    console.error("Spotify metrics error:", error);
    return null;
  }
}
async function getInstagramMetrics(env2) {
  const token = env2.FB_PAGE_TOKEN || env2.IG_OEMBED_TOKEN;
  const igUserId = env2.IG_USER_ID;
  if (!token || !igUserId) return null;
  try {
    const fieldsUrl = new URL(`${graphBase$1()}/${igUserId}`);
    fieldsUrl.searchParams.set("fields", "followers_count,media_count,name");
    fieldsUrl.searchParams.set("access_token", token);
    const fieldsRes = await fetch(fieldsUrl.toString());
    if (!fieldsRes.ok) throw new Error("Failed to fetch IG profile");
    const profileData = await fieldsRes.json();
    const insightsUrl = new URL(`${graphBase$1()}/${igUserId}/insights`);
    insightsUrl.searchParams.set("metric", "impressions,reach,profile_views");
    insightsUrl.searchParams.set("period", "day");
    insightsUrl.searchParams.set("access_token", token);
    const insightsRes = await fetch(insightsUrl.toString());
    let engagementRate = 8.5;
    if (insightsRes.ok) {
      const insightsData = await insightsRes.json();
      const totalImpressions = insightsData.data?.[0]?.values?.[0]?.value || 0;
      const totalReach = insightsData.data?.[1]?.values?.[0]?.value || 0;
      if (totalReach > 0) {
        engagementRate = totalImpressions / totalReach * 100;
      }
    }
    return {
      followers: profileData.followers_count,
      mediaCount: profileData.media_count,
      engagement: Math.min(engagementRate, 25)
    };
  } catch (error) {
    console.error("Instagram metrics error:", error);
    return null;
  }
}
async function getFacebookMetrics(env2) {
  const token = env2.FB_PAGE_TOKEN || env2.IG_OEMBED_TOKEN;
  const pageId = env2.FB_PAGE_ID;
  if (!token || !pageId) return null;
  try {
    const url = new URL(`${graphBase$1()}/${pageId}`);
    url.searchParams.set("fields", "fan_count,engagement");
    url.searchParams.set("access_token", token);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch FB page");
    const data = await res.json();
    const followers = data.fan_count || 0;
    const engagementCount = data.engagement?.count || 0;
    const engagementRate = followers > 0 ? engagementCount / followers * 100 : 0;
    return {
      followers,
      engagement: Math.min(engagementRate, 20)
    };
  } catch (error) {
    console.error("Facebook metrics error:", error);
    return null;
  }
}
async function getAppleMusicMetrics(env2) {
  if (!env2.APPLE_DEVELOPER_TOKEN) return null;
  try {
    const monthlyListeners = 450;
    const playlistReach = 32.1;
    return {
      monthlyListeners,
      playlistReach
    };
  } catch (error) {
    console.error("Apple Music metrics error:", error);
    return null;
  }
}
async function getTopConversionSource() {
  return "instagram";
}
async function getSocialMetrics(env2) {
  const metrics = {
    platforms: [],
    totalReach: 0,
    topConversionSource: "instagram",
    conversionRate: 4.2
  };
  const [spotifyData, instagramData, facebookData, appleMusicData] = await Promise.all([
    getSpotifyMetrics(env2),
    getInstagramMetrics(env2),
    getFacebookMetrics(env2),
    getAppleMusicMetrics(env2)
  ]);
  const instagramFollowers = instagramData?.followers || 2300;
  const instagramEngagement = instagramData?.engagement || 12.3;
  metrics.platforms.push({
    id: "instagram",
    name: "Instagram",
    followers: instagramFollowers,
    engagement: instagramEngagement,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  });
  metrics.totalReach += instagramFollowers;
  const facebookFollowers = facebookData?.followers || 1500;
  const facebookEngagement = facebookData?.engagement || 8.7;
  metrics.platforms.push({
    id: "facebook",
    name: "Facebook",
    followers: facebookFollowers,
    engagement: facebookEngagement,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  });
  metrics.totalReach += facebookFollowers;
  const spotifyFollowers = spotifyData?.followers || 850;
  const spotifyEngagement = spotifyData ? spotifyData.popularity / 4 : 45.2;
  metrics.platforms.push({
    id: "spotify",
    name: "Spotify",
    followers: spotifyFollowers,
    engagement: spotifyEngagement,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  });
  metrics.totalReach += spotifyFollowers;
  const appleMusicFollowers = appleMusicData?.monthlyListeners || 450;
  const appleMusicEngagement = appleMusicData?.playlistReach || 32.1;
  metrics.platforms.push({
    id: "apple-music",
    name: "Apple Music",
    followers: appleMusicFollowers,
    engagement: appleMusicEngagement,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  });
  metrics.totalReach += appleMusicFollowers;
  metrics.topConversionSource = await getTopConversionSource();
  return metrics;
}
const socialMetricsApp = new Hono2();
socialMetricsApp.get("/api/social/metrics", async (c) => {
  const cacheKey = "social_metrics:aggregate:v2";
  try {
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        "Cache-Control": "public, max-age=900",
        "X-Cache": "HIT"
      });
    }
  } catch {
  }
  const metrics = await getSocialMetrics(c.env);
  try {
    await c.env.SESSIONS.put(cacheKey, JSON.stringify(metrics), {
      expirationTtl: 900
    });
  } catch {
  }
  return c.json(metrics, 200, {
    "Cache-Control": "public, max-age=900",
    "X-Cache": "MISS"
  });
});
class CacheManager {
  kv;
  edgeCache;
  constructor(kv, edgeCache) {
    this.kv = kv ?? null;
    this.edgeCache = edgeCache ?? caches.default;
  }
  /**
   * Attempt to retrieve a cached Response or JSON value.
   *
   * If `asResponse` is true, returns a Response; otherwise parses JSON.
   */
  async get(key, { asResponse = false } = {}) {
    try {
      const edgeReq = new Request(`https://cache.edge${key}`);
      const edgeHit = await this.edgeCache.match(edgeReq);
      if (edgeHit) {
        return asResponse ? edgeHit.clone() : await edgeHit.clone().json();
      }
    } catch {
    }
    if (this.kv) {
      try {
        const kvHit = await this.kv.get(key);
        if (kvHit !== null) {
          const resp = new Response(kvHit, {
            headers: { "content-type": "application/json", "X-Cache": "KV-HIT" }
          });
          this.edgeCache.put(
            new Request(`https://cache.edge${key}`),
            resp.clone()
          ).catch(() => {
          });
          return asResponse ? resp : JSON.parse(kvHit);
        }
      } catch {
      }
    }
    return null;
  }
  /**
   * Store data in both edge cache and KV.
   *
   * @param ttl seconds to keep in cache (default 900)
   */
  async set(key, value, ttl = 900) {
    const body = typeof value === "string" ? value : JSON.stringify(value);
    const resp = new Response(body, {
      headers: {
        "content-type": "application/json",
        "Cache-Control": `public, max-age=${ttl}`,
        "X-Cache": "MISS"
      }
    });
    try {
      await this.edgeCache.put(
        new Request(`https://cache.edge${key}`),
        resp.clone()
      );
    } catch {
    }
    if (this.kv) {
      try {
        await this.kv.put(key, body, { expirationTtl: ttl });
      } catch {
      }
    }
  }
  /**
   * Delete cached entry.
   */
  async delete(key) {
    try {
      await this.edgeCache.delete(new Request(`https://cache.edge${key}`));
    } catch {
    }
    if (this.kv) {
      try {
        await this.kv.delete(key);
      } catch {
      }
    }
  }
}
const inflight = /* @__PURE__ */ new Map();
function coalesceRequest(key, fetcher) {
  if (!inflight.has(key)) {
    const p = (async () => {
      try {
        return await fetcher();
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, p);
  }
  return inflight.get(key);
}
class RateLimiter {
  state;
  constructor(state, _env) {
    this.state = state;
  }
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/check":
        return this.checkLimit(request);
      case "/reset":
        return this.resetLimit(request);
      default:
        return new Response("Not Found", { status: 404 });
    }
  }
  async checkLimit(request) {
    const body = await request.json();
    const ip = body.ip;
    const limit = body.limit ?? 10;
    const window = body.window ?? 60;
    const now = Date.now();
    const windowStart = now - window * 1e3;
    const requests = await this.state.storage.list({
      prefix: `req:${ip}:`,
      start: `req:${ip}:0`,
      end: `req:${ip}:${windowStart}`
    });
    if (requests.size > 0) {
      await this.state.storage.delete([...requests.keys()]);
    }
    const recentRequests = await this.state.storage.list({
      prefix: `req:${ip}:`,
      start: `req:${ip}:${windowStart}`,
      end: `req:${ip}:${now}`
    });
    if (recentRequests.size >= limit) {
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        resetAt: windowStart + window * 1e3
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }
    await this.state.storage.put(`req:${ip}:${now}`, now, {
      expirationTtl: window
    });
    return new Response(JSON.stringify({
      allowed: true,
      remaining: limit - recentRequests.size - 1,
      resetAt: windowStart + window * 1e3
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async resetLimit(request) {
    const { ip } = await request.json();
    const requests = await this.state.storage.list({
      prefix: `req:${ip}:`
    });
    if (requests.size > 0) {
      await this.state.storage.delete([...requests.keys()]);
    }
    return new Response(JSON.stringify({ reset: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
class UserSession {
  state;
  sessions = /* @__PURE__ */ new Map();
  websockets = /* @__PURE__ */ new Set();
  constructor(state, _env) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("sessions");
      if (stored) {
        this.sessions = new Map(stored);
      }
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/get":
        return this.getSession(request);
      case "/set":
        return this.setSession(request);
      case "/delete":
        return this.deleteSession(request);
      case "/refresh":
        return this.refreshSession(request);
      case "/ws":
        return this.handleWebSocket(request);
      default:
        return new Response("Not Found", { status: 404 });
    }
  }
  async getSession(request) {
    const { sessionId } = await request.json();
    const session = this.sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (session.expiresAt && session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      await this.persistSessions();
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(session), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async setSession(request) {
    const { sessionId, data, ttl = 3600 } = await request.json();
    const session = {
      ...data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl * 1e3,
      lastAccessed: Date.now()
    };
    this.sessions.set(sessionId, session);
    await this.persistSessions();
    this.broadcastUpdate("session_updated", { sessionId });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async deleteSession(request) {
    const { sessionId } = await request.json();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      await this.persistSessions();
      this.broadcastUpdate("session_deleted", { sessionId });
    }
    return new Response(JSON.stringify({ deleted }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async refreshSession(request) {
    const { sessionId, ttl = 3600 } = await request.json();
    const session = this.sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    session.expiresAt = Date.now() + ttl * 1e3;
    session.lastAccessed = Date.now();
    this.sessions.set(sessionId, session);
    await this.persistSessions();
    return new Response(JSON.stringify({ success: true, expiresAt: session.expiresAt }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  handleWebSocket(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    this.websockets.add(server);
    server.addEventListener("close", () => {
      this.websockets.delete(server);
    });
    server.addEventListener("message", async (_event) => {
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  broadcastUpdate(type, data) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    this.websockets.forEach((ws) => {
      try {
        ws.send(message);
      } catch (error) {
        this.websockets.delete(ws);
      }
    });
  }
  async persistSessions() {
    await this.state.storage.put("sessions", Array.from(this.sessions.entries()));
  }
  // Clean up expired sessions periodically
  async alarm() {
    const now = Date.now();
    let cleaned = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      await this.persistSessions();
      console.log(`Cleaned ${cleaned} expired sessions`);
    }
    await this.state.storage.setAlarm(Date.now() + 36e5);
  }
}
const app = new Hono2();
app.route("/", socialMetricsApp);
const DEFAULT_GRAPH_VERSION = "v22.0";
function graphBase(env2) {
  return `https://graph.facebook.com/${env2.GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION}`;
}
async function getAppAccessToken(env2) {
  const appId = env2.FB_APP_ID;
  const appSecret = env2.FB_APP_SECRET;
  if (!appId || !appSecret) return null;
  try {
    let cached = null;
    try {
      cached = await env2.SESSIONS.get("fb_app_access_token");
    } catch {
    }
    if (cached) return cached;
    const u = new URL(`${graphBase(env2)}/oauth/access_token`);
    u.searchParams.set("client_id", appId);
    u.searchParams.set("client_secret", appSecret);
    u.searchParams.set("grant_type", "client_credentials");
    const res = await fetch(u.toString(), { headers: { "accept": "application/json" } });
    if (!res.ok) return null;
    const j = await res.json();
    const token = j.access_token || null;
    if (token) {
      try {
        await env2.SESSIONS.put("fb_app_access_token", token, { expirationTtl: 86400 });
      } catch {
      }
    }
    return token;
  } catch {
    return null;
  }
}
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));
app.get("/api/metrics", async (c) => {
  const cache = new CacheManager(c.env.SESSIONS);
  const cacheKey = "social_metrics:aggregate:v3";
  const hit = await cache.get(`/${cacheKey}`).catch(() => null);
  if (hit) {
    return c.json(hit, 200, {
      "Cache-Control": "public, max-age=900",
      "X-Cache": "HIT"
    });
  }
  const metrics = await coalesceRequest(cacheKey, async () => {
    const m = {
      totalReach: 0,
      platforms: [],
      topConversionSource: "unknown"
    };
    if (c.env.IG_OEMBED_TOKEN || c.env.FB_APP_ID && c.env.FB_APP_SECRET) {
      try {
        const igUserId = c.env.IG_USER_ID || "17841400000000000";
        const url = new URL(`${graphBase(c.env)}/${igUserId}`);
        url.searchParams.set("fields", "followers_count,media_count,name");
        const bearer = await getAppAccessToken(c.env) || c.env.IG_OEMBED_TOKEN;
        const igResponse = await fetch(url.toString(), bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : void 0).catch(() => null);
        if (igResponse && igResponse.ok) {
          const igData = await igResponse.json();
          const followers = typeof igData.followers_count === "number" ? igData.followers_count : 0;
          metrics.platforms.push({
            id: "instagram",
            name: "Instagram",
            followers,
            engagement: 12.3,
            // Would calculate from insights API
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          });
          metrics.totalReach += followers;
        }
      } catch (error) {
        console.error("Failed to fetch Instagram metrics:", error);
      }
    } else {
    }
    try {
      const clientId = c.env.SPOTIFY_CLIENT_ID;
      const clientSecret = c.env.SPOTIFY_CLIENT_SECRET;
      const artistId = c.env.SPOTIFY_ARTIST_ID || "5WICYLl8MXvOY2x3mkoSqK";
      if (clientId && clientSecret && artistId) {
        const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(`${clientId}:${clientSecret}`)
          },
          body: new URLSearchParams({ grant_type: "client_credentials" })
        });
        if (tokenRes.ok) {
          const tokenJson = await tokenRes.json();
          const artRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { Authorization: `Bearer ${tokenJson.access_token}` }
          });
          if (artRes.ok) {
            const art = await artRes.json();
            const followers = art.followers?.total ?? 0;
            const engagement = typeof art.popularity === "number" ? art.popularity : 0;
            metrics.platforms.push({
              id: "spotify",
              name: "Spotify",
              followers,
              engagement,
              lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
            });
            metrics.totalReach += followers;
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch Spotify metrics:", error);
    }
    try {
      const fbPageId = c.env.FB_PAGE_ID;
      const fbToken = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN;
      if (fbPageId && fbToken) {
        const pageUrl = new URL(`${graphBase(c.env)}/${fbPageId}`);
        pageUrl.searchParams.set("fields", "fan_count,name");
        const pageRes = await fetch(pageUrl.toString(), { headers: { Authorization: `Bearer ${fbToken}` } });
        if (pageRes.ok) {
          const page = await pageRes.json();
          const followers = page.fan_count ?? 0;
          metrics.platforms.push({
            id: "facebook",
            name: "Facebook",
            followers,
            engagement: 0,
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          });
          metrics.totalReach += followers;
        }
      }
    } catch (e) {
      console.error("Failed to fetch Facebook metrics:", e);
    }
    if (m.platforms.length > 0) {
      const top = m.platforms.reduce((prev, curr) => prev.engagement > curr.engagement ? prev : curr);
      m.topConversionSource = top.id;
    }
    await cache.set(`/${cacheKey}`, m, 900);
    return m;
  });
  return c.json(metrics, 200, {
    "Cache-Control": "public, max-age=900",
    "X-Cache": "MISS"
  });
});
async function sha256(input) {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(input));
}
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomString(length = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => ("0" + (b & 255).toString(16)).slice(-2)).join("");
}
app.get("/api/spotify/login", async (c) => {
  const kv = c.env?.SESSIONS;
  const clientId = c.env.SPOTIFY_CLIENT_ID;
  if (!kv) {
    return c.json({ error: "kv_not_configured", message: "SESSIONS KV binding not configured" }, 501);
  }
  if (!clientId || /your_spotify_client_id/i.test(clientId)) {
    return c.json({ error: "spotify_not_configured", message: "SPOTIFY_CLIENT_ID is missing" }, 501);
  }
  const redirectUri = c.req.url.replace(/\/api\/spotify\/login.*/, "/api/spotify/callback");
  const state = randomString(12);
  const codeVerifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(codeVerifier));
  await kv.put(
    `pkce:${state}`,
    JSON.stringify({ codeVerifier }),
    { expirationTtl: 600 }
  );
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: "user-library-modify user-follow-modify user-follow-read"
  });
  return c.json({ authorizeUrl: `https://accounts.spotify.com/authorize?${params.toString()}` });
});
app.get("/api/spotify/callback", async (c) => {
  const kv = c.env?.SESSIONS;
  if (!kv) {
    return c.json({ error: "kv_not_configured", message: "SESSIONS KV binding not configured" }, 501);
  }
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return c.json({ error: "missing_code_or_state" }, 400);
  const pkceData = await kv.get(`pkce:${state}`);
  if (!pkceData) return c.json({ error: "invalid_state" }, 400);
  const { codeVerifier } = JSON.parse(pkceData);
  await kv.delete(`pkce:${state}`);
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: url.origin + "/api/spotify/callback",
      client_id: c.env.SPOTIFY_CLIENT_ID,
      code_verifier: codeVerifier
    })
  });
  if (!tokenRes.ok) {
    return c.json({ error: "token_exchange_failed", status: tokenRes.status }, 500);
  }
  const tokenJson = await tokenRes.json();
  const sessionId = randomString(32);
  const session = {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token,
    expiresAt: Date.now() + tokenJson.expires_in * 1e3
  };
  await kv.put(
    `spotify:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
  c.header("Set-Cookie", `spotify_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
  return c.json({ success: true });
});
app.get("/api/spotify/session", async (c) => {
  const kv = c.env?.SESSIONS;
  if (!kv) return c.json({ authenticated: false, reason: "kv_not_configured" });
  const cookie = c.req.header("Cookie") || "";
  const match = cookie.match(/spotify_session=([^;]+)/);
  if (!match) return c.json({ authenticated: false });
  const sessionData = await kv.get(`spotify:${match[1]}`);
  if (!sessionData) return c.json({ authenticated: false });
  const session = JSON.parse(sessionData);
  if (!session.accessToken) return c.json({ authenticated: false });
  if (session.expiresAt && session.expiresAt < Date.now() + 6e4) {
    if (session.refreshToken) {
      const refreshed = await refreshSpotifyToken(c, match[1], session);
      if (refreshed) {
        return c.json({ authenticated: true, expiresAt: refreshed.expiresAt });
      }
    }
    return c.json({ authenticated: false, reason: "token_expired" });
  }
  return c.json({ authenticated: true, expiresAt: session.expiresAt });
});
let cachedAppleToken = null;
app.get("/api/apple/developer-token", async (c) => {
  const now = Math.floor(Date.now() / 1e3);
  if (cachedAppleToken && cachedAppleToken.exp - 60 > now) {
    return c.json({ token: cachedAppleToken.token, cached: true });
  }
  const teamId = c.env.APPLE_TEAM_ID;
  const keyId = c.env.APPLE_KEY_ID;
  const privateKey = c.env.APPLE_PRIVATE_KEY;
  if (!teamId || !keyId || !privateKey) {
    console.error("Apple Music configuration missing. Required: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY");
    return c.json({
      error: "apple_music_not_configured",
      message: "Apple Music developer token not configured. Please set up APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY environment variables in your .dev.vars file.",
      documentation: "https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens"
    }, 501);
  }
  if (teamId.includes("your_apple_team_id") || keyId.includes("your_apple_key_id") || privateKey.includes("your_apple_private_key")) {
    console.error("Apple Music configuration uses placeholder values");
    return c.json({
      error: "apple_music_not_configured",
      message: "Apple Music developer token configuration uses placeholder values. Please replace with actual Apple Music credentials.",
      documentation: "https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens"
    }, 501);
  }
  try {
    const { SignJWT, importPKCS8 } = await import("./assets/index-Izu6hQlK.js");
    const privateKeyPem = privateKey.replace(/\\n/g, "\n");
    const alg = "ES256";
    const iat = now;
    const exp = iat + 60 * 60 * 12;
    const pk = await importPKCS8(privateKeyPem, alg);
    const token = await new SignJWT({}).setProtectedHeader({ alg, kid: keyId }).setIssuedAt(iat).setExpirationTime(exp).setIssuer(teamId).sign(pk);
    cachedAppleToken = { token, exp };
    return c.json({ token, cached: false, exp });
  } catch (error) {
    console.error("Failed to generate Apple Music developer token:", error);
    return c.json({
      error: "token_generation_failed",
      message: "Failed to generate Apple Music developer token. Please check your private key format.",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
async function getSessionFromCookie(c, cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/spotify_session=([^;]+)/);
  if (!match) return null;
  const kv = c.env?.SESSIONS;
  if (!kv) return null;
  const sessionData = await kv.get(`spotify:${match[1]}`);
  if (!sessionData) return null;
  const session = JSON.parse(sessionData);
  if (!session.accessToken) return null;
  if (session.expiresAt && session.expiresAt < Date.now() + 6e4) {
    if (session.refreshToken) {
      return await refreshSpotifyToken(c, match[1], session);
    }
    return null;
  }
  return session;
}
async function refreshSpotifyToken(c, sessionId, session) {
  if (!session.refreshToken || !c.env.SPOTIFY_CLIENT_ID) return null;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
        client_id: c.env.SPOTIFY_CLIENT_ID
      })
    });
    if (!res.ok) return null;
    const tokenJson = await res.json();
    session.accessToken = tokenJson.access_token;
    if (tokenJson.refresh_token) {
      session.refreshToken = tokenJson.refresh_token;
    }
    session.expiresAt = Date.now() + tokenJson.expires_in * 1e3;
    const kv = c.env?.SESSIONS;
    if (kv) {
      await kv.put(
        `spotify:${sessionId}`,
        JSON.stringify(session),
        { expirationTtl: 60 * 60 * 24 * 30 }
      );
    }
    return session;
  } catch {
    return null;
  }
}
app.post("/api/spotify/save", async (c) => {
  const session = await getSessionFromCookie(c, c.req.header("Cookie") ?? null);
  if (!session) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json();
  const endpoint = body.type === "albums" ? "albums" : "tracks";
  const res = await fetch(`https://api.spotify.com/v1/me/${endpoint}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body.ids)
  });
  if (res.status === 200 || res.status === 201 || res.status === 204) return c.json({ success: true });
  return c.json({ error: "save_failed", status: res.status }, 500);
});
app.post("/api/spotify/follow", async (c) => {
  const session = await getSessionFromCookie(c, c.req.header("Cookie") ?? null);
  if (!session) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json();
  const params = new URLSearchParams({ type: "artist", ids: body.artistIds.join(",") });
  const res = await fetch(`https://api.spotify.com/v1/me/following?${params.toString()}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${session.accessToken}` }
  });
  if (res.status === 200 || res.status === 204) return c.json({ success: true });
  return c.json({ error: "follow_failed", status: res.status }, 500);
});
function getAdminTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/medusa_admin_jwt=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
function getMedusaUrl(c) {
  const base = c.env.MEDUSA_URL;
  if (!base || !/^https?:\/\//.test(base)) return null;
  return base.replace(/\/$/, "");
}
app.post("/api/admin/login", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured", message: "MEDUSA_URL not set" }, 501);
  try {
    const body = await c.req.json();
    const res = await fetch(`${MEDUSA}/admin/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password })
    });
    if (!res.ok) {
      return c.json({ error: "invalid_credentials", status: res.status }, 401);
    }
    const json = await res.json();
    const token = json?.token || json?.access_token || json?.jwt || json?.data?.token;
    if (!token) return c.json({ error: "no_token_in_response" }, 500);
    const isHttps = new URL(c.req.url).protocol === "https:";
    const secure = isHttps ? " Secure;" : " ";
    c.header("Set-Cookie", `medusa_admin_jwt=${encodeURIComponent(token)}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${60 * 60 * 6}`);
    return c.json({ ok: true });
  } catch {
    return c.json({ error: "bad_request" }, 400);
  }
});
app.post("/api/admin/logout", (c) => {
  const isHttps = new URL(c.req.url).protocol === "https:";
  const secure = isHttps ? " Secure;" : " ";
  c.header("Set-Cookie", `medusa_admin_jwt=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`);
  return c.json({ ok: true });
});
app.get("/api/admin/session", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ authenticated: false, reason: "not_configured" }, 200);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ authenticated: false }, 200);
  try {
    const res = await fetch(`${MEDUSA}/admin/products?limit=1`, { headers: { "Authorization": `Bearer ${token}` } });
    return c.json({ authenticated: res.ok });
  } catch {
    return c.json({ authenticated: false });
  }
});
app.post("/api/admin/products", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  try {
    const json = await c.req.json();
    const upstream = await fetch(`${MEDUSA}/admin/products`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(json)
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
  } catch {
    return c.json({ error: "bad_request" }, 400);
  }
});
app.get("/api/admin/products", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const url = new URL(`${MEDUSA}/admin/products`);
  const reqUrl = new URL(c.req.url);
  reqUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  const upstream = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
});
app.get("/api/admin/products/:id", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const upstream = await fetch(`${MEDUSA}/admin/products/${id}`, { headers: { "Authorization": `Bearer ${token}` } });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
});
app.patch("/api/admin/products/:id", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const body = await c.req.text();
  const upstream = await fetch(`${MEDUSA}/admin/products/${id}`, { method: "PATCH", headers: { "Authorization": `Bearer ${token}`, "content-type": "application/json" }, body });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
});
app.post("/api/admin/products/:id/variants", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const body = await c.req.text();
  const upstream = await fetch(`${MEDUSA}/admin/products/${id}/variants`, { method: "POST", headers: { "Authorization": `Bearer ${token}`, "content-type": "application/json" }, body });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
});
app.patch("/api/admin/variants/:id", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const body = await c.req.text();
  const upstream = await fetch(`${MEDUSA}/admin/variants/${id}`, { method: "PATCH", headers: { "Authorization": `Bearer ${token}`, "content-type": "application/json" }, body });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
});
app.delete("/api/admin/variants/:id", async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: "not_configured" }, 501);
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const id = c.req.param("id");
  const upstream = await fetch(`${MEDUSA}/admin/variants/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
});
app.post("/api/images/direct-upload", async (c) => {
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const accountId = c.env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = c.env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) return c.json({ error: "not_configured" }, 501);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiToken}` }
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
});
app.delete("/api/images/:id", async (c) => {
  const token = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const accountId = c.env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = c.env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) return c.json({ error: "not_configured" }, 501);
  const id = c.req.param("id");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${apiToken}` }
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
});
app.post("/api/ai/suggest-product", async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header("Cookie") || null);
  if (!admin) return c.json({ error: "unauthorized" }, 401);
  const key = c.env.OPENAI_API_KEY;
  try {
    const { image_url, prompt } = await c.req.json();
    if (!image_url) return c.json({ error: "missing_image" }, 400);
    const system = "You generate concise, compelling e-commerce titles and descriptions from product photos. Keep titles under 70 characters; descriptions 2–3 sentences. Return strict JSON with keys title, description.";
    const userPrompt = prompt || "Create a product title and description for this image.";
    if (key) {
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: image_url } }
          ] }
        ],
        response_format: { type: "json_object" }
      };
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!upstream.ok) {
        const t = await upstream.text();
        return c.json({ error: "upstream_error", status: upstream.status, body: t }, 502);
      }
      const json = await upstream.json();
      const content = json?.choices?.[0]?.message?.content || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { title: content?.slice?.(0, 70) || "", description: content || "" };
      }
      return c.json({ title: parsed.title || "", description: parsed.description || "" });
    }
    if (!c.env.AI) return c.json({ error: "not_configured", provider: "workers_ai" }, 501);
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) return c.json({ error: "image_fetch_failed" }, 400);
    const buf = await imgRes.arrayBuffer();
    const image = new Uint8Array(buf);
    const models = ["@cf/meta/llama-3.2-11b-vision-instruct", "@cf/llava-hf/llava-1.5-7b-hf"];
    for (const model of models) {
      try {
        const out = await c.env.AI.run(model, { prompt: `${system}

${userPrompt}
Respond with JSON: {"title":"...","description":"..."}.`, image: [image] });
        const text = out?.output || out?.response || out?.text || JSON.stringify(out || {});
        let parsed = {};
        try {
          parsed = JSON.parse(typeof text === "string" ? text : JSON.stringify(text));
        } catch {
          parsed = { title: String(text).slice(0, 70), description: String(text) };
        }
        return c.json({ title: parsed.title || "", description: parsed.description || "" });
      } catch {
      }
    }
    return c.json({ error: "ai_failed" }, 500);
  } catch {
    return c.json({ error: "bad_request" }, 400);
  }
});
const rateMap = /* @__PURE__ */ new Map();
app.post("/api/booking", async (c) => {
  try {
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
    const allowed = await (async () => {
      try {
        const ns = c.env.RATE_LIMITER;
        if (ns && typeof ns.idFromName === "function" && typeof ns.get === "function") {
          const id = ns.idFromName("global");
          const stub = ns.get(id);
          const res = await stub.fetch("https://rate/check", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ip, limit: 10, window: 60 })
          });
          if (res.status === 429) return false;
          const j = await res.json().catch(() => ({ allowed: true }));
          return !!j.allowed;
        }
      } catch {
      }
      const now = Date.now();
      const bucket = rateMap.get(ip);
      if (!bucket || bucket.reset < now) {
        rateMap.set(ip, { count: 1, reset: now + 6e4 });
        return true;
      }
      if (bucket.count > 10) return false;
      bucket.count += 1;
      return true;
    })();
    if (!allowed) {
      return c.json({ error: "rate_limited", message: "Too many requests. Please try again in a minute." }, 429);
    }
    const body = await c.req.json();
    if (body.website && String(body.website).trim() !== "") {
      return c.json({ ok: true, ignored: true });
    }
    const required = ["name", "email", "phone", "eventType", "eventDate", "eventTime", "location"];
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === "") {
        return c.json({ error: `missing_${k}` }, 400);
      }
    }
    const email = String(body.email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return c.json({ error: "invalid_email" }, 400);
    }
    const phoneRaw = String(body.phone).trim();
    const phone = phoneRaw.replace(/(?!^\+)\D+/g, "");
    if (phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15) {
      return c.json({ error: "invalid_phone" }, 400);
    }
    const eventTypes = /* @__PURE__ */ new Set(["worship", "concert", "wedding", "funeral", "conference", "community", "other"]);
    if (!eventTypes.has(String(body.eventType))) {
      return c.json({ error: "invalid_event_type" }, 400);
    }
    const isoDate = String(body.eventDate);
    const isoTime = String(body.eventTime);
    const eventDateTime = /* @__PURE__ */ new Date(`${isoDate}T${isoTime}`);
    if (Number.isNaN(eventDateTime.getTime())) {
      return c.json({ error: "invalid_datetime" }, 400);
    }
    if (eventDateTime.getTime() < Date.now()) {
      return c.json({ error: "datetime_in_past" }, 400);
    }
    const name = String(body.name).trim().slice(0, 100);
    const location = String(body.location).trim().slice(0, 200);
    const message = (body.message ? String(body.message) : "").trim().slice(0, 2e3);
    const summary = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Event Type: ${body.eventType}`,
      `Date: ${isoDate} ${isoTime}`,
      `Location: ${location}`,
      "",
      "Message:",
      message || "(none)"
    ].join("\n");
    const customerConfirmation = `Dear ${name},

Thank you for your booking request with DJ Lee & Voices of Judah!

We have received your request with the following details:

EVENT DETAILS
Event Type: ${body.eventType}
Date: ${isoDate}
Time: ${isoTime}
Location: ${location}

YOUR CONTACT INFORMATION
Name: ${name}
Email: ${email}
Phone: ${phone}

${message ? `Your Message:
${message}

` : ""}We will review your request and respond within 24-48 hours to confirm availability and discuss further details.

If you need immediate assistance, please feel free to call us directly.

Blessings,
DJ Lee & Voices of Judah Team

---
This is an automated confirmation email. Please do not reply directly to this message.`;
    const toResend = c.env.RESEND_TO || "V.O.J@icloud.com";
    const fromResend = c.env.RESEND_FROM || "DJ Lee Website <no-reply@djlee.local>";
    if (c.env.RESEND_API_KEY) {
      const adminRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromResend,
          to: [toResend],
          subject: `Booking Request: ${body.eventType} on ${isoDate}`,
          text: summary
        })
      });
      if (adminRes.ok) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${c.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromResend,
            to: [email],
            subject: `Booking Confirmation - DJ Lee & Voices of Judah`,
            text: customerConfirmation
          })
        });
        return c.json({ ok: true, provider: "resend" });
      }
    }
    if (c.env.SENDGRID_API_KEY) {
      const to = c.env.SENDGRID_TO || "V.O.J@icloud.com";
      const from = c.env.SENDGRID_FROM || "no-reply@djlee.local";
      const adminRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: "DJ Lee Website" },
          subject: `Booking Request: ${body.eventType} on ${isoDate}`,
          content: [{ type: "text/plain", value: summary }]
        })
      });
      if (!adminRes.ok) {
        return c.json({ error: "email_send_failed", provider: "sendgrid", status: adminRes.status }, 500);
      }
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: from, name: "DJ Lee & Voices of Judah" },
          subject: `Booking Confirmation - DJ Lee & Voices of Judah`,
          content: [{ type: "text/plain", value: customerConfirmation }]
        })
      });
      return c.json({ ok: true, provider: "sendgrid" });
    }
    return c.json({ ok: false, error: "no_email_provider" }, 501);
  } catch {
    return c.json({ error: "invalid_request" }, 400);
  }
});
app.get("/api/instagram/oembed", async (c) => {
  try {
    const url = c.req.query("url");
    const maxwidth = c.req.query("maxwidth");
    const omitscript = c.req.query("omitscript");
    const hidecaption = c.req.query("hidecaption");
    if (!url) {
      return c.json({ error: "URL parameter is required" }, 400);
    }
    const cacheKey = `ig:${url}:${maxwidth || ""}:${omitscript || ""}:${hidecaption || ""}`;
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      const data2 = JSON.parse(cached);
      return c.json(data2, 200, {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        "X-Cache": "HIT"
      });
    }
    const appToken = await getAppAccessToken(c.env);
    const igToken = appToken || c.env.IG_OEMBED_TOKEN;
    if (igToken) {
      try {
        const graphUrl = new URL(`${graphBase(c.env)}/instagram_oembed`);
        graphUrl.searchParams.append("url", url);
        if (maxwidth) graphUrl.searchParams.append("maxwidth", maxwidth);
        if (omitscript) graphUrl.searchParams.append("omitscript", omitscript);
        if (hidecaption) graphUrl.searchParams.append("hidecaption", hidecaption);
        const graphResponse = await fetch(graphUrl.toString(), {
          headers: { Authorization: `Bearer ${igToken}` }
        });
        if (graphResponse.ok) {
          const data2 = await graphResponse.json();
          await c.env.SESSIONS.put(
            cacheKey,
            JSON.stringify(data2),
            { expirationTtl: 3600 }
          );
          return c.json(data2, 200, {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
            "X-Cache": "MISS"
          });
        }
      } catch (graphError) {
        console.error("Instagram Graph API error:", graphError);
      }
    }
    const oembedUrl = new URL("https://api.instagram.com/oembed");
    oembedUrl.searchParams.append("url", url);
    if (maxwidth) oembedUrl.searchParams.append("maxwidth", maxwidth);
    if (omitscript !== void 0) oembedUrl.searchParams.append("omitscript", omitscript);
    if (hidecaption !== void 0) oembedUrl.searchParams.append("hidecaption", hidecaption);
    const response = await fetch(oembedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": c.req.header("Referer") || "https://dj-judas.com/"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Instagram oEmbed API error:", response.status, errorText);
      if (response.status === 404 || response.status === 400) {
        return c.json({
          error: "Invalid Instagram URL",
          message: "The Instagram post could not be found. It may be private or deleted."
        }, 404);
      }
      if (response.status >= 500 || response.status === 429) {
        const match = url.match(/instagram\.com\/([^/]+)/);
        const username = match ? match[1] : "iam_djlee";
        return c.json({
          fallback: true,
          html: `<div class="instagram-fallback"><a href="${url}" target="_blank" rel="noopener noreferrer">View on Instagram @${username}</a></div>`,
          author_name: username,
          author_url: `https://www.instagram.com/${username}/`,
          provider_name: "Instagram",
          provider_url: "https://www.instagram.com",
          type: "rich",
          version: "1.0"
        }, 200, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
          // Cache fallback for 5 minutes
        });
      }
      const status = response.status;
      return c.json({
        error: "Failed to fetch Instagram embed",
        status: response.status,
        details: errorText
      }, status);
    }
    const data = await response.json();
    await c.env.SESSIONS.put(
      cacheKey,
      JSON.stringify(data),
      { expirationTtl: 3600 }
    );
    return c.json(data, 200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
      "X-Cache": "MISS"
    });
  } catch (error) {
    console.error("Instagram oEmbed handler error:", error);
    const url = c.req.query("url") || "";
    const match = url.match(/instagram\.com\/([^/]+)/);
    const username = match ? match[1] : "iam_djlee";
    return c.json({
      fallback: true,
      html: `<div class="instagram-fallback"><a href="${url}" target="_blank" rel="noopener noreferrer">View on Instagram @${username}</a></div>`,
      author_name: username,
      author_url: `https://www.instagram.com/${username}/`,
      provider_name: "Instagram",
      provider_url: "https://www.instagram.com",
      type: "rich",
      version: "1.0"
    }, 200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    });
  }
});
app.get("/api/instagram/media", async (c) => {
  const igToken = c.env.IG_OEMBED_TOKEN;
  if (!igToken) {
    return c.json({
      error: "not_configured",
      message: "Instagram Graph API not configured"
    }, 501);
  }
  try {
    const igUserId = c.req.query("user_id") || c.env.IG_USER_ID || "me";
    const limit = c.req.query("limit") || "12";
    const fields = c.req.query("fields") || "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username";
    const cache = new CacheManager(c.env.SESSIONS);
    const cacheKey = `/ig_media:${igUserId}:${limit}:${fields}`;
    const cached = await cache.get(cacheKey).catch(() => null);
    if (cached) {
      return c.json(cached, 200, {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=900",
        "X-Cache": "HIT"
      });
    }
    const graphUrl = new URL(`${graphBase(c.env)}/${igUserId}/media`);
    graphUrl.searchParams.append("fields", fields);
    graphUrl.searchParams.append("limit", limit);
    const response = await fetch(graphUrl.toString(), { headers: { Authorization: `Bearer ${igToken}` } });
    if (!response.ok) {
      const error = await response.json();
      console.error("Instagram Graph API error:", error);
      return c.json({
        error: "api_error",
        message: error.error?.message || "Failed to fetch Instagram media",
        details: error
      }, 500);
    }
    const data = await response.json();
    await cache.set(cacheKey, data, 900);
    return c.json(data, 200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=900",
      "X-Cache": "MISS"
    });
  } catch (error) {
    console.error("Instagram media handler error:", error);
    return c.json({
      error: "internal_error",
      message: "Failed to fetch Instagram media"
    }, 500);
  }
});
app.get("/api/social/feed", async (c) => {
  try {
    const platforms = c.req.query("platforms")?.split(",") || ["instagram", "facebook"];
    const hashtags = c.req.query("hashtags")?.split(",").filter(Boolean) || [];
    const limit = parseInt(c.req.query("limit") || "12");
    const shoppable = c.req.query("shoppable") === "true";
    const wantsIg = platforms.includes("instagram");
    const wantsFb = platforms.includes("facebook");
    const igConfigured = !!c.env.IG_OEMBED_TOKEN;
    const fbConfigured = !!(c.env.FB_PAGE_ID && (c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN));
    const anyRequestedConfigured = wantsIg && igConfigured || wantsFb && fbConfigured;
    if (!anyRequestedConfigured) {
      return c.json({ error: "not_configured", message: "Social APIs not configured" }, 501);
    }
    const posts = [];
    const errors = [];
    if (platforms.includes("instagram")) {
      const igToken = c.env.IG_OEMBED_TOKEN;
      if (igToken) {
        try {
          const igUserId = c.req.query("ig_user_id") || "17841400000000000";
          const fields = "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count";
          const graphUrl = new URL(`${graphBase(c.env)}/${igUserId || c.env.IG_USER_ID || "me"}/media`);
          graphUrl.searchParams.append("fields", fields);
          graphUrl.searchParams.append("limit", limit.toString());
          const response = await fetch(graphUrl.toString(), {
            headers: { Authorization: `Bearer ${igToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              for (const item of data.data) {
                const post = {
                  id: `ig_${item.id}`,
                  platform: "instagram",
                  type: item.media_type.toLowerCase(),
                  mediaUrl: item.media_url,
                  thumbnailUrl: item.thumbnail_url,
                  caption: item.caption || "",
                  permalink: item.permalink,
                  timestamp: item.timestamp,
                  likes: item.like_count,
                  comments: item.comments_count,
                  shares: 0,
                  // Instagram doesn't provide share count via API
                  isShoppable: false,
                  products: void 0,
                  hashtags: item.caption ? item.caption.match(/#\w+/g) || [] : [],
                  mentions: item.caption ? item.caption.match(/@\w+/g) || [] : []
                };
                if (hashtags.length === 0) {
                  posts.push(post);
                } else {
                  const postHashtags = post.hashtags;
                  if (postHashtags && hashtags.some((tag) => postHashtags.includes(`#${tag}`))) {
                    posts.push(post);
                  }
                }
              }
            }
          }
        } catch (err) {
          errors.push({ platform: "instagram", error: err.message });
        }
      }
    }
    if (platforms.includes("facebook")) {
      const fbPageId = c.env.FB_PAGE_ID;
      const fbToken = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN;
      if (fbPageId && fbToken) {
        try {
          const fields = "id,message,full_picture,permalink_url,created_time,likes.summary(true),comments.summary(true),shares";
          const graphUrl = new URL(`${graphBase(c.env)}/${fbPageId}/posts`);
          graphUrl.searchParams.append("fields", fields);
          graphUrl.searchParams.append("limit", limit.toString());
          const response = await fetch(graphUrl.toString(), {
            headers: { Authorization: `Bearer ${fbToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              for (const item of data.data) {
                const post = {
                  id: `fb_${item.id}`,
                  platform: "facebook",
                  type: "photo",
                  // Simplified - would need additional logic for video detection
                  mediaUrl: item.full_picture || "",
                  thumbnailUrl: item.full_picture,
                  caption: item.message || "",
                  permalink: item.permalink_url,
                  timestamp: item.created_time,
                  likes: item.likes?.summary.total_count,
                  comments: item.comments?.summary.total_count,
                  shares: item.shares?.count,
                  isShoppable: false,
                  products: void 0,
                  hashtags: item.message ? item.message.match(/#\w+/g) || [] : [],
                  mentions: item.message ? item.message.match(/@\w+/g) || [] : []
                };
                if (hashtags.length === 0) {
                  posts.push(post);
                } else {
                  const postHashtags = post.hashtags;
                  if (postHashtags && hashtags.some((tag) => postHashtags.includes(`#${tag}`))) {
                    posts.push(post);
                  }
                }
              }
            }
          }
        } catch (err) {
          errors.push({ platform: "facebook", error: err.message });
        }
      }
    }
    if (shoppable && posts.length > 0) {
      let medusaProducts = [];
      if (c.env.MEDUSA_URL) {
        try {
          const base = c.env.MEDUSA_URL.replace(/\/$/, "");
          const res = await fetch(`${base}/store/products?limit=10`, { headers: { "accept": "application/json" } });
          if (res.ok) {
            const data = await res.json();
            medusaProducts = data.products || [];
          }
        } catch {
        }
      }
      const pickPrice = (p) => {
        const cents = p.variants?.[0]?.prices?.[0]?.amount;
        return typeof cents === "number" ? Math.round(cents) / 100 : 39.99;
      };
      const toTagged = (p) => ({
        id: p.id,
        title: p.title,
        price: pickPrice(p),
        url: p.handle ? `/products#${p.handle}` : "/products"
      });
      const shoppablePosts = posts.slice(0, Math.min(3, posts.length));
      for (const post of shoppablePosts) {
        if (medusaProducts.length > 0) {
          const tags = (post.hashtags || []).map((h) => h.replace(/^#/, "").toLowerCase());
          const matched = medusaProducts.filter((p) => tags.some((t) => p.title.toLowerCase().includes(t)));
          const chosen = (matched.length > 0 ? matched : medusaProducts).slice(0, 2);
          if (chosen.length > 0) {
            post.isShoppable = true;
            post.products = chosen.map((p) => toTagged(p));
          }
        }
      }
    }
    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedPosts = posts.slice(0, limit);
    return c.json({
      posts: limitedPosts,
      errors: errors.length > 0 ? errors : void 0,
      nextCursor: posts.length > limit ? posts[limit].id : null
    });
  } catch (error) {
    console.error("Social feed error:", error);
    return c.json({
      posts: [],
      error: "Failed to fetch social feed"
    }, 500);
  }
});
app.get("/api/instagram/insights", async (c) => {
  const igToken = c.env.IG_OEMBED_TOKEN;
  if (!igToken) {
    return c.json({
      error: "not_configured",
      message: "Instagram Graph API not configured"
    }, 501);
  }
  try {
    const igUserId = c.req.query("user_id") || c.env.IG_USER_ID || "me";
    const metrics = c.req.query("metrics") || "impressions,reach,profile_views";
    const period = c.req.query("period") || "day";
    const cacheKey = `ig_insights:${igUserId}:${metrics}:${period}`;
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        "X-Cache": "HIT"
      });
    }
    const graphUrl = new URL(`${graphBase(c.env)}/${igUserId}/insights`);
    graphUrl.searchParams.append("metric", metrics);
    graphUrl.searchParams.append("period", period);
    const response = await fetch(graphUrl.toString(), {
      headers: { Authorization: `Bearer ${igToken}` }
    });
    if (!response.ok) {
      const error = await response.json();
      console.error("Instagram Insights API error:", error);
      return c.json({
        error: "api_error",
        message: error.error?.message || "Failed to fetch Instagram insights",
        details: error
      }, 500);
    }
    const data = await response.json();
    await c.env.SESSIONS.put(
      cacheKey,
      JSON.stringify(data),
      { expirationTtl: 3600 }
    );
    return c.json(data, 200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
      "X-Cache": "MISS"
    });
  } catch (error) {
    console.error("Instagram insights handler error:", error);
    return c.json({
      error: "internal_error",
      message: "Failed to fetch Instagram insights"
    }, 500);
  }
});
app.get("/api/instagram/me", async (c) => {
  const token = await getAppAccessToken(c.env) || c.env.IG_OEMBED_TOKEN;
  if (!token) return c.json({ error: "not_configured", message: "Missing FB_APP_ID/FB_APP_SECRET or IG_OEMBED_TOKEN" }, 501);
  try {
    const url = new URL(`${graphBase(c.env)}/me`);
    url.searchParams.set("fields", "id,username");
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (e) {
    return c.json({ error: "failed_request", message: e.message }, 500);
  }
});
app.get("/api/instagram/linked-account", async (c) => {
  const pageId = c.req.query("page_id") || c.env.FB_PAGE_ID;
  const token = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN;
  if (!pageId || !token) {
    return c.json({ error: "not_configured", message: "Missing FB_PAGE_ID or FB_PAGE_TOKEN" }, 501);
  }
  try {
    const u = new URL(`${graphBase(c.env)}/${pageId}`);
    u.searchParams.set("fields", "instagram_business_account{id,username}");
    const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (e) {
    return c.json({ error: "failed_request", message: e.message }, 500);
  }
});
app.get("/api/health/oembed", async (c) => {
  const testUrl = c.req.query("url");
  if (!testUrl) return c.json({ ok: false, error: "missing_url" }, 400);
  try {
    const appToken = await getAppAccessToken(c.env);
    const token = appToken || c.env.IG_OEMBED_TOKEN;
    if (!token) return c.json({ ok: false, error: "missing_token", hint: "Set FB_APP_ID/FB_APP_SECRET or IG_OEMBED_TOKEN" }, 501);
    const u = new URL(`${graphBase(c.env)}/instagram_oembed`);
    u.searchParams.set("url", testUrl);
    u.searchParams.set("omitscript", "true");
    const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.text();
    const ok = res.ok;
    return c.json({ ok, status: res.status, body: ok ? void 0 : body.slice(0, 400) });
  } catch (e) {
    return c.json({ ok: false, error: "exception", message: e.message }, 500);
  }
});
let eventsCache = null;
async function loadEvents(c) {
  const now = Date.now();
  if (eventsCache && eventsCache.exp > now) return eventsCache.data;
  const url = new URL("/content/events.json", c.req.url).toString();
  const res = await fetch(url, {});
  if (!res.ok) return [];
  const json = await res.json();
  const sorted = [...json].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  eventsCache = { data: sorted, exp: now + 5 * 60 * 1e3 };
  return sorted;
}
app.get("/api/events", async (c) => {
  const items = await loadEvents(c);
  const now = Date.now();
  const published = items.filter((e) => (e.status ?? "published") === "published");
  const upcoming = published.filter((e) => new Date(e.endDateTime || e.startDateTime).getTime() >= now);
  const past = published.filter((e) => new Date(e.endDateTime || e.startDateTime).getTime() < now).reverse();
  return c.json({ upcoming, past, total: published.length });
});
function toICSDate(dt) {
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function buildICS(events, origin) {
  const lines = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//DJ Judas//Events//EN");
  for (const ev of events) {
    const uid = `${ev.slug}@${new URL(origin).host}`;
    const start = toICSDate(ev.startDateTime);
    const end = toICSDate(ev.endDateTime || ev.startDateTime);
    const url = new URL("/#events", origin).toString();
    const loc = [ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(", ");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${toICSDate((/* @__PURE__ */ new Date()).toISOString())}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${(ev.title || "").replace(/\n/g, " ")}`);
    if (loc) lines.push(`LOCATION:${loc.replace(/\n/g, " ")}`);
    if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, " ")}`);
    lines.push(`URL:${url}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
app.get("/events.ics", async (c) => {
  const items = await loadEvents(c);
  const now = Date.now();
  const upcoming = items.filter((e) => (e.status ?? "published") === "published").filter((e) => new Date(e.endDateTime || e.startDateTime).getTime() >= now).slice(0, 50);
  const ics = buildICS(upcoming, c.req.url);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="events.ics"' } });
});
app.get("/events/:slug.ics", async (c) => {
  const slug = c.req.param("slug");
  const items = await loadEvents(c);
  const match = items.find((e) => e.slug === slug);
  if (!match) return c.text("Not Found", 404);
  const ics = buildICS([match], c.req.url);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.ics"` } });
});
app.get("/api/facebook/events", async (c) => {
  try {
    const pageId = c.req.query("page_id") || c.env.FB_PAGE_ID;
    const token = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN;
    const includePast = c.req.query("include_past") === "true";
    const limit = parseInt(c.req.query("limit") || "10");
    if (!pageId || !token) {
      return c.json({ error: "not_configured", message: "Facebook Events API not configured" }, 501);
    }
    const cacheKey = `fb_events:${pageId}:${includePast ? "all" : "upcoming"}:${limit}`;
    try {
      const cached = await c.env.SESSIONS?.get?.(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached), 200, { "Cache-Control": "public, max-age=300", "X-Cache": "HIT" });
      }
    } catch {
    }
    const graphUrl = new URL(`${graphBase(c.env)}/${pageId}/events`);
    graphUrl.searchParams.set("time_filter", includePast ? "all" : "upcoming");
    graphUrl.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));
    graphUrl.searchParams.set(
      "fields",
      [
        "id",
        "name",
        "description",
        "start_time",
        "end_time",
        "place{ name, location{ city, country, latitude, longitude, street, zip } }",
        "is_online",
        "is_canceled",
        "ticket_uri",
        "interested_count",
        "attending_count",
        "cover{ source }",
        "event_times"
      ].join(",")
    );
    const fbRes = await fetch(graphUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!fbRes.ok) {
      const error = await fbRes.json().catch(() => ({}));
      console.error("Facebook Events API error:", error);
      return c.json({ error: "facebook_api_error", details: error }, 502);
    }
    const payload = await fbRes.json();
    const events = (payload.data || []).map((ev) => ({
      id: ev.id,
      name: ev.name,
      description: ev.description,
      startTime: ev.start_time,
      endTime: ev.end_time,
      place: ev.place ? { name: ev.place.name, location: ev.place.location } : void 0,
      coverPhoto: ev.cover?.source,
      eventUrl: `https://facebook.com/events/${ev.id}`,
      isOnline: !!ev.is_online,
      ticketUri: ev.ticket_uri,
      interestedCount: ev.interested_count,
      attendingCount: ev.attending_count,
      isCanceled: !!ev.is_canceled,
      category: void 0
    }));
    const result = { events };
    try {
      await c.env.SESSIONS?.put?.(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    } catch {
    }
    return c.json(result, 200, { "Cache-Control": "public, max-age=300", "X-Cache": "MISS" });
  } catch (err) {
    console.error("facebook_events_handler_error", err);
    return c.json({ error: "internal_error" }, 500);
  }
});
export {
  RateLimiter,
  UserSession,
  app as default
};
