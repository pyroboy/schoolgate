import { E as setContext, J as getContext } from './index.892efb91.js';
import { r as readable } from './index.482e8653.js';
import { e as equal, K as Kind, p as printer, s as symbol_observable_1, _ as __extends, A as ApolloLink, I as InMemoryCache, H as HttpLink, a as split, b as ApolloClient__default, g as getMainDefinition } from './bundle.esm.9a99eb82.js';
import { c as createCommonjsModule, u as unwrapExports, g as getCjsExportFromNamespace, a as commonjsGlobal } from './_commonjsHelpers.e0f9ccb2.js';

var OBSERVABLE;
function isObservable(value) {
    // Lazy-load Symbol to give polyfills a chance to run
    if (!OBSERVABLE) {
        OBSERVABLE =
            (typeof Symbol === 'function' && Symbol.observable) || '@@observable';
    }
    return value && value[OBSERVABLE] && value[OBSERVABLE]() === value;
}
function deferred(set, initial) {
    var initialized = initial !== undefined;
    var resolve;
    var reject;
    // Set initial value
    set(initialized
        ? initial
        : new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        }));
    return {
        fulfill: function (value) {
            if (initialized)
                return set(Promise.resolve(value));
            initialized = true;
            resolve(value);
        },
        reject: function (error) {
            if (initialized)
                return set(Promise.reject(error));
            initialized = true;
            reject(error);
        }
    };
}

var noop = function () { };
function observe(observable, initial) {
    if (!isObservable(observable)) {
        return readable(observable, noop);
    }
    return readable(undefined, function (set) {
        var _a = deferred(set, initial), fulfill = _a.fulfill, reject = _a.reject;
        var subscription = observable.subscribe({
            next: function (value) {
                fulfill(value);
            },
            error: function (err) {
                reject(err);
            }
        });
        return function () { return subscription.unsubscribe(); };
    });
}
//# sourceMappingURL=svelte-observable.es.js.map

var CLIENT = typeof Symbol !== 'undefined' ? Symbol('client') : '@@client';
function getClient() {
    return getContext(CLIENT);
}
function setClient(client) {
    setContext(CLIENT, client);
}

var restoring = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();

function query(client, options) {
    var subscribed = false;
    var initial_value;
    // If client is restoring (e.g. from SSR)
    // attempt synchronous readQuery first (to prevent loading in {#await})
    if (restoring.has(client)) {
        try {
            // undefined = skip initial value (not in cache)
            initial_value = client.readQuery(options) || undefined;
            initial_value = { data: initial_value };
        }
        catch (err) {
            // Ignore preload errors
        }
    }
    // Create query and observe,
    // but don't subscribe directly to avoid firing duplicate value if initialized
    var observable_query = client.watchQuery(options);
    var subscribe_to_query = observe(observable_query, initial_value).subscribe;
    // Wrap the query subscription with a readable to prevent duplicate values
    var subscribe = readable(initial_value, function (set) {
        subscribed = true;
        var skip_duplicate = initial_value !== undefined;
        var initialized = false;
        var skipped = false;
        var unsubscribe = subscribe_to_query(function (value) {
            if (skip_duplicate && initialized && !skipped) {
                skipped = true;
            }
            else {
                if (!initialized)
                    initialized = true;
                set(value);
            }
        });
        return unsubscribe;
    }).subscribe;
    return {
        subscribe: subscribe,
        refetch: function (variables) {
            // If variables have not changed and not subscribed, skip refetch
            if (!subscribed && equal(variables, observable_query.variables))
                return observable_query.result();
            return observable_query.refetch(variables);
        },
        result: function () { return observable_query.result(); },
        fetchMore: function (options) { return observable_query.fetchMore(options); },
        setOptions: function (options) { return observable_query.setOptions(options); },
        updateQuery: function (map) { return observable_query.updateQuery(map); },
        startPolling: function (interval) { return observable_query.startPolling(interval); },
        stopPolling: function () { return observable_query.stopPolling(); },
        subscribeToMore: function (options) { return observable_query.subscribeToMore(options); }
    };
}

function subscribe(client, options) {
    var observable = client.subscribe(options);
    return observe(observable);
}
//# sourceMappingURL=svelte-apollo.es.js.map

/**
 * Expose `Backoff`.
 */

var backo2 = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};

var eventemitter3 = createCommonjsModule(function (module) {

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
{
  module.exports = EventEmitter;
}
});

var isString_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function isString(value) {
    return typeof value === 'string';
}
exports.default = isString;
//# sourceMappingURL=is-string.js.map
});

unwrapExports(isString_1);

var isObject_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(value) {
    return ((value !== null) && (typeof value === 'object'));
}
exports.default = isObject;
//# sourceMappingURL=is-object.js.map
});

unwrapExports(isObject_1);

/**
 * Returns an operation AST given a document AST and optionally an operation
 * name. If a name is not provided, an operation is only returned if only one is
 * provided in the document.
 */
function getOperationAST(documentAST, operationName) {
  var operation = null;

  for (var _i2 = 0, _documentAST$definiti2 = documentAST.definitions; _i2 < _documentAST$definiti2.length; _i2++) {
    var definition = _documentAST$definiti2[_i2];

    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (!operationName) {
        // If no operation name was provided, only return an Operation if there
        // is one defined in the document. Upon encountering the second, return
        // null.
        if (operation) {
          return null;
        }

        operation = definition;
      } else if (definition.name && definition.name.value === operationName) {
        return definition;
      }
    }
  }

  return operation;
}

var getOperationAST$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getOperationAST: getOperationAST
});

var protocol = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var GRAPHQL_WS = 'graphql-ws';
exports.GRAPHQL_WS = GRAPHQL_WS;
var GRAPHQL_SUBSCRIPTIONS = 'graphql-subscriptions';
exports.GRAPHQL_SUBSCRIPTIONS = GRAPHQL_SUBSCRIPTIONS;
//# sourceMappingURL=protocol.js.map
});

unwrapExports(protocol);
var protocol_1 = protocol.GRAPHQL_WS;
var protocol_2 = protocol.GRAPHQL_SUBSCRIPTIONS;

var defaults = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var WS_TIMEOUT = 30000;
exports.WS_TIMEOUT = WS_TIMEOUT;
//# sourceMappingURL=defaults.js.map
});

unwrapExports(defaults);
var defaults_1 = defaults.WS_TIMEOUT;

var messageTypes = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var MessageTypes = (function () {
    function MessageTypes() {
        throw new Error('Static Class');
    }
    MessageTypes.GQL_CONNECTION_INIT = 'connection_init';
    MessageTypes.GQL_CONNECTION_ACK = 'connection_ack';
    MessageTypes.GQL_CONNECTION_ERROR = 'connection_error';
    MessageTypes.GQL_CONNECTION_KEEP_ALIVE = 'ka';
    MessageTypes.GQL_CONNECTION_TERMINATE = 'connection_terminate';
    MessageTypes.GQL_START = 'start';
    MessageTypes.GQL_DATA = 'data';
    MessageTypes.GQL_ERROR = 'error';
    MessageTypes.GQL_COMPLETE = 'complete';
    MessageTypes.GQL_STOP = 'stop';
    MessageTypes.SUBSCRIPTION_START = 'subscription_start';
    MessageTypes.SUBSCRIPTION_DATA = 'subscription_data';
    MessageTypes.SUBSCRIPTION_SUCCESS = 'subscription_success';
    MessageTypes.SUBSCRIPTION_FAIL = 'subscription_fail';
    MessageTypes.SUBSCRIPTION_END = 'subscription_end';
    MessageTypes.INIT = 'init';
    MessageTypes.INIT_SUCCESS = 'init_success';
    MessageTypes.INIT_FAIL = 'init_fail';
    MessageTypes.KEEP_ALIVE = 'keepalive';
    return MessageTypes;
}());
exports.default = MessageTypes;
//# sourceMappingURL=message-types.js.map
});

unwrapExports(messageTypes);

var printer_1 = getCjsExportFromNamespace(printer);

var getOperationAST_1 = getCjsExportFromNamespace(getOperationAST$1);

var client = createCommonjsModule(function (module, exports) {
var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _global = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : (typeof window !== 'undefined' ? window : {});
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;










var SubscriptionClient = (function () {
    function SubscriptionClient(url, options, webSocketImpl, webSocketProtocols) {
        var _a = (options || {}), _b = _a.connectionCallback, connectionCallback = _b === void 0 ? undefined : _b, _c = _a.connectionParams, connectionParams = _c === void 0 ? {} : _c, _d = _a.timeout, timeout = _d === void 0 ? defaults.WS_TIMEOUT : _d, _e = _a.reconnect, reconnect = _e === void 0 ? false : _e, _f = _a.reconnectionAttempts, reconnectionAttempts = _f === void 0 ? Infinity : _f, _g = _a.lazy, lazy = _g === void 0 ? false : _g, _h = _a.inactivityTimeout, inactivityTimeout = _h === void 0 ? 0 : _h;
        this.wsImpl = webSocketImpl || NativeWebSocket;
        if (!this.wsImpl) {
            throw new Error('Unable to find native implementation, or alternative implementation for WebSocket!');
        }
        this.wsProtocols = webSocketProtocols || protocol.GRAPHQL_WS;
        this.connectionCallback = connectionCallback;
        this.url = url;
        this.operations = {};
        this.nextOperationId = 0;
        this.wsTimeout = timeout;
        this.unsentMessagesQueue = [];
        this.reconnect = reconnect;
        this.reconnecting = false;
        this.reconnectionAttempts = reconnectionAttempts;
        this.lazy = !!lazy;
        this.inactivityTimeout = inactivityTimeout;
        this.closedByUser = false;
        this.backoff = new backo2({ jitter: 0.5 });
        this.eventEmitter = new eventemitter3.EventEmitter();
        this.middlewares = [];
        this.client = null;
        this.maxConnectTimeGenerator = this.createMaxConnectTimeGenerator();
        this.connectionParams = this.getConnectionParams(connectionParams);
        if (!this.lazy) {
            this.connect();
        }
    }
    Object.defineProperty(SubscriptionClient.prototype, "status", {
        get: function () {
            if (this.client === null) {
                return this.wsImpl.CLOSED;
            }
            return this.client.readyState;
        },
        enumerable: true,
        configurable: true
    });
    SubscriptionClient.prototype.close = function (isForced, closedByUser) {
        if (isForced === void 0) { isForced = true; }
        if (closedByUser === void 0) { closedByUser = true; }
        this.clearInactivityTimeout();
        if (this.client !== null) {
            this.closedByUser = closedByUser;
            if (isForced) {
                this.clearCheckConnectionInterval();
                this.clearMaxConnectTimeout();
                this.clearTryReconnectTimeout();
                this.unsubscribeAll();
                this.sendMessage(undefined, messageTypes.default.GQL_CONNECTION_TERMINATE, null);
            }
            this.client.close();
            this.client = null;
            this.eventEmitter.emit('disconnected');
            if (!isForced) {
                this.tryReconnect();
            }
        }
    };
    SubscriptionClient.prototype.request = function (request) {
        var _a;
        var getObserver = this.getObserver.bind(this);
        var executeOperation = this.executeOperation.bind(this);
        var unsubscribe = this.unsubscribe.bind(this);
        var opId;
        this.clearInactivityTimeout();
        return _a = {},
            _a[symbol_observable_1.default] = function () {
                return this;
            },
            _a.subscribe = function (observerOrNext, onError, onComplete) {
                var observer = getObserver(observerOrNext, onError, onComplete);
                opId = executeOperation(request, function (error, result) {
                    if (error === null && result === null) {
                        if (observer.complete) {
                            observer.complete();
                        }
                    }
                    else if (error) {
                        if (observer.error) {
                            observer.error(error[0]);
                        }
                    }
                    else {
                        if (observer.next) {
                            observer.next(result);
                        }
                    }
                });
                return {
                    unsubscribe: function () {
                        if (opId) {
                            unsubscribe(opId);
                            opId = null;
                        }
                    },
                };
            },
            _a;
    };
    SubscriptionClient.prototype.on = function (eventName, callback, context) {
        var handler = this.eventEmitter.on(eventName, callback, context);
        return function () {
            handler.off(eventName, callback, context);
        };
    };
    SubscriptionClient.prototype.onConnected = function (callback, context) {
        return this.on('connected', callback, context);
    };
    SubscriptionClient.prototype.onConnecting = function (callback, context) {
        return this.on('connecting', callback, context);
    };
    SubscriptionClient.prototype.onDisconnected = function (callback, context) {
        return this.on('disconnected', callback, context);
    };
    SubscriptionClient.prototype.onReconnected = function (callback, context) {
        return this.on('reconnected', callback, context);
    };
    SubscriptionClient.prototype.onReconnecting = function (callback, context) {
        return this.on('reconnecting', callback, context);
    };
    SubscriptionClient.prototype.onError = function (callback, context) {
        return this.on('error', callback, context);
    };
    SubscriptionClient.prototype.unsubscribeAll = function () {
        var _this = this;
        Object.keys(this.operations).forEach(function (subId) {
            _this.unsubscribe(subId);
        });
    };
    SubscriptionClient.prototype.applyMiddlewares = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var queue = function (funcs, scope) {
                var next = function (error) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        if (funcs.length > 0) {
                            var f = funcs.shift();
                            if (f) {
                                f.applyMiddleware.apply(scope, [options, next]);
                            }
                        }
                        else {
                            resolve(options);
                        }
                    }
                };
                next();
            };
            queue(_this.middlewares.slice(), _this);
        });
    };
    SubscriptionClient.prototype.use = function (middlewares) {
        var _this = this;
        middlewares.map(function (middleware) {
            if (typeof middleware.applyMiddleware === 'function') {
                _this.middlewares.push(middleware);
            }
            else {
                throw new Error('Middleware must implement the applyMiddleware function.');
            }
        });
        return this;
    };
    SubscriptionClient.prototype.getConnectionParams = function (connectionParams) {
        return function () { return new Promise(function (resolve, reject) {
            if (typeof connectionParams === 'function') {
                try {
                    return resolve(connectionParams.call(null));
                }
                catch (error) {
                    return reject(error);
                }
            }
            resolve(connectionParams);
        }); };
    };
    SubscriptionClient.prototype.executeOperation = function (options, handler) {
        var _this = this;
        if (this.client === null) {
            this.connect();
        }
        var opId = this.generateOperationId();
        this.operations[opId] = { options: options, handler: handler };
        this.applyMiddlewares(options)
            .then(function (processedOptions) {
            _this.checkOperationOptions(processedOptions, handler);
            if (_this.operations[opId]) {
                _this.operations[opId] = { options: processedOptions, handler: handler };
                _this.sendMessage(opId, messageTypes.default.GQL_START, processedOptions);
            }
        })
            .catch(function (error) {
            _this.unsubscribe(opId);
            handler(_this.formatErrors(error));
        });
        return opId;
    };
    SubscriptionClient.prototype.getObserver = function (observerOrNext, error, complete) {
        if (typeof observerOrNext === 'function') {
            return {
                next: function (v) { return observerOrNext(v); },
                error: function (e) { return error && error(e); },
                complete: function () { return complete && complete(); },
            };
        }
        return observerOrNext;
    };
    SubscriptionClient.prototype.createMaxConnectTimeGenerator = function () {
        var minValue = 1000;
        var maxValue = this.wsTimeout;
        return new backo2({
            min: minValue,
            max: maxValue,
            factor: 1.2,
        });
    };
    SubscriptionClient.prototype.clearCheckConnectionInterval = function () {
        if (this.checkConnectionIntervalId) {
            clearInterval(this.checkConnectionIntervalId);
            this.checkConnectionIntervalId = null;
        }
    };
    SubscriptionClient.prototype.clearMaxConnectTimeout = function () {
        if (this.maxConnectTimeoutId) {
            clearTimeout(this.maxConnectTimeoutId);
            this.maxConnectTimeoutId = null;
        }
    };
    SubscriptionClient.prototype.clearTryReconnectTimeout = function () {
        if (this.tryReconnectTimeoutId) {
            clearTimeout(this.tryReconnectTimeoutId);
            this.tryReconnectTimeoutId = null;
        }
    };
    SubscriptionClient.prototype.clearInactivityTimeout = function () {
        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
            this.inactivityTimeoutId = null;
        }
    };
    SubscriptionClient.prototype.setInactivityTimeout = function () {
        var _this = this;
        if (this.inactivityTimeout > 0 && Object.keys(this.operations).length === 0) {
            this.inactivityTimeoutId = setTimeout(function () {
                if (Object.keys(_this.operations).length === 0) {
                    _this.close();
                }
            }, this.inactivityTimeout);
        }
    };
    SubscriptionClient.prototype.checkOperationOptions = function (options, handler) {
        var query = options.query, variables = options.variables, operationName = options.operationName;
        if (!query) {
            throw new Error('Must provide a query.');
        }
        if (!handler) {
            throw new Error('Must provide an handler.');
        }
        if ((!isString_1.default(query) && !getOperationAST_1.getOperationAST(query, operationName)) ||
            (operationName && !isString_1.default(operationName)) ||
            (variables && !isObject_1.default(variables))) {
            throw new Error('Incorrect option types. query must be a string or a document,' +
                '`operationName` must be a string, and `variables` must be an object.');
        }
    };
    SubscriptionClient.prototype.buildMessage = function (id, type, payload) {
        var payloadToReturn = payload && payload.query ? __assign({}, payload, { query: typeof payload.query === 'string' ? payload.query : printer_1.print(payload.query) }) :
            payload;
        return {
            id: id,
            type: type,
            payload: payloadToReturn,
        };
    };
    SubscriptionClient.prototype.formatErrors = function (errors) {
        if (Array.isArray(errors)) {
            return errors;
        }
        if (errors && errors.errors) {
            return this.formatErrors(errors.errors);
        }
        if (errors && errors.message) {
            return [errors];
        }
        return [{
                name: 'FormatedError',
                message: 'Unknown error',
                originalError: errors,
            }];
    };
    SubscriptionClient.prototype.sendMessage = function (id, type, payload) {
        this.sendMessageRaw(this.buildMessage(id, type, payload));
    };
    SubscriptionClient.prototype.sendMessageRaw = function (message) {
        switch (this.status) {
            case this.wsImpl.OPEN:
                var serializedMessage = JSON.stringify(message);
                try {
                    JSON.parse(serializedMessage);
                }
                catch (e) {
                    this.eventEmitter.emit('error', new Error("Message must be JSON-serializable. Got: " + message));
                }
                this.client.send(serializedMessage);
                break;
            case this.wsImpl.CONNECTING:
                this.unsentMessagesQueue.push(message);
                break;
            default:
                if (!this.reconnecting) {
                    this.eventEmitter.emit('error', new Error('A message was not sent because socket is not connected, is closing or ' +
                        'is already closed. Message was: ' + JSON.stringify(message)));
                }
        }
    };
    SubscriptionClient.prototype.generateOperationId = function () {
        return String(++this.nextOperationId);
    };
    SubscriptionClient.prototype.tryReconnect = function () {
        var _this = this;
        if (!this.reconnect || this.backoff.attempts >= this.reconnectionAttempts) {
            return;
        }
        if (!this.reconnecting) {
            Object.keys(this.operations).forEach(function (key) {
                _this.unsentMessagesQueue.push(_this.buildMessage(key, messageTypes.default.GQL_START, _this.operations[key].options));
            });
            this.reconnecting = true;
        }
        this.clearTryReconnectTimeout();
        var delay = this.backoff.duration();
        this.tryReconnectTimeoutId = setTimeout(function () {
            _this.connect();
        }, delay);
    };
    SubscriptionClient.prototype.flushUnsentMessagesQueue = function () {
        var _this = this;
        this.unsentMessagesQueue.forEach(function (message) {
            _this.sendMessageRaw(message);
        });
        this.unsentMessagesQueue = [];
    };
    SubscriptionClient.prototype.checkConnection = function () {
        if (this.wasKeepAliveReceived) {
            this.wasKeepAliveReceived = false;
            return;
        }
        if (!this.reconnecting) {
            this.close(false, true);
        }
    };
    SubscriptionClient.prototype.checkMaxConnectTimeout = function () {
        var _this = this;
        this.clearMaxConnectTimeout();
        this.maxConnectTimeoutId = setTimeout(function () {
            if (_this.status !== _this.wsImpl.OPEN) {
                _this.reconnecting = true;
                _this.close(false, true);
            }
        }, this.maxConnectTimeGenerator.duration());
    };
    SubscriptionClient.prototype.connect = function () {
        var _this = this;
        this.client = new this.wsImpl(this.url, this.wsProtocols);
        this.checkMaxConnectTimeout();
        this.client.onopen = function () { return __awaiter(_this, void 0, void 0, function () {
            var connectionParams, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.status === this.wsImpl.OPEN)) return [3, 4];
                        this.clearMaxConnectTimeout();
                        this.closedByUser = false;
                        this.eventEmitter.emit(this.reconnecting ? 'reconnecting' : 'connecting');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.connectionParams()];
                    case 2:
                        connectionParams = _a.sent();
                        this.sendMessage(undefined, messageTypes.default.GQL_CONNECTION_INIT, connectionParams);
                        this.flushUnsentMessagesQueue();
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.sendMessage(undefined, messageTypes.default.GQL_CONNECTION_ERROR, error_1);
                        this.flushUnsentMessagesQueue();
                        return [3, 4];
                    case 4: return [2];
                }
            });
        }); };
        this.client.onclose = function () {
            if (!_this.closedByUser) {
                _this.close(false, false);
            }
        };
        this.client.onerror = function (err) {
            _this.eventEmitter.emit('error', err);
        };
        this.client.onmessage = function (_a) {
            var data = _a.data;
            _this.processReceivedData(data);
        };
    };
    SubscriptionClient.prototype.processReceivedData = function (receivedData) {
        var parsedMessage;
        var opId;
        try {
            parsedMessage = JSON.parse(receivedData);
            opId = parsedMessage.id;
        }
        catch (e) {
            throw new Error("Message must be JSON-parseable. Got: " + receivedData);
        }
        if ([messageTypes.default.GQL_DATA,
            messageTypes.default.GQL_COMPLETE,
            messageTypes.default.GQL_ERROR,
        ].indexOf(parsedMessage.type) !== -1 && !this.operations[opId]) {
            this.unsubscribe(opId);
            return;
        }
        switch (parsedMessage.type) {
            case messageTypes.default.GQL_CONNECTION_ERROR:
                if (this.connectionCallback) {
                    this.connectionCallback(parsedMessage.payload);
                }
                break;
            case messageTypes.default.GQL_CONNECTION_ACK:
                this.eventEmitter.emit(this.reconnecting ? 'reconnected' : 'connected');
                this.reconnecting = false;
                this.backoff.reset();
                this.maxConnectTimeGenerator.reset();
                if (this.connectionCallback) {
                    this.connectionCallback();
                }
                break;
            case messageTypes.default.GQL_COMPLETE:
                this.operations[opId].handler(null, null);
                delete this.operations[opId];
                break;
            case messageTypes.default.GQL_ERROR:
                this.operations[opId].handler(this.formatErrors(parsedMessage.payload), null);
                delete this.operations[opId];
                break;
            case messageTypes.default.GQL_DATA:
                var parsedPayload = !parsedMessage.payload.errors ?
                    parsedMessage.payload : __assign({}, parsedMessage.payload, { errors: this.formatErrors(parsedMessage.payload.errors) });
                this.operations[opId].handler(null, parsedPayload);
                break;
            case messageTypes.default.GQL_CONNECTION_KEEP_ALIVE:
                var firstKA = typeof this.wasKeepAliveReceived === 'undefined';
                this.wasKeepAliveReceived = true;
                if (firstKA) {
                    this.checkConnection();
                }
                if (this.checkConnectionIntervalId) {
                    clearInterval(this.checkConnectionIntervalId);
                    this.checkConnection();
                }
                this.checkConnectionIntervalId = setInterval(this.checkConnection.bind(this), this.wsTimeout);
                break;
            default:
                throw new Error('Invalid message type!');
        }
    };
    SubscriptionClient.prototype.unsubscribe = function (opId) {
        if (this.operations[opId]) {
            delete this.operations[opId];
            this.setInactivityTimeout();
            this.sendMessage(opId, messageTypes.default.GQL_STOP, undefined);
        }
    };
    return SubscriptionClient;
}());
exports.SubscriptionClient = SubscriptionClient;
//# sourceMappingURL=client.js.map
});

unwrapExports(client);
var client_1 = client.SubscriptionClient;

var WebSocketLink = (function (_super) {
    __extends(WebSocketLink, _super);
    function WebSocketLink(paramsOrClient) {
        var _this = _super.call(this) || this;
        if (paramsOrClient instanceof client_1) {
            _this.subscriptionClient = paramsOrClient;
        }
        else {
            _this.subscriptionClient = new client_1(paramsOrClient.uri, paramsOrClient.options, paramsOrClient.webSocketImpl);
        }
        return _this;
    }
    WebSocketLink.prototype.request = function (operation) {
        return this.subscriptionClient.request(operation);
    };
    return WebSocketLink;
}(ApolloLink));
//# sourceMappingURL=bundle.esm.js.map

var support = {
  searchParams: 'URLSearchParams' in self,
  iterable: 'Symbol' in self && 'iterator' in Symbol,
  blob:
    'FileReader' in self &&
    'Blob' in self &&
    (function() {
      try {
        new Blob();
        return true
      } catch (e) {
        return false
      }
    })(),
  formData: 'FormData' in self,
  arrayBuffer: 'ArrayBuffer' in self
};

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ];

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    };
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
    throw new TypeError('Invalid character in header field name')
  }
  return name.toLowerCase()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift();
      return {done: value === undefined, value: value}
    }
  };

  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator
    };
  }

  return iterator
}

function Headers(headers) {
  this.map = {};

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name]);
    }, this);
  }
}

Headers.prototype.append = function(name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ', ' + value : value;
};

Headers.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)];
};

Headers.prototype.get = function(name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null
};

Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name))
};

Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};

Headers.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};

Headers.prototype.keys = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push(name);
  });
  return iteratorFor(items)
};

Headers.prototype.values = function() {
  var items = [];
  this.forEach(function(value) {
    items.push(value);
  });
  return iteratorFor(items)
};

Headers.prototype.entries = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items)
};

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true;
}

function fileReaderReady(reader) {
  return new Promise(function(resolve, reject) {
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = function() {
      reject(reader.error);
    };
  })
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise
}

function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsText(blob);
  return promise
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    var view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false;

  this._initBody = function(body) {
    this._bodyInit = body;
    if (!body) {
      this._bodyText = '';
    } else if (typeof body === 'string') {
      this._bodyText = body;
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body;
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body;
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer]);
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body);
    } else {
      this._bodyText = body = Object.prototype.toString.call(body);
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8');
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type);
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
      }
    }
  };

  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return Promise.resolve(new Blob([this._bodyText]))
      }
    };

    this.arrayBuffer = function() {
      if (this._bodyArrayBuffer) {
        return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
      } else {
        return this.blob().then(readBlobAsArrayBuffer)
      }
    };
  }

  this.text = function() {
    var rejected = consumed(this);
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return Promise.resolve(this._bodyText)
    }
  };

  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode)
    };
  }

  this.json = function() {
    return this.text().then(JSON.parse)
  };

  return this
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

function normalizeMethod(method) {
  var upcased = method.toUpperCase();
  return methods.indexOf(upcased) > -1 ? upcased : method
}

function Request(input, options) {
  options = options || {};
  var body = options.body;

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url;
    this.credentials = input.credentials;
    if (!options.headers) {
      this.headers = new Headers(input.headers);
    }
    this.method = input.method;
    this.mode = input.mode;
    this.signal = input.signal;
    if (!body && input._bodyInit != null) {
      body = input._bodyInit;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }

  this.credentials = options.credentials || this.credentials || 'same-origin';
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers);
  }
  this.method = normalizeMethod(options.method || this.method || 'GET');
  this.mode = options.mode || this.mode || null;
  this.signal = options.signal || this.signal;
  this.referrer = null;

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body);
}

Request.prototype.clone = function() {
  return new Request(this, {body: this._bodyInit})
};

function decode(body) {
  var form = new FormData();
  body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
  return form
}

function parseHeaders(rawHeaders) {
  var headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
    var parts = line.split(':');
    var key = parts.shift().trim();
    if (key) {
      var value = parts.join(':').trim();
      headers.append(key, value);
    }
  });
  return headers
}

Body.call(Request.prototype);

function Response(bodyInit, options) {
  if (!options) {
    options = {};
  }

  this.type = 'default';
  this.status = options.status === undefined ? 200 : options.status;
  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = 'statusText' in options ? options.statusText : 'OK';
  this.headers = new Headers(options.headers);
  this.url = options.url || '';
  this._initBody(bodyInit);
}

Body.call(Response.prototype);

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
};

Response.error = function() {
  var response = new Response(null, {status: 0, statusText: ''});
  response.type = 'error';
  return response
};

var redirectStatuses = [301, 302, 303, 307, 308];

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, {status: status, headers: {location: url}})
};

var DOMException = self.DOMException;
try {
  new DOMException();
} catch (err) {
  DOMException = function(message, name) {
    this.message = message;
    this.name = name;
    var error = Error(message);
    this.stack = error.stack;
  };
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
}

function fetch(input, init) {
  return new Promise(function(resolve, reject) {
    var request = new Request(input, init);

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    var xhr = new XMLHttpRequest();

    function abortXhr() {
      xhr.abort();
    }

    xhr.onload = function() {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      };
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      resolve(new Response(body, options));
    };

    xhr.onerror = function() {
      reject(new TypeError('Network request failed'));
    };

    xhr.ontimeout = function() {
      reject(new TypeError('Network request failed'));
    };

    xhr.onabort = function() {
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.open(request.method, request.url, true);

    if (request.credentials === 'include') {
      xhr.withCredentials = true;
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false;
    }

    if ('responseType' in xhr && support.blob) {
      xhr.responseType = 'blob';
    }

    request.headers.forEach(function(value, name) {
      xhr.setRequestHeader(name, value);
    });

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr);

      xhr.onreadystatechange = function() {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr);
        }
      };
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
  })
}

fetch.polyfill = true;

if (!self.fetch) {
  self.fetch = fetch;
  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;
}

// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.

var fetchNpmBrowserify = self.fetch.bind(self);

const headers = {'content-type': 'application/json'};
const getHeaders = () => {
  return headers;
};

const cache = new InMemoryCache();

const wsLink =  new WebSocketLink({
  uri: "ws://hasura-midcodes1.herokuapp.com/v1/graphql",
  options: {
    reconnect: true,
    lazy: true,
    connectionParams: () => {
      return { headers: getHeaders() };
    },
  },
}) ;

const httpLink = new HttpLink({
  uri: "https://hasura-midcodes1.herokuapp.com/v1/graphql",
   fetch: fetchNpmBrowserify ,
  headers: getHeaders()
});



const link =  split( //only create the split in the browser
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink,
  ) ;


  const client$1 = new ApolloClient__default({
    link,
    cache
  });

export { setClient as a, client$1 as c, getClient as g, query as q, subscribe as s };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2Fwb2xsby5jM2UyZjgyZi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS1vYnNlcnZhYmxlL2Rpc3Qvc3ZlbHRlLW9ic2VydmFibGUuZXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3ZlbHRlLWFwb2xsby9kaXN0L3N2ZWx0ZS1hcG9sbG8uZXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvYmFja28yL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MvZGlzdC91dGlscy9pcy1zdHJpbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MvZGlzdC91dGlscy9pcy1vYmplY3QuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZ3JhcGhxbC91dGlsaXRpZXMvZ2V0T3BlcmF0aW9uQVNULm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdWJzY3JpcHRpb25zLXRyYW5zcG9ydC13cy9kaXN0L3Byb3RvY29sLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N1YnNjcmlwdGlvbnMtdHJhbnNwb3J0LXdzL2Rpc3QvZGVmYXVsdHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MvZGlzdC9tZXNzYWdlLXR5cGVzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N1YnNjcmlwdGlvbnMtdHJhbnNwb3J0LXdzL2Rpc3QvY2xpZW50LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Fwb2xsby1saW5rLXdzL2xpYi9idW5kbGUuZXNtLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9mZXRjaC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9pc29tb3JwaGljLWZldGNoL2ZldGNoLW5wbS1icm93c2VyaWZ5LmpzIiwiLi4vLi4vLi4vc3JjL3JvdXRlcy9fYXBvbGxvLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlYWRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcblxudmFyIE9CU0VSVkFCTEU7XHJcbmZ1bmN0aW9uIGlzT2JzZXJ2YWJsZSh2YWx1ZSkge1xyXG4gICAgLy8gTGF6eS1sb2FkIFN5bWJvbCB0byBnaXZlIHBvbHlmaWxscyBhIGNoYW5jZSB0byBydW5cclxuICAgIGlmICghT0JTRVJWQUJMRSkge1xyXG4gICAgICAgIE9CU0VSVkFCTEUgPVxyXG4gICAgICAgICAgICAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBTeW1ib2wub2JzZXJ2YWJsZSkgfHwgJ0BAb2JzZXJ2YWJsZSc7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgdmFsdWVbT0JTRVJWQUJMRV0gJiYgdmFsdWVbT0JTRVJWQUJMRV0oKSA9PT0gdmFsdWU7XHJcbn1cclxuZnVuY3Rpb24gZGVmZXJyZWQoc2V0LCBpbml0aWFsKSB7XHJcbiAgICB2YXIgaW5pdGlhbGl6ZWQgPSBpbml0aWFsICE9PSB1bmRlZmluZWQ7XHJcbiAgICB2YXIgcmVzb2x2ZTtcclxuICAgIHZhciByZWplY3Q7XHJcbiAgICAvLyBTZXQgaW5pdGlhbCB2YWx1ZVxyXG4gICAgc2V0KGluaXRpYWxpemVkXHJcbiAgICAgICAgPyBpbml0aWFsXHJcbiAgICAgICAgOiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoX3Jlc29sdmUsIF9yZWplY3QpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSA9IF9yZXNvbHZlO1xyXG4gICAgICAgICAgICByZWplY3QgPSBfcmVqZWN0O1xyXG4gICAgICAgIH0pKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZnVsZmlsbDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsaXplZClcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXQoUHJvbWlzZS5yZXNvbHZlKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZWplY3Q6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbGl6ZWQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0KFByb21pc2UucmVqZWN0KGVycm9yKSk7XHJcbiAgICAgICAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XG5cbnZhciBub29wID0gZnVuY3Rpb24gKCkgeyB9O1xyXG5mdW5jdGlvbiBvYnNlcnZlKG9ic2VydmFibGUsIGluaXRpYWwpIHtcclxuICAgIGlmICghaXNPYnNlcnZhYmxlKG9ic2VydmFibGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlYWRhYmxlKG9ic2VydmFibGUsIG5vb3ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlYWRhYmxlKHVuZGVmaW5lZCwgZnVuY3Rpb24gKHNldCkge1xyXG4gICAgICAgIHZhciBfYSA9IGRlZmVycmVkKHNldCwgaW5pdGlhbCksIGZ1bGZpbGwgPSBfYS5mdWxmaWxsLCByZWplY3QgPSBfYS5yZWplY3Q7XHJcbiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IG9ic2VydmFibGUuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBmdWxmaWxsKHZhbHVlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpOyB9O1xyXG4gICAgfSk7XHJcbn1cblxuZnVuY3Rpb24gZmxhdChzdWJzY3JpYmFibGUsIGluaXRpYWwpIHtcclxuICAgIHZhciBpc19vYnNlcnZhYmxlID0gaXNPYnNlcnZhYmxlKHN1YnNjcmliYWJsZSk7XHJcbiAgICByZXR1cm4gcmVhZGFibGUodW5kZWZpbmVkLCBmdW5jdGlvbiAoc2V0KSB7XHJcbiAgICAgICAgdmFyIGlubmVyX3Vuc3Vic2NyaWJlID0gbnVsbDtcclxuICAgICAgICB2YXIgb3V0ZXJfdW5zdWJzY3JpYmUgPSBudWxsO1xyXG4gICAgICAgIHZhciBfYSA9IChpc19vYnNlcnZhYmxlXHJcbiAgICAgICAgICAgID8gZGVmZXJyZWQoc2V0LCBpbml0aWFsKVxyXG4gICAgICAgICAgICA6IHt9KSwgX2IgPSBfYS5mdWxmaWxsLCBmdWxmaWxsID0gX2IgPT09IHZvaWQgMCA/IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gc2V0KHZhbHVlKTsgfSA6IF9iLCByZWplY3QgPSBfYS5yZWplY3Q7XHJcbiAgICAgICAgZnVuY3Rpb24gbmV4dCh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaW5uZXJfdW5zdWJzY3JpYmUpIHtcclxuICAgICAgICAgICAgICAgIGlubmVyX3Vuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgICAgICBpbm5lcl91bnN1YnNjcmliZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlzT2JzZXJ2YWJsZSh2YWx1ZSkpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9ic2VydmUodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAoaXNTdG9yZSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlubmVyX3Vuc3Vic2NyaWJlID0gdmFsdWUuc3Vic2NyaWJlKGZ1bmN0aW9uIChpbm5lcikgeyByZXR1cm4gZnVsZmlsbChpbm5lcik7IH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZnVsZmlsbCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZXJyb3IoZXJyb3IpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGlzX29ic2VydmFibGUpIHtcclxuICAgICAgICAgICAgdmFyIHN1YnNjcmlwdGlvbl8xID0gc3Vic2NyaWJhYmxlLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBuZXh0OiBuZXh0LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBvdXRlcl91bnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN1YnNjcmlwdGlvbl8xLnVuc3Vic2NyaWJlKCk7IH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBvdXRlcl91bnN1YnNjcmliZSA9IHN1YnNjcmliYWJsZS5zdWJzY3JpYmUobmV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChpbm5lcl91bnN1YnNjcmliZSlcclxuICAgICAgICAgICAgICAgIGlubmVyX3Vuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgIG91dGVyX3Vuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGlzU3RvcmUodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUuc3Vic2NyaWJlID09PSAnZnVuY3Rpb24nO1xyXG59XG5cbmV4cG9ydCB7IGZsYXQsIG9ic2VydmUgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN2ZWx0ZS1vYnNlcnZhYmxlLmVzLmpzLm1hcFxuIiwiaW1wb3J0IHsgZ2V0Q29udGV4dCwgc2V0Q29udGV4dCwgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBpc0VxdWFsIH0gZnJvbSAnYXBvbGxvLXV0aWxpdGllcyc7XG5pbXBvcnQgeyByZWFkYWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSc7XG5pbXBvcnQgeyBvYnNlcnZlIH0gZnJvbSAnc3ZlbHRlLW9ic2VydmFibGUnO1xuXG52YXIgQ0xJRU5UID0gdHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgPyBTeW1ib2woJ2NsaWVudCcpIDogJ0BAY2xpZW50JztcclxuZnVuY3Rpb24gZ2V0Q2xpZW50KCkge1xyXG4gICAgcmV0dXJuIGdldENvbnRleHQoQ0xJRU5UKTtcclxufVxyXG5mdW5jdGlvbiBzZXRDbGllbnQoY2xpZW50KSB7XHJcbiAgICBzZXRDb250ZXh0KENMSUVOVCwgY2xpZW50KTtcclxufVxuXG52YXIgcmVzdG9yaW5nID0gdHlwZW9mIFdlYWtTZXQgIT09ICd1bmRlZmluZWQnID8gbmV3IFdlYWtTZXQoKSA6IG5ldyBTZXQoKTtcclxuZnVuY3Rpb24gcmVzdG9yZShjbGllbnQsIHF1ZXJ5LCBkYXRhKSB7XHJcbiAgICByZXN0b3JpbmcuYWRkKGNsaWVudCk7XHJcbiAgICBhZnRlckh5ZHJhdGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJlc3RvcmluZy5kZWxldGUoY2xpZW50KTtcclxuICAgIH0pO1xyXG4gICAgY2xpZW50LndyaXRlUXVlcnkoeyBxdWVyeTogcXVlcnksIGRhdGE6IGRhdGEgfSk7XHJcbn1cclxuZnVuY3Rpb24gYWZ0ZXJIeWRyYXRlKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBBdHRlbXB0IHRvIHdhaXQgZm9yIG9uTW91bnQgKGh5ZHJhdGlvbiBvZiBjdXJyZW50IGNvbXBvbmVudCBpcyBjb21wbGV0ZSksXHJcbiAgICAvLyBidXQgaWYgdGhhdCBmYWlscyAoZS5nLiBvdXRzaWRlIG9mIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbilcclxuICAgIC8vIHdhaXQgZm9yIG5leHQgZXZlbnQgbG9vcCBmb3IgaHlkcmF0ZSB0byBjb21wbGV0ZVxyXG4gICAgdHJ5IHtcclxuICAgICAgICBvbk1vdW50KGNhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChfZXJyb3IpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxKTtcclxuICAgIH1cclxufVxuXG5mdW5jdGlvbiBxdWVyeShjbGllbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzdWJzY3JpYmVkID0gZmFsc2U7XHJcbiAgICB2YXIgaW5pdGlhbF92YWx1ZTtcclxuICAgIC8vIElmIGNsaWVudCBpcyByZXN0b3JpbmcgKGUuZy4gZnJvbSBTU1IpXHJcbiAgICAvLyBhdHRlbXB0IHN5bmNocm9ub3VzIHJlYWRRdWVyeSBmaXJzdCAodG8gcHJldmVudCBsb2FkaW5nIGluIHsjYXdhaXR9KVxyXG4gICAgaWYgKHJlc3RvcmluZy5oYXMoY2xpZW50KSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIHVuZGVmaW5lZCA9IHNraXAgaW5pdGlhbCB2YWx1ZSAobm90IGluIGNhY2hlKVxyXG4gICAgICAgICAgICBpbml0aWFsX3ZhbHVlID0gY2xpZW50LnJlYWRRdWVyeShvcHRpb25zKSB8fCB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGluaXRpYWxfdmFsdWUgPSB7IGRhdGE6IGluaXRpYWxfdmFsdWUgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAvLyBJZ25vcmUgcHJlbG9hZCBlcnJvcnNcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBDcmVhdGUgcXVlcnkgYW5kIG9ic2VydmUsXHJcbiAgICAvLyBidXQgZG9uJ3Qgc3Vic2NyaWJlIGRpcmVjdGx5IHRvIGF2b2lkIGZpcmluZyBkdXBsaWNhdGUgdmFsdWUgaWYgaW5pdGlhbGl6ZWRcclxuICAgIHZhciBvYnNlcnZhYmxlX3F1ZXJ5ID0gY2xpZW50LndhdGNoUXVlcnkob3B0aW9ucyk7XHJcbiAgICB2YXIgc3Vic2NyaWJlX3RvX3F1ZXJ5ID0gb2JzZXJ2ZShvYnNlcnZhYmxlX3F1ZXJ5LCBpbml0aWFsX3ZhbHVlKS5zdWJzY3JpYmU7XHJcbiAgICAvLyBXcmFwIHRoZSBxdWVyeSBzdWJzY3JpcHRpb24gd2l0aCBhIHJlYWRhYmxlIHRvIHByZXZlbnQgZHVwbGljYXRlIHZhbHVlc1xyXG4gICAgdmFyIHN1YnNjcmliZSA9IHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIGZ1bmN0aW9uIChzZXQpIHtcclxuICAgICAgICBzdWJzY3JpYmVkID0gdHJ1ZTtcclxuICAgICAgICB2YXIgc2tpcF9kdXBsaWNhdGUgPSBpbml0aWFsX3ZhbHVlICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIHNraXBwZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgdW5zdWJzY3JpYmUgPSBzdWJzY3JpYmVfdG9fcXVlcnkoZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChza2lwX2R1cGxpY2F0ZSAmJiBpbml0aWFsaXplZCAmJiAhc2tpcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgc2tpcHBlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWluaXRpYWxpemVkKVxyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHNldCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdW5zdWJzY3JpYmU7XHJcbiAgICB9KS5zdWJzY3JpYmU7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHN1YnNjcmliZTogc3Vic2NyaWJlLFxyXG4gICAgICAgIHJlZmV0Y2g6IGZ1bmN0aW9uICh2YXJpYWJsZXMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdmFyaWFibGVzIGhhdmUgbm90IGNoYW5nZWQgYW5kIG5vdCBzdWJzY3JpYmVkLCBza2lwIHJlZmV0Y2hcclxuICAgICAgICAgICAgaWYgKCFzdWJzY3JpYmVkICYmIGlzRXF1YWwodmFyaWFibGVzLCBvYnNlcnZhYmxlX3F1ZXJ5LnZhcmlhYmxlcykpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZV9xdWVyeS5yZXN1bHQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVfcXVlcnkucmVmZXRjaCh2YXJpYWJsZXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzdWx0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBvYnNlcnZhYmxlX3F1ZXJ5LnJlc3VsdCgpOyB9LFxyXG4gICAgICAgIGZldGNoTW9yZTogZnVuY3Rpb24gKG9wdGlvbnMpIHsgcmV0dXJuIG9ic2VydmFibGVfcXVlcnkuZmV0Y2hNb3JlKG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIHNldE9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zKSB7IHJldHVybiBvYnNlcnZhYmxlX3F1ZXJ5LnNldE9wdGlvbnMob3B0aW9ucyk7IH0sXHJcbiAgICAgICAgdXBkYXRlUXVlcnk6IGZ1bmN0aW9uIChtYXApIHsgcmV0dXJuIG9ic2VydmFibGVfcXVlcnkudXBkYXRlUXVlcnkobWFwKTsgfSxcclxuICAgICAgICBzdGFydFBvbGxpbmc6IGZ1bmN0aW9uIChpbnRlcnZhbCkgeyByZXR1cm4gb2JzZXJ2YWJsZV9xdWVyeS5zdGFydFBvbGxpbmcoaW50ZXJ2YWwpOyB9LFxyXG4gICAgICAgIHN0b3BQb2xsaW5nOiBmdW5jdGlvbiAoKSB7IHJldHVybiBvYnNlcnZhYmxlX3F1ZXJ5LnN0b3BQb2xsaW5nKCk7IH0sXHJcbiAgICAgICAgc3Vic2NyaWJlVG9Nb3JlOiBmdW5jdGlvbiAob3B0aW9ucykgeyByZXR1cm4gb2JzZXJ2YWJsZV9xdWVyeS5zdWJzY3JpYmVUb01vcmUob3B0aW9ucyk7IH1cclxuICAgIH07XHJcbn1cblxuZnVuY3Rpb24gbXV0YXRlKGNsaWVudCwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuIGNsaWVudC5tdXRhdGUob3B0aW9ucyk7XHJcbn1cblxuZnVuY3Rpb24gc3Vic2NyaWJlKGNsaWVudCwgb3B0aW9ucykge1xyXG4gICAgdmFyIG9ic2VydmFibGUgPSBjbGllbnQuc3Vic2NyaWJlKG9wdGlvbnMpO1xyXG4gICAgcmV0dXJuIG9ic2VydmUob2JzZXJ2YWJsZSk7XHJcbn1cblxuZXhwb3J0IHsgZ2V0Q2xpZW50LCBtdXRhdGUsIHF1ZXJ5LCByZXN0b3JlLCBzZXRDbGllbnQsIHN1YnNjcmliZSB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3ZlbHRlLWFwb2xsby5lcy5qcy5tYXBcbiIsIlxuLyoqXG4gKiBFeHBvc2UgYEJhY2tvZmZgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQmFja29mZjtcblxuLyoqXG4gKiBJbml0aWFsaXplIGJhY2tvZmYgdGltZXIgd2l0aCBgb3B0c2AuXG4gKlxuICogLSBgbWluYCBpbml0aWFsIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzIFsxMDBdXG4gKiAtIGBtYXhgIG1heCB0aW1lb3V0IFsxMDAwMF1cbiAqIC0gYGppdHRlcmAgWzBdXG4gKiAtIGBmYWN0b3JgIFsyXVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEJhY2tvZmYob3B0cykge1xuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgdGhpcy5tcyA9IG9wdHMubWluIHx8IDEwMDtcbiAgdGhpcy5tYXggPSBvcHRzLm1heCB8fCAxMDAwMDtcbiAgdGhpcy5mYWN0b3IgPSBvcHRzLmZhY3RvciB8fCAyO1xuICB0aGlzLmppdHRlciA9IG9wdHMuaml0dGVyID4gMCAmJiBvcHRzLmppdHRlciA8PSAxID8gb3B0cy5qaXR0ZXIgOiAwO1xuICB0aGlzLmF0dGVtcHRzID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGJhY2tvZmYgZHVyYXRpb24uXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5CYWNrb2ZmLnByb3RvdHlwZS5kdXJhdGlvbiA9IGZ1bmN0aW9uKCl7XG4gIHZhciBtcyA9IHRoaXMubXMgKiBNYXRoLnBvdyh0aGlzLmZhY3RvciwgdGhpcy5hdHRlbXB0cysrKTtcbiAgaWYgKHRoaXMuaml0dGVyKSB7XG4gICAgdmFyIHJhbmQgPSAgTWF0aC5yYW5kb20oKTtcbiAgICB2YXIgZGV2aWF0aW9uID0gTWF0aC5mbG9vcihyYW5kICogdGhpcy5qaXR0ZXIgKiBtcyk7XG4gICAgbXMgPSAoTWF0aC5mbG9vcihyYW5kICogMTApICYgMSkgPT0gMCAgPyBtcyAtIGRldmlhdGlvbiA6IG1zICsgZGV2aWF0aW9uO1xuICB9XG4gIHJldHVybiBNYXRoLm1pbihtcywgdGhpcy5tYXgpIHwgMDtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIG51bWJlciBvZiBhdHRlbXB0cy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkJhY2tvZmYucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5hdHRlbXB0cyA9IDA7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgbWluaW11bSBkdXJhdGlvblxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQmFja29mZi5wcm90b3R5cGUuc2V0TWluID0gZnVuY3Rpb24obWluKXtcbiAgdGhpcy5tcyA9IG1pbjtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBtYXhpbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNYXggPSBmdW5jdGlvbihtYXgpe1xuICB0aGlzLm1heCA9IG1heDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBqaXR0ZXJcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkJhY2tvZmYucHJvdG90eXBlLnNldEppdHRlciA9IGZ1bmN0aW9uKGppdHRlcil7XG4gIHRoaXMuaml0dGVyID0gaml0dGVyO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFdmVudHMoKSB7fVxuXG4vL1xuLy8gV2UgdHJ5IHRvIG5vdCBpbmhlcml0IGZyb20gYE9iamVjdC5wcm90b3R5cGVgLiBJbiBzb21lIGVuZ2luZXMgY3JlYXRpbmcgYW5cbi8vIGluc3RhbmNlIGluIHRoaXMgd2F5IGlzIGZhc3RlciB0aGFuIGNhbGxpbmcgYE9iamVjdC5jcmVhdGUobnVsbClgIGRpcmVjdGx5LlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGNoYXJhY3RlciB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdFxuLy8gb3ZlcnJpZGRlbiBvciB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vL1xuaWYgKE9iamVjdC5jcmVhdGUpIHtcbiAgRXZlbnRzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy9cbiAgLy8gVGhpcyBoYWNrIGlzIG5lZWRlZCBiZWNhdXNlIHRoZSBgX19wcm90b19fYCBwcm9wZXJ0eSBpcyBzdGlsbCBpbmhlcml0ZWQgaW5cbiAgLy8gc29tZSBvbGQgYnJvd3NlcnMgbGlrZSBBbmRyb2lkIDQsIGlQaG9uZSA1LjEsIE9wZXJhIDExIGFuZCBTYWZhcmkgNS5cbiAgLy9cbiAgaWYgKCFuZXcgRXZlbnRzKCkuX19wcm90b19fKSBwcmVmaXggPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBldmVudCBsaXN0ZW5lci5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBlbWl0dGVyIFJlZmVyZW5jZSB0byB0aGUgYEV2ZW50RW1pdHRlcmAgaW5zdGFuY2UuXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIFNwZWNpZnkgaWYgdGhlIGxpc3RlbmVyIGlzIGEgb25lLXRpbWUgbGlzdGVuZXIuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gYWRkTGlzdGVuZXIoZW1pdHRlciwgZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgZW1pdHRlciwgb25jZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCFlbWl0dGVyLl9ldmVudHNbZXZ0XSkgZW1pdHRlci5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgZW1pdHRlci5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIWVtaXR0ZXIuX2V2ZW50c1tldnRdLmZuKSBlbWl0dGVyLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSBlbWl0dGVyLl9ldmVudHNbZXZ0XSA9IFtlbWl0dGVyLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiBlbWl0dGVyO1xufVxuXG4vKipcbiAqIENsZWFyIGV2ZW50IGJ5IG5hbWUuXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IGVtaXR0ZXIgUmVmZXJlbmNlIHRvIHRoZSBgRXZlbnRFbWl0dGVyYCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldnQgVGhlIEV2ZW50IG5hbWUuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjbGVhckV2ZW50KGVtaXR0ZXIsIGV2dCkge1xuICBpZiAoLS1lbWl0dGVyLl9ldmVudHNDb3VudCA9PT0gMCkgZW1pdHRlci5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICBlbHNlIGRlbGV0ZSBlbWl0dGVyLl9ldmVudHNbZXZ0XTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBuYW1lcyA9IFtdXG4gICAgLCBldmVudHNcbiAgICAsIG5hbWU7XG5cbiAgaWYgKHRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIChldmVudHMgPSB0aGlzLl9ldmVudHMpKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0FycmF5fSBUaGUgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBoYW5kbGVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmICghaGFuZGxlcnMpIHJldHVybiBbXTtcbiAgaWYgKGhhbmRsZXJzLmZuKSByZXR1cm4gW2hhbmRsZXJzLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGhhbmRsZXJzLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGhhbmRsZXJzW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMgbGlzdGVuaW5nIHRvIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge051bWJlcn0gVGhlIG51bWJlciBvZiBsaXN0ZW5lcnMuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmICghbGlzdGVuZXJzKSByZXR1cm4gMDtcbiAgaWYgKGxpc3RlbmVycy5mbikgcmV0dXJuIDE7XG4gIHJldHVybiBsaXN0ZW5lcnMubGVuZ3RoO1xufTtcblxuLyoqXG4gKiBDYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICByZXR1cm4gYWRkTGlzdGVuZXIodGhpcywgZXZlbnQsIGZuLCBjb250ZXh0LCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEFkZCBhIG9uZS10aW1lIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICByZXR1cm4gYWRkTGlzdGVuZXIodGhpcywgZXZlbnQsIGZuLCBjb250ZXh0LCB0cnVlKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgbWF0Y2ggdGhpcyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAoXG4gICAgICBsaXN0ZW5lcnMuZm4gPT09IGZuICYmXG4gICAgICAoIW9uY2UgfHwgbGlzdGVuZXJzLm9uY2UpICYmXG4gICAgICAoIWNvbnRleHQgfHwgbGlzdGVuZXJzLmNvbnRleHQgPT09IGNvbnRleHQpXG4gICAgKSB7XG4gICAgICBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudHMgPSBbXSwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm4gfHxcbiAgICAgICAgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKSB8fFxuICAgICAgICAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vXG4gICAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAgIC8vXG4gICAgaWYgKGV2ZW50cy5sZW5ndGgpIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgICBlbHNlIGNsZWFyRXZlbnQodGhpcywgZXZ0KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dDtcblxuICBpZiAoZXZlbnQpIHtcbiAgICBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuICAgIGlmICh0aGlzLl9ldmVudHNbZXZ0XSkgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gaXNTdHJpbmc7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy1zdHJpbmcuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiAoKHZhbHVlICE9PSBudWxsKSAmJiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykpO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gaXNPYmplY3Q7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy1vYmplY3QuanMubWFwIiwiaW1wb3J0IHsgS2luZCB9IGZyb20gJy4uL2xhbmd1YWdlL2tpbmRzJztcblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9wZXJhdGlvbiBBU1QgZ2l2ZW4gYSBkb2N1bWVudCBBU1QgYW5kIG9wdGlvbmFsbHkgYW4gb3BlcmF0aW9uXG4gKiBuYW1lLiBJZiBhIG5hbWUgaXMgbm90IHByb3ZpZGVkLCBhbiBvcGVyYXRpb24gaXMgb25seSByZXR1cm5lZCBpZiBvbmx5IG9uZSBpc1xuICogcHJvdmlkZWQgaW4gdGhlIGRvY3VtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3BlcmF0aW9uQVNUKGRvY3VtZW50QVNULCBvcGVyYXRpb25OYW1lKSB7XG4gIHZhciBvcGVyYXRpb24gPSBudWxsO1xuXG4gIGZvciAodmFyIF9pMiA9IDAsIF9kb2N1bWVudEFTVCRkZWZpbml0aTIgPSBkb2N1bWVudEFTVC5kZWZpbml0aW9uczsgX2kyIDwgX2RvY3VtZW50QVNUJGRlZmluaXRpMi5sZW5ndGg7IF9pMisrKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBfZG9jdW1lbnRBU1QkZGVmaW5pdGkyW19pMl07XG5cbiAgICBpZiAoZGVmaW5pdGlvbi5raW5kID09PSBLaW5kLk9QRVJBVElPTl9ERUZJTklUSU9OKSB7XG4gICAgICBpZiAoIW9wZXJhdGlvbk5hbWUpIHtcbiAgICAgICAgLy8gSWYgbm8gb3BlcmF0aW9uIG5hbWUgd2FzIHByb3ZpZGVkLCBvbmx5IHJldHVybiBhbiBPcGVyYXRpb24gaWYgdGhlcmVcbiAgICAgICAgLy8gaXMgb25lIGRlZmluZWQgaW4gdGhlIGRvY3VtZW50LiBVcG9uIGVuY291bnRlcmluZyB0aGUgc2Vjb25kLCByZXR1cm5cbiAgICAgICAgLy8gbnVsbC5cbiAgICAgICAgaWYgKG9wZXJhdGlvbikge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgb3BlcmF0aW9uID0gZGVmaW5pdGlvbjtcbiAgICAgIH0gZWxzZSBpZiAoZGVmaW5pdGlvbi5uYW1lICYmIGRlZmluaXRpb24ubmFtZS52YWx1ZSA9PT0gb3BlcmF0aW9uTmFtZSkge1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvbjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3BlcmF0aW9uO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgR1JBUEhRTF9XUyA9ICdncmFwaHFsLXdzJztcbmV4cG9ydHMuR1JBUEhRTF9XUyA9IEdSQVBIUUxfV1M7XG52YXIgR1JBUEhRTF9TVUJTQ1JJUFRJT05TID0gJ2dyYXBocWwtc3Vic2NyaXB0aW9ucyc7XG5leHBvcnRzLkdSQVBIUUxfU1VCU0NSSVBUSU9OUyA9IEdSQVBIUUxfU1VCU0NSSVBUSU9OUztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3RvY29sLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFdTX1RJTUVPVVQgPSAzMDAwMDtcbmV4cG9ydHMuV1NfVElNRU9VVCA9IFdTX1RJTUVPVVQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kZWZhdWx0cy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBNZXNzYWdlVHlwZXMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1lc3NhZ2VUeXBlcygpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdGF0aWMgQ2xhc3MnKTtcbiAgICB9XG4gICAgTWVzc2FnZVR5cGVzLkdRTF9DT05ORUNUSU9OX0lOSVQgPSAnY29ubmVjdGlvbl9pbml0JztcbiAgICBNZXNzYWdlVHlwZXMuR1FMX0NPTk5FQ1RJT05fQUNLID0gJ2Nvbm5lY3Rpb25fYWNrJztcbiAgICBNZXNzYWdlVHlwZXMuR1FMX0NPTk5FQ1RJT05fRVJST1IgPSAnY29ubmVjdGlvbl9lcnJvcic7XG4gICAgTWVzc2FnZVR5cGVzLkdRTF9DT05ORUNUSU9OX0tFRVBfQUxJVkUgPSAna2EnO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfQ09OTkVDVElPTl9URVJNSU5BVEUgPSAnY29ubmVjdGlvbl90ZXJtaW5hdGUnO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfU1RBUlQgPSAnc3RhcnQnO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfREFUQSA9ICdkYXRhJztcbiAgICBNZXNzYWdlVHlwZXMuR1FMX0VSUk9SID0gJ2Vycm9yJztcbiAgICBNZXNzYWdlVHlwZXMuR1FMX0NPTVBMRVRFID0gJ2NvbXBsZXRlJztcbiAgICBNZXNzYWdlVHlwZXMuR1FMX1NUT1AgPSAnc3RvcCc7XG4gICAgTWVzc2FnZVR5cGVzLlNVQlNDUklQVElPTl9TVEFSVCA9ICdzdWJzY3JpcHRpb25fc3RhcnQnO1xuICAgIE1lc3NhZ2VUeXBlcy5TVUJTQ1JJUFRJT05fREFUQSA9ICdzdWJzY3JpcHRpb25fZGF0YSc7XG4gICAgTWVzc2FnZVR5cGVzLlNVQlNDUklQVElPTl9TVUNDRVNTID0gJ3N1YnNjcmlwdGlvbl9zdWNjZXNzJztcbiAgICBNZXNzYWdlVHlwZXMuU1VCU0NSSVBUSU9OX0ZBSUwgPSAnc3Vic2NyaXB0aW9uX2ZhaWwnO1xuICAgIE1lc3NhZ2VUeXBlcy5TVUJTQ1JJUFRJT05fRU5EID0gJ3N1YnNjcmlwdGlvbl9lbmQnO1xuICAgIE1lc3NhZ2VUeXBlcy5JTklUID0gJ2luaXQnO1xuICAgIE1lc3NhZ2VUeXBlcy5JTklUX1NVQ0NFU1MgPSAnaW5pdF9zdWNjZXNzJztcbiAgICBNZXNzYWdlVHlwZXMuSU5JVF9GQUlMID0gJ2luaXRfZmFpbCc7XG4gICAgTWVzc2FnZVR5cGVzLktFRVBfQUxJVkUgPSAna2VlcGFsaXZlJztcbiAgICByZXR1cm4gTWVzc2FnZVR5cGVzO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IE1lc3NhZ2VUeXBlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1lc3NhZ2UtdHlwZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9fZ2VuZXJhdG9yID0gKHRoaXMgJiYgdGhpcy5fX2dlbmVyYXRvcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIGJvZHkpIHtcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgX2dsb2JhbCA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDoge30pO1xudmFyIE5hdGl2ZVdlYlNvY2tldCA9IF9nbG9iYWwuV2ViU29ja2V0IHx8IF9nbG9iYWwuTW96V2ViU29ja2V0O1xudmFyIEJhY2tvZmYgPSByZXF1aXJlKFwiYmFja28yXCIpO1xudmFyIGV2ZW50ZW1pdHRlcjNfMSA9IHJlcXVpcmUoXCJldmVudGVtaXR0ZXIzXCIpO1xudmFyIGlzX3N0cmluZ18xID0gcmVxdWlyZShcIi4vdXRpbHMvaXMtc3RyaW5nXCIpO1xudmFyIGlzX29iamVjdF8xID0gcmVxdWlyZShcIi4vdXRpbHMvaXMtb2JqZWN0XCIpO1xudmFyIHByaW50ZXJfMSA9IHJlcXVpcmUoXCJncmFwaHFsL2xhbmd1YWdlL3ByaW50ZXJcIik7XG52YXIgZ2V0T3BlcmF0aW9uQVNUXzEgPSByZXF1aXJlKFwiZ3JhcGhxbC91dGlsaXRpZXMvZ2V0T3BlcmF0aW9uQVNUXCIpO1xudmFyIHN5bWJvbF9vYnNlcnZhYmxlXzEgPSByZXF1aXJlKFwic3ltYm9sLW9ic2VydmFibGVcIik7XG52YXIgcHJvdG9jb2xfMSA9IHJlcXVpcmUoXCIuL3Byb3RvY29sXCIpO1xudmFyIGRlZmF1bHRzXzEgPSByZXF1aXJlKFwiLi9kZWZhdWx0c1wiKTtcbnZhciBtZXNzYWdlX3R5cGVzXzEgPSByZXF1aXJlKFwiLi9tZXNzYWdlLXR5cGVzXCIpO1xudmFyIFN1YnNjcmlwdGlvbkNsaWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3Vic2NyaXB0aW9uQ2xpZW50KHVybCwgb3B0aW9ucywgd2ViU29ja2V0SW1wbCwgd2ViU29ja2V0UHJvdG9jb2xzKSB7XG4gICAgICAgIHZhciBfYSA9IChvcHRpb25zIHx8IHt9KSwgX2IgPSBfYS5jb25uZWN0aW9uQ2FsbGJhY2ssIGNvbm5lY3Rpb25DYWxsYmFjayA9IF9iID09PSB2b2lkIDAgPyB1bmRlZmluZWQgOiBfYiwgX2MgPSBfYS5jb25uZWN0aW9uUGFyYW1zLCBjb25uZWN0aW9uUGFyYW1zID0gX2MgPT09IHZvaWQgMCA/IHt9IDogX2MsIF9kID0gX2EudGltZW91dCwgdGltZW91dCA9IF9kID09PSB2b2lkIDAgPyBkZWZhdWx0c18xLldTX1RJTUVPVVQgOiBfZCwgX2UgPSBfYS5yZWNvbm5lY3QsIHJlY29ubmVjdCA9IF9lID09PSB2b2lkIDAgPyBmYWxzZSA6IF9lLCBfZiA9IF9hLnJlY29ubmVjdGlvbkF0dGVtcHRzLCByZWNvbm5lY3Rpb25BdHRlbXB0cyA9IF9mID09PSB2b2lkIDAgPyBJbmZpbml0eSA6IF9mLCBfZyA9IF9hLmxhenksIGxhenkgPSBfZyA9PT0gdm9pZCAwID8gZmFsc2UgOiBfZywgX2ggPSBfYS5pbmFjdGl2aXR5VGltZW91dCwgaW5hY3Rpdml0eVRpbWVvdXQgPSBfaCA9PT0gdm9pZCAwID8gMCA6IF9oO1xuICAgICAgICB0aGlzLndzSW1wbCA9IHdlYlNvY2tldEltcGwgfHwgTmF0aXZlV2ViU29ja2V0O1xuICAgICAgICBpZiAoIXRoaXMud3NJbXBsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiwgb3IgYWx0ZXJuYXRpdmUgaW1wbGVtZW50YXRpb24gZm9yIFdlYlNvY2tldCEnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndzUHJvdG9jb2xzID0gd2ViU29ja2V0UHJvdG9jb2xzIHx8IHByb3RvY29sXzEuR1JBUEhRTF9XUztcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uQ2FsbGJhY2sgPSBjb25uZWN0aW9uQ2FsbGJhY2s7XG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuICAgICAgICB0aGlzLm9wZXJhdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5uZXh0T3BlcmF0aW9uSWQgPSAwO1xuICAgICAgICB0aGlzLndzVGltZW91dCA9IHRpbWVvdXQ7XG4gICAgICAgIHRoaXMudW5zZW50TWVzc2FnZXNRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnJlY29ubmVjdCA9IHJlY29ubmVjdDtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyA9IHJlY29ubmVjdGlvbkF0dGVtcHRzO1xuICAgICAgICB0aGlzLmxhenkgPSAhIWxhenk7XG4gICAgICAgIHRoaXMuaW5hY3Rpdml0eVRpbWVvdXQgPSBpbmFjdGl2aXR5VGltZW91dDtcbiAgICAgICAgdGhpcy5jbG9zZWRCeVVzZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5iYWNrb2ZmID0gbmV3IEJhY2tvZmYoeyBqaXR0ZXI6IDAuNSB9KTtcbiAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIgPSBuZXcgZXZlbnRlbWl0dGVyM18xLkV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLm1pZGRsZXdhcmVzID0gW107XG4gICAgICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5tYXhDb25uZWN0VGltZUdlbmVyYXRvciA9IHRoaXMuY3JlYXRlTWF4Q29ubmVjdFRpbWVHZW5lcmF0b3IoKTtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uUGFyYW1zID0gdGhpcy5nZXRDb25uZWN0aW9uUGFyYW1zKGNvbm5lY3Rpb25QYXJhbXMpO1xuICAgICAgICBpZiAoIXRoaXMubGF6eSkge1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUsIFwic3RhdHVzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbGllbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53c0ltcGwuQ0xPU0VEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50LnJlYWR5U3RhdGU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoaXNGb3JjZWQsIGNsb3NlZEJ5VXNlcikge1xuICAgICAgICBpZiAoaXNGb3JjZWQgPT09IHZvaWQgMCkgeyBpc0ZvcmNlZCA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNsb3NlZEJ5VXNlciA9PT0gdm9pZCAwKSB7IGNsb3NlZEJ5VXNlciA9IHRydWU7IH1cbiAgICAgICAgdGhpcy5jbGVhckluYWN0aXZpdHlUaW1lb3V0KCk7XG4gICAgICAgIGlmICh0aGlzLmNsaWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZWRCeVVzZXIgPSBjbG9zZWRCeVVzZXI7XG4gICAgICAgICAgICBpZiAoaXNGb3JjZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTWF4Q29ubmVjdFRpbWVvdXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVHJ5UmVjb25uZWN0VGltZW91dCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmVBbGwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbmRNZXNzYWdlKHVuZGVmaW5lZCwgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0NPTk5FQ1RJT05fVEVSTUlOQVRFLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2xpZW50LmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLmNsaWVudCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGlmICghaXNGb3JjZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyeVJlY29ubmVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHZhciBnZXRPYnNlcnZlciA9IHRoaXMuZ2V0T2JzZXJ2ZXIuYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIGV4ZWN1dGVPcGVyYXRpb24gPSB0aGlzLmV4ZWN1dGVPcGVyYXRpb24uYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIHVuc3Vic2NyaWJlID0gdGhpcy51bnN1YnNjcmliZS5iaW5kKHRoaXMpO1xuICAgICAgICB2YXIgb3BJZDtcbiAgICAgICAgdGhpcy5jbGVhckluYWN0aXZpdHlUaW1lb3V0KCk7XG4gICAgICAgIHJldHVybiBfYSA9IHt9LFxuICAgICAgICAgICAgX2Fbc3ltYm9sX29ic2VydmFibGVfMS5kZWZhdWx0XSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfYS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAob2JzZXJ2ZXJPck5leHQsIG9uRXJyb3IsIG9uQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBnZXRPYnNlcnZlcihvYnNlcnZlck9yTmV4dCwgb25FcnJvciwgb25Db21wbGV0ZSk7XG4gICAgICAgICAgICAgICAgb3BJZCA9IGV4ZWN1dGVPcGVyYXRpb24ocmVxdWVzdCwgZnVuY3Rpb24gKGVycm9yLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yID09PSBudWxsICYmIHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ic2VydmVyLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ic2VydmVyLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZXJyb3IoZXJyb3JbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ic2VydmVyLm5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnN1YnNjcmliZShvcElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcElkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9hO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5ldmVudEVtaXR0ZXIub24oZXZlbnROYW1lLCBjYWxsYmFjaywgY29udGV4dCk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBoYW5kbGVyLm9mZihldmVudE5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUub25Db25uZWN0ZWQgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub24oJ2Nvbm5lY3RlZCcsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUub25Db25uZWN0aW5nID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKCdjb25uZWN0aW5nJywgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vbkRpc2Nvbm5lY3RlZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vbignZGlzY29ubmVjdGVkJywgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vblJlY29ubmVjdGVkID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKCdyZWNvbm5lY3RlZCcsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUub25SZWNvbm5lY3RpbmcgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub24oJ3JlY29ubmVjdGluZycsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vbignZXJyb3InLCBjYWxsYmFjaywgY29udGV4dCk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLnVuc3Vic2NyaWJlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm9wZXJhdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKHN1YklkKSB7XG4gICAgICAgICAgICBfdGhpcy51bnN1YnNjcmliZShzdWJJZCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5hcHBseU1pZGRsZXdhcmVzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IGZ1bmN0aW9uIChmdW5jcywgc2NvcGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnVuY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmID0gZnVuY3Muc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLmFwcGx5TWlkZGxld2FyZS5hcHBseShzY29wZSwgW29wdGlvbnMsIG5leHRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcXVldWUoX3RoaXMubWlkZGxld2FyZXMuc2xpY2UoKSwgX3RoaXMpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gKG1pZGRsZXdhcmVzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIG1pZGRsZXdhcmVzLm1hcChmdW5jdGlvbiAobWlkZGxld2FyZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtaWRkbGV3YXJlLmFwcGx5TWlkZGxld2FyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIF90aGlzLm1pZGRsZXdhcmVzLnB1c2gobWlkZGxld2FyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pZGRsZXdhcmUgbXVzdCBpbXBsZW1lbnQgdGhlIGFwcGx5TWlkZGxld2FyZSBmdW5jdGlvbi4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5nZXRDb25uZWN0aW9uUGFyYW1zID0gZnVuY3Rpb24gKGNvbm5lY3Rpb25QYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29ubmVjdGlvblBhcmFtcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGNvbm5lY3Rpb25QYXJhbXMuY2FsbChudWxsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKGNvbm5lY3Rpb25QYXJhbXMpO1xuICAgICAgICB9KTsgfTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuZXhlY3V0ZU9wZXJhdGlvbiA9IGZ1bmN0aW9uIChvcHRpb25zLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmNsaWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wSWQgPSB0aGlzLmdlbmVyYXRlT3BlcmF0aW9uSWQoKTtcbiAgICAgICAgdGhpcy5vcGVyYXRpb25zW29wSWRdID0geyBvcHRpb25zOiBvcHRpb25zLCBoYW5kbGVyOiBoYW5kbGVyIH07XG4gICAgICAgIHRoaXMuYXBwbHlNaWRkbGV3YXJlcyhvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHByb2Nlc3NlZE9wdGlvbnMpIHtcbiAgICAgICAgICAgIF90aGlzLmNoZWNrT3BlcmF0aW9uT3B0aW9ucyhwcm9jZXNzZWRPcHRpb25zLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcGVyYXRpb25zW29wSWRdKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMub3BlcmF0aW9uc1tvcElkXSA9IHsgb3B0aW9uczogcHJvY2Vzc2VkT3B0aW9ucywgaGFuZGxlcjogaGFuZGxlciB9O1xuICAgICAgICAgICAgICAgIF90aGlzLnNlbmRNZXNzYWdlKG9wSWQsIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9TVEFSVCwgcHJvY2Vzc2VkT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBfdGhpcy51bnN1YnNjcmliZShvcElkKTtcbiAgICAgICAgICAgIGhhbmRsZXIoX3RoaXMuZm9ybWF0RXJyb3JzKGVycm9yKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb3BJZDtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuZ2V0T2JzZXJ2ZXIgPSBmdW5jdGlvbiAob2JzZXJ2ZXJPck5leHQsIGVycm9yLCBjb21wbGV0ZSkge1xuICAgICAgICBpZiAodHlwZW9mIG9ic2VydmVyT3JOZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICh2KSB7IHJldHVybiBvYnNlcnZlck9yTmV4dCh2KTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGVycm9yICYmIGVycm9yKGUpOyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IHJldHVybiBjb21wbGV0ZSAmJiBjb21wbGV0ZSgpOyB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JzZXJ2ZXJPck5leHQ7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNyZWF0ZU1heENvbm5lY3RUaW1lR2VuZXJhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWluVmFsdWUgPSAxMDAwO1xuICAgICAgICB2YXIgbWF4VmFsdWUgPSB0aGlzLndzVGltZW91dDtcbiAgICAgICAgcmV0dXJuIG5ldyBCYWNrb2ZmKHtcbiAgICAgICAgICAgIG1pbjogbWluVmFsdWUsXG4gICAgICAgICAgICBtYXg6IG1heFZhbHVlLFxuICAgICAgICAgICAgZmFjdG9yOiAxLjIsXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jbGVhckNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5jaGVja0Nvbm5lY3Rpb25JbnRlcnZhbElkKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWxJZCk7XG4gICAgICAgICAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbkludGVydmFsSWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNsZWFyTWF4Q29ubmVjdFRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm1heENvbm5lY3RUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLm1heENvbm5lY3RUaW1lb3V0SWQpO1xuICAgICAgICAgICAgdGhpcy5tYXhDb25uZWN0VGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jbGVhclRyeVJlY29ubmVjdFRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnRyeVJlY29ubmVjdFRpbWVvdXRJZCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudHJ5UmVjb25uZWN0VGltZW91dElkKTtcbiAgICAgICAgICAgIHRoaXMudHJ5UmVjb25uZWN0VGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jbGVhckluYWN0aXZpdHlUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5pbmFjdGl2aXR5VGltZW91dElkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5pbmFjdGl2aXR5VGltZW91dElkKTtcbiAgICAgICAgICAgIHRoaXMuaW5hY3Rpdml0eVRpbWVvdXRJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuc2V0SW5hY3Rpdml0eVRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmluYWN0aXZpdHlUaW1lb3V0ID4gMCAmJiBPYmplY3Qua2V5cyh0aGlzLm9wZXJhdGlvbnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5pbmFjdGl2aXR5VGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKF90aGlzLm9wZXJhdGlvbnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMuaW5hY3Rpdml0eVRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNoZWNrT3BlcmF0aW9uT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IG9wdGlvbnMucXVlcnksIHZhcmlhYmxlcyA9IG9wdGlvbnMudmFyaWFibGVzLCBvcGVyYXRpb25OYW1lID0gb3B0aW9ucy5vcGVyYXRpb25OYW1lO1xuICAgICAgICBpZiAoIXF1ZXJ5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3QgcHJvdmlkZSBhIHF1ZXJ5LicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IHByb3ZpZGUgYW4gaGFuZGxlci4nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKCFpc19zdHJpbmdfMS5kZWZhdWx0KHF1ZXJ5KSAmJiAhZ2V0T3BlcmF0aW9uQVNUXzEuZ2V0T3BlcmF0aW9uQVNUKHF1ZXJ5LCBvcGVyYXRpb25OYW1lKSkgfHxcbiAgICAgICAgICAgIChvcGVyYXRpb25OYW1lICYmICFpc19zdHJpbmdfMS5kZWZhdWx0KG9wZXJhdGlvbk5hbWUpKSB8fFxuICAgICAgICAgICAgKHZhcmlhYmxlcyAmJiAhaXNfb2JqZWN0XzEuZGVmYXVsdCh2YXJpYWJsZXMpKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3Qgb3B0aW9uIHR5cGVzLiBxdWVyeSBtdXN0IGJlIGEgc3RyaW5nIG9yIGEgZG9jdW1lbnQsJyArXG4gICAgICAgICAgICAgICAgJ2BvcGVyYXRpb25OYW1lYCBtdXN0IGJlIGEgc3RyaW5nLCBhbmQgYHZhcmlhYmxlc2AgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuYnVpbGRNZXNzYWdlID0gZnVuY3Rpb24gKGlkLCB0eXBlLCBwYXlsb2FkKSB7XG4gICAgICAgIHZhciBwYXlsb2FkVG9SZXR1cm4gPSBwYXlsb2FkICYmIHBheWxvYWQucXVlcnkgPyBfX2Fzc2lnbih7fSwgcGF5bG9hZCwgeyBxdWVyeTogdHlwZW9mIHBheWxvYWQucXVlcnkgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5xdWVyeSA6IHByaW50ZXJfMS5wcmludChwYXlsb2FkLnF1ZXJ5KSB9KSA6XG4gICAgICAgICAgICBwYXlsb2FkO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWRUb1JldHVybixcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuZm9ybWF0RXJyb3JzID0gZnVuY3Rpb24gKGVycm9ycykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlcnJvcnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJvcnMgJiYgZXJyb3JzLmVycm9ycykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0RXJyb3JzKGVycm9ycy5lcnJvcnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJvcnMgJiYgZXJyb3JzLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBbZXJyb3JzXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBuYW1lOiAnRm9ybWF0ZWRFcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXJyb3I6IGVycm9ycyxcbiAgICAgICAgICAgIH1dO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uIChpZCwgdHlwZSwgcGF5bG9hZCkge1xuICAgICAgICB0aGlzLnNlbmRNZXNzYWdlUmF3KHRoaXMuYnVpbGRNZXNzYWdlKGlkLCB0eXBlLCBwYXlsb2FkKSk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLnNlbmRNZXNzYWdlUmF3ID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLnN0YXR1cykge1xuICAgICAgICAgICAgY2FzZSB0aGlzLndzSW1wbC5PUEVOOlxuICAgICAgICAgICAgICAgIHZhciBzZXJpYWxpemVkTWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIEpTT04ucGFyc2Uoc2VyaWFsaXplZE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcihcIk1lc3NhZ2UgbXVzdCBiZSBKU09OLXNlcmlhbGl6YWJsZS4gR290OiBcIiArIG1lc3NhZ2UpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGllbnQuc2VuZChzZXJpYWxpemVkTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMud3NJbXBsLkNPTk5FQ1RJTkc6XG4gICAgICAgICAgICAgICAgdGhpcy51bnNlbnRNZXNzYWdlc1F1ZXVlLnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZWNvbm5lY3RpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIuZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IoJ0EgbWVzc2FnZSB3YXMgbm90IHNlbnQgYmVjYXVzZSBzb2NrZXQgaXMgbm90IGNvbm5lY3RlZCwgaXMgY2xvc2luZyBvciAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpcyBhbHJlYWR5IGNsb3NlZC4gTWVzc2FnZSB3YXM6ICcgKyBKU09OLnN0cmluZ2lmeShtZXNzYWdlKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5nZW5lcmF0ZU9wZXJhdGlvbklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gU3RyaW5nKCsrdGhpcy5uZXh0T3BlcmF0aW9uSWQpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS50cnlSZWNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICghdGhpcy5yZWNvbm5lY3QgfHwgdGhpcy5iYWNrb2ZmLmF0dGVtcHRzID49IHRoaXMucmVjb25uZWN0aW9uQXR0ZW1wdHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMucmVjb25uZWN0aW5nKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm9wZXJhdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIF90aGlzLnVuc2VudE1lc3NhZ2VzUXVldWUucHVzaChfdGhpcy5idWlsZE1lc3NhZ2Uoa2V5LCBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfU1RBUlQsIF90aGlzLm9wZXJhdGlvbnNba2V5XS5vcHRpb25zKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0aW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyVHJ5UmVjb25uZWN0VGltZW91dCgpO1xuICAgICAgICB2YXIgZGVsYXkgPSB0aGlzLmJhY2tvZmYuZHVyYXRpb24oKTtcbiAgICAgICAgdGhpcy50cnlSZWNvbm5lY3RUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmNvbm5lY3QoKTtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5mbHVzaFVuc2VudE1lc3NhZ2VzUXVldWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMudW5zZW50TWVzc2FnZXNRdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICBfdGhpcy5zZW5kTWVzc2FnZVJhdyhtZXNzYWdlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudW5zZW50TWVzc2FnZXNRdWV1ZSA9IFtdO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jaGVja0Nvbm5lY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLndhc0tlZXBBbGl2ZVJlY2VpdmVkKSB7XG4gICAgICAgICAgICB0aGlzLndhc0tlZXBBbGl2ZVJlY2VpdmVkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnJlY29ubmVjdGluZykge1xuICAgICAgICAgICAgdGhpcy5jbG9zZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuY2hlY2tNYXhDb25uZWN0VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5jbGVhck1heENvbm5lY3RUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMubWF4Q29ubmVjdFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnN0YXR1cyAhPT0gX3RoaXMud3NJbXBsLk9QRU4pIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5yZWNvbm5lY3RpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcy5tYXhDb25uZWN0VGltZUdlbmVyYXRvci5kdXJhdGlvbigpKTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5jbGllbnQgPSBuZXcgdGhpcy53c0ltcGwodGhpcy51cmwsIHRoaXMud3NQcm90b2NvbHMpO1xuICAgICAgICB0aGlzLmNoZWNrTWF4Q29ubmVjdFRpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5jbGllbnQub25vcGVuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX19hd2FpdGVyKF90aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb25QYXJhbXMsIGVycm9yXzE7XG4gICAgICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISh0aGlzLnN0YXR1cyA9PT0gdGhpcy53c0ltcGwuT1BFTikpIHJldHVybiBbMywgNF07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTWF4Q29ubmVjdFRpbWVvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvc2VkQnlVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KHRoaXMucmVjb25uZWN0aW5nID8gJ3JlY29ubmVjdGluZycgOiAnY29ubmVjdGluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX2EubGFiZWwgPSAxO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS50cnlzLnB1c2goWzEsIDMsICwgNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFs0LCB0aGlzLmNvbm5lY3Rpb25QYXJhbXMoKV07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25QYXJhbXMgPSBfYS5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRNZXNzYWdlKHVuZGVmaW5lZCwgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0NPTk5FQ1RJT05fSU5JVCwgY29ubmVjdGlvblBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsdXNoVW5zZW50TWVzc2FnZXNRdWV1ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszLCA0XTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JfMSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UodW5kZWZpbmVkLCBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09OTkVDVElPTl9FUlJPUiwgZXJyb3JfMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsdXNoVW5zZW50TWVzc2FnZXNRdWV1ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszLCA0XTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiByZXR1cm4gWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTsgfTtcbiAgICAgICAgdGhpcy5jbGllbnQub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghX3RoaXMuY2xvc2VkQnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGllbnQub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIF90aGlzLmV2ZW50RW1pdHRlci5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY2xpZW50Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBfYS5kYXRhO1xuICAgICAgICAgICAgX3RoaXMucHJvY2Vzc1JlY2VpdmVkRGF0YShkYXRhKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUucHJvY2Vzc1JlY2VpdmVkRGF0YSA9IGZ1bmN0aW9uIChyZWNlaXZlZERhdGEpIHtcbiAgICAgICAgdmFyIHBhcnNlZE1lc3NhZ2U7XG4gICAgICAgIHZhciBvcElkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFyc2VkTWVzc2FnZSA9IEpTT04ucGFyc2UocmVjZWl2ZWREYXRhKTtcbiAgICAgICAgICAgIG9wSWQgPSBwYXJzZWRNZXNzYWdlLmlkO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXNzYWdlIG11c3QgYmUgSlNPTi1wYXJzZWFibGUuIEdvdDogXCIgKyByZWNlaXZlZERhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChbbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0RBVEEsXG4gICAgICAgICAgICBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09NUExFVEUsXG4gICAgICAgICAgICBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfRVJST1IsXG4gICAgICAgIF0uaW5kZXhPZihwYXJzZWRNZXNzYWdlLnR5cGUpICE9PSAtMSAmJiAhdGhpcy5vcGVyYXRpb25zW29wSWRdKSB7XG4gICAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlKG9wSWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAocGFyc2VkTWVzc2FnZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9DT05ORUNUSU9OX0VSUk9SOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbm5lY3Rpb25DYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb25DYWxsYmFjayhwYXJzZWRNZXNzYWdlLnBheWxvYWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0NPTk5FQ1RJT05fQUNLOlxuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQodGhpcy5yZWNvbm5lY3RpbmcgPyAncmVjb25uZWN0ZWQnIDogJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5iYWNrb2ZmLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXhDb25uZWN0VGltZUdlbmVyYXRvci5yZXNldCgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbm5lY3Rpb25DYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb25DYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0NPTVBMRVRFOlxuICAgICAgICAgICAgICAgIHRoaXMub3BlcmF0aW9uc1tvcElkXS5oYW5kbGVyKG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wZXJhdGlvbnNbb3BJZF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9FUlJPUjpcbiAgICAgICAgICAgICAgICB0aGlzLm9wZXJhdGlvbnNbb3BJZF0uaGFuZGxlcih0aGlzLmZvcm1hdEVycm9ycyhwYXJzZWRNZXNzYWdlLnBheWxvYWQpLCBudWxsKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5vcGVyYXRpb25zW29wSWRdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfREFUQTpcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkUGF5bG9hZCA9ICFwYXJzZWRNZXNzYWdlLnBheWxvYWQuZXJyb3JzID9cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkTWVzc2FnZS5wYXlsb2FkIDogX19hc3NpZ24oe30sIHBhcnNlZE1lc3NhZ2UucGF5bG9hZCwgeyBlcnJvcnM6IHRoaXMuZm9ybWF0RXJyb3JzKHBhcnNlZE1lc3NhZ2UucGF5bG9hZC5lcnJvcnMpIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlcmF0aW9uc1tvcElkXS5oYW5kbGVyKG51bGwsIHBhcnNlZFBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09OTkVDVElPTl9LRUVQX0FMSVZFOlxuICAgICAgICAgICAgICAgIHZhciBmaXJzdEtBID0gdHlwZW9mIHRoaXMud2FzS2VlcEFsaXZlUmVjZWl2ZWQgPT09ICd1bmRlZmluZWQnO1xuICAgICAgICAgICAgICAgIHRoaXMud2FzS2VlcEFsaXZlUmVjZWl2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdEtBKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrQ29ubmVjdGlvbkludGVydmFsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmNoZWNrQ29ubmVjdGlvbkludGVydmFsSWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbkludGVydmFsSWQgPSBzZXRJbnRlcnZhbCh0aGlzLmNoZWNrQ29ubmVjdGlvbi5iaW5kKHRoaXMpLCB0aGlzLndzVGltZW91dCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBtZXNzYWdlIHR5cGUhJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAob3BJZCkge1xuICAgICAgICBpZiAodGhpcy5vcGVyYXRpb25zW29wSWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vcGVyYXRpb25zW29wSWRdO1xuICAgICAgICAgICAgdGhpcy5zZXRJbmFjdGl2aXR5VGltZW91dCgpO1xuICAgICAgICAgICAgdGhpcy5zZW5kTWVzc2FnZShvcElkLCBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfU1RPUCwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFN1YnNjcmlwdGlvbkNsaWVudDtcbn0oKSk7XG5leHBvcnRzLlN1YnNjcmlwdGlvbkNsaWVudCA9IFN1YnNjcmlwdGlvbkNsaWVudDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsaWVudC5qcy5tYXAiLCJpbXBvcnQgeyBfX2V4dGVuZHMgfSBmcm9tICd0c2xpYic7XG5pbXBvcnQgeyBBcG9sbG9MaW5rIH0gZnJvbSAnYXBvbGxvLWxpbmsnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uQ2xpZW50IH0gZnJvbSAnc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MnO1xuXG52YXIgV2ViU29ja2V0TGluayA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFdlYlNvY2tldExpbmssIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gV2ViU29ja2V0TGluayhwYXJhbXNPckNsaWVudCkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBpZiAocGFyYW1zT3JDbGllbnQgaW5zdGFuY2VvZiBTdWJzY3JpcHRpb25DbGllbnQpIHtcbiAgICAgICAgICAgIF90aGlzLnN1YnNjcmlwdGlvbkNsaWVudCA9IHBhcmFtc09yQ2xpZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgX3RoaXMuc3Vic2NyaXB0aW9uQ2xpZW50ID0gbmV3IFN1YnNjcmlwdGlvbkNsaWVudChwYXJhbXNPckNsaWVudC51cmksIHBhcmFtc09yQ2xpZW50Lm9wdGlvbnMsIHBhcmFtc09yQ2xpZW50LndlYlNvY2tldEltcGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgV2ViU29ja2V0TGluay5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIChvcGVyYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaXB0aW9uQ2xpZW50LnJlcXVlc3Qob3BlcmF0aW9uKTtcbiAgICB9O1xuICAgIHJldHVybiBXZWJTb2NrZXRMaW5rO1xufShBcG9sbG9MaW5rKSk7XG5cbmV4cG9ydCB7IFdlYlNvY2tldExpbmsgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJ1bmRsZS5lc20uanMubWFwXG4iLCJ2YXIgc3VwcG9ydCA9IHtcbiAgc2VhcmNoUGFyYW1zOiAnVVJMU2VhcmNoUGFyYW1zJyBpbiBzZWxmLFxuICBpdGVyYWJsZTogJ1N5bWJvbCcgaW4gc2VsZiAmJiAnaXRlcmF0b3InIGluIFN5bWJvbCxcbiAgYmxvYjpcbiAgICAnRmlsZVJlYWRlcicgaW4gc2VsZiAmJlxuICAgICdCbG9iJyBpbiBzZWxmICYmXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IEJsb2IoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9KSgpLFxuICBmb3JtRGF0YTogJ0Zvcm1EYXRhJyBpbiBzZWxmLFxuICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBzZWxmXG59XG5cbmZ1bmN0aW9uIGlzRGF0YVZpZXcob2JqKSB7XG4gIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKVxufVxuXG5pZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgJ1tvYmplY3QgSW50MTZBcnJheV0nLFxuICAgICdbb2JqZWN0IFVpbnQxNkFycmF5XScsXG4gICAgJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgICdbb2JqZWN0IFVpbnQzMkFycmF5XScsXG4gICAgJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsXG4gICAgJ1tvYmplY3QgRmxvYXQ2NEFycmF5XSdcbiAgXVxuXG4gIHZhciBpc0FycmF5QnVmZmVyVmlldyA9XG4gICAgQXJyYXlCdWZmZXIuaXNWaWV3IHx8XG4gICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqICYmIHZpZXdDbGFzc2VzLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikpID4gLTFcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgbmFtZSA9IFN0cmluZyhuYW1lKVxuICB9XG4gIGlmICgvW15hLXowLTlcXC0jJCUmJyorLl5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGNoYXJhY3RlciBpbiBoZWFkZXIgZmllbGQgbmFtZScpXG4gIH1cbiAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgdmFyIGl0ZXJhdG9yID0ge1xuICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKVxuICAgICAgcmV0dXJuIHtkb25lOiB2YWx1ZSA9PT0gdW5kZWZpbmVkLCB2YWx1ZTogdmFsdWV9XG4gICAgfVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaXRlcmF0b3JcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXRlcmF0b3Jcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICB0aGlzLm1hcCA9IHt9XG5cbiAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSlcbiAgICB9LCB0aGlzKVxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICB0aGlzLmFwcGVuZChoZWFkZXJbMF0sIGhlYWRlclsxXSlcbiAgICB9LCB0aGlzKVxuICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pXG4gICAgfSwgdGhpcylcbiAgfVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKVxuICB2YXIgb2xkVmFsdWUgPSB0aGlzLm1hcFtuYW1lXVxuICB0aGlzLm1hcFtuYW1lXSA9IG9sZFZhbHVlID8gb2xkVmFsdWUgKyAnLCAnICsgdmFsdWUgOiB2YWx1ZVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBmdW5jdGlvbihuYW1lKSB7XG4gIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpXG4gIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbFxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLm1hcCkge1xuICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLm1hcFtuYW1lXSwgbmFtZSwgdGhpcylcbiAgICB9XG4gIH1cbn1cblxuSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXRlbXMgPSBbXVxuICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICBpdGVtcy5wdXNoKG5hbWUpXG4gIH0pXG4gIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbn1cblxuSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtcyA9IFtdXG4gIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgIGl0ZW1zLnB1c2godmFsdWUpXG4gIH0pXG4gIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbn1cblxuSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXRlbXMgPSBbXVxuICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICBpdGVtcy5wdXNoKFtuYW1lLCB2YWx1ZV0pXG4gIH0pXG4gIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbn1cblxuaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXNcbn1cblxuZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKSlcbiAgfVxuICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxufVxuXG5mdW5jdGlvbiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXG4gICAgfVxuICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QocmVhZGVyLmVycm9yKVxuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYilcbiAgcmV0dXJuIHByb21pc2Vcbn1cblxuZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpXG4gIHJldHVybiBwcm9taXNlXG59XG5cbmZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpXG4gIHZhciBjaGFycyA9IG5ldyBBcnJheSh2aWV3Lmxlbmd0aClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUodmlld1tpXSlcbiAgfVxuICByZXR1cm4gY2hhcnMuam9pbignJylcbn1cblxuZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gIGlmIChidWYuc2xpY2UpIHtcbiAgICByZXR1cm4gYnVmLnNsaWNlKDApXG4gIH0gZWxzZSB7XG4gICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYuYnl0ZUxlbmd0aClcbiAgICB2aWV3LnNldChuZXcgVWludDhBcnJheShidWYpKVxuICAgIHJldHVybiB2aWV3LmJ1ZmZlclxuICB9XG59XG5cbmZ1bmN0aW9uIEJvZHkoKSB7XG4gIHRoaXMuYm9keVVzZWQgPSBmYWxzZVxuXG4gIHRoaXMuX2luaXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgIGlmICghYm9keSkge1xuICAgICAgdGhpcy5fYm9keVRleHQgPSAnJ1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHlcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHlcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5LnRvU3RyaW5nKClcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgc3VwcG9ydC5ibG9iICYmIGlzRGF0YVZpZXcoYm9keSkpIHtcbiAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKVxuICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pXG4gICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIChBcnJheUJ1ZmZlci5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSB8fCBpc0FycmF5QnVmZmVyVmlldyhib2R5KSkpIHtcbiAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChib2R5KVxuICAgIH1cblxuICAgIGlmICghdGhpcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykpIHtcbiAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlCbG9iICYmIHRoaXMuX2JvZHlCbG9iLnR5cGUpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgdGhpcy5fYm9keUJsb2IudHlwZSlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOCcpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKSlcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICByZXR1cm4gY29uc3VtZWQodGhpcykgfHwgUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpXG4gICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVhZEFycmF5QnVmZmVyQXNUZXh0KHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikpXG4gICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0JylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICB9XG4gIH1cblxuICBpZiAoc3VwcG9ydC5mb3JtRGF0YSkge1xuICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKGRlY29kZSlcbiAgICB9XG4gIH1cblxuICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG52YXIgbWV0aG9kcyA9IFsnREVMRVRFJywgJ0dFVCcsICdIRUFEJywgJ09QVElPTlMnLCAnUE9TVCcsICdQVVQnXVxuXG5mdW5jdGlvbiBub3JtYWxpemVNZXRob2QobWV0aG9kKSB7XG4gIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keVxuXG4gIGlmIChpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpIHtcbiAgICBpZiAoaW5wdXQuYm9keVVzZWQpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpXG4gICAgfVxuICAgIHRoaXMudXJsID0gaW5wdXQudXJsXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzXG4gICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG4gICAgfVxuICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kXG4gICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZVxuICAgIHRoaXMuc2lnbmFsID0gaW5wdXQuc2lnbmFsXG4gICAgaWYgKCFib2R5ICYmIGlucHV0Ll9ib2R5SW5pdCAhPSBudWxsKSB7XG4gICAgICBib2R5ID0gaW5wdXQuX2JvZHlJbml0XG4gICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpXG4gIH1cblxuICB0aGlzLmNyZWRlbnRpYWxzID0gb3B0aW9ucy5jcmVkZW50aWFscyB8fCB0aGlzLmNyZWRlbnRpYWxzIHx8ICdzYW1lLW9yaWdpbidcbiAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICB9XG4gIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8IHRoaXMubWV0aG9kIHx8ICdHRVQnKVxuICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGxcbiAgdGhpcy5zaWduYWwgPSBvcHRpb25zLnNpZ25hbCB8fCB0aGlzLnNpZ25hbFxuICB0aGlzLnJlZmVycmVyID0gbnVsbFxuXG4gIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIGJvZHkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0cycpXG4gIH1cbiAgdGhpcy5faW5pdEJvZHkoYm9keSlcbn1cblxuUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHtib2R5OiB0aGlzLl9ib2R5SW5pdH0pXG59XG5cbmZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gIHZhciBmb3JtID0gbmV3IEZvcm1EYXRhKClcbiAgYm9keVxuICAgIC50cmltKClcbiAgICAuc3BsaXQoJyYnKVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgdmFyIHNwbGl0ID0gYnl0ZXMuc3BsaXQoJz0nKVxuICAgICAgICB2YXIgbmFtZSA9IHNwbGl0LnNoaWZ0KCkucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignPScpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSlcbiAgICAgIH1cbiAgICB9KVxuICByZXR1cm4gZm9ybVxufVxuXG5mdW5jdGlvbiBwYXJzZUhlYWRlcnMocmF3SGVhZGVycykge1xuICB2YXIgaGVhZGVycyA9IG5ldyBIZWFkZXJzKClcbiAgLy8gUmVwbGFjZSBpbnN0YW5jZXMgb2YgXFxyXFxuIGFuZCBcXG4gZm9sbG93ZWQgYnkgYXQgbGVhc3Qgb25lIHNwYWNlIG9yIGhvcml6b250YWwgdGFiIHdpdGggYSBzcGFjZVxuICAvLyBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzIzMCNzZWN0aW9uLTMuMlxuICB2YXIgcHJlUHJvY2Vzc2VkSGVhZGVycyA9IHJhd0hlYWRlcnMucmVwbGFjZSgvXFxyP1xcbltcXHQgXSsvZywgJyAnKVxuICBwcmVQcm9jZXNzZWRIZWFkZXJzLnNwbGl0KC9cXHI/XFxuLykuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgdmFyIHBhcnRzID0gbGluZS5zcGxpdCgnOicpXG4gICAgdmFyIGtleSA9IHBhcnRzLnNoaWZ0KCkudHJpbSgpXG4gICAgaWYgKGtleSkge1xuICAgICAgdmFyIHZhbHVlID0gcGFydHMuam9pbignOicpLnRyaW0oKVxuICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSlcbiAgICB9XG4gIH0pXG4gIHJldHVybiBoZWFkZXJzXG59XG5cbkJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSlcblxuZXhwb3J0IGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgdGhpcy50eXBlID0gJ2RlZmF1bHQnXG4gIHRoaXMuc3RhdHVzID0gb3B0aW9ucy5zdGF0dXMgPT09IHVuZGVmaW5lZCA/IDIwMCA6IG9wdGlvbnMuc3RhdHVzXG4gIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDBcbiAgdGhpcy5zdGF0dXNUZXh0ID0gJ3N0YXR1c1RleHQnIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1c1RleHQgOiAnT0snXG4gIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJ1xuICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbn1cblxuQm9keS5jYWxsKFJlc3BvbnNlLnByb3RvdHlwZSlcblxuUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgIHVybDogdGhpcy51cmxcbiAgfSlcbn1cblxuUmVzcG9uc2UuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSlcbiAgcmVzcG9uc2UudHlwZSA9ICdlcnJvcidcbiAgcmV0dXJuIHJlc3BvbnNlXG59XG5cbnZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XVxuXG5SZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBzdGF0dXMgY29kZScpXG4gIH1cblxuICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbn1cblxuZXhwb3J0IHZhciBET01FeGNlcHRpb24gPSBzZWxmLkRPTUV4Y2VwdGlvblxudHJ5IHtcbiAgbmV3IERPTUV4Y2VwdGlvbigpXG59IGNhdGNoIChlcnIpIHtcbiAgRE9NRXhjZXB0aW9uID0gZnVuY3Rpb24obWVzc2FnZSwgbmFtZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2VcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdmFyIGVycm9yID0gRXJyb3IobWVzc2FnZSlcbiAgICB0aGlzLnN0YWNrID0gZXJyb3Iuc3RhY2tcbiAgfVxuICBET01FeGNlcHRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpXG4gIERPTUV4Y2VwdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBET01FeGNlcHRpb25cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoKGlucHV0LCBpbml0KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KVxuXG4gICAgaWYgKHJlcXVlc3Quc2lnbmFsICYmIHJlcXVlc3Quc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IERPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpXG4gICAgfVxuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG5cbiAgICBmdW5jdGlvbiBhYm9ydFhocigpIHtcbiAgICAgIHhoci5hYm9ydCgpXG4gICAgfVxuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgIGhlYWRlcnM6IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgJycpXG4gICAgICB9XG4gICAgICBvcHRpb25zLnVybCA9ICdyZXNwb25zZVVSTCcgaW4geGhyID8geGhyLnJlc3BvbnNlVVJMIDogb3B0aW9ucy5oZWFkZXJzLmdldCgnWC1SZXF1ZXN0LVVSTCcpXG4gICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpXG4gICAgfVxuXG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgfVxuXG4gICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICB9XG5cbiAgICB4aHIub25hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KG5ldyBET01FeGNlcHRpb24oJ0Fib3J0ZWQnLCAnQWJvcnRFcnJvcicpKVxuICAgIH1cblxuICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSlcblxuICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgfSBlbHNlIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnb21pdCcpIHtcbiAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InXG4gICAgfVxuXG4gICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKVxuICAgIH0pXG5cbiAgICBpZiAocmVxdWVzdC5zaWduYWwpIHtcbiAgICAgIHJlcXVlc3Quc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRYaHIpXG5cbiAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gRE9ORSAoc3VjY2VzcyBvciBmYWlsdXJlKVxuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICByZXF1ZXN0LnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0WGhyKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgeGhyLnNlbmQodHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdClcbiAgfSlcbn1cblxuZmV0Y2gucG9seWZpbGwgPSB0cnVlXG5cbmlmICghc2VsZi5mZXRjaCkge1xuICBzZWxmLmZldGNoID0gZmV0Y2hcbiAgc2VsZi5IZWFkZXJzID0gSGVhZGVyc1xuICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0XG4gIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZVxufVxuIiwiLy8gdGhlIHdoYXR3Zy1mZXRjaCBwb2x5ZmlsbCBpbnN0YWxscyB0aGUgZmV0Y2goKSBmdW5jdGlvblxuLy8gb24gdGhlIGdsb2JhbCBvYmplY3QgKHdpbmRvdyBvciBzZWxmKVxuLy9cbi8vIFJldHVybiB0aGF0IGFzIHRoZSBleHBvcnQgZm9yIHVzZSBpbiBXZWJwYWNrLCBCcm93c2VyaWZ5IGV0Yy5cbnJlcXVpcmUoJ3doYXR3Zy1mZXRjaCcpO1xubW9kdWxlLmV4cG9ydHMgPSBzZWxmLmZldGNoLmJpbmQoc2VsZik7XG4iLCJcbmltcG9ydCBBcG9sbG9DbGllbnQgZnJvbSBcImFwb2xsby1jbGllbnRcIjtcbmltcG9ydCB7IEluTWVtb3J5Q2FjaGUgfSBmcm9tIFwiYXBvbGxvLWNhY2hlLWlubWVtb3J5XCI7XG5pbXBvcnQgeyBXZWJTb2NrZXRMaW5rIH0gZnJvbSBcImFwb2xsby1saW5rLXdzXCI7XG5pbXBvcnQgeyBzcGxpdCB9IGZyb20gXCJhcG9sbG8tbGlua1wiO1xuaW1wb3J0IHsgSHR0cExpbmsgfSBmcm9tIFwiYXBvbGxvLWxpbmstaHR0cFwiO1xuaW1wb3J0IHsgZ2V0TWFpbkRlZmluaXRpb24gfSBmcm9tIFwiYXBvbGxvLXV0aWxpdGllc1wiO1xuLy9pbXBvcnQgV2ViU29ja2V0IGZyb20gJ3dzJztcbmltcG9ydCBmZXRjaCBmcm9tIFwiaXNvbW9ycGhpYy1mZXRjaFwiXG5cblxuXG5jb25zdCBoZWFkZXJzID0geydjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9O1xuY29uc3QgZ2V0SGVhZGVycyA9ICgpID0+IHtcbiAgcmV0dXJuIGhlYWRlcnM7XG59O1xuXG5jb25zdCBjYWNoZSA9IG5ldyBJbk1lbW9yeUNhY2hlKCk7XG5cbmNvbnN0IHdzTGluayA9IHByb2Nlc3MuYnJvd3NlciA/IG5ldyBXZWJTb2NrZXRMaW5rKHtcbiAgdXJpOiBcIndzOi8vaGFzdXJhLW1pZGNvZGVzMS5oZXJva3VhcHAuY29tL3YxL2dyYXBocWxcIixcbiAgb3B0aW9uczoge1xuICAgIHJlY29ubmVjdDogdHJ1ZSxcbiAgICBsYXp5OiB0cnVlLFxuICAgIGNvbm5lY3Rpb25QYXJhbXM6ICgpID0+IHtcbiAgICAgIHJldHVybiB7IGhlYWRlcnM6IGdldEhlYWRlcnMoKSB9O1xuICAgIH0sXG4gIH0sXG59KSA6IG51bGw7XG5cbmNvbnN0IGh0dHBMaW5rID0gbmV3IEh0dHBMaW5rKHtcbiAgdXJpOiBcImh0dHBzOi8vaGFzdXJhLW1pZGNvZGVzMS5oZXJva3VhcHAuY29tL3YxL2dyYXBocWxcIixcbiAgIGZldGNoICxcbiAgaGVhZGVyczogZ2V0SGVhZGVycygpXG59KTtcblxuXG5cbmNvbnN0IGxpbmsgPSBwcm9jZXNzLmJyb3dzZXIgPyBzcGxpdCggLy9vbmx5IGNyZWF0ZSB0aGUgc3BsaXQgaW4gdGhlIGJyb3dzZXJcbiAgICAvLyBzcGxpdCBiYXNlZCBvbiBvcGVyYXRpb24gdHlwZVxuICAgICh7IHF1ZXJ5IH0pID0+IHtcbiAgICAgIGNvbnN0IGRlZmluaXRpb24gPSBnZXRNYWluRGVmaW5pdGlvbihxdWVyeSk7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBkZWZpbml0aW9uLmtpbmQgPT09ICdPcGVyYXRpb25EZWZpbml0aW9uJyAmJlxuICAgICAgICBkZWZpbml0aW9uLm9wZXJhdGlvbiA9PT0gJ3N1YnNjcmlwdGlvbidcbiAgICAgICk7XG4gICAgfSxcbiAgICB3c0xpbmssXG4gICAgaHR0cExpbmssXG4gICkgOiBodHRwTGluaztcblxuXG4gIGV4cG9ydCBjb25zdCBjbGllbnQgPSBuZXcgQXBvbGxvQ2xpZW50KHtcbiAgICBsaW5rLFxuICAgIGNhY2hlXG4gIH0pO1xuXG4gIl0sIm5hbWVzIjpbImlzRXF1YWwiLCJ0aGlzIiwiZ2xvYmFsIiwiZGVmYXVsdHNfMSIsInByb3RvY29sXzEiLCJCYWNrb2ZmIiwiZXZlbnRlbWl0dGVyM18xIiwibWVzc2FnZV90eXBlc18xIiwiaXNfc3RyaW5nXzEiLCJpc19vYmplY3RfMSIsIlN1YnNjcmlwdGlvbkNsaWVudCIsImZldGNoIiwiY2xpZW50IiwiQXBvbGxvQ2xpZW50Il0sIm1hcHBpbmdzIjoiOzs7OztBQUVBLElBQUksVUFBVSxDQUFDO0FBQ2YsU0FBUyxZQUFZLENBQUMsS0FBSyxFQUFFOztJQUV6QixJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2IsVUFBVTtZQUNOLENBQUMsT0FBTyxNQUFNLEtBQUssVUFBVSxJQUFJLE1BQU0sQ0FBQyxVQUFVLEtBQUssY0FBYyxDQUFDO0tBQzdFO0lBQ0QsT0FBTyxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQztDQUN0RTtBQUNELFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUU7SUFDNUIsSUFBSSxXQUFXLEdBQUcsT0FBTyxLQUFLLFNBQVMsQ0FBQztJQUN4QyxJQUFJLE9BQU8sQ0FBQztJQUNaLElBQUksTUFB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QUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUM5RCxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUNsRSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7TUFDdEUsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUMxRSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztLQUMvRTs7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO01BQ2xELElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVCOztJQUVELFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDN0MsTUFBTTtJQUNMLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNO1FBQ3pCLENBQUMsQ0FBQzs7SUFFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMzQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7O01BRXBGLFFBQVEsR0FBRztRQUNULEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDMUQsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDOUQsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ2xFLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDdEU7VUFDRSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0QsSUFBSSxDQUFDLENBQUMsR0FBRyxD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T0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUM5RixTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRTtRQUMvSSxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDekUsQ0FBQyxDQUFDO0NBQ04sQ0FBQztBQUNGLElBQUksV0FBVyxHQUFHLENBQUNBLGNBQUksSUFBSUEsY0FBSSxDQUFDLFdBQVcsS0FBSyxVQUFVLE9BQU8sRUFBRSxJQUFJLEVBQUU7SUFDckUsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqSCxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxNQUFNLEtBQUssVUFBVSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsV0FBVyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6SixTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUNsRSxTQUFTLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDZCxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksU0FBUyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDOUQsT0FBTyxDQUFDLEVBQUUsSUFBSTtZQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzdKLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNULEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU07Z0JBQzlCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDeEQsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDakQsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsU0FBUztnQkFDakQ7b0JBQ0ksSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRTtvQkFDNUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDdEYsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFO29CQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7b0JBQ25FLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxTQUFTO2FBQzlCO1lBQ0QsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzlCLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7UUFDMUQsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdB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
