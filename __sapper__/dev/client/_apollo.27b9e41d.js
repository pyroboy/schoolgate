import { E as setContext, J as getContext } from './index.892efb91.js';
import { r as readable } from './index.482e8653.js';
import { e as equal, K as Kind, p as printer, s as symbol_observable_1, _ as __extends, A as ApolloLink, I as InMemoryCache, H as HttpLink, a as split, b as ApolloClient__default, g as getMainDefinition } from './bundle.esm.0a1d9003.js';
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

});

unwrapExports(isString_1);

var isObject_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(value) {
    return ((value !== null) && (typeof value === 'object'));
}
exports.default = isObject;

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

});

unwrapExports(protocol);
var protocol_1 = protocol.GRAPHQL_WS;
var protocol_2 = protocol.GRAPHQL_SUBSCRIPTIONS;

var defaults = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var WS_TIMEOUT = 30000;
exports.WS_TIMEOUT = WS_TIMEOUT;

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

var browser = function() {
  throw new Error(
    'ws does not work in the browser. Browser clients must use the native ' +
      'WebSocket object'
  );
};

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

const wsLink = new WebSocketLink({
  uri: "ws://hasura-midcodes1.herokuapp.com/v1/graphql",
  options: {
    reconnect: true,
    lazy: true,
    connectionParams: () => {
      return { headers: getHeaders() };
    },
  },
  webSocketImpl: browser
});

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2Fwb2xsby4yN2I5ZTQxZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS1vYnNlcnZhYmxlL2Rpc3Qvc3ZlbHRlLW9ic2VydmFibGUuZXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3ZlbHRlLWFwb2xsby9kaXN0L3N2ZWx0ZS1hcG9sbG8uZXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvYmFja28yL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MvZGlzdC91dGlscy9pcy1zdHJpbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MvZGlzdC91dGlscy9pcy1vYmplY3QuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZ3JhcGhxbC91dGlsaXRpZXMvZ2V0T3BlcmF0aW9uQVNULm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdWJzY3JpcHRpb25zLXRyYW5zcG9ydC13cy9kaXN0L3Byb3RvY29sLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N1YnNjcmlwdGlvbnMtdHJhbnNwb3J0LXdzL2Rpc3QvZGVmYXVsdHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MvZGlzdC9tZXNzYWdlLXR5cGVzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N1YnNjcmlwdGlvbnMtdHJhbnNwb3J0LXdzL2Rpc3QvY2xpZW50LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Fwb2xsby1saW5rLXdzL2xpYi9idW5kbGUuZXNtLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3dzL2Jyb3dzZXIuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd2hhdHdnLWZldGNoL2ZldGNoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2lzb21vcnBoaWMtZmV0Y2gvZmV0Y2gtbnBtLWJyb3dzZXJpZnkuanMiLCIuLi8uLi8uLi9zcmMvcm91dGVzL19hcG9sbG8uanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xuXG52YXIgT0JTRVJWQUJMRTtcclxuZnVuY3Rpb24gaXNPYnNlcnZhYmxlKHZhbHVlKSB7XHJcbiAgICAvLyBMYXp5LWxvYWQgU3ltYm9sIHRvIGdpdmUgcG9seWZpbGxzIGEgY2hhbmNlIHRvIHJ1blxyXG4gICAgaWYgKCFPQlNFUlZBQkxFKSB7XHJcbiAgICAgICAgT0JTRVJWQUJMRSA9XHJcbiAgICAgICAgICAgICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIFN5bWJvbC5vYnNlcnZhYmxlKSB8fCAnQEBvYnNlcnZhYmxlJztcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZSAmJiB2YWx1ZVtPQlNFUlZBQkxFXSAmJiB2YWx1ZVtPQlNFUlZBQkxFXSgpID09PSB2YWx1ZTtcclxufVxyXG5mdW5jdGlvbiBkZWZlcnJlZChzZXQsIGluaXRpYWwpIHtcclxuICAgIHZhciBpbml0aWFsaXplZCA9IGluaXRpYWwgIT09IHVuZGVmaW5lZDtcclxuICAgIHZhciByZXNvbHZlO1xyXG4gICAgdmFyIHJlamVjdDtcclxuICAgIC8vIFNldCBpbml0aWFsIHZhbHVlXHJcbiAgICBzZXQoaW5pdGlhbGl6ZWRcclxuICAgICAgICA/IGluaXRpYWxcclxuICAgICAgICA6IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChfcmVzb2x2ZSwgX3JlamVjdCkge1xyXG4gICAgICAgICAgICByZXNvbHZlID0gX3Jlc29sdmU7XHJcbiAgICAgICAgICAgIHJlamVjdCA9IF9yZWplY3Q7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBmdWxmaWxsOiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxpemVkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldChQcm9taXNlLnJlc29sdmUodmFsdWUpKTtcclxuICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlamVjdDogZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpbml0aWFsaXplZClcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXQoUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcclxuICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cblxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7IH07XHJcbmZ1bmN0aW9uIG9ic2VydmUob2JzZXJ2YWJsZSwgaW5pdGlhbCkge1xyXG4gICAgaWYgKCFpc09ic2VydmFibGUob2JzZXJ2YWJsZSkpIHtcclxuICAgICAgICByZXR1cm4gcmVhZGFibGUob2JzZXJ2YWJsZSwgbm9vcCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVhZGFibGUodW5kZWZpbmVkLCBmdW5jdGlvbiAoc2V0KSB7XHJcbiAgICAgICAgdmFyIF9hID0gZGVmZXJyZWQoc2V0LCBpbml0aWFsKSwgZnVsZmlsbCA9IF9hLmZ1bGZpbGwsIHJlamVjdCA9IF9hLnJlamVjdDtcclxuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gb2JzZXJ2YWJsZS5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGZ1bGZpbGwodmFsdWUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7IH07XHJcbiAgICB9KTtcclxufVxuXG5mdW5jdGlvbiBmbGF0KHN1YnNjcmliYWJsZSwgaW5pdGlhbCkge1xyXG4gICAgdmFyIGlzX29ic2VydmFibGUgPSBpc09ic2VydmFibGUoc3Vic2NyaWJhYmxlKTtcclxuICAgIHJldHVybiByZWFkYWJsZSh1bmRlZmluZWQsIGZ1bmN0aW9uIChzZXQpIHtcclxuICAgICAgICB2YXIgaW5uZXJfdW5zdWJzY3JpYmUgPSBudWxsO1xyXG4gICAgICAgIHZhciBvdXRlcl91bnN1YnNjcmliZSA9IG51bGw7XHJcbiAgICAgICAgdmFyIF9hID0gKGlzX29ic2VydmFibGVcclxuICAgICAgICAgICAgPyBkZWZlcnJlZChzZXQsIGluaXRpYWwpXHJcbiAgICAgICAgICAgIDoge30pLCBfYiA9IF9hLmZ1bGZpbGwsIGZ1bGZpbGwgPSBfYiA9PT0gdm9pZCAwID8gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBzZXQodmFsdWUpOyB9IDogX2IsIHJlamVjdCA9IF9hLnJlamVjdDtcclxuICAgICAgICBmdW5jdGlvbiBuZXh0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpbm5lcl91bnN1YnNjcmliZSkge1xyXG4gICAgICAgICAgICAgICAgaW5uZXJfdW5zdWJzY3JpYmUoKTtcclxuICAgICAgICAgICAgICAgIGlubmVyX3Vuc3Vic2NyaWJlID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNPYnNlcnZhYmxlKHZhbHVlKSlcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gb2JzZXJ2ZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChpc1N0b3JlKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaW5uZXJfdW5zdWJzY3JpYmUgPSB2YWx1ZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGlubmVyKSB7IHJldHVybiBmdWxmaWxsKGlubmVyKTsgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmdWxmaWxsKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBlcnJvcihlcnJvcikge1xyXG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaXNfb2JzZXJ2YWJsZSkge1xyXG4gICAgICAgICAgICB2YXIgc3Vic2NyaXB0aW9uXzEgPSBzdWJzY3JpYmFibGUuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgIG5leHQ6IG5leHQsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIG91dGVyX3Vuc3Vic2NyaWJlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3Vic2NyaXB0aW9uXzEudW5zdWJzY3JpYmUoKTsgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG91dGVyX3Vuc3Vic2NyaWJlID0gc3Vic2NyaWJhYmxlLnN1YnNjcmliZShuZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGlubmVyX3Vuc3Vic2NyaWJlKVxyXG4gICAgICAgICAgICAgICAgaW5uZXJfdW5zdWJzY3JpYmUoKTtcclxuICAgICAgICAgICAgb3V0ZXJfdW5zdWJzY3JpYmUoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gaXNTdG9yZSh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5zdWJzY3JpYmUgPT09ICdmdW5jdGlvbic7XHJcbn1cblxuZXhwb3J0IHsgZmxhdCwgb2JzZXJ2ZSB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3ZlbHRlLW9ic2VydmFibGUuZXMuanMubWFwXG4iLCJpbXBvcnQgeyBnZXRDb250ZXh0LCBzZXRDb250ZXh0LCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IGlzRXF1YWwgfSBmcm9tICdhcG9sbG8tdXRpbGl0aWVzJztcbmltcG9ydCB7IHJlYWRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcbmltcG9ydCB7IG9ic2VydmUgfSBmcm9tICdzdmVsdGUtb2JzZXJ2YWJsZSc7XG5cbnZhciBDTElFTlQgPSB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyA/IFN5bWJvbCgnY2xpZW50JykgOiAnQEBjbGllbnQnO1xyXG5mdW5jdGlvbiBnZXRDbGllbnQoKSB7XHJcbiAgICByZXR1cm4gZ2V0Q29udGV4dChDTElFTlQpO1xyXG59XHJcbmZ1bmN0aW9uIHNldENsaWVudChjbGllbnQpIHtcclxuICAgIHNldENvbnRleHQoQ0xJRU5ULCBjbGllbnQpO1xyXG59XG5cbnZhciByZXN0b3JpbmcgPSB0eXBlb2YgV2Vha1NldCAhPT0gJ3VuZGVmaW5lZCcgPyBuZXcgV2Vha1NldCgpIDogbmV3IFNldCgpO1xyXG5mdW5jdGlvbiByZXN0b3JlKGNsaWVudCwgcXVlcnksIGRhdGEpIHtcclxuICAgIHJlc3RvcmluZy5hZGQoY2xpZW50KTtcclxuICAgIGFmdGVySHlkcmF0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmVzdG9yaW5nLmRlbGV0ZShjbGllbnQpO1xyXG4gICAgfSk7XHJcbiAgICBjbGllbnQud3JpdGVRdWVyeSh7IHF1ZXJ5OiBxdWVyeSwgZGF0YTogZGF0YSB9KTtcclxufVxyXG5mdW5jdGlvbiBhZnRlckh5ZHJhdGUoY2FsbGJhY2spIHtcclxuICAgIC8vIEF0dGVtcHQgdG8gd2FpdCBmb3Igb25Nb3VudCAoaHlkcmF0aW9uIG9mIGN1cnJlbnQgY29tcG9uZW50IGlzIGNvbXBsZXRlKSxcclxuICAgIC8vIGJ1dCBpZiB0aGF0IGZhaWxzIChlLmcuIG91dHNpZGUgb2YgY29tcG9uZW50IGluaXRpYWxpemF0aW9uKVxyXG4gICAgLy8gd2FpdCBmb3IgbmV4dCBldmVudCBsb29wIGZvciBoeWRyYXRlIHRvIGNvbXBsZXRlXHJcbiAgICB0cnkge1xyXG4gICAgICAgIG9uTW91bnQoY2FsbGJhY2spO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKF9lcnJvcikge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIDEpO1xyXG4gICAgfVxyXG59XG5cbmZ1bmN0aW9uIHF1ZXJ5KGNsaWVudCwgb3B0aW9ucykge1xyXG4gICAgdmFyIHN1YnNjcmliZWQgPSBmYWxzZTtcclxuICAgIHZhciBpbml0aWFsX3ZhbHVlO1xyXG4gICAgLy8gSWYgY2xpZW50IGlzIHJlc3RvcmluZyAoZS5nLiBmcm9tIFNTUilcclxuICAgIC8vIGF0dGVtcHQgc3luY2hyb25vdXMgcmVhZFF1ZXJ5IGZpcnN0ICh0byBwcmV2ZW50IGxvYWRpbmcgaW4geyNhd2FpdH0pXHJcbiAgICBpZiAocmVzdG9yaW5nLmhhcyhjbGllbnQpKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gdW5kZWZpbmVkID0gc2tpcCBpbml0aWFsIHZhbHVlIChub3QgaW4gY2FjaGUpXHJcbiAgICAgICAgICAgIGluaXRpYWxfdmFsdWUgPSBjbGllbnQucmVhZFF1ZXJ5KG9wdGlvbnMpIHx8IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaW5pdGlhbF92YWx1ZSA9IHsgZGF0YTogaW5pdGlhbF92YWx1ZSB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSBwcmVsb2FkIGVycm9yc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENyZWF0ZSBxdWVyeSBhbmQgb2JzZXJ2ZSxcclxuICAgIC8vIGJ1dCBkb24ndCBzdWJzY3JpYmUgZGlyZWN0bHkgdG8gYXZvaWQgZmlyaW5nIGR1cGxpY2F0ZSB2YWx1ZSBpZiBpbml0aWFsaXplZFxyXG4gICAgdmFyIG9ic2VydmFibGVfcXVlcnkgPSBjbGllbnQud2F0Y2hRdWVyeShvcHRpb25zKTtcclxuICAgIHZhciBzdWJzY3JpYmVfdG9fcXVlcnkgPSBvYnNlcnZlKG9ic2VydmFibGVfcXVlcnksIGluaXRpYWxfdmFsdWUpLnN1YnNjcmliZTtcclxuICAgIC8vIFdyYXAgdGhlIHF1ZXJ5IHN1YnNjcmlwdGlvbiB3aXRoIGEgcmVhZGFibGUgdG8gcHJldmVudCBkdXBsaWNhdGUgdmFsdWVzXHJcbiAgICB2YXIgc3Vic2NyaWJlID0gcmVhZGFibGUoaW5pdGlhbF92YWx1ZSwgZnVuY3Rpb24gKHNldCkge1xyXG4gICAgICAgIHN1YnNjcmliZWQgPSB0cnVlO1xyXG4gICAgICAgIHZhciBza2lwX2R1cGxpY2F0ZSA9IGluaXRpYWxfdmFsdWUgIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB2YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgc2tpcHBlZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciB1bnN1YnNjcmliZSA9IHN1YnNjcmliZV90b19xdWVyeShmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHNraXBfZHVwbGljYXRlICYmIGluaXRpYWxpemVkICYmICFza2lwcGVkKSB7XHJcbiAgICAgICAgICAgICAgICBza2lwcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICghaW5pdGlhbGl6ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB1bnN1YnNjcmliZTtcclxuICAgIH0pLnN1YnNjcmliZTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3Vic2NyaWJlOiBzdWJzY3JpYmUsXHJcbiAgICAgICAgcmVmZXRjaDogZnVuY3Rpb24gKHZhcmlhYmxlcykge1xyXG4gICAgICAgICAgICAvLyBJZiB2YXJpYWJsZXMgaGF2ZSBub3QgY2hhbmdlZCBhbmQgbm90IHN1YnNjcmliZWQsIHNraXAgcmVmZXRjaFxyXG4gICAgICAgICAgICBpZiAoIXN1YnNjcmliZWQgJiYgaXNFcXVhbCh2YXJpYWJsZXMsIG9ic2VydmFibGVfcXVlcnkudmFyaWFibGVzKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlX3F1ZXJ5LnJlc3VsdCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZV9xdWVyeS5yZWZldGNoKHZhcmlhYmxlcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXN1bHQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9ic2VydmFibGVfcXVlcnkucmVzdWx0KCk7IH0sXHJcbiAgICAgICAgZmV0Y2hNb3JlOiBmdW5jdGlvbiAob3B0aW9ucykgeyByZXR1cm4gb2JzZXJ2YWJsZV9xdWVyeS5mZXRjaE1vcmUob3B0aW9ucyk7IH0sXHJcbiAgICAgICAgc2V0T3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbnMpIHsgcmV0dXJuIG9ic2VydmFibGVfcXVlcnkuc2V0T3B0aW9ucyhvcHRpb25zKTsgfSxcclxuICAgICAgICB1cGRhdGVRdWVyeTogZnVuY3Rpb24gKG1hcCkgeyByZXR1cm4gb2JzZXJ2YWJsZV9xdWVyeS51cGRhdGVRdWVyeShtYXApOyB9LFxyXG4gICAgICAgIHN0YXJ0UG9sbGluZzogZnVuY3Rpb24gKGludGVydmFsKSB7IHJldHVybiBvYnNlcnZhYmxlX3F1ZXJ5LnN0YXJ0UG9sbGluZyhpbnRlcnZhbCk7IH0sXHJcbiAgICAgICAgc3RvcFBvbGxpbmc6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9ic2VydmFibGVfcXVlcnkuc3RvcFBvbGxpbmcoKTsgfSxcclxuICAgICAgICBzdWJzY3JpYmVUb01vcmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7IHJldHVybiBvYnNlcnZhYmxlX3F1ZXJ5LnN1YnNjcmliZVRvTW9yZShvcHRpb25zKTsgfVxyXG4gICAgfTtcclxufVxuXG5mdW5jdGlvbiBtdXRhdGUoY2xpZW50LCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gY2xpZW50Lm11dGF0ZShvcHRpb25zKTtcclxufVxuXG5mdW5jdGlvbiBzdWJzY3JpYmUoY2xpZW50LCBvcHRpb25zKSB7XHJcbiAgICB2YXIgb2JzZXJ2YWJsZSA9IGNsaWVudC5zdWJzY3JpYmUob3B0aW9ucyk7XHJcbiAgICByZXR1cm4gb2JzZXJ2ZShvYnNlcnZhYmxlKTtcclxufVxuXG5leHBvcnQgeyBnZXRDbGllbnQsIG11dGF0ZSwgcXVlcnksIHJlc3RvcmUsIHNldENsaWVudCwgc3Vic2NyaWJlIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdmVsdGUtYXBvbGxvLmVzLmpzLm1hcFxuIiwiXG4vKipcbiAqIEV4cG9zZSBgQmFja29mZmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrb2ZmO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYmFja29mZiB0aW1lciB3aXRoIGBvcHRzYC5cbiAqXG4gKiAtIGBtaW5gIGluaXRpYWwgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgWzEwMF1cbiAqIC0gYG1heGAgbWF4IHRpbWVvdXQgWzEwMDAwXVxuICogLSBgaml0dGVyYCBbMF1cbiAqIC0gYGZhY3RvcmAgWzJdXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gQmFja29mZihvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICB0aGlzLm1zID0gb3B0cy5taW4gfHwgMTAwO1xuICB0aGlzLm1heCA9IG9wdHMubWF4IHx8IDEwMDAwO1xuICB0aGlzLmZhY3RvciA9IG9wdHMuZmFjdG9yIHx8IDI7XG4gIHRoaXMuaml0dGVyID0gb3B0cy5qaXR0ZXIgPiAwICYmIG9wdHMuaml0dGVyIDw9IDEgPyBvcHRzLmppdHRlciA6IDA7XG4gIHRoaXMuYXR0ZW1wdHMgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgYmFja29mZiBkdXJhdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkJhY2tvZmYucHJvdG90eXBlLmR1cmF0aW9uID0gZnVuY3Rpb24oKXtcbiAgdmFyIG1zID0gdGhpcy5tcyAqIE1hdGgucG93KHRoaXMuZmFjdG9yLCB0aGlzLmF0dGVtcHRzKyspO1xuICBpZiAodGhpcy5qaXR0ZXIpIHtcbiAgICB2YXIgcmFuZCA9ICBNYXRoLnJhbmRvbSgpO1xuICAgIHZhciBkZXZpYXRpb24gPSBNYXRoLmZsb29yKHJhbmQgKiB0aGlzLmppdHRlciAqIG1zKTtcbiAgICBtcyA9IChNYXRoLmZsb29yKHJhbmQgKiAxMCkgJiAxKSA9PSAwICA/IG1zIC0gZGV2aWF0aW9uIDogbXMgKyBkZXZpYXRpb247XG4gIH1cbiAgcmV0dXJuIE1hdGgubWluKG1zLCB0aGlzLm1heCkgfCAwO1xufTtcblxuLyoqXG4gKiBSZXNldCB0aGUgbnVtYmVyIG9mIGF0dGVtcHRzLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQmFja29mZi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLmF0dGVtcHRzID0gMDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBtaW5pbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNaW4gPSBmdW5jdGlvbihtaW4pe1xuICB0aGlzLm1zID0gbWluO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG1heGltdW0gZHVyYXRpb25cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkJhY2tvZmYucHJvdG90eXBlLnNldE1heCA9IGZ1bmN0aW9uKG1heCl7XG4gIHRoaXMubWF4ID0gbWF4O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGppdHRlclxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQmFja29mZi5wcm90b3R5cGUuc2V0Sml0dGVyID0gZnVuY3Rpb24oaml0dGVyKXtcbiAgdGhpcy5qaXR0ZXIgPSBqaXR0ZXI7XG59O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgcHJlZml4ID0gJ34nO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgZm9yIG91ciBgRUVgIG9iamVjdHMuXG4gKiBBbiBgRXZlbnRzYCBpbnN0YW5jZSBpcyBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IGVtaXR0ZXIgUmVmZXJlbmNlIHRvIHRoZSBgRXZlbnRFbWl0dGVyYCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBhZGRMaXN0ZW5lcihlbWl0dGVyLCBldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCBlbWl0dGVyLCBvbmNlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIWVtaXR0ZXIuX2V2ZW50c1tldnRdKSBlbWl0dGVyLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCBlbWl0dGVyLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghZW1pdHRlci5fZXZlbnRzW2V2dF0uZm4pIGVtaXR0ZXIuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIGVtaXR0ZXIuX2V2ZW50c1tldnRdID0gW2VtaXR0ZXIuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIGVtaXR0ZXI7XG59XG5cbi8qKlxuICogQ2xlYXIgZXZlbnQgYnkgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gZW1pdHRlciBSZWZlcmVuY2UgdG8gdGhlIGBFdmVudEVtaXR0ZXJgIGluc3RhbmNlLlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2dCBUaGUgRXZlbnQgbmFtZS5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNsZWFyRXZlbnQoZW1pdHRlciwgZXZ0KSB7XG4gIGlmICgtLWVtaXR0ZXIuX2V2ZW50c0NvdW50ID09PSAwKSBlbWl0dGVyLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIGVsc2UgZGVsZXRlIGVtaXR0ZXIuX2V2ZW50c1tldnRdO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFRoZSByZWdpc3RlcmVkIGxpc3RlbmVycy5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKCFoYW5kbGVycykgcmV0dXJuIFtdO1xuICBpZiAoaGFuZGxlcnMuZm4pIHJldHVybiBbaGFuZGxlcnMuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaGFuZGxlcnMubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gaGFuZGxlcnNbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24gbGlzdGVuZXJDb3VudChldmVudCkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiAwO1xuICBpZiAobGlzdGVuZXJzLmZuKSByZXR1cm4gMTtcbiAgcmV0dXJuIGxpc3RlbmVycy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgY2FzZSA0OiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyLCBhMyk7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHJldHVybiBhZGRMaXN0ZW5lcih0aGlzLCBldmVudCwgZm4sIGNvbnRleHQsIGZhbHNlKTtcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHJldHVybiBhZGRMaXN0ZW5lcih0aGlzLCBldmVudCwgZm4sIGNvbnRleHQsIHRydWUpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGxpc3RlbmVycyBvZiBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG4gIGlmICghZm4pIHtcbiAgICBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm4gJiZcbiAgICAgICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSkgJiZcbiAgICAgICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGNsZWFyRXZlbnQodGhpcywgZXZ0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmbiB8fFxuICAgICAgICAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpIHx8XG4gICAgICAgIChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBbZXZlbnRdIFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBBbGxvdyBgRXZlbnRFbWl0dGVyYCB0byBiZSBpbXBvcnRlZCBhcyBtb2R1bGUgbmFtZXNwYWNlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBpc1N0cmluZztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLXN0cmluZy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuICgodmFsdWUgIT09IG51bGwpICYmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBpc09iamVjdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLW9iamVjdC5qcy5tYXAiLCJpbXBvcnQgeyBLaW5kIH0gZnJvbSAnLi4vbGFuZ3VhZ2Uva2luZHMnO1xuXG4vKipcbiAqIFJldHVybnMgYW4gb3BlcmF0aW9uIEFTVCBnaXZlbiBhIGRvY3VtZW50IEFTVCBhbmQgb3B0aW9uYWxseSBhbiBvcGVyYXRpb25cbiAqIG5hbWUuIElmIGEgbmFtZSBpcyBub3QgcHJvdmlkZWQsIGFuIG9wZXJhdGlvbiBpcyBvbmx5IHJldHVybmVkIGlmIG9ubHkgb25lIGlzXG4gKiBwcm92aWRlZCBpbiB0aGUgZG9jdW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcGVyYXRpb25BU1QoZG9jdW1lbnRBU1QsIG9wZXJhdGlvbk5hbWUpIHtcbiAgdmFyIG9wZXJhdGlvbiA9IG51bGw7XG5cbiAgZm9yICh2YXIgX2kyID0gMCwgX2RvY3VtZW50QVNUJGRlZmluaXRpMiA9IGRvY3VtZW50QVNULmRlZmluaXRpb25zOyBfaTIgPCBfZG9jdW1lbnRBU1QkZGVmaW5pdGkyLmxlbmd0aDsgX2kyKyspIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IF9kb2N1bWVudEFTVCRkZWZpbml0aTJbX2kyXTtcblxuICAgIGlmIChkZWZpbml0aW9uLmtpbmQgPT09IEtpbmQuT1BFUkFUSU9OX0RFRklOSVRJT04pIHtcbiAgICAgIGlmICghb3BlcmF0aW9uTmFtZSkge1xuICAgICAgICAvLyBJZiBubyBvcGVyYXRpb24gbmFtZSB3YXMgcHJvdmlkZWQsIG9ubHkgcmV0dXJuIGFuIE9wZXJhdGlvbiBpZiB0aGVyZVxuICAgICAgICAvLyBpcyBvbmUgZGVmaW5lZCBpbiB0aGUgZG9jdW1lbnQuIFVwb24gZW5jb3VudGVyaW5nIHRoZSBzZWNvbmQsIHJldHVyblxuICAgICAgICAvLyBudWxsLlxuICAgICAgICBpZiAob3BlcmF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBvcGVyYXRpb24gPSBkZWZpbml0aW9uO1xuICAgICAgfSBlbHNlIGlmIChkZWZpbml0aW9uLm5hbWUgJiYgZGVmaW5pdGlvbi5uYW1lLnZhbHVlID09PSBvcGVyYXRpb25OYW1lKSB7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvcGVyYXRpb247XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBHUkFQSFFMX1dTID0gJ2dyYXBocWwtd3MnO1xuZXhwb3J0cy5HUkFQSFFMX1dTID0gR1JBUEhRTF9XUztcbnZhciBHUkFQSFFMX1NVQlNDUklQVElPTlMgPSAnZ3JhcGhxbC1zdWJzY3JpcHRpb25zJztcbmV4cG9ydHMuR1JBUEhRTF9TVUJTQ1JJUFRJT05TID0gR1JBUEhRTF9TVUJTQ1JJUFRJT05TO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvdG9jb2wuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgV1NfVElNRU9VVCA9IDMwMDAwO1xuZXhwb3J0cy5XU19USU1FT1VUID0gV1NfVElNRU9VVDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlZmF1bHRzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIE1lc3NhZ2VUeXBlcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWVzc2FnZVR5cGVzKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0YXRpYyBDbGFzcycpO1xuICAgIH1cbiAgICBNZXNzYWdlVHlwZXMuR1FMX0NPTk5FQ1RJT05fSU5JVCA9ICdjb25uZWN0aW9uX2luaXQnO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfQ09OTkVDVElPTl9BQ0sgPSAnY29ubmVjdGlvbl9hY2snO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfQ09OTkVDVElPTl9FUlJPUiA9ICdjb25uZWN0aW9uX2Vycm9yJztcbiAgICBNZXNzYWdlVHlwZXMuR1FMX0NPTk5FQ1RJT05fS0VFUF9BTElWRSA9ICdrYSc7XG4gICAgTWVzc2FnZVR5cGVzLkdRTF9DT05ORUNUSU9OX1RFUk1JTkFURSA9ICdjb25uZWN0aW9uX3Rlcm1pbmF0ZSc7XG4gICAgTWVzc2FnZVR5cGVzLkdRTF9TVEFSVCA9ICdzdGFydCc7XG4gICAgTWVzc2FnZVR5cGVzLkdRTF9EQVRBID0gJ2RhdGEnO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfRVJST1IgPSAnZXJyb3InO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfQ09NUExFVEUgPSAnY29tcGxldGUnO1xuICAgIE1lc3NhZ2VUeXBlcy5HUUxfU1RPUCA9ICdzdG9wJztcbiAgICBNZXNzYWdlVHlwZXMuU1VCU0NSSVBUSU9OX1NUQVJUID0gJ3N1YnNjcmlwdGlvbl9zdGFydCc7XG4gICAgTWVzc2FnZVR5cGVzLlNVQlNDUklQVElPTl9EQVRBID0gJ3N1YnNjcmlwdGlvbl9kYXRhJztcbiAgICBNZXNzYWdlVHlwZXMuU1VCU0NSSVBUSU9OX1NVQ0NFU1MgPSAnc3Vic2NyaXB0aW9uX3N1Y2Nlc3MnO1xuICAgIE1lc3NhZ2VUeXBlcy5TVUJTQ1JJUFRJT05fRkFJTCA9ICdzdWJzY3JpcHRpb25fZmFpbCc7XG4gICAgTWVzc2FnZVR5cGVzLlNVQlNDUklQVElPTl9FTkQgPSAnc3Vic2NyaXB0aW9uX2VuZCc7XG4gICAgTWVzc2FnZVR5cGVzLklOSVQgPSAnaW5pdCc7XG4gICAgTWVzc2FnZVR5cGVzLklOSVRfU1VDQ0VTUyA9ICdpbml0X3N1Y2Nlc3MnO1xuICAgIE1lc3NhZ2VUeXBlcy5JTklUX0ZBSUwgPSAnaW5pdF9mYWlsJztcbiAgICBNZXNzYWdlVHlwZXMuS0VFUF9BTElWRSA9ICdrZWVwYWxpdmUnO1xuICAgIHJldHVybiBNZXNzYWdlVHlwZXM7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gTWVzc2FnZVR5cGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWVzc2FnZS10eXBlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19nZW5lcmF0b3IgPSAodGhpcyAmJiB0aGlzLl9fZ2VuZXJhdG9yKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgYm9keSkge1xuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XG4gICAgfVxufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBfZ2xvYmFsID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fSk7XG52YXIgTmF0aXZlV2ViU29ja2V0ID0gX2dsb2JhbC5XZWJTb2NrZXQgfHwgX2dsb2JhbC5Nb3pXZWJTb2NrZXQ7XG52YXIgQmFja29mZiA9IHJlcXVpcmUoXCJiYWNrbzJcIik7XG52YXIgZXZlbnRlbWl0dGVyM18xID0gcmVxdWlyZShcImV2ZW50ZW1pdHRlcjNcIik7XG52YXIgaXNfc3RyaW5nXzEgPSByZXF1aXJlKFwiLi91dGlscy9pcy1zdHJpbmdcIik7XG52YXIgaXNfb2JqZWN0XzEgPSByZXF1aXJlKFwiLi91dGlscy9pcy1vYmplY3RcIik7XG52YXIgcHJpbnRlcl8xID0gcmVxdWlyZShcImdyYXBocWwvbGFuZ3VhZ2UvcHJpbnRlclwiKTtcbnZhciBnZXRPcGVyYXRpb25BU1RfMSA9IHJlcXVpcmUoXCJncmFwaHFsL3V0aWxpdGllcy9nZXRPcGVyYXRpb25BU1RcIik7XG52YXIgc3ltYm9sX29ic2VydmFibGVfMSA9IHJlcXVpcmUoXCJzeW1ib2wtb2JzZXJ2YWJsZVwiKTtcbnZhciBwcm90b2NvbF8xID0gcmVxdWlyZShcIi4vcHJvdG9jb2xcIik7XG52YXIgZGVmYXVsdHNfMSA9IHJlcXVpcmUoXCIuL2RlZmF1bHRzXCIpO1xudmFyIG1lc3NhZ2VfdHlwZXNfMSA9IHJlcXVpcmUoXCIuL21lc3NhZ2UtdHlwZXNcIik7XG52YXIgU3Vic2NyaXB0aW9uQ2xpZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdWJzY3JpcHRpb25DbGllbnQodXJsLCBvcHRpb25zLCB3ZWJTb2NrZXRJbXBsLCB3ZWJTb2NrZXRQcm90b2NvbHMpIHtcbiAgICAgICAgdmFyIF9hID0gKG9wdGlvbnMgfHwge30pLCBfYiA9IF9hLmNvbm5lY3Rpb25DYWxsYmFjaywgY29ubmVjdGlvbkNhbGxiYWNrID0gX2IgPT09IHZvaWQgMCA/IHVuZGVmaW5lZCA6IF9iLCBfYyA9IF9hLmNvbm5lY3Rpb25QYXJhbXMsIGNvbm5lY3Rpb25QYXJhbXMgPSBfYyA9PT0gdm9pZCAwID8ge30gOiBfYywgX2QgPSBfYS50aW1lb3V0LCB0aW1lb3V0ID0gX2QgPT09IHZvaWQgMCA/IGRlZmF1bHRzXzEuV1NfVElNRU9VVCA6IF9kLCBfZSA9IF9hLnJlY29ubmVjdCwgcmVjb25uZWN0ID0gX2UgPT09IHZvaWQgMCA/IGZhbHNlIDogX2UsIF9mID0gX2EucmVjb25uZWN0aW9uQXR0ZW1wdHMsIHJlY29ubmVjdGlvbkF0dGVtcHRzID0gX2YgPT09IHZvaWQgMCA/IEluZmluaXR5IDogX2YsIF9nID0gX2EubGF6eSwgbGF6eSA9IF9nID09PSB2b2lkIDAgPyBmYWxzZSA6IF9nLCBfaCA9IF9hLmluYWN0aXZpdHlUaW1lb3V0LCBpbmFjdGl2aXR5VGltZW91dCA9IF9oID09PSB2b2lkIDAgPyAwIDogX2g7XG4gICAgICAgIHRoaXMud3NJbXBsID0gd2ViU29ja2V0SW1wbCB8fCBOYXRpdmVXZWJTb2NrZXQ7XG4gICAgICAgIGlmICghdGhpcy53c0ltcGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGZpbmQgbmF0aXZlIGltcGxlbWVudGF0aW9uLCBvciBhbHRlcm5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBmb3IgV2ViU29ja2V0IScpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMud3NQcm90b2NvbHMgPSB3ZWJTb2NrZXRQcm90b2NvbHMgfHwgcHJvdG9jb2xfMS5HUkFQSFFMX1dTO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25DYWxsYmFjayA9IGNvbm5lY3Rpb25DYWxsYmFjaztcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG4gICAgICAgIHRoaXMub3BlcmF0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLm5leHRPcGVyYXRpb25JZCA9IDA7XG4gICAgICAgIHRoaXMud3NUaW1lb3V0ID0gdGltZW91dDtcbiAgICAgICAgdGhpcy51bnNlbnRNZXNzYWdlc1F1ZXVlID0gW107XG4gICAgICAgIHRoaXMucmVjb25uZWN0ID0gcmVjb25uZWN0O1xuICAgICAgICB0aGlzLnJlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkF0dGVtcHRzID0gcmVjb25uZWN0aW9uQXR0ZW1wdHM7XG4gICAgICAgIHRoaXMubGF6eSA9ICEhbGF6eTtcbiAgICAgICAgdGhpcy5pbmFjdGl2aXR5VGltZW91dCA9IGluYWN0aXZpdHlUaW1lb3V0O1xuICAgICAgICB0aGlzLmNsb3NlZEJ5VXNlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJhY2tvZmYgPSBuZXcgQmFja29mZih7IGppdHRlcjogMC41IH0pO1xuICAgICAgICB0aGlzLmV2ZW50RW1pdHRlciA9IG5ldyBldmVudGVtaXR0ZXIzXzEuRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMubWlkZGxld2FyZXMgPSBbXTtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBudWxsO1xuICAgICAgICB0aGlzLm1heENvbm5lY3RUaW1lR2VuZXJhdG9yID0gdGhpcy5jcmVhdGVNYXhDb25uZWN0VGltZUdlbmVyYXRvcigpO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25QYXJhbXMgPSB0aGlzLmdldENvbm5lY3Rpb25QYXJhbXMoY29ubmVjdGlvblBhcmFtcyk7XG4gICAgICAgIGlmICghdGhpcy5sYXp5KSB7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZSwgXCJzdGF0dXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNsaWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndzSW1wbC5DTE9TRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQucmVhZHlTdGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChpc0ZvcmNlZCwgY2xvc2VkQnlVc2VyKSB7XG4gICAgICAgIGlmIChpc0ZvcmNlZCA9PT0gdm9pZCAwKSB7IGlzRm9yY2VkID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2xvc2VkQnlVc2VyID09PSB2b2lkIDApIHsgY2xvc2VkQnlVc2VyID0gdHJ1ZTsgfVxuICAgICAgICB0aGlzLmNsZWFySW5hY3Rpdml0eVRpbWVvdXQoKTtcbiAgICAgICAgaWYgKHRoaXMuY2xpZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlZEJ5VXNlciA9IGNsb3NlZEJ5VXNlcjtcbiAgICAgICAgICAgIGlmIChpc0ZvcmNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJNYXhDb25uZWN0VGltZW91dCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUcnlSZWNvbm5lY3RUaW1lb3V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51bnN1YnNjcmliZUFsbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UodW5kZWZpbmVkLCBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09OTkVDVElPTl9URVJNSU5BVEUsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jbGllbnQuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgaWYgKCFpc0ZvcmNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudHJ5UmVjb25uZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgdmFyIGdldE9ic2VydmVyID0gdGhpcy5nZXRPYnNlcnZlci5iaW5kKHRoaXMpO1xuICAgICAgICB2YXIgZXhlY3V0ZU9wZXJhdGlvbiA9IHRoaXMuZXhlY3V0ZU9wZXJhdGlvbi5iaW5kKHRoaXMpO1xuICAgICAgICB2YXIgdW5zdWJzY3JpYmUgPSB0aGlzLnVuc3Vic2NyaWJlLmJpbmQodGhpcyk7XG4gICAgICAgIHZhciBvcElkO1xuICAgICAgICB0aGlzLmNsZWFySW5hY3Rpdml0eVRpbWVvdXQoKTtcbiAgICAgICAgcmV0dXJuIF9hID0ge30sXG4gICAgICAgICAgICBfYVtzeW1ib2xfb2JzZXJ2YWJsZV8xLmRlZmF1bHRdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9hLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChvYnNlcnZlck9yTmV4dCwgb25FcnJvciwgb25Db21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHZhciBvYnNlcnZlciA9IGdldE9ic2VydmVyKG9ic2VydmVyT3JOZXh0LCBvbkVycm9yLCBvbkNvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICBvcElkID0gZXhlY3V0ZU9wZXJhdGlvbihyZXF1ZXN0LCBmdW5jdGlvbiAoZXJyb3IsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgPT09IG51bGwgJiYgcmVzdWx0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JzZXJ2ZXIuY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JzZXJ2ZXIuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5lcnJvcihlcnJvclswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JzZXJ2ZXIubmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuc3Vic2NyaWJlKG9wSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2E7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLmV2ZW50RW1pdHRlci5vbihldmVudE5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGhhbmRsZXIub2ZmKGV2ZW50TmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vbkNvbm5lY3RlZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vbignY29ubmVjdGVkJywgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vbkNvbm5lY3RpbmcgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub24oJ2Nvbm5lY3RpbmcnLCBjYWxsYmFjaywgY29udGV4dCk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLm9uRGlzY29ubmVjdGVkID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKCdkaXNjb25uZWN0ZWQnLCBjYWxsYmFjaywgY29udGV4dCk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLm9uUmVjb25uZWN0ZWQgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub24oJ3JlY29ubmVjdGVkJywgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vblJlY29ubmVjdGluZyA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vbigncmVjb25uZWN0aW5nJywgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKCdlcnJvcicsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUudW5zdWJzY3JpYmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMub3BlcmF0aW9ucykuZm9yRWFjaChmdW5jdGlvbiAoc3ViSWQpIHtcbiAgICAgICAgICAgIF90aGlzLnVuc3Vic2NyaWJlKHN1YklkKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmFwcGx5TWlkZGxld2FyZXMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlID0gZnVuY3Rpb24gKGZ1bmNzLCBzY29wZSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmdW5jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGYgPSBmdW5jcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGYuYXBwbHlNaWRkbGV3YXJlLmFwcGx5KHNjb3BlLCBbb3B0aW9ucywgbmV4dF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBxdWV1ZShfdGhpcy5taWRkbGV3YXJlcy5zbGljZSgpLCBfdGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS51c2UgPSBmdW5jdGlvbiAobWlkZGxld2FyZXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgbWlkZGxld2FyZXMubWFwKGZ1bmN0aW9uIChtaWRkbGV3YXJlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUuYXBwbHlNaWRkbGV3YXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMubWlkZGxld2FyZXMucHVzaChtaWRkbGV3YXJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlkZGxld2FyZSBtdXN0IGltcGxlbWVudCB0aGUgYXBwbHlNaWRkbGV3YXJlIGZ1bmN0aW9uLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmdldENvbm5lY3Rpb25QYXJhbXMgPSBmdW5jdGlvbiAoY29ubmVjdGlvblBhcmFtcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25uZWN0aW9uUGFyYW1zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoY29ubmVjdGlvblBhcmFtcy5jYWxsKG51bGwpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoY29ubmVjdGlvblBhcmFtcyk7XG4gICAgICAgIH0pOyB9O1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5leGVjdXRlT3BlcmF0aW9uID0gZnVuY3Rpb24gKG9wdGlvbnMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuY2xpZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3BJZCA9IHRoaXMuZ2VuZXJhdGVPcGVyYXRpb25JZCgpO1xuICAgICAgICB0aGlzLm9wZXJhdGlvbnNbb3BJZF0gPSB7IG9wdGlvbnM6IG9wdGlvbnMsIGhhbmRsZXI6IGhhbmRsZXIgfTtcbiAgICAgICAgdGhpcy5hcHBseU1pZGRsZXdhcmVzKG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocHJvY2Vzc2VkT3B0aW9ucykge1xuICAgICAgICAgICAgX3RoaXMuY2hlY2tPcGVyYXRpb25PcHRpb25zKHByb2Nlc3NlZE9wdGlvbnMsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKF90aGlzLm9wZXJhdGlvbnNbb3BJZF0pIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5vcGVyYXRpb25zW29wSWRdID0geyBvcHRpb25zOiBwcm9jZXNzZWRPcHRpb25zLCBoYW5kbGVyOiBoYW5kbGVyIH07XG4gICAgICAgICAgICAgICAgX3RoaXMuc2VuZE1lc3NhZ2Uob3BJZCwgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX1NUQVJULCBwcm9jZXNzZWRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIF90aGlzLnVuc3Vic2NyaWJlKG9wSWQpO1xuICAgICAgICAgICAgaGFuZGxlcihfdGhpcy5mb3JtYXRFcnJvcnMoZXJyb3IpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvcElkO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5nZXRPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlck9yTmV4dCwgZXJyb3IsIGNvbXBsZXRlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JzZXJ2ZXJPck5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG9ic2VydmVyT3JOZXh0KHYpOyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZXJyb3IgJiYgZXJyb3IoZSk7IH0sXG4gICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbXBsZXRlICYmIGNvbXBsZXRlKCk7IH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYnNlcnZlck9yTmV4dDtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuY3JlYXRlTWF4Q29ubmVjdFRpbWVHZW5lcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtaW5WYWx1ZSA9IDEwMDA7XG4gICAgICAgIHZhciBtYXhWYWx1ZSA9IHRoaXMud3NUaW1lb3V0O1xuICAgICAgICByZXR1cm4gbmV3IEJhY2tvZmYoe1xuICAgICAgICAgICAgbWluOiBtaW5WYWx1ZSxcbiAgICAgICAgICAgIG1heDogbWF4VmFsdWUsXG4gICAgICAgICAgICBmYWN0b3I6IDEuMixcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNsZWFyQ2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmNoZWNrQ29ubmVjdGlvbkludGVydmFsSWQpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5jaGVja0Nvbm5lY3Rpb25JbnRlcnZhbElkKTtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWxJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuY2xlYXJNYXhDb25uZWN0VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubWF4Q29ubmVjdFRpbWVvdXRJZCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMubWF4Q29ubmVjdFRpbWVvdXRJZCk7XG4gICAgICAgICAgICB0aGlzLm1heENvbm5lY3RUaW1lb3V0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNsZWFyVHJ5UmVjb25uZWN0VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudHJ5UmVjb25uZWN0VGltZW91dElkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50cnlSZWNvbm5lY3RUaW1lb3V0SWQpO1xuICAgICAgICAgICAgdGhpcy50cnlSZWNvbm5lY3RUaW1lb3V0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNsZWFySW5hY3Rpdml0eVRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmluYWN0aXZpdHlUaW1lb3V0SWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmluYWN0aXZpdHlUaW1lb3V0SWQpO1xuICAgICAgICAgICAgdGhpcy5pbmFjdGl2aXR5VGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5zZXRJbmFjdGl2aXR5VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuaW5hY3Rpdml0eVRpbWVvdXQgPiAwICYmIE9iamVjdC5rZXlzKHRoaXMub3BlcmF0aW9ucykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmluYWN0aXZpdHlUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoX3RoaXMub3BlcmF0aW9ucykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcy5pbmFjdGl2aXR5VGltZW91dCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuY2hlY2tPcGVyYXRpb25PcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gb3B0aW9ucy5xdWVyeSwgdmFyaWFibGVzID0gb3B0aW9ucy52YXJpYWJsZXMsIG9wZXJhdGlvbk5hbWUgPSBvcHRpb25zLm9wZXJhdGlvbk5hbWU7XG4gICAgICAgIGlmICghcXVlcnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBwcm92aWRlIGEgcXVlcnkuJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3QgcHJvdmlkZSBhbiBoYW5kbGVyLicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoIWlzX3N0cmluZ18xLmRlZmF1bHQocXVlcnkpICYmICFnZXRPcGVyYXRpb25BU1RfMS5nZXRPcGVyYXRpb25BU1QocXVlcnksIG9wZXJhdGlvbk5hbWUpKSB8fFxuICAgICAgICAgICAgKG9wZXJhdGlvbk5hbWUgJiYgIWlzX3N0cmluZ18xLmRlZmF1bHQob3BlcmF0aW9uTmFtZSkpIHx8XG4gICAgICAgICAgICAodmFyaWFibGVzICYmICFpc19vYmplY3RfMS5kZWZhdWx0KHZhcmlhYmxlcykpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBvcHRpb24gdHlwZXMuIHF1ZXJ5IG11c3QgYmUgYSBzdHJpbmcgb3IgYSBkb2N1bWVudCwnICtcbiAgICAgICAgICAgICAgICAnYG9wZXJhdGlvbk5hbWVgIG11c3QgYmUgYSBzdHJpbmcsIGFuZCBgdmFyaWFibGVzYCBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5idWlsZE1lc3NhZ2UgPSBmdW5jdGlvbiAoaWQsIHR5cGUsIHBheWxvYWQpIHtcbiAgICAgICAgdmFyIHBheWxvYWRUb1JldHVybiA9IHBheWxvYWQgJiYgcGF5bG9hZC5xdWVyeSA/IF9fYXNzaWduKHt9LCBwYXlsb2FkLCB7IHF1ZXJ5OiB0eXBlb2YgcGF5bG9hZC5xdWVyeSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLnF1ZXJ5IDogcHJpbnRlcl8xLnByaW50KHBheWxvYWQucXVlcnkpIH0pIDpcbiAgICAgICAgICAgIHBheWxvYWQ7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZFRvUmV0dXJuLFxuICAgICAgICB9O1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5mb3JtYXRFcnJvcnMgPSBmdW5jdGlvbiAoZXJyb3JzKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVycm9ycykpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVycm9ycyAmJiBlcnJvcnMuZXJyb3JzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXRFcnJvcnMoZXJyb3JzLmVycm9ycyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVycm9ycyAmJiBlcnJvcnMubWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIFtlcnJvcnNdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdGb3JtYXRlZEVycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxFcnJvcjogZXJyb3JzLFxuICAgICAgICAgICAgfV07XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGlkLCB0eXBlLCBwYXlsb2FkKSB7XG4gICAgICAgIHRoaXMuc2VuZE1lc3NhZ2VSYXcodGhpcy5idWlsZE1lc3NhZ2UoaWQsIHR5cGUsIHBheWxvYWQpKTtcbiAgICB9O1xuICAgIFN1YnNjcmlwdGlvbkNsaWVudC5wcm90b3R5cGUuc2VuZE1lc3NhZ2VSYXcgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBzd2l0Y2ggKHRoaXMuc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMud3NJbXBsLk9QRU46XG4gICAgICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWRNZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5wYXJzZShzZXJpYWxpemVkTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQoJ2Vycm9yJywgbmV3IEVycm9yKFwiTWVzc2FnZSBtdXN0IGJlIEpTT04tc2VyaWFsaXphYmxlLiBHb3Q6IFwiICsgbWVzc2FnZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsaWVudC5zZW5kKHNlcmlhbGl6ZWRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy53c0ltcGwuQ09OTkVDVElORzpcbiAgICAgICAgICAgICAgICB0aGlzLnVuc2VudE1lc3NhZ2VzUXVldWUucHVzaChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlY29ubmVjdGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcignQSBtZXNzYWdlIHdhcyBub3Qgc2VudCBiZWNhdXNlIHNvY2tldCBpcyBub3QgY29ubmVjdGVkLCBpcyBjbG9zaW5nIG9yICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2lzIGFscmVhZHkgY2xvc2VkLiBNZXNzYWdlIHdhczogJyArIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmdlbmVyYXRlT3BlcmF0aW9uSWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBTdHJpbmcoKyt0aGlzLm5leHRPcGVyYXRpb25JZCk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLnRyeVJlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF0aGlzLnJlY29ubmVjdCB8fCB0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPj0gdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5yZWNvbm5lY3RpbmcpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMub3BlcmF0aW9ucykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgX3RoaXMudW5zZW50TWVzc2FnZXNRdWV1ZS5wdXNoKF90aGlzLmJ1aWxkTWVzc2FnZShrZXksIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9TVEFSVCwgX3RoaXMub3BlcmF0aW9uc1trZXldLm9wdGlvbnMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3RpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJUcnlSZWNvbm5lY3RUaW1lb3V0KCk7XG4gICAgICAgIHZhciBkZWxheSA9IHRoaXMuYmFja29mZi5kdXJhdGlvbigpO1xuICAgICAgICB0aGlzLnRyeVJlY29ubmVjdFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuY29ubmVjdCgpO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmZsdXNoVW5zZW50TWVzc2FnZXNRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy51bnNlbnRNZXNzYWdlc1F1ZXVlLmZvckVhY2goZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIF90aGlzLnNlbmRNZXNzYWdlUmF3KG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51bnNlbnRNZXNzYWdlc1F1ZXVlID0gW107XG4gICAgfTtcbiAgICBTdWJzY3JpcHRpb25DbGllbnQucHJvdG90eXBlLmNoZWNrQ29ubmVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMud2FzS2VlcEFsaXZlUmVjZWl2ZWQpIHtcbiAgICAgICAgICAgIHRoaXMud2FzS2VlcEFsaXZlUmVjZWl2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMucmVjb25uZWN0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jaGVja01heENvbm5lY3RUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmNsZWFyTWF4Q29ubmVjdFRpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5tYXhDb25uZWN0VGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuc3RhdHVzICE9PSBfdGhpcy53c0ltcGwuT1BFTikge1xuICAgICAgICAgICAgICAgIF90aGlzLnJlY29ubmVjdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzLm1heENvbm5lY3RUaW1lR2VuZXJhdG9yLmR1cmF0aW9uKCkpO1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmNsaWVudCA9IG5ldyB0aGlzLndzSW1wbCh0aGlzLnVybCwgdGhpcy53c1Byb3RvY29scyk7XG4gICAgICAgIHRoaXMuY2hlY2tNYXhDb25uZWN0VGltZW91dCgpO1xuICAgICAgICB0aGlzLmNsaWVudC5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfX2F3YWl0ZXIoX3RoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29ubmVjdGlvblBhcmFtcywgZXJyb3JfMTtcbiAgICAgICAgICAgIHJldHVybiBfX2dlbmVyYXRvcih0aGlzLCBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKF9hLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHRoaXMuc3RhdHVzID09PSB0aGlzLndzSW1wbC5PUEVOKSkgcmV0dXJuIFszLCA0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJNYXhDb25uZWN0VGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbG9zZWRCeVVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQodGhpcy5yZWNvbm5lY3RpbmcgPyAncmVjb25uZWN0aW5nJyA6ICdjb25uZWN0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS5sYWJlbCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hLnRyeXMucHVzaChbMSwgMywgLCA0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQsIHRoaXMuY29ubmVjdGlvblBhcmFtcygpXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvblBhcmFtcyA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UodW5kZWZpbmVkLCBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09OTkVDVElPTl9JTklULCBjb25uZWN0aW9uUGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmx1c2hVbnNlbnRNZXNzYWdlc1F1ZXVlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMsIDRdO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcl8xID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kTWVzc2FnZSh1bmRlZmluZWQsIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9DT05ORUNUSU9OX0VSUk9SLCBlcnJvcl8xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmx1c2hVbnNlbnRNZXNzYWdlc1F1ZXVlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMsIDRdO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6IHJldHVybiBbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pOyB9O1xuICAgICAgICB0aGlzLmNsaWVudC5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFfdGhpcy5jbG9zZWRCeVVzZXIpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZShmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsaWVudC5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgX3RoaXMuZXZlbnRFbWl0dGVyLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGllbnQub25tZXNzYWdlID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IF9hLmRhdGE7XG4gICAgICAgICAgICBfdGhpcy5wcm9jZXNzUmVjZWl2ZWREYXRhKGRhdGEpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS5wcm9jZXNzUmVjZWl2ZWREYXRhID0gZnVuY3Rpb24gKHJlY2VpdmVkRGF0YSkge1xuICAgICAgICB2YXIgcGFyc2VkTWVzc2FnZTtcbiAgICAgICAgdmFyIG9wSWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYXJzZWRNZXNzYWdlID0gSlNPTi5wYXJzZShyZWNlaXZlZERhdGEpO1xuICAgICAgICAgICAgb3BJZCA9IHBhcnNlZE1lc3NhZ2UuaWQ7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1lc3NhZ2UgbXVzdCBiZSBKU09OLXBhcnNlYWJsZS4gR290OiBcIiArIHJlY2VpdmVkRGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFttZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfREFUQSxcbiAgICAgICAgICAgIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9DT01QTEVURSxcbiAgICAgICAgICAgIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9FUlJPUixcbiAgICAgICAgXS5pbmRleE9mKHBhcnNlZE1lc3NhZ2UudHlwZSkgIT09IC0xICYmICF0aGlzLm9wZXJhdGlvbnNbb3BJZF0pIHtcbiAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmUob3BJZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChwYXJzZWRNZXNzYWdlLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0NPTk5FQ1RJT05fRVJST1I6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29ubmVjdGlvbkNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbkNhbGxiYWNrKHBhcnNlZE1lc3NhZ2UucGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09OTkVDVElPTl9BQ0s6XG4gICAgICAgICAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIuZW1pdCh0aGlzLnJlY29ubmVjdGluZyA/ICdyZWNvbm5lY3RlZCcgOiAnY29ubmVjdGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1heENvbm5lY3RUaW1lR2VuZXJhdG9yLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29ubmVjdGlvbkNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbkNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBtZXNzYWdlX3R5cGVzXzEuZGVmYXVsdC5HUUxfQ09NUExFVEU6XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVyYXRpb25zW29wSWRdLmhhbmRsZXIobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMub3BlcmF0aW9uc1tvcElkXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgbWVzc2FnZV90eXBlc18xLmRlZmF1bHQuR1FMX0VSUk9SOlxuICAgICAgICAgICAgICAgIHRoaXMub3BlcmF0aW9uc1tvcElkXS5oYW5kbGVyKHRoaXMuZm9ybWF0RXJyb3JzKHBhcnNlZE1lc3NhZ2UucGF5bG9hZCksIG51bGwpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wZXJhdGlvbnNbb3BJZF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9EQVRBOlxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWRQYXlsb2FkID0gIXBhcnNlZE1lc3NhZ2UucGF5bG9hZC5lcnJvcnMgP1xuICAgICAgICAgICAgICAgICAgICBwYXJzZWRNZXNzYWdlLnBheWxvYWQgOiBfX2Fzc2lnbih7fSwgcGFyc2VkTWVzc2FnZS5wYXlsb2FkLCB7IGVycm9yczogdGhpcy5mb3JtYXRFcnJvcnMocGFyc2VkTWVzc2FnZS5wYXlsb2FkLmVycm9ycykgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVyYXRpb25zW29wSWRdLmhhbmRsZXIobnVsbCwgcGFyc2VkUGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9DT05ORUNUSU9OX0tFRVBfQUxJVkU6XG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0S0EgPSB0eXBlb2YgdGhpcy53YXNLZWVwQWxpdmVSZWNlaXZlZCA9PT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNLZWVwQWxpdmVSZWNlaXZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0S0EpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWxJZCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWxJZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKHRoaXMuY2hlY2tDb25uZWN0aW9uLmJpbmQodGhpcyksIHRoaXMud3NUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG1lc3NhZ2UgdHlwZSEnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU3Vic2NyaXB0aW9uQ2xpZW50LnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIChvcElkKSB7XG4gICAgICAgIGlmICh0aGlzLm9wZXJhdGlvbnNbb3BJZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9wZXJhdGlvbnNbb3BJZF07XG4gICAgICAgICAgICB0aGlzLnNldEluYWN0aXZpdHlUaW1lb3V0KCk7XG4gICAgICAgICAgICB0aGlzLnNlbmRNZXNzYWdlKG9wSWQsIG1lc3NhZ2VfdHlwZXNfMS5kZWZhdWx0LkdRTF9TVE9QLCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gU3Vic2NyaXB0aW9uQ2xpZW50O1xufSgpKTtcbmV4cG9ydHMuU3Vic2NyaXB0aW9uQ2xpZW50ID0gU3Vic2NyaXB0aW9uQ2xpZW50O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xpZW50LmpzLm1hcCIsImltcG9ydCB7IF9fZXh0ZW5kcyB9IGZyb20gJ3RzbGliJztcbmltcG9ydCB7IEFwb2xsb0xpbmsgfSBmcm9tICdhcG9sbG8tbGluayc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb25DbGllbnQgfSBmcm9tICdzdWJzY3JpcHRpb25zLXRyYW5zcG9ydC13cyc7XG5cbnZhciBXZWJTb2NrZXRMaW5rID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoV2ViU29ja2V0TGluaywgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBXZWJTb2NrZXRMaW5rKHBhcmFtc09yQ2xpZW50KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIGlmIChwYXJhbXNPckNsaWVudCBpbnN0YW5jZW9mIFN1YnNjcmlwdGlvbkNsaWVudCkge1xuICAgICAgICAgICAgX3RoaXMuc3Vic2NyaXB0aW9uQ2xpZW50ID0gcGFyYW1zT3JDbGllbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5zdWJzY3JpcHRpb25DbGllbnQgPSBuZXcgU3Vic2NyaXB0aW9uQ2xpZW50KHBhcmFtc09yQ2xpZW50LnVyaSwgcGFyYW1zT3JDbGllbnQub3B0aW9ucywgcGFyYW1zT3JDbGllbnQud2ViU29ja2V0SW1wbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBXZWJTb2NrZXRMaW5rLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gKG9wZXJhdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpcHRpb25DbGllbnQucmVxdWVzdChvcGVyYXRpb24pO1xuICAgIH07XG4gICAgcmV0dXJuIFdlYlNvY2tldExpbms7XG59KEFwb2xsb0xpbmspKTtcblxuZXhwb3J0IHsgV2ViU29ja2V0TGluayB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YnVuZGxlLmVzbS5qcy5tYXBcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd3cyBkb2VzIG5vdCB3b3JrIGluIHRoZSBicm93c2VyLiBCcm93c2VyIGNsaWVudHMgbXVzdCB1c2UgdGhlIG5hdGl2ZSAnICtcbiAgICAgICdXZWJTb2NrZXQgb2JqZWN0J1xuICApO1xufTtcbiIsInZhciBzdXBwb3J0ID0ge1xuICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gIGl0ZXJhYmxlOiAnU3ltYm9sJyBpbiBzZWxmICYmICdpdGVyYXRvcicgaW4gU3ltYm9sLFxuICBibG9iOlxuICAgICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmXG4gICAgJ0Jsb2InIGluIHNlbGYgJiZcbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICBuZXcgQmxvYigpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKCksXG4gIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIHNlbGYsXG4gIGFycmF5QnVmZmVyOiAnQXJyYXlCdWZmZXInIGluIHNlbGZcbn1cblxuZnVuY3Rpb24gaXNEYXRhVmlldyhvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopXG59XG5cbmlmIChzdXBwb3J0LmFycmF5QnVmZmVyKSB7XG4gIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgJ1tvYmplY3QgVWludDE2QXJyYXldJyxcbiAgICAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgJ1tvYmplY3QgVWludDMyQXJyYXldJyxcbiAgICAnW29iamVjdCBGbG9hdDMyQXJyYXldJyxcbiAgICAnW29iamVjdCBGbG9hdDY0QXJyYXldJ1xuICBdXG5cbiAgdmFyIGlzQXJyYXlCdWZmZXJWaWV3ID1cbiAgICBBcnJheUJ1ZmZlci5pc1ZpZXcgfHxcbiAgICBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogJiYgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICBuYW1lID0gU3RyaW5nKG5hbWUpXG4gIH1cbiAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lJylcbiAgfVxuICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG5mdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpXG4gICAgICByZXR1cm4ge2RvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZX1cbiAgICB9XG4gIH1cblxuICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBpdGVyYXRvclxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpdGVyYXRvclxufVxuXG5leHBvcnQgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gIHRoaXMubWFwID0ge31cblxuICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKVxuICAgIH0sIHRoaXMpXG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShoZWFkZXJzKSkge1xuICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHRoaXMuYXBwZW5kKGhlYWRlclswXSwgaGVhZGVyWzFdKVxuICAgIH0sIHRoaXMpXG4gIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICB9LCB0aGlzKVxuICB9XG59XG5cbkhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpXG4gIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gIHZhciBvbGRWYWx1ZSA9IHRoaXMubWFwW25hbWVdXG4gIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArICcsICcgKyB2YWx1ZSA6IHZhbHVlXG59XG5cbkhlYWRlcnMucHJvdG90eXBlWydkZWxldGUnXSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgZGVsZXRlIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldXG59XG5cbkhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSlcbiAgcmV0dXJuIHRoaXMuaGFzKG5hbWUpID8gdGhpcy5tYXBbbmFtZV0gOiBudWxsXG59XG5cbkhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG59XG5cbkhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG59XG5cbkhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICBmb3IgKHZhciBuYW1lIGluIHRoaXMubWFwKSB7XG4gICAgaWYgKHRoaXMubWFwLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHRoaXMubWFwW25hbWVdLCBuYW1lLCB0aGlzKVxuICAgIH1cbiAgfVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtcyA9IFtdXG4gIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgIGl0ZW1zLnB1c2gobmFtZSlcbiAgfSlcbiAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGl0ZW1zID0gW11cbiAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaXRlbXMucHVzaCh2YWx1ZSlcbiAgfSlcbiAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxufVxuXG5IZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtcyA9IFtdXG4gIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgIGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSlcbiAgfSlcbiAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxufVxuXG5pZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllc1xufVxuXG5mdW5jdGlvbiBjb25zdW1lZChib2R5KSB7XG4gIGlmIChib2R5LmJvZHlVc2VkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICB9XG4gIGJvZHkuYm9keVVzZWQgPSB0cnVlXG59XG5cbmZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcbiAgICB9XG4gICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChyZWFkZXIuZXJyb3IpXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiByZWFkQmxvYkFzQXJyYXlCdWZmZXIoYmxvYikge1xuICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5mdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgcmV0dXJuIHByb21pc2Vcbn1cblxuZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgdmFyIGNoYXJzID0gbmV3IEFycmF5KHZpZXcubGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKVxuICB9XG4gIHJldHVybiBjaGFycy5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBidWZmZXJDbG9uZShidWYpIHtcbiAgaWYgKGJ1Zi5zbGljZSkge1xuICAgIHJldHVybiBidWYuc2xpY2UoMClcbiAgfSBlbHNlIHtcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zi5ieXRlTGVuZ3RoKVxuICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpXG4gICAgcmV0dXJuIHZpZXcuYnVmZmVyXG4gIH1cbn1cblxuZnVuY3Rpb24gQm9keSgpIHtcbiAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlXG5cbiAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgdGhpcy5fYm9keUluaXQgPSBib2R5XG4gICAgaWYgKCFib2R5KSB7XG4gICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5mb3JtRGF0YSAmJiBGb3JtRGF0YS5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keS5idWZmZXIpXG4gICAgICAvLyBJRSAxMC0xMSBjYW4ndCBoYW5kbGUgYSBEYXRhVmlldyBib2R5LlxuICAgICAgdGhpcy5fYm9keUluaXQgPSBuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSlcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8IGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKSkge1xuICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5ID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGJvZHkpXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04JylcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCB0aGlzLl9ib2R5QmxvYi50eXBlKVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04JylcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QmxvYilcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKSlcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIHRleHQnKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgIH1cbiAgfVxuXG4gIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKEpTT04ucGFyc2UpXG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIVFRQIG1ldGhvZHMgd2hvc2UgY2FwaXRhbGl6YXRpb24gc2hvdWxkIGJlIG5vcm1hbGl6ZWRcbnZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKVxuICByZXR1cm4gbWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEgPyB1cGNhc2VkIDogbWV0aG9kXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5XG5cbiAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJylcbiAgICB9XG4gICAgdGhpcy51cmwgPSBpbnB1dC51cmxcbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHNcbiAgICBpZiAoIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5wdXQuaGVhZGVycylcbiAgICB9XG4gICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2RcbiAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlXG4gICAgdGhpcy5zaWduYWwgPSBpbnB1dC5zaWduYWxcbiAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXRcbiAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLnVybCA9IFN0cmluZyhpbnB1dClcbiAgfVxuXG4gIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgJ3NhbWUtb3JpZ2luJ1xuICBpZiAob3B0aW9ucy5oZWFkZXJzIHx8ICF0aGlzLmhlYWRlcnMpIHtcbiAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gIH1cbiAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgJ0dFVCcpXG4gIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbFxuICB0aGlzLnNpZ25hbCA9IG9wdGlvbnMuc2lnbmFsIHx8IHRoaXMuc2lnbmFsXG4gIHRoaXMucmVmZXJyZXIgPSBudWxsXG5cbiAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JvZHkgbm90IGFsbG93ZWQgZm9yIEdFVCBvciBIRUFEIHJlcXVlc3RzJylcbiAgfVxuICB0aGlzLl9pbml0Qm9keShib2R5KVxufVxuXG5SZXF1ZXN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcywge2JvZHk6IHRoaXMuX2JvZHlJbml0fSlcbn1cblxuZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICBib2R5XG4gICAgLnRyaW0oKVxuICAgIC5zcGxpdCgnJicpXG4gICAgLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgIGlmIChieXRlcykge1xuICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpXG4gICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKVxuICAgICAgfVxuICAgIH0pXG4gIHJldHVybiBmb3JtXG59XG5cbmZ1bmN0aW9uIHBhcnNlSGVhZGVycyhyYXdIZWFkZXJzKSB7XG4gIHZhciBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKVxuICAvLyBSZXBsYWNlIGluc3RhbmNlcyBvZiBcXHJcXG4gYW5kIFxcbiBmb2xsb3dlZCBieSBhdCBsZWFzdCBvbmUgc3BhY2Ugb3IgaG9yaXpvbnRhbCB0YWIgd2l0aCBhIHNwYWNlXG4gIC8vIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM3MjMwI3NlY3Rpb24tMy4yXG4gIHZhciBwcmVQcm9jZXNzZWRIZWFkZXJzID0gcmF3SGVhZGVycy5yZXBsYWNlKC9cXHI/XFxuW1xcdCBdKy9nLCAnICcpXG4gIHByZVByb2Nlc3NlZEhlYWRlcnMuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICB2YXIgcGFydHMgPSBsaW5lLnNwbGl0KCc6JylcbiAgICB2YXIga2V5ID0gcGFydHMuc2hpZnQoKS50cmltKClcbiAgICBpZiAoa2V5KSB7XG4gICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5qb2luKCc6JykudHJpbSgpXG4gICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIGhlYWRlcnNcbn1cblxuQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKVxuXG5leHBvcnQgZnVuY3Rpb24gUmVzcG9uc2UoYm9keUluaXQsIG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9XG4gIH1cblxuICB0aGlzLnR5cGUgPSAnZGVmYXVsdCdcbiAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1cyA9PT0gdW5kZWZpbmVkID8gMjAwIDogb3B0aW9ucy5zdGF0dXNcbiAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMFxuICB0aGlzLnN0YXR1c1RleHQgPSAnc3RhdHVzVGV4dCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6ICdPSydcbiAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8ICcnXG4gIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KVxufVxuXG5Cb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKVxuXG5SZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgdXJsOiB0aGlzLnVybFxuICB9KVxufVxuXG5SZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogMCwgc3RhdHVzVGV4dDogJyd9KVxuICByZXNwb25zZS50eXBlID0gJ2Vycm9yJ1xuICByZXR1cm4gcmVzcG9uc2Vcbn1cblxudmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdXG5cblJlc3BvbnNlLnJlZGlyZWN0ID0gZnVuY3Rpb24odXJsLCBzdGF0dXMpIHtcbiAgaWYgKHJlZGlyZWN0U3RhdHVzZXMuaW5kZXhPZihzdGF0dXMpID09PSAtMSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgfVxuXG4gIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogc3RhdHVzLCBoZWFkZXJzOiB7bG9jYXRpb246IHVybH19KVxufVxuXG5leHBvcnQgdmFyIERPTUV4Y2VwdGlvbiA9IHNlbGYuRE9NRXhjZXB0aW9uXG50cnkge1xuICBuZXcgRE9NRXhjZXB0aW9uKClcbn0gY2F0Y2ggKGVycikge1xuICBET01FeGNlcHRpb24gPSBmdW5jdGlvbihtZXNzYWdlLCBuYW1lKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZVxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB2YXIgZXJyb3IgPSBFcnJvcihtZXNzYWdlKVxuICAgIHRoaXMuc3RhY2sgPSBlcnJvci5zdGFja1xuICB9XG4gIERPTUV4Y2VwdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSlcbiAgRE9NRXhjZXB0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERPTUV4Y2VwdGlvblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2goaW5wdXQsIGluaXQpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpXG5cbiAgICBpZiAocmVxdWVzdC5zaWduYWwgJiYgcmVxdWVzdC5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgcmV0dXJuIHJlamVjdChuZXcgRE9NRXhjZXB0aW9uKCdBYm9ydGVkJywgJ0Fib3J0RXJyb3InKSlcbiAgICB9XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblxuICAgIGZ1bmN0aW9uIGFib3J0WGhyKCkge1xuICAgICAgeGhyLmFib3J0KClcbiAgICB9XG5cbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgaGVhZGVyczogcGFyc2VIZWFkZXJzKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCAnJylcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMudXJsID0gJ3Jlc3BvbnNlVVJMJyBpbiB4aHIgPyB4aHIucmVzcG9uc2VVUkwgOiBvcHRpb25zLmhlYWRlcnMuZ2V0KCdYLVJlcXVlc3QtVVJMJylcbiAgICAgIHZhciBib2R5ID0gJ3Jlc3BvbnNlJyBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0XG4gICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICB9XG5cbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICB9XG5cbiAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgIH1cblxuICAgIHhoci5vbmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QobmV3IERPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpXG4gICAgfVxuXG4gICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKVxuXG4gICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdpbmNsdWRlJykge1xuICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICB9IGVsc2UgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdvbWl0Jykge1xuICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYidcbiAgICB9XG5cbiAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpXG4gICAgfSlcblxuICAgIGlmIChyZXF1ZXN0LnNpZ25hbCkge1xuICAgICAgcmVxdWVzdC5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydFhocilcblxuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBET05FIChzdWNjZXNzIG9yIGZhaWx1cmUpXG4gICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgIHJlcXVlc3Quc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgYWJvcnRYaHIpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KVxuICB9KVxufVxuXG5mZXRjaC5wb2x5ZmlsbCA9IHRydWVcblxuaWYgKCFzZWxmLmZldGNoKSB7XG4gIHNlbGYuZmV0Y2ggPSBmZXRjaFxuICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzXG4gIHNlbGYuUmVxdWVzdCA9IFJlcXVlc3RcbiAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlXG59XG4iLCIvLyB0aGUgd2hhdHdnLWZldGNoIHBvbHlmaWxsIGluc3RhbGxzIHRoZSBmZXRjaCgpIGZ1bmN0aW9uXG4vLyBvbiB0aGUgZ2xvYmFsIG9iamVjdCAod2luZG93IG9yIHNlbGYpXG4vL1xuLy8gUmV0dXJuIHRoYXQgYXMgdGhlIGV4cG9ydCBmb3IgdXNlIGluIFdlYnBhY2ssIEJyb3dzZXJpZnkgZXRjLlxucmVxdWlyZSgnd2hhdHdnLWZldGNoJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHNlbGYuZmV0Y2guYmluZChzZWxmKTtcbiIsIlxuaW1wb3J0IEFwb2xsb0NsaWVudCBmcm9tIFwiYXBvbGxvLWNsaWVudFwiO1xuaW1wb3J0IHsgSW5NZW1vcnlDYWNoZSB9IGZyb20gXCJhcG9sbG8tY2FjaGUtaW5tZW1vcnlcIjtcbmltcG9ydCB7IFdlYlNvY2tldExpbmsgfSBmcm9tIFwiYXBvbGxvLWxpbmstd3NcIjtcbmltcG9ydCB7IHNwbGl0IH0gZnJvbSBcImFwb2xsby1saW5rXCI7XG5pbXBvcnQgeyBIdHRwTGluayB9IGZyb20gXCJhcG9sbG8tbGluay1odHRwXCI7XG5pbXBvcnQgeyBnZXRNYWluRGVmaW5pdGlvbiB9IGZyb20gXCJhcG9sbG8tdXRpbGl0aWVzXCI7XG5pbXBvcnQgV2ViU29ja2V0IGZyb20gJ3dzJztcbmltcG9ydCBmZXRjaCBmcm9tIFwiaXNvbW9ycGhpYy1mZXRjaFwiXG5cblxuXG5jb25zdCBoZWFkZXJzID0geydjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9O1xuY29uc3QgZ2V0SGVhZGVycyA9ICgpID0+IHtcbiAgcmV0dXJuIGhlYWRlcnM7XG59O1xuXG5jb25zdCBjYWNoZSA9IG5ldyBJbk1lbW9yeUNhY2hlKCk7XG5cbmNvbnN0IHdzTGluayA9IG5ldyBXZWJTb2NrZXRMaW5rKHtcbiAgdXJpOiBcIndzOi8vaGFzdXJhLW1pZGNvZGVzMS5oZXJva3VhcHAuY29tL3YxL2dyYXBocWxcIixcbiAgb3B0aW9uczoge1xuICAgIHJlY29ubmVjdDogdHJ1ZSxcbiAgICBsYXp5OiB0cnVlLFxuICAgIGNvbm5lY3Rpb25QYXJhbXM6ICgpID0+IHtcbiAgICAgIHJldHVybiB7IGhlYWRlcnM6IGdldEhlYWRlcnMoKSB9O1xuICAgIH0sXG4gIH0sXG4gIHdlYlNvY2tldEltcGw6IFdlYlNvY2tldFxufSk7XG5cbmNvbnN0IGh0dHBMaW5rID0gbmV3IEh0dHBMaW5rKHtcbiAgdXJpOiBcImh0dHBzOi8vaGFzdXJhLW1pZGNvZGVzMS5oZXJva3VhcHAuY29tL3YxL2dyYXBocWxcIixcbiAgIGZldGNoICxcbiAgaGVhZGVyczogZ2V0SGVhZGVycygpXG59KTtcblxuXG5cbmNvbnN0IGxpbmsgPSBwcm9jZXNzLmJyb3dzZXIgPyBzcGxpdCggLy9vbmx5IGNyZWF0ZSB0aGUgc3BsaXQgaW4gdGhlIGJyb3dzZXJcbiAgICAvLyBzcGxpdCBiYXNlZCBvbiBvcGVyYXRpb24gdHlwZVxuICAgICh7IHF1ZXJ5IH0pID0+IHtcbiAgICAgIGNvbnN0IGRlZmluaXRpb24gPSBnZXRNYWluRGVmaW5pdGlvbihxdWVyeSk7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBkZWZpbml0aW9uLmtpbmQgPT09ICdPcGVyYXRpb25EZWZpbml0aW9uJyAmJlxuICAgICAgICBkZWZpbml0aW9uLm9wZXJhdGlvbiA9PT0gJ3N1YnNjcmlwdGlvbidcbiAgICAgICk7XG4gICAgfSxcbiAgICB3c0xpbmssXG4gICAgaHR0cExpbmssXG4gICkgOiBodHRwTGluaztcblxuXG4gIGV4cG9ydCBjb25zdCBjbGllbnQgPSBuZXcgQXBvbGxvQ2xpZW50KHtcbiAgICBsaW5rLFxuICAgIGNhY2hlXG4gIH0pO1xuXG4gIl0sIm5hbWVzIjpbImlzRXF1YWwiLCJ0aGlzIiwiZ2xvYmFsIiwiZGVmYXVsdHNfMSIsInByb3RvY29sXzEiLCJCYWNrb2ZmIiwiZXZlbnRlbWl0dGVyM18xIiwibWVzc2FnZV90eXBlc18xIiwiaXNfc3RyaW5nXzEiLCJpc19vYmplY3RfMSIsIlN1YnNjcmlwdGlvbkNsaWVudCIsIldlYlNvY2tldCIsImZldGNoIiwiY2xpZW50IiwiQXBvbGxvQ2xpZW50Il0sIm1hcHBpbmdzIjoiOzs7OztBQUVBLElBQUksVUFBVSxDQUFDO0FBQ2YsU0FBUyxZQUFZLENBQUMsS0FBSyxFQUFFOztJQUV6QixJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2IsVUFBVTtZQUNOLENBQUMsT0FBTyxNQUFNLEtBQUssVUFBVSxJQUFJLE1BQU0s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QUksRUFBRSxDQUFDO0VBQ2xCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUM7RUFDMUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQztFQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO0VBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDcEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7Q0FDbkI7Ozs7Ozs7OztBQVNELE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFVBQVU7RUFDckMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7RUFDMUQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ2YsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDcEQsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsU0FBUyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7R0FDMUU7RUFDRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDbkMsQ0FBQzs7Ozs7Ozs7QUFRRixPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxVQUFVO0VBQ2xDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0NBQ25CLENBQUM7Ozs7Ozs7O0FBUUYsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxHQUFHLENBQUM7RUFDdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7Q0FDZixDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsR0FBRyxDQUFDO0VBQ3RDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0NBQ2hCLENBQUM7Ozs7Ozs7O0FBUUYsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxNQUFNLENBQUM7RUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Q0FDdEIsQ0FBQzs7O0FDbkZGO0FBRUEsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjO0lBQ3JDLE1BQU0sR0FBRyxHQUFHLENBQUM7Ozs7Ozs7OztBQVNqQixTQUFTLE1BQU0sR0FBRyxFQUFFOzs7Ozs7Ozs7QUFTcEIsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO0VBQ2pCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Ozs7O0VBTXZDLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDLFNBQVMsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDO0NBQzdDOzs7Ozs7Ozs7OztBQVdELFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0VBQzdCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7RUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxDQUFDO0NBQzNCOzs7Ozs7Ozs7Ozs7O0FBYUQsU0FBUyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtFQUN0RCxJQUFJLE9BQU8sRUFBRSxLQUFLLFVBQVUsRUFBRTtJQUM1QixNQUFNLElBQUksU0FBUyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7R0FDeEQ7O0VBRUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxPQUFPLEVBQUUsSUFBSSxDQUFDO01BQy9DLEdBQUcsR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7O0VBRTFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztPQUM5RSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7T0FDbEUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7O0VBRTdELE9BQU8sT0FBTyxDQUFDO0NBQ2hCOzs7Ozs7Ozs7QUFTRCxTQUFTLFVBQVUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO0VBQ2hDLElBQUksRUFBRSxPQUFPLENBQUMsWUFBWSxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7T0FDNUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2xDOzs7Ozs7Ozs7QUFTRCxTQUFTLFlBQVksR0FBRztFQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7RUFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7Q0FDdkI7Ozs7Ozs7OztBQVNELFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFNBQVMsVUFBVSxHQUFHO0VBQ3hELElBQUksS0FBSyxHQUFHLEVBQUU7TUFDVixNQUFNO01BQ04sSUFBSSxDQUFDOztFQUVULElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxDQUFDLEVBQUUsT0FBTyxLQUFLLENBQUM7O0VBRTFDLEtBQUssSUFBSSxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHO0lBQ3BDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztHQUN2RTs7RUFFRCxJQUFJLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRTtJQUNoQyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7R0FDM0Q7O0VBRUQsT0FBTyxLQUFLLENBQUM7Q0FDZCxDQUFDOzs7Ozs7Ozs7QUFTRixZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUU7RUFDM0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSztNQUNyQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7RUFFakMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQztFQUN6QixJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7RUFFdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDbEUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7R0FDeEI7O0VBRUQsT0FBTyxFQUFFLENBQUM7Q0FDWCxDQUFDOzs7Ozs7Ozs7QUFTRixZQUFZLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxTQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7RUFDbkUsSUFBSSxHQUFHLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSztNQUNyQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7RUFFbEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztFQUN6QixJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7RUFDM0IsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDO0NBQ3pCLENBQUM7Ozs7Ozs7OztBQVNGLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0VBQ3JFLElBQUksR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7RUFFMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxLQUFLLENBQUM7O0VBRXJDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO01BQzdCLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTTtNQUN0QixJQUFJO01BQ0osQ0FBQyxDQUFDOztFQUVOLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRTtJQUNoQixJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7O0lBRTlFLFFBQVEsR0FBRztNQUNULEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQztNQUMxRCxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzlELEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQ2xFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUN0RSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO0tBQy9FOztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDbEQsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUI7O0lBRUQsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztHQUM3QyxNQUFNO0lBQ0wsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU07UUFDekIsQ0FBQyxDQUFDOztJQUVOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO01BQzNCLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7TUFFcEYsUUFBUSxHQUFHO1FBQ1QsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUMxRCxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUM5RCxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDbEUsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFB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QUMsRUFBRSxTQUFTLEVBQUU7SUFDckYsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO1FBQ3ZELFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDM0YsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzlGLFNBQVMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQy9JLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxVQUFVLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUN6RSxDQUFDLENBQUM7Q0FDTixDQUFDO0FBQ0YsSUFBSSxXQUFXLEdBQUcsQ0FBQ0EsY0FBSSxJQUFJQSxjQUFJLENBQUMsV0FBVyxLQUFLLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRTtJQUNyRSxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pILE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLE1BQU0sS0FBSyxVQUFVLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxXQUFXLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pKLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQ2xFLFNBQVMsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNkLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxTQUFTLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5RCxPQUFPLENBQUMsRUFBRSxJQUFJO1lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0osSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ1QsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTTtnQkFDOUIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUN4RCxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUNqRCxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxTQUFTO2dCQUNqRDtvQkFDSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFO29CQUM1RyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO29CQUN0RixJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7b0JBQ3JFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDbkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFNBQVM7YUFDOUI7WUFDRCxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFP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
