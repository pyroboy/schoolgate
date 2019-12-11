
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.ctx, $$.dirty);
            $$.dirty = [-1];
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
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
    }

    var nodejsCustomInspectSymbol = typeof Symbol === 'function' && typeof Symbol.for === 'function' ? Symbol.for('nodejs.util.inspect.custom') : undefined;

    function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    var MAX_ARRAY_LENGTH = 10;
    var MAX_RECURSIVE_DEPTH = 2;
    /**
     * Used to print values in error messages.
     */

    function inspect(value) {
      return formatValue(value, []);
    }

    function formatValue(value, seenValues) {
      switch (_typeof(value)) {
        case 'string':
          return JSON.stringify(value);

        case 'function':
          return value.name ? "[function ".concat(value.name, "]") : '[function]';

        case 'object':
          if (value === null) {
            return 'null';
          }

          return formatObjectValue(value, seenValues);

        default:
          return String(value);
      }
    }

    function formatObjectValue(value, previouslySeenValues) {
      if (previouslySeenValues.indexOf(value) !== -1) {
        return '[Circular]';
      }

      var seenValues = [].concat(previouslySeenValues, [value]);
      var customInspectFn = getCustomFn(value);

      if (customInspectFn !== undefined) {
        // $FlowFixMe(>=0.90.0)
        var customValue = customInspectFn.call(value); // check for infinite recursion

        if (customValue !== value) {
          return typeof customValue === 'string' ? customValue : formatValue(customValue, seenValues);
        }
      } else if (Array.isArray(value)) {
        return formatArray(value, seenValues);
      }

      return formatObject(value, seenValues);
    }

    function formatObject(object, seenValues) {
      var keys = Object.keys(object);

      if (keys.length === 0) {
        return '{}';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[' + getObjectTag(object) + ']';
      }

      var properties = keys.map(function (key) {
        var value = formatValue(object[key], seenValues);
        return key + ': ' + value;
      });
      return '{ ' + properties.join(', ') + ' }';
    }

    function formatArray(array, seenValues) {
      if (array.length === 0) {
        return '[]';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[Array]';
      }

      var len = Math.min(MAX_ARRAY_LENGTH, array.length);
      var remaining = array.length - len;
      var items = [];

      for (var i = 0; i < len; ++i) {
        items.push(formatValue(array[i], seenValues));
      }

      if (remaining === 1) {
        items.push('... 1 more item');
      } else if (remaining > 1) {
        items.push("... ".concat(remaining, " more items"));
      }

      return '[' + items.join(', ') + ']';
    }

    function getCustomFn(object) {
      var customInspectFn = object[String(nodejsCustomInspectSymbol)];

      if (typeof customInspectFn === 'function') {
        return customInspectFn;
      }

      if (typeof object.inspect === 'function') {
        return object.inspect;
      }
    }

    function getObjectTag(object) {
      var tag = Object.prototype.toString.call(object).replace(/^\[object /, '').replace(/]$/, '');

      if (tag === 'Object' && typeof object.constructor === 'function') {
        var name = object.constructor.name;

        if (typeof name === 'string' && name !== '') {
          return name;
        }
      }

      return tag;
    }

    var QueryDocumentKeys = {
      Name: [],
      Document: ['definitions'],
      OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
      VariableDefinition: ['variable', 'type', 'defaultValue', 'directives'],
      Variable: ['name'],
      SelectionSet: ['selections'],
      Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
      Argument: ['name', 'value'],
      FragmentSpread: ['name', 'directives'],
      InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
      FragmentDefinition: ['name', // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],
      IntValue: [],
      FloatValue: [],
      StringValue: [],
      BooleanValue: [],
      NullValue: [],
      EnumValue: [],
      ListValue: ['values'],
      ObjectValue: ['fields'],
      ObjectField: ['name', 'value'],
      Directive: ['name', 'arguments'],
      NamedType: ['name'],
      ListType: ['type'],
      NonNullType: ['type'],
      SchemaDefinition: ['directives', 'operationTypes'],
      OperationTypeDefinition: ['type'],
      ScalarTypeDefinition: ['description', 'name', 'directives'],
      ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
      FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
      InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
      InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
      UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
      EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
      EnumValueDefinition: ['description', 'name', 'directives'],
      InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
      DirectiveDefinition: ['description', 'name', 'arguments', 'locations'],
      SchemaExtension: ['directives', 'operationTypes'],
      ScalarTypeExtension: ['name', 'directives'],
      ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
      InterfaceTypeExtension: ['name', 'directives', 'fields'],
      UnionTypeExtension: ['name', 'directives', 'types'],
      EnumTypeExtension: ['name', 'directives', 'values'],
      InputObjectTypeExtension: ['name', 'directives', 'fields']
    };
    var BREAK = Object.freeze({});
    /**
     * visit() will walk through an AST using a depth first traversal, calling
     * the visitor's enter function at each node in the traversal, and calling the
     * leave function after visiting that node and all of its child nodes.
     *
     * By returning different values from the enter and leave functions, the
     * behavior of the visitor can be altered, including skipping over a sub-tree of
     * the AST (by returning false), editing the AST by returning a value or null
     * to remove the value, or to stop the whole traversal by returning BREAK.
     *
     * When using visit() to edit an AST, the original AST will not be modified, and
     * a new version of the AST with the changes applied will be returned from the
     * visit function.
     *
     *     const editedAST = visit(ast, {
     *       enter(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: skip visiting this node
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       },
     *       leave(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: no action
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       }
     *     });
     *
     * Alternatively to providing enter() and leave() functions, a visitor can
     * instead provide functions named the same as the kinds of AST nodes, or
     * enter/leave visitors at a named key, leading to four permutations of
     * visitor API:
     *
     * 1) Named visitors triggered when entering a node a specific kind.
     *
     *     visit(ast, {
     *       Kind(node) {
     *         // enter the "Kind" node
     *       }
     *     })
     *
     * 2) Named visitors that trigger upon entering and leaving a node of
     *    a specific kind.
     *
     *     visit(ast, {
     *       Kind: {
     *         enter(node) {
     *           // enter the "Kind" node
     *         }
     *         leave(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     *
     * 3) Generic visitors that trigger upon entering and leaving any node.
     *
     *     visit(ast, {
     *       enter(node) {
     *         // enter any node
     *       },
     *       leave(node) {
     *         // leave any node
     *       }
     *     })
     *
     * 4) Parallel visitors for entering and leaving nodes of a specific kind.
     *
     *     visit(ast, {
     *       enter: {
     *         Kind(node) {
     *           // enter the "Kind" node
     *         }
     *       },
     *       leave: {
     *         Kind(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     */

    function visit(root, visitor) {
      var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

      /* eslint-disable no-undef-init */
      var stack = undefined;
      var inArray = Array.isArray(root);
      var keys = [root];
      var index = -1;
      var edits = [];
      var node = undefined;
      var key = undefined;
      var parent = undefined;
      var path = [];
      var ancestors = [];
      var newRoot = root;
      /* eslint-enable no-undef-init */

      do {
        index++;
        var isLeaving = index === keys.length;
        var isEdited = isLeaving && edits.length !== 0;

        if (isLeaving) {
          key = ancestors.length === 0 ? undefined : path[path.length - 1];
          node = parent;
          parent = ancestors.pop();

          if (isEdited) {
            if (inArray) {
              node = node.slice();
            } else {
              var clone = {};

              for (var _i2 = 0, _Object$keys2 = Object.keys(node); _i2 < _Object$keys2.length; _i2++) {
                var k = _Object$keys2[_i2];
                clone[k] = node[k];
              }

              node = clone;
            }

            var editOffset = 0;

            for (var ii = 0; ii < edits.length; ii++) {
              var editKey = edits[ii][0];
              var editValue = edits[ii][1];

              if (inArray) {
                editKey -= editOffset;
              }

              if (inArray && editValue === null) {
                node.splice(editKey, 1);
                editOffset++;
              } else {
                node[editKey] = editValue;
              }
            }
          }

          index = stack.index;
          keys = stack.keys;
          edits = stack.edits;
          inArray = stack.inArray;
          stack = stack.prev;
        } else {
          key = parent ? inArray ? index : keys[index] : undefined;
          node = parent ? parent[key] : newRoot;

          if (node === null || node === undefined) {
            continue;
          }

          if (parent) {
            path.push(key);
          }
        }

        var result = void 0;

        if (!Array.isArray(node)) {
          if (!isNode(node)) {
            throw new Error('Invalid AST Node: ' + inspect(node));
          }

          var visitFn = getVisitFn(visitor, node.kind, isLeaving);

          if (visitFn) {
            result = visitFn.call(visitor, node, key, parent, path, ancestors);

            if (result === BREAK) {
              break;
            }

            if (result === false) {
              if (!isLeaving) {
                path.pop();
                continue;
              }
            } else if (result !== undefined) {
              edits.push([key, result]);

              if (!isLeaving) {
                if (isNode(result)) {
                  node = result;
                } else {
                  path.pop();
                  continue;
                }
              }
            }
          }
        }

        if (result === undefined && isEdited) {
          edits.push([key, node]);
        }

        if (isLeaving) {
          path.pop();
        } else {
          stack = {
            inArray: inArray,
            index: index,
            keys: keys,
            edits: edits,
            prev: stack
          };
          inArray = Array.isArray(node);
          keys = inArray ? node : visitorKeys[node.kind] || [];
          index = -1;
          edits = [];

          if (parent) {
            ancestors.push(parent);
          }

          parent = node;
        }
      } while (stack !== undefined);

      if (edits.length !== 0) {
        newRoot = edits[edits.length - 1][1];
      }

      return newRoot;
    }

    function isNode(maybeNode) {
      return Boolean(maybeNode && typeof maybeNode.kind === 'string');
    }
    /**
     * Given a visitor instance, if it is leaving or not, and a node kind, return
     * the function the visitor runtime should call.
     */

    function getVisitFn(visitor, kind, isLeaving) {
      var kindVisitor = visitor[kind];

      if (kindVisitor) {
        if (!isLeaving && typeof kindVisitor === 'function') {
          // { Kind() {} }
          return kindVisitor;
        }

        var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;

        if (typeof kindSpecificVisitor === 'function') {
          // { Kind: { enter() {}, leave() {} } }
          return kindSpecificVisitor;
        }
      } else {
        var specificVisitor = isLeaving ? visitor.leave : visitor.enter;

        if (specificVisitor) {
          if (typeof specificVisitor === 'function') {
            // { enter() {}, leave() {} }
            return specificVisitor;
          }

          var specificKindVisitor = specificVisitor[kind];

          if (typeof specificKindVisitor === 'function') {
            // { enter: { Kind() {} }, leave: { Kind() {} } }
            return specificKindVisitor;
          }
        }
      }
    }

    var genericMessage = "Invariant Violation";
    var _a = Object.setPrototypeOf, setPrototypeOf = _a === void 0 ? function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    } : _a;
    var InvariantError = /** @class */ (function (_super) {
        __extends(InvariantError, _super);
        function InvariantError(message) {
            if (message === void 0) { message = genericMessage; }
            var _this = _super.call(this, typeof message === "number"
                ? genericMessage + ": " + message + " (see https://github.com/apollographql/invariant-packages)"
                : message) || this;
            _this.framesToPop = 1;
            _this.name = genericMessage;
            setPrototypeOf(_this, InvariantError.prototype);
            return _this;
        }
        return InvariantError;
    }(Error));
    function invariant(condition, message) {
        if (!condition) {
            throw new InvariantError(message);
        }
    }
    function wrapConsoleMethod(method) {
        return function () {
            return console[method].apply(console, arguments);
        };
    }
    (function (invariant) {
        invariant.warn = wrapConsoleMethod("warn");
        invariant.error = wrapConsoleMethod("error");
    })(invariant || (invariant = {}));
    // Code that uses ts-invariant with rollup-plugin-invariant may want to
    // import this process stub to avoid errors evaluating "development".
    // However, because most ESM-to-CJS compilers will rewrite the process import
    // as tsInvariant.process, which prevents proper replacement by minifiers, we
    // also attempt to define the stub globally when it is not already defined.
    var processStub = { env: {} };
    if (typeof process === "object") {
        processStub = process;
    }
    else
        try {
            // Using Function to evaluate this assignment in global scope also escapes
            // the strict mode of the current module, thereby allowing the assignment.
            // Inspired by https://github.com/facebook/regenerator/pull/369.
            Function("stub", "process = stub")(processStub);
        }
        catch (atLeastWeTried) {
            // The assignment can fail if a Content Security Policy heavy-handedly
            // forbids Function usage. In those environments, developers should take
            // extra care to replace "development" in their production builds,
            // or define an appropriate global.process polyfill.
        }

    var fastJsonStableStringify = function (data, opts) {
        if (!opts) opts = {};
        if (typeof opts === 'function') opts = { cmp: opts };
        var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

        var cmp = opts.cmp && (function (f) {
            return function (node) {
                return function (a, b) {
                    var aobj = { key: a, value: node[a] };
                    var bobj = { key: b, value: node[b] };
                    return f(aobj, bobj);
                };
            };
        })(opts.cmp);

        var seen = [];
        return (function stringify (node) {
            if (node && node.toJSON && typeof node.toJSON === 'function') {
                node = node.toJSON();
            }

            if (node === undefined) return;
            if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
            if (typeof node !== 'object') return JSON.stringify(node);

            var i, out;
            if (Array.isArray(node)) {
                out = '[';
                for (i = 0; i < node.length; i++) {
                    if (i) out += ',';
                    out += stringify(node[i]) || 'null';
                }
                return out + ']';
            }

            if (node === null) return 'null';

            if (seen.indexOf(node) !== -1) {
                if (cycles) return JSON.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }

            var seenIndex = seen.push(node) - 1;
            var keys = Object.keys(node).sort(cmp && cmp(node));
            out = '';
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node[key]);

                if (!value) continue;
                if (out) out += ',';
                out += JSON.stringify(key) + ':' + value;
            }
            seen.splice(seenIndex, 1);
            return '{' + out + '}';
        })(data);
    };

    var _a$1 = Object.prototype, toString = _a$1.toString, hasOwnProperty = _a$1.hasOwnProperty;
    var previousComparisons = new Map();
    /**
     * Performs a deep equality check on two JavaScript values, tolerating cycles.
     */
    function equal(a, b) {
        try {
            return check(a, b);
        }
        finally {
            previousComparisons.clear();
        }
    }
    function check(a, b) {
        // If the two values are strictly equal, our job is easy.
        if (a === b) {
            return true;
        }
        // Object.prototype.toString returns a representation of the runtime type of
        // the given value that is considerably more precise than typeof.
        var aTag = toString.call(a);
        var bTag = toString.call(b);
        // If the runtime types of a and b are different, they could maybe be equal
        // under some interpretation of equality, but for simplicity and performance
        // we just return false instead.
        if (aTag !== bTag) {
            return false;
        }
        switch (aTag) {
            case '[object Array]':
                // Arrays are a lot like other objects, but we can cheaply compare their
                // lengths as a short-cut before comparing their elements.
                if (a.length !== b.length)
                    return false;
            // Fall through to object case...
            case '[object Object]': {
                if (previouslyCompared(a, b))
                    return true;
                var aKeys = Object.keys(a);
                var bKeys = Object.keys(b);
                // If `a` and `b` have a different number of enumerable keys, they
                // must be different.
                var keyCount = aKeys.length;
                if (keyCount !== bKeys.length)
                    return false;
                // Now make sure they have the same keys.
                for (var k = 0; k < keyCount; ++k) {
                    if (!hasOwnProperty.call(b, aKeys[k])) {
                        return false;
                    }
                }
                // Finally, check deep equality of all child properties.
                for (var k = 0; k < keyCount; ++k) {
                    var key = aKeys[k];
                    if (!check(a[key], b[key])) {
                        return false;
                    }
                }
                return true;
            }
            case '[object Error]':
                return a.name === b.name && a.message === b.message;
            case '[object Number]':
                // Handle NaN, which is !== itself.
                if (a !== a)
                    return b !== b;
            // Fall through to shared +a === +b case...
            case '[object Boolean]':
            case '[object Date]':
                return +a === +b;
            case '[object RegExp]':
            case '[object String]':
                return a == "" + b;
            case '[object Map]':
            case '[object Set]': {
                if (a.size !== b.size)
                    return false;
                if (previouslyCompared(a, b))
                    return true;
                var aIterator = a.entries();
                var isMap = aTag === '[object Map]';
                while (true) {
                    var info = aIterator.next();
                    if (info.done)
                        break;
                    // If a instanceof Set, aValue === aKey.
                    var _a = info.value, aKey = _a[0], aValue = _a[1];
                    // So this works the same way for both Set and Map.
                    if (!b.has(aKey)) {
                        return false;
                    }
                    // However, we care about deep equality of values only when dealing
                    // with Map structures.
                    if (isMap && !check(aValue, b.get(aKey))) {
                        return false;
                    }
                }
                return true;
            }
        }
        // Otherwise the values are not equal.
        return false;
    }
    function previouslyCompared(a, b) {
        // Though cyclic references can make an object graph appear infinite from the
        // perspective of a depth-first traversal, the graph still contains a finite
        // number of distinct object references. We use the previousComparisons cache
        // to avoid comparing the same pair of object references more than once, which
        // guarantees termination (even if we end up comparing every object in one
        // graph to every object in the other graph, which is extremely unlikely),
        // while still allowing weird isomorphic structures (like rings with different
        // lengths) a chance to pass the equality test.
        var bSet = previousComparisons.get(a);
        if (bSet) {
            // Return true here because we can be sure false will be returned somewhere
            // else if the objects are not equivalent.
            if (bSet.has(b))
                return true;
        }
        else {
            previousComparisons.set(a, bSet = new Set);
        }
        bSet.add(b);
        return false;
    }

    function isStringValue(value) {
        return value.kind === 'StringValue';
    }
    function isBooleanValue(value) {
        return value.kind === 'BooleanValue';
    }
    function isIntValue(value) {
        return value.kind === 'IntValue';
    }
    function isFloatValue(value) {
        return value.kind === 'FloatValue';
    }
    function isVariable(value) {
        return value.kind === 'Variable';
    }
    function isObjectValue(value) {
        return value.kind === 'ObjectValue';
    }
    function isListValue(value) {
        return value.kind === 'ListValue';
    }
    function isEnumValue(value) {
        return value.kind === 'EnumValue';
    }
    function isNullValue(value) {
        return value.kind === 'NullValue';
    }
    function valueToObjectRepresentation(argObj, name, value, variables) {
        if (isIntValue(value) || isFloatValue(value)) {
            argObj[name.value] = Number(value.value);
        }
        else if (isBooleanValue(value) || isStringValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isObjectValue(value)) {
            var nestedArgObj_1 = {};
            value.fields.map(function (obj) {
                return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
            });
            argObj[name.value] = nestedArgObj_1;
        }
        else if (isVariable(value)) {
            var variableValue = (variables || {})[value.name.value];
            argObj[name.value] = variableValue;
        }
        else if (isListValue(value)) {
            argObj[name.value] = value.values.map(function (listValue) {
                var nestedArgArrayObj = {};
                valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
                return nestedArgArrayObj[name.value];
            });
        }
        else if (isEnumValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isNullValue(value)) {
            argObj[name.value] = null;
        }
        else {
            throw  new InvariantError("The inline argument \"" + name.value + "\" of kind \"" + value.kind + "\"" +
                'is not supported. Use variables instead of inline arguments to ' +
                'overcome this limitation.');
        }
    }
    function storeKeyNameFromField(field, variables) {
        var directivesObj = null;
        if (field.directives) {
            directivesObj = {};
            field.directives.forEach(function (directive) {
                directivesObj[directive.name.value] = {};
                if (directive.arguments) {
                    directive.arguments.forEach(function (_a) {
                        var name = _a.name, value = _a.value;
                        return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
                    });
                }
            });
        }
        var argObj = null;
        if (field.arguments && field.arguments.length) {
            argObj = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj, name, value, variables);
            });
        }
        return getStoreKeyName(field.name.value, argObj, directivesObj);
    }
    var KNOWN_DIRECTIVES = [
        'connection',
        'include',
        'skip',
        'client',
        'rest',
        'export',
    ];
    function getStoreKeyName(fieldName, args, directives) {
        if (directives &&
            directives['connection'] &&
            directives['connection']['key']) {
            if (directives['connection']['filter'] &&
                directives['connection']['filter'].length > 0) {
                var filterKeys = directives['connection']['filter']
                    ? directives['connection']['filter']
                    : [];
                filterKeys.sort();
                var queryArgs_1 = args;
                var filteredArgs_1 = {};
                filterKeys.forEach(function (key) {
                    filteredArgs_1[key] = queryArgs_1[key];
                });
                return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
            }
            else {
                return directives['connection']['key'];
            }
        }
        var completeFieldName = fieldName;
        if (args) {
            var stringifiedArgs = fastJsonStableStringify(args);
            completeFieldName += "(" + stringifiedArgs + ")";
        }
        if (directives) {
            Object.keys(directives).forEach(function (key) {
                if (KNOWN_DIRECTIVES.indexOf(key) !== -1)
                    return;
                if (directives[key] && Object.keys(directives[key]).length) {
                    completeFieldName += "@" + key + "(" + JSON.stringify(directives[key]) + ")";
                }
                else {
                    completeFieldName += "@" + key;
                }
            });
        }
        return completeFieldName;
    }
    function argumentsObjectFromField(field, variables) {
        if (field.arguments && field.arguments.length) {
            var argObj_1 = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj_1, name, value, variables);
            });
            return argObj_1;
        }
        return null;
    }
    function resultKeyNameFromField(field) {
        return field.alias ? field.alias.value : field.name.value;
    }
    function isField(selection) {
        return selection.kind === 'Field';
    }
    function isInlineFragment(selection) {
        return selection.kind === 'InlineFragment';
    }
    function isIdValue(idObject) {
        return idObject &&
            idObject.type === 'id' &&
            typeof idObject.generated === 'boolean';
    }
    function toIdValue(idConfig, generated) {
        if (generated === void 0) { generated = false; }
        return __assign({ type: 'id', generated: generated }, (typeof idConfig === 'string'
            ? { id: idConfig, typename: undefined }
            : idConfig));
    }
    function isJsonValue(jsonObject) {
        return (jsonObject != null &&
            typeof jsonObject === 'object' &&
            jsonObject.type === 'json');
    }

    function getDirectiveInfoFromField(field, variables) {
        if (field.directives && field.directives.length) {
            var directiveObj_1 = {};
            field.directives.forEach(function (directive) {
                directiveObj_1[directive.name.value] = argumentsObjectFromField(directive, variables);
            });
            return directiveObj_1;
        }
        return null;
    }
    function shouldInclude(selection, variables) {
        if (variables === void 0) { variables = {}; }
        return getInclusionDirectives(selection.directives).every(function (_a) {
            var directive = _a.directive, ifArgument = _a.ifArgument;
            var evaledValue = false;
            if (ifArgument.value.kind === 'Variable') {
                evaledValue = variables[ifArgument.value.name.value];
                 invariant(evaledValue !== void 0, "Invalid variable referenced in @" + directive.name.value + " directive.");
            }
            else {
                evaledValue = ifArgument.value.value;
            }
            return directive.name.value === 'skip' ? !evaledValue : evaledValue;
        });
    }
    function getDirectiveNames(doc) {
        var names = [];
        visit(doc, {
            Directive: function (node) {
                names.push(node.name.value);
            },
        });
        return names;
    }
    function hasDirectives(names, doc) {
        return getDirectiveNames(doc).some(function (name) { return names.indexOf(name) > -1; });
    }
    function hasClientExports(document) {
        return (document &&
            hasDirectives(['client'], document) &&
            hasDirectives(['export'], document));
    }
    function isInclusionDirective(_a) {
        var value = _a.name.value;
        return value === 'skip' || value === 'include';
    }
    function getInclusionDirectives(directives) {
        return directives ? directives.filter(isInclusionDirective).map(function (directive) {
            var directiveArguments = directive.arguments;
            var directiveName = directive.name.value;
             invariant(directiveArguments && directiveArguments.length === 1, "Incorrect number of arguments for the @" + directiveName + " directive.");
            var ifArgument = directiveArguments[0];
             invariant(ifArgument.name && ifArgument.name.value === 'if', "Invalid argument for the @" + directiveName + " directive.");
            var ifValue = ifArgument.value;
             invariant(ifValue &&
                (ifValue.kind === 'Variable' || ifValue.kind === 'BooleanValue'), "Argument for the @" + directiveName + " directive must be a variable or a boolean value.");
            return { directive: directive, ifArgument: ifArgument };
        }) : [];
    }

    function getFragmentQueryDocument(document, fragmentName) {
        var actualFragmentName = fragmentName;
        var fragments = [];
        document.definitions.forEach(function (definition) {
            if (definition.kind === 'OperationDefinition') {
                throw  new InvariantError("Found a " + definition.operation + " operation" + (definition.name ? " named '" + definition.name.value + "'" : '') + ". " +
                    'No operations are allowed when using a fragment as a query. Only fragments are allowed.');
            }
            if (definition.kind === 'FragmentDefinition') {
                fragments.push(definition);
            }
        });
        if (typeof actualFragmentName === 'undefined') {
             invariant(fragments.length === 1, "Found " + fragments.length + " fragments. `fragmentName` must be provided when there is not exactly 1 fragment.");
            actualFragmentName = fragments[0].name.value;
        }
        var query = __assign({}, document, { definitions: [
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    selectionSet: {
                        kind: 'SelectionSet',
                        selections: [
                            {
                                kind: 'FragmentSpread',
                                name: {
                                    kind: 'Name',
                                    value: actualFragmentName,
                                },
                            },
                        ],
                    },
                }
            ].concat(document.definitions) });
        return query;
    }

    function assign$1(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        sources.forEach(function (source) {
            if (typeof source === 'undefined' || source === null) {
                return;
            }
            Object.keys(source).forEach(function (key) {
                target[key] = source[key];
            });
        });
        return target;
    }
    function checkDocument(doc) {
         invariant(doc && doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        var operations = doc.definitions
            .filter(function (d) { return d.kind !== 'FragmentDefinition'; })
            .map(function (definition) {
            if (definition.kind !== 'OperationDefinition') {
                throw  new InvariantError("Schema type definitions not allowed in queries. Found: \"" + definition.kind + "\"");
            }
            return definition;
        });
         invariant(operations.length <= 1, "Ambiguous GraphQL document: contains " + operations.length + " operations");
        return doc;
    }
    function getOperationDefinition(doc) {
        checkDocument(doc);
        return doc.definitions.filter(function (definition) { return definition.kind === 'OperationDefinition'; })[0];
    }
    function getOperationName(doc) {
        return (doc.definitions
            .filter(function (definition) {
            return definition.kind === 'OperationDefinition' && definition.name;
        })
            .map(function (x) { return x.name.value; })[0] || null);
    }
    function getFragmentDefinitions(doc) {
        return doc.definitions.filter(function (definition) { return definition.kind === 'FragmentDefinition'; });
    }
    function getQueryDefinition(doc) {
        var queryDef = getOperationDefinition(doc);
         invariant(queryDef && queryDef.operation === 'query', 'Must contain a query definition.');
        return queryDef;
    }
    function getFragmentDefinition(doc) {
         invariant(doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
         invariant(doc.definitions.length <= 1, 'Fragment must have exactly one definition.');
        var fragmentDef = doc.definitions[0];
         invariant(fragmentDef.kind === 'FragmentDefinition', 'Must be a fragment definition.');
        return fragmentDef;
    }
    function getMainDefinition(queryDoc) {
        checkDocument(queryDoc);
        var fragmentDefinition;
        for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
            var definition = _a[_i];
            if (definition.kind === 'OperationDefinition') {
                var operation = definition.operation;
                if (operation === 'query' ||
                    operation === 'mutation' ||
                    operation === 'subscription') {
                    return definition;
                }
            }
            if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
                fragmentDefinition = definition;
            }
        }
        if (fragmentDefinition) {
            return fragmentDefinition;
        }
        throw  new InvariantError('Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.');
    }
    function createFragmentMap(fragments) {
        if (fragments === void 0) { fragments = []; }
        var symTable = {};
        fragments.forEach(function (fragment) {
            symTable[fragment.name.value] = fragment;
        });
        return symTable;
    }
    function getDefaultValues(definition) {
        if (definition &&
            definition.variableDefinitions &&
            definition.variableDefinitions.length) {
            var defaultValues = definition.variableDefinitions
                .filter(function (_a) {
                var defaultValue = _a.defaultValue;
                return defaultValue;
            })
                .map(function (_a) {
                var variable = _a.variable, defaultValue = _a.defaultValue;
                var defaultValueObj = {};
                valueToObjectRepresentation(defaultValueObj, variable.name, defaultValue);
                return defaultValueObj;
            });
            return assign$1.apply(void 0, [{}].concat(defaultValues));
        }
        return {};
    }

    function filterInPlace(array, test, context) {
        var target = 0;
        array.forEach(function (elem, i) {
            if (test.call(this, elem, i, array)) {
                array[target++] = elem;
            }
        }, context);
        array.length = target;
        return array;
    }

    var TYPENAME_FIELD = {
        kind: 'Field',
        name: {
            kind: 'Name',
            value: '__typename',
        },
    };
    function isEmpty(op, fragments) {
        return op.selectionSet.selections.every(function (selection) {
            return selection.kind === 'FragmentSpread' &&
                isEmpty(fragments[selection.name.value], fragments);
        });
    }
    function nullIfDocIsEmpty(doc) {
        return isEmpty(getOperationDefinition(doc) || getFragmentDefinition(doc), createFragmentMap(getFragmentDefinitions(doc)))
            ? null
            : doc;
    }
    function getDirectiveMatcher(directives) {
        return function directiveMatcher(directive) {
            return directives.some(function (dir) {
                return (dir.name && dir.name === directive.name.value) ||
                    (dir.test && dir.test(directive));
            });
        };
    }
    function removeDirectivesFromDocument(directives, doc) {
        var variablesInUse = Object.create(null);
        var variablesToRemove = [];
        var fragmentSpreadsInUse = Object.create(null);
        var fragmentSpreadsToRemove = [];
        var modifiedDoc = nullIfDocIsEmpty(visit(doc, {
            Variable: {
                enter: function (node, _key, parent) {
                    if (parent.kind !== 'VariableDefinition') {
                        variablesInUse[node.name.value] = true;
                    }
                },
            },
            Field: {
                enter: function (node) {
                    if (directives && node.directives) {
                        var shouldRemoveField = directives.some(function (directive) { return directive.remove; });
                        if (shouldRemoveField &&
                            node.directives &&
                            node.directives.some(getDirectiveMatcher(directives))) {
                            if (node.arguments) {
                                node.arguments.forEach(function (arg) {
                                    if (arg.value.kind === 'Variable') {
                                        variablesToRemove.push({
                                            name: arg.value.name.value,
                                        });
                                    }
                                });
                            }
                            if (node.selectionSet) {
                                getAllFragmentSpreadsFromSelectionSet(node.selectionSet).forEach(function (frag) {
                                    fragmentSpreadsToRemove.push({
                                        name: frag.name.value,
                                    });
                                });
                            }
                            return null;
                        }
                    }
                },
            },
            FragmentSpread: {
                enter: function (node) {
                    fragmentSpreadsInUse[node.name.value] = true;
                },
            },
            Directive: {
                enter: function (node) {
                    if (getDirectiveMatcher(directives)(node)) {
                        return null;
                    }
                },
            },
        }));
        if (modifiedDoc &&
            filterInPlace(variablesToRemove, function (v) { return !variablesInUse[v.name]; }).length) {
            modifiedDoc = removeArgumentsFromDocument(variablesToRemove, modifiedDoc);
        }
        if (modifiedDoc &&
            filterInPlace(fragmentSpreadsToRemove, function (fs) { return !fragmentSpreadsInUse[fs.name]; })
                .length) {
            modifiedDoc = removeFragmentSpreadFromDocument(fragmentSpreadsToRemove, modifiedDoc);
        }
        return modifiedDoc;
    }
    function addTypenameToDocument(doc) {
        return visit(checkDocument(doc), {
            SelectionSet: {
                enter: function (node, _key, parent) {
                    if (parent &&
                        parent.kind === 'OperationDefinition') {
                        return;
                    }
                    var selections = node.selections;
                    if (!selections) {
                        return;
                    }
                    var skip = selections.some(function (selection) {
                        return (isField(selection) &&
                            (selection.name.value === '__typename' ||
                                selection.name.value.lastIndexOf('__', 0) === 0));
                    });
                    if (skip) {
                        return;
                    }
                    var field = parent;
                    if (isField(field) &&
                        field.directives &&
                        field.directives.some(function (d) { return d.name.value === 'export'; })) {
                        return;
                    }
                    return __assign({}, node, { selections: selections.concat([TYPENAME_FIELD]) });
                },
            },
        });
    }
    var connectionRemoveConfig = {
        test: function (directive) {
            var willRemove = directive.name.value === 'connection';
            if (willRemove) {
                if (!directive.arguments ||
                    !directive.arguments.some(function (arg) { return arg.name.value === 'key'; })) {
                     invariant.warn('Removing an @connection directive even though it does not have a key. ' +
                        'You may want to use the key parameter to specify a store key.');
                }
            }
            return willRemove;
        },
    };
    function removeConnectionDirectiveFromDocument(doc) {
        return removeDirectivesFromDocument([connectionRemoveConfig], checkDocument(doc));
    }
    function getArgumentMatcher(config) {
        return function argumentMatcher(argument) {
            return config.some(function (aConfig) {
                return argument.value &&
                    argument.value.kind === 'Variable' &&
                    argument.value.name &&
                    (aConfig.name === argument.value.name.value ||
                        (aConfig.test && aConfig.test(argument)));
            });
        };
    }
    function removeArgumentsFromDocument(config, doc) {
        var argMatcher = getArgumentMatcher(config);
        return nullIfDocIsEmpty(visit(doc, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign({}, node, { variableDefinitions: node.variableDefinitions.filter(function (varDef) {
                            return !config.some(function (arg) { return arg.name === varDef.variable.name.value; });
                        }) });
                },
            },
            Field: {
                enter: function (node) {
                    var shouldRemoveField = config.some(function (argConfig) { return argConfig.remove; });
                    if (shouldRemoveField) {
                        var argMatchCount_1 = 0;
                        node.arguments.forEach(function (arg) {
                            if (argMatcher(arg)) {
                                argMatchCount_1 += 1;
                            }
                        });
                        if (argMatchCount_1 === 1) {
                            return null;
                        }
                    }
                },
            },
            Argument: {
                enter: function (node) {
                    if (argMatcher(node)) {
                        return null;
                    }
                },
            },
        }));
    }
    function removeFragmentSpreadFromDocument(config, doc) {
        function enter(node) {
            if (config.some(function (def) { return def.name === node.name.value; })) {
                return null;
            }
        }
        return nullIfDocIsEmpty(visit(doc, {
            FragmentSpread: { enter: enter },
            FragmentDefinition: { enter: enter },
        }));
    }
    function getAllFragmentSpreadsFromSelectionSet(selectionSet) {
        var allFragments = [];
        selectionSet.selections.forEach(function (selection) {
            if ((isField(selection) || isInlineFragment(selection)) &&
                selection.selectionSet) {
                getAllFragmentSpreadsFromSelectionSet(selection.selectionSet).forEach(function (frag) { return allFragments.push(frag); });
            }
            else if (selection.kind === 'FragmentSpread') {
                allFragments.push(selection);
            }
        });
        return allFragments;
    }
    function buildQueryFromSelectionSet(document) {
        var definition = getMainDefinition(document);
        var definitionOperation = definition.operation;
        if (definitionOperation === 'query') {
            return document;
        }
        var modifiedDoc = visit(document, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign({}, node, { operation: 'query' });
                },
            },
        });
        return modifiedDoc;
    }
    function removeClientSetsFromDocument(document) {
        checkDocument(document);
        var modifiedDoc = removeDirectivesFromDocument([
            {
                test: function (directive) { return directive.name.value === 'client'; },
                remove: true,
            },
        ], document);
        if (modifiedDoc) {
            modifiedDoc = visit(modifiedDoc, {
                FragmentDefinition: {
                    enter: function (node) {
                        if (node.selectionSet) {
                            var isTypenameOnly = node.selectionSet.selections.every(function (selection) {
                                return isField(selection) && selection.name.value === '__typename';
                            });
                            if (isTypenameOnly) {
                                return null;
                            }
                        }
                    },
                },
            });
        }
        return modifiedDoc;
    }

    var canUseWeakMap = typeof WeakMap === 'function' && !(typeof navigator === 'object' &&
        navigator.product === 'ReactNative');

    var toString$1 = Object.prototype.toString;
    function cloneDeep(value) {
        return cloneDeepHelper(value, new Map());
    }
    function cloneDeepHelper(val, seen) {
        switch (toString$1.call(val)) {
            case "[object Array]": {
                if (seen.has(val))
                    return seen.get(val);
                var copy_1 = val.slice(0);
                seen.set(val, copy_1);
                copy_1.forEach(function (child, i) {
                    copy_1[i] = cloneDeepHelper(child, seen);
                });
                return copy_1;
            }
            case "[object Object]": {
                if (seen.has(val))
                    return seen.get(val);
                var copy_2 = Object.create(Object.getPrototypeOf(val));
                seen.set(val, copy_2);
                Object.keys(val).forEach(function (key) {
                    copy_2[key] = cloneDeepHelper(val[key], seen);
                });
                return copy_2;
            }
            default:
                return val;
        }
    }

    function getEnv() {
        if (typeof process !== 'undefined' && "development") {
            return "development";
        }
        return 'development';
    }
    function isEnv(env) {
        return getEnv() === env;
    }
    function isProduction() {
        return isEnv('production') === true;
    }
    function isDevelopment() {
        return isEnv('development') === true;
    }
    function isTest() {
        return isEnv('test') === true;
    }

    function tryFunctionOrLogError(f) {
        try {
            return f();
        }
        catch (e) {
            if (console.error) {
                console.error(e);
            }
        }
    }
    function graphQLResultHasError(result) {
        return result.errors && result.errors.length;
    }

    function deepFreeze(o) {
        Object.freeze(o);
        Object.getOwnPropertyNames(o).forEach(function (prop) {
            if (o[prop] !== null &&
                (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
                !Object.isFrozen(o[prop])) {
                deepFreeze(o[prop]);
            }
        });
        return o;
    }
    function maybeDeepFreeze(obj) {
        if (isDevelopment() || isTest()) {
            var symbolIsPolyfilled = typeof Symbol === 'function' && typeof Symbol('') === 'string';
            if (!symbolIsPolyfilled) {
                return deepFreeze(obj);
            }
        }
        return obj;
    }

    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    function mergeDeep() {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sources[_i] = arguments[_i];
        }
        return mergeDeepArray(sources);
    }
    function mergeDeepArray(sources) {
        var target = sources[0] || {};
        var count = sources.length;
        if (count > 1) {
            var pastCopies = [];
            target = shallowCopyForMerge(target, pastCopies);
            for (var i = 1; i < count; ++i) {
                target = mergeHelper(target, sources[i], pastCopies);
            }
        }
        return target;
    }
    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    function mergeHelper(target, source, pastCopies) {
        if (isObject(source) && isObject(target)) {
            if (Object.isExtensible && !Object.isExtensible(target)) {
                target = shallowCopyForMerge(target, pastCopies);
            }
            Object.keys(source).forEach(function (sourceKey) {
                var sourceValue = source[sourceKey];
                if (hasOwnProperty$1.call(target, sourceKey)) {
                    var targetValue = target[sourceKey];
                    if (sourceValue !== targetValue) {
                        target[sourceKey] = mergeHelper(shallowCopyForMerge(targetValue, pastCopies), sourceValue, pastCopies);
                    }
                }
                else {
                    target[sourceKey] = sourceValue;
                }
            });
            return target;
        }
        return source;
    }
    function shallowCopyForMerge(value, pastCopies) {
        if (value !== null &&
            typeof value === 'object' &&
            pastCopies.indexOf(value) < 0) {
            if (Array.isArray(value)) {
                value = value.slice(0);
            }
            else {
                value = __assign({ __proto__: Object.getPrototypeOf(value) }, value);
            }
            pastCopies.push(value);
        }
        return value;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var Observable_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Observable = void 0;

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    // === Symbol Support ===
    var hasSymbols = function () {
      return typeof Symbol === 'function';
    };

    var hasSymbol = function (name) {
      return hasSymbols() && Boolean(Symbol[name]);
    };

    var getSymbol = function (name) {
      return hasSymbol(name) ? Symbol[name] : '@@' + name;
    };

    if (hasSymbols() && !hasSymbol('observable')) {
      Symbol.observable = Symbol('observable');
    }

    var SymbolIterator = getSymbol('iterator');
    var SymbolObservable = getSymbol('observable');
    var SymbolSpecies = getSymbol('species'); // === Abstract Operations ===

    function getMethod(obj, key) {
      var value = obj[key];
      if (value == null) return undefined;
      if (typeof value !== 'function') throw new TypeError(value + ' is not a function');
      return value;
    }

    function getSpecies(obj) {
      var ctor = obj.constructor;

      if (ctor !== undefined) {
        ctor = ctor[SymbolSpecies];

        if (ctor === null) {
          ctor = undefined;
        }
      }

      return ctor !== undefined ? ctor : Observable;
    }

    function isObservable(x) {
      return x instanceof Observable; // SPEC: Brand check
    }

    function hostReportError(e) {
      if (hostReportError.log) {
        hostReportError.log(e);
      } else {
        setTimeout(function () {
          throw e;
        });
      }
    }

    function enqueue(fn) {
      Promise.resolve().then(function () {
        try {
          fn();
        } catch (e) {
          hostReportError(e);
        }
      });
    }

    function cleanupSubscription(subscription) {
      var cleanup = subscription._cleanup;
      if (cleanup === undefined) return;
      subscription._cleanup = undefined;

      if (!cleanup) {
        return;
      }

      try {
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          var unsubscribe = getMethod(cleanup, 'unsubscribe');

          if (unsubscribe) {
            unsubscribe.call(cleanup);
          }
        }
      } catch (e) {
        hostReportError(e);
      }
    }

    function closeSubscription(subscription) {
      subscription._observer = undefined;
      subscription._queue = undefined;
      subscription._state = 'closed';
    }

    function flushSubscription(subscription) {
      var queue = subscription._queue;

      if (!queue) {
        return;
      }

      subscription._queue = undefined;
      subscription._state = 'ready';

      for (var i = 0; i < queue.length; ++i) {
        notifySubscription(subscription, queue[i].type, queue[i].value);
        if (subscription._state === 'closed') break;
      }
    }

    function notifySubscription(subscription, type, value) {
      subscription._state = 'running';
      var observer = subscription._observer;

      try {
        var m = getMethod(observer, type);

        switch (type) {
          case 'next':
            if (m) m.call(observer, value);
            break;

          case 'error':
            closeSubscription(subscription);
            if (m) m.call(observer, value);else throw value;
            break;

          case 'complete':
            closeSubscription(subscription);
            if (m) m.call(observer);
            break;
        }
      } catch (e) {
        hostReportError(e);
      }

      if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
    }

    function onNotify(subscription, type, value) {
      if (subscription._state === 'closed') return;

      if (subscription._state === 'buffering') {
        subscription._queue.push({
          type: type,
          value: value
        });

        return;
      }

      if (subscription._state !== 'ready') {
        subscription._state = 'buffering';
        subscription._queue = [{
          type: type,
          value: value
        }];
        enqueue(function () {
          return flushSubscription(subscription);
        });
        return;
      }

      notifySubscription(subscription, type, value);
    }

    var Subscription =
    /*#__PURE__*/
    function () {
      function Subscription(observer, subscriber) {
        _classCallCheck(this, Subscription);

        // ASSERT: observer is an object
        // ASSERT: subscriber is callable
        this._cleanup = undefined;
        this._observer = observer;
        this._queue = undefined;
        this._state = 'initializing';
        var subscriptionObserver = new SubscriptionObserver(this);

        try {
          this._cleanup = subscriber.call(undefined, subscriptionObserver);
        } catch (e) {
          subscriptionObserver.error(e);
        }

        if (this._state === 'initializing') this._state = 'ready';
      }

      _createClass(Subscription, [{
        key: "unsubscribe",
        value: function unsubscribe() {
          if (this._state !== 'closed') {
            closeSubscription(this);
            cleanupSubscription(this);
          }
        }
      }, {
        key: "closed",
        get: function () {
          return this._state === 'closed';
        }
      }]);

      return Subscription;
    }();

    var SubscriptionObserver =
    /*#__PURE__*/
    function () {
      function SubscriptionObserver(subscription) {
        _classCallCheck(this, SubscriptionObserver);

        this._subscription = subscription;
      }

      _createClass(SubscriptionObserver, [{
        key: "next",
        value: function next(value) {
          onNotify(this._subscription, 'next', value);
        }
      }, {
        key: "error",
        value: function error(value) {
          onNotify(this._subscription, 'error', value);
        }
      }, {
        key: "complete",
        value: function complete() {
          onNotify(this._subscription, 'complete');
        }
      }, {
        key: "closed",
        get: function () {
          return this._subscription._state === 'closed';
        }
      }]);

      return SubscriptionObserver;
    }();

    var Observable =
    /*#__PURE__*/
    function () {
      function Observable(subscriber) {
        _classCallCheck(this, Observable);

        if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');
        if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');
        this._subscriber = subscriber;
      }

      _createClass(Observable, [{
        key: "subscribe",
        value: function subscribe(observer) {
          if (typeof observer !== 'object' || observer === null) {
            observer = {
              next: observer,
              error: arguments[1],
              complete: arguments[2]
            };
          }

          return new Subscription(observer, this._subscriber);
        }
      }, {
        key: "forEach",
        value: function forEach(fn) {
          var _this = this;

          return new Promise(function (resolve, reject) {
            if (typeof fn !== 'function') {
              reject(new TypeError(fn + ' is not a function'));
              return;
            }

            function done() {
              subscription.unsubscribe();
              resolve();
            }

            var subscription = _this.subscribe({
              next: function (value) {
                try {
                  fn(value, done);
                } catch (e) {
                  reject(e);
                  subscription.unsubscribe();
                }
              },
              error: reject,
              complete: resolve
            });
          });
        }
      }, {
        key: "map",
        value: function map(fn) {
          var _this2 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            return _this2.subscribe({
              next: function (value) {
                try {
                  value = fn(value);
                } catch (e) {
                  return observer.error(e);
                }

                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "filter",
        value: function filter(fn) {
          var _this3 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            return _this3.subscribe({
              next: function (value) {
                try {
                  if (!fn(value)) return;
                } catch (e) {
                  return observer.error(e);
                }

                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "reduce",
        value: function reduce(fn) {
          var _this4 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          var hasSeed = arguments.length > 1;
          var hasValue = false;
          var seed = arguments[1];
          var acc = seed;
          return new C(function (observer) {
            return _this4.subscribe({
              next: function (value) {
                var first = !hasValue;
                hasValue = true;

                if (!first || hasSeed) {
                  try {
                    acc = fn(acc, value);
                  } catch (e) {
                    return observer.error(e);
                  }
                } else {
                  acc = value;
                }
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));
                observer.next(acc);
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "concat",
        value: function concat() {
          var _this5 = this;

          for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
            sources[_key] = arguments[_key];
          }

          var C = getSpecies(this);
          return new C(function (observer) {
            var subscription;
            var index = 0;

            function startNext(next) {
              subscription = next.subscribe({
                next: function (v) {
                  observer.next(v);
                },
                error: function (e) {
                  observer.error(e);
                },
                complete: function () {
                  if (index === sources.length) {
                    subscription = undefined;
                    observer.complete();
                  } else {
                    startNext(C.from(sources[index++]));
                  }
                }
              });
            }

            startNext(_this5);
            return function () {
              if (subscription) {
                subscription.unsubscribe();
                subscription = undefined;
              }
            };
          });
        }
      }, {
        key: "flatMap",
        value: function flatMap(fn) {
          var _this6 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            var subscriptions = [];

            var outer = _this6.subscribe({
              next: function (value) {
                if (fn) {
                  try {
                    value = fn(value);
                  } catch (e) {
                    return observer.error(e);
                  }
                }

                var inner = C.from(value).subscribe({
                  next: function (value) {
                    observer.next(value);
                  },
                  error: function (e) {
                    observer.error(e);
                  },
                  complete: function () {
                    var i = subscriptions.indexOf(inner);
                    if (i >= 0) subscriptions.splice(i, 1);
                    completeIfDone();
                  }
                });
                subscriptions.push(inner);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                completeIfDone();
              }
            });

            function completeIfDone() {
              if (outer.closed && subscriptions.length === 0) observer.complete();
            }

            return function () {
              subscriptions.forEach(function (s) {
                return s.unsubscribe();
              });
              outer.unsubscribe();
            };
          });
        }
      }, {
        key: SymbolObservable,
        value: function () {
          return this;
        }
      }], [{
        key: "from",
        value: function from(x) {
          var C = typeof this === 'function' ? this : Observable;
          if (x == null) throw new TypeError(x + ' is not an object');
          var method = getMethod(x, SymbolObservable);

          if (method) {
            var observable = method.call(x);
            if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');
            if (isObservable(observable) && observable.constructor === C) return observable;
            return new C(function (observer) {
              return observable.subscribe(observer);
            });
          }

          if (hasSymbol('iterator')) {
            method = getMethod(x, SymbolIterator);

            if (method) {
              return new C(function (observer) {
                enqueue(function () {
                  if (observer.closed) return;
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var _item = _step.value;
                      observer.next(_item);
                      if (observer.closed) return;
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return != null) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  observer.complete();
                });
              });
            }
          }

          if (Array.isArray(x)) {
            return new C(function (observer) {
              enqueue(function () {
                if (observer.closed) return;

                for (var i = 0; i < x.length; ++i) {
                  observer.next(x[i]);
                  if (observer.closed) return;
                }

                observer.complete();
              });
            });
          }

          throw new TypeError(x + ' is not observable');
        }
      }, {
        key: "of",
        value: function of() {
          for (var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            items[_key2] = arguments[_key2];
          }

          var C = typeof this === 'function' ? this : Observable;
          return new C(function (observer) {
            enqueue(function () {
              if (observer.closed) return;

              for (var i = 0; i < items.length; ++i) {
                observer.next(items[i]);
                if (observer.closed) return;
              }

              observer.complete();
            });
          });
        }
      }, {
        key: SymbolSpecies,
        get: function () {
          return this;
        }
      }]);

      return Observable;
    }();

    exports.Observable = Observable;

    if (hasSymbols()) {
      Object.defineProperty(Observable, Symbol('extensions'), {
        value: {
          symbol: SymbolObservable,
          hostReportError: hostReportError
        },
        configurable: true
      });
    }
    });

    unwrapExports(Observable_1);
    var Observable_2 = Observable_1.Observable;

    var zenObservable = Observable_1.Observable;

    var Observable = zenObservable;

    function validateOperation(operation) {
        var OPERATION_FIELDS = [
            'query',
            'operationName',
            'variables',
            'extensions',
            'context',
        ];
        for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
            var key = _a[_i];
            if (OPERATION_FIELDS.indexOf(key) < 0) {
                throw  new InvariantError("illegal argument: " + key);
            }
        }
        return operation;
    }
    var LinkError = (function (_super) {
        __extends(LinkError, _super);
        function LinkError(message, link) {
            var _this = _super.call(this, message) || this;
            _this.link = link;
            return _this;
        }
        return LinkError;
    }(Error));
    function isTerminating(link) {
        return link.request.length <= 1;
    }
    function fromError(errorValue) {
        return new Observable(function (observer) {
            observer.error(errorValue);
        });
    }
    function transformOperation(operation) {
        var transformedOperation = {
            variables: operation.variables || {},
            extensions: operation.extensions || {},
            operationName: operation.operationName,
            query: operation.query,
        };
        if (!transformedOperation.operationName) {
            transformedOperation.operationName =
                typeof transformedOperation.query !== 'string'
                    ? getOperationName(transformedOperation.query)
                    : '';
        }
        return transformedOperation;
    }
    function createOperation(starting, operation) {
        var context = __assign({}, starting);
        var setContext = function (next) {
            if (typeof next === 'function') {
                context = __assign({}, context, next(context));
            }
            else {
                context = __assign({}, context, next);
            }
        };
        var getContext = function () { return (__assign({}, context)); };
        Object.defineProperty(operation, 'setContext', {
            enumerable: false,
            value: setContext,
        });
        Object.defineProperty(operation, 'getContext', {
            enumerable: false,
            value: getContext,
        });
        Object.defineProperty(operation, 'toKey', {
            enumerable: false,
            value: function () { return getKey(operation); },
        });
        return operation;
    }
    function getKey(operation) {
        var query = operation.query, variables = operation.variables, operationName = operation.operationName;
        return JSON.stringify([operationName, query, variables]);
    }

    function passthrough(op, forward) {
        return forward ? forward(op) : Observable.of();
    }
    function toLink(handler) {
        return typeof handler === 'function' ? new ApolloLink(handler) : handler;
    }
    function empty$1() {
        return new ApolloLink(function () { return Observable.of(); });
    }
    function from(links) {
        if (links.length === 0)
            return empty$1();
        return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
    }
    function split(test, left, right) {
        var leftLink = toLink(left);
        var rightLink = toLink(right || new ApolloLink(passthrough));
        if (isTerminating(leftLink) && isTerminating(rightLink)) {
            return new ApolloLink(function (operation) {
                return test(operation)
                    ? leftLink.request(operation) || Observable.of()
                    : rightLink.request(operation) || Observable.of();
            });
        }
        else {
            return new ApolloLink(function (operation, forward) {
                return test(operation)
                    ? leftLink.request(operation, forward) || Observable.of()
                    : rightLink.request(operation, forward) || Observable.of();
            });
        }
    }
    var concat = function (first, second) {
        var firstLink = toLink(first);
        if (isTerminating(firstLink)) {
             invariant.warn(new LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
            return firstLink;
        }
        var nextLink = toLink(second);
        if (isTerminating(nextLink)) {
            return new ApolloLink(function (operation) {
                return firstLink.request(operation, function (op) { return nextLink.request(op) || Observable.of(); }) || Observable.of();
            });
        }
        else {
            return new ApolloLink(function (operation, forward) {
                return (firstLink.request(operation, function (op) {
                    return nextLink.request(op, forward) || Observable.of();
                }) || Observable.of());
            });
        }
    };
    var ApolloLink = (function () {
        function ApolloLink(request) {
            if (request)
                this.request = request;
        }
        ApolloLink.prototype.split = function (test, left, right) {
            return this.concat(split(test, left, right || new ApolloLink(passthrough)));
        };
        ApolloLink.prototype.concat = function (next) {
            return concat(this, next);
        };
        ApolloLink.prototype.request = function (operation, forward) {
            throw  new InvariantError('request is not implemented');
        };
        ApolloLink.empty = empty$1;
        ApolloLink.from = from;
        ApolloLink.split = split;
        ApolloLink.execute = execute;
        return ApolloLink;
    }());
    function execute(link, operation) {
        return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || Observable.of());
    }

    function symbolObservablePonyfill(root) {
    	var result;
    	var Symbol = root.Symbol;

    	if (typeof Symbol === 'function') {
    		if (Symbol.observable) {
    			result = Symbol.observable;
    		} else {
    			result = Symbol('observable');
    			Symbol.observable = result;
    		}
    	} else {
    		result = '@@observable';
    	}

    	return result;
    }

    /* global window */

    var root;

    if (typeof self !== 'undefined') {
      root = self;
    } else if (typeof window !== 'undefined') {
      root = window;
    } else if (typeof global !== 'undefined') {
      root = global;
    } else if (typeof module !== 'undefined') {
      root = module;
    } else {
      root = Function('return this')();
    }

    var result = symbolObservablePonyfill(root);

    var NetworkStatus;
    (function (NetworkStatus) {
        NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
        NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
        NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
        NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
        NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
        NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
        NetworkStatus[NetworkStatus["error"] = 8] = "error";
    })(NetworkStatus || (NetworkStatus = {}));
    function isNetworkRequestInFlight(networkStatus) {
        return networkStatus < 7;
    }

    var Observable$1 = (function (_super) {
        __extends(Observable, _super);
        function Observable() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Observable.prototype[result] = function () {
            return this;
        };
        Observable.prototype['@@observable'] = function () {
            return this;
        };
        return Observable;
    }(Observable));

    function isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function isApolloError(err) {
        return err.hasOwnProperty('graphQLErrors');
    }
    var generateErrorMessage = function (err) {
        var message = '';
        if (isNonEmptyArray(err.graphQLErrors)) {
            err.graphQLErrors.forEach(function (graphQLError) {
                var errorMessage = graphQLError
                    ? graphQLError.message
                    : 'Error message not found.';
                message += "GraphQL error: " + errorMessage + "\n";
            });
        }
        if (err.networkError) {
            message += 'Network error: ' + err.networkError.message + '\n';
        }
        message = message.replace(/\n$/, '');
        return message;
    };
    var ApolloError = (function (_super) {
        __extends(ApolloError, _super);
        function ApolloError(_a) {
            var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError, errorMessage = _a.errorMessage, extraInfo = _a.extraInfo;
            var _this = _super.call(this, errorMessage) || this;
            _this.graphQLErrors = graphQLErrors || [];
            _this.networkError = networkError || null;
            if (!errorMessage) {
                _this.message = generateErrorMessage(_this);
            }
            else {
                _this.message = errorMessage;
            }
            _this.extraInfo = extraInfo;
            _this.__proto__ = ApolloError.prototype;
            return _this;
        }
        return ApolloError;
    }(Error));

    var FetchType;
    (function (FetchType) {
        FetchType[FetchType["normal"] = 1] = "normal";
        FetchType[FetchType["refetch"] = 2] = "refetch";
        FetchType[FetchType["poll"] = 3] = "poll";
    })(FetchType || (FetchType = {}));

    var hasError = function (storeValue, policy) {
        if (policy === void 0) { policy = 'none'; }
        return storeValue && (storeValue.networkError ||
            (policy === 'none' && isNonEmptyArray(storeValue.graphQLErrors)));
    };
    var ObservableQuery = (function (_super) {
        __extends(ObservableQuery, _super);
        function ObservableQuery(_a) {
            var queryManager = _a.queryManager, options = _a.options, _b = _a.shouldSubscribe, shouldSubscribe = _b === void 0 ? true : _b;
            var _this = _super.call(this, function (observer) {
                return _this.onSubscribe(observer);
            }) || this;
            _this.observers = new Set();
            _this.subscriptions = new Set();
            _this.isTornDown = false;
            _this.options = options;
            _this.variables = options.variables || {};
            _this.queryId = queryManager.generateQueryId();
            _this.shouldSubscribe = shouldSubscribe;
            var opDef = getOperationDefinition(options.query);
            _this.queryName = opDef && opDef.name && opDef.name.value;
            _this.queryManager = queryManager;
            return _this;
        }
        ObservableQuery.prototype.result = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var observer = {
                    next: function (result) {
                        resolve(result);
                        _this.observers.delete(observer);
                        if (!_this.observers.size) {
                            _this.queryManager.removeQuery(_this.queryId);
                        }
                        setTimeout(function () {
                            subscription.unsubscribe();
                        }, 0);
                    },
                    error: reject,
                };
                var subscription = _this.subscribe(observer);
            });
        };
        ObservableQuery.prototype.currentResult = function () {
            var result = this.getCurrentResult();
            if (result.data === undefined) {
                result.data = {};
            }
            return result;
        };
        ObservableQuery.prototype.getCurrentResult = function () {
            if (this.isTornDown) {
                var lastResult = this.lastResult;
                return {
                    data: !this.lastError && lastResult && lastResult.data || void 0,
                    error: this.lastError,
                    loading: false,
                    networkStatus: NetworkStatus.error,
                };
            }
            var _a = this.queryManager.getCurrentQueryResult(this), data = _a.data, partial = _a.partial;
            var queryStoreValue = this.queryManager.queryStore.get(this.queryId);
            var result;
            var fetchPolicy = this.options.fetchPolicy;
            var isNetworkFetchPolicy = fetchPolicy === 'network-only' ||
                fetchPolicy === 'no-cache';
            if (queryStoreValue) {
                var networkStatus = queryStoreValue.networkStatus;
                if (hasError(queryStoreValue, this.options.errorPolicy)) {
                    return {
                        data: void 0,
                        loading: false,
                        networkStatus: networkStatus,
                        error: new ApolloError({
                            graphQLErrors: queryStoreValue.graphQLErrors,
                            networkError: queryStoreValue.networkError,
                        }),
                    };
                }
                if (queryStoreValue.variables) {
                    this.options.variables = __assign({}, this.options.variables, queryStoreValue.variables);
                    this.variables = this.options.variables;
                }
                result = {
                    data: data,
                    loading: isNetworkRequestInFlight(networkStatus),
                    networkStatus: networkStatus,
                };
                if (queryStoreValue.graphQLErrors && this.options.errorPolicy === 'all') {
                    result.errors = queryStoreValue.graphQLErrors;
                }
            }
            else {
                var loading = isNetworkFetchPolicy ||
                    (partial && fetchPolicy !== 'cache-only');
                result = {
                    data: data,
                    loading: loading,
                    networkStatus: loading ? NetworkStatus.loading : NetworkStatus.ready,
                };
            }
            if (!partial) {
                this.updateLastResult(__assign({}, result, { stale: false }));
            }
            return __assign({}, result, { partial: partial });
        };
        ObservableQuery.prototype.isDifferentFromLastResult = function (newResult) {
            var snapshot = this.lastResultSnapshot;
            return !(snapshot &&
                newResult &&
                snapshot.networkStatus === newResult.networkStatus &&
                snapshot.stale === newResult.stale &&
                equal(snapshot.data, newResult.data));
        };
        ObservableQuery.prototype.getLastResult = function () {
            return this.lastResult;
        };
        ObservableQuery.prototype.getLastError = function () {
            return this.lastError;
        };
        ObservableQuery.prototype.resetLastResults = function () {
            delete this.lastResult;
            delete this.lastResultSnapshot;
            delete this.lastError;
            this.isTornDown = false;
        };
        ObservableQuery.prototype.resetQueryStoreErrors = function () {
            var queryStore = this.queryManager.queryStore.get(this.queryId);
            if (queryStore) {
                queryStore.networkError = null;
                queryStore.graphQLErrors = [];
            }
        };
        ObservableQuery.prototype.refetch = function (variables) {
            var fetchPolicy = this.options.fetchPolicy;
            if (fetchPolicy === 'cache-only') {
                return Promise.reject( new InvariantError('cache-only fetchPolicy option should not be used together with query refetch.'));
            }
            if (fetchPolicy !== 'no-cache' &&
                fetchPolicy !== 'cache-and-network') {
                fetchPolicy = 'network-only';
            }
            if (!equal(this.variables, variables)) {
                this.variables = __assign({}, this.variables, variables);
            }
            if (!equal(this.options.variables, this.variables)) {
                this.options.variables = __assign({}, this.options.variables, this.variables);
            }
            return this.queryManager.fetchQuery(this.queryId, __assign({}, this.options, { fetchPolicy: fetchPolicy }), FetchType.refetch);
        };
        ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
            var _this = this;
             invariant(fetchMoreOptions.updateQuery, 'updateQuery option is required. This function defines how to update the query data with the new results.');
            var combinedOptions = __assign({}, (fetchMoreOptions.query ? fetchMoreOptions : __assign({}, this.options, fetchMoreOptions, { variables: __assign({}, this.variables, fetchMoreOptions.variables) })), { fetchPolicy: 'network-only' });
            var qid = this.queryManager.generateQueryId();
            return this.queryManager
                .fetchQuery(qid, combinedOptions, FetchType.normal, this.queryId)
                .then(function (fetchMoreResult) {
                _this.updateQuery(function (previousResult) {
                    return fetchMoreOptions.updateQuery(previousResult, {
                        fetchMoreResult: fetchMoreResult.data,
                        variables: combinedOptions.variables,
                    });
                });
                _this.queryManager.stopQuery(qid);
                return fetchMoreResult;
            }, function (error) {
                _this.queryManager.stopQuery(qid);
                throw error;
            });
        };
        ObservableQuery.prototype.subscribeToMore = function (options) {
            var _this = this;
            var subscription = this.queryManager
                .startGraphQLSubscription({
                query: options.document,
                variables: options.variables,
            })
                .subscribe({
                next: function (subscriptionData) {
                    var updateQuery = options.updateQuery;
                    if (updateQuery) {
                        _this.updateQuery(function (previous, _a) {
                            var variables = _a.variables;
                            return updateQuery(previous, {
                                subscriptionData: subscriptionData,
                                variables: variables,
                            });
                        });
                    }
                },
                error: function (err) {
                    if (options.onError) {
                        options.onError(err);
                        return;
                    }
                     invariant.error('Unhandled GraphQL subscription error', err);
                },
            });
            this.subscriptions.add(subscription);
            return function () {
                if (_this.subscriptions.delete(subscription)) {
                    subscription.unsubscribe();
                }
            };
        };
        ObservableQuery.prototype.setOptions = function (opts) {
            var oldFetchPolicy = this.options.fetchPolicy;
            this.options = __assign({}, this.options, opts);
            if (opts.pollInterval) {
                this.startPolling(opts.pollInterval);
            }
            else if (opts.pollInterval === 0) {
                this.stopPolling();
            }
            var fetchPolicy = opts.fetchPolicy;
            return this.setVariables(this.options.variables, oldFetchPolicy !== fetchPolicy && (oldFetchPolicy === 'cache-only' ||
                oldFetchPolicy === 'standby' ||
                fetchPolicy === 'network-only'), opts.fetchResults);
        };
        ObservableQuery.prototype.setVariables = function (variables, tryFetch, fetchResults) {
            if (tryFetch === void 0) { tryFetch = false; }
            if (fetchResults === void 0) { fetchResults = true; }
            this.isTornDown = false;
            variables = variables || this.variables;
            if (!tryFetch && equal(variables, this.variables)) {
                return this.observers.size && fetchResults
                    ? this.result()
                    : Promise.resolve();
            }
            this.variables = this.options.variables = variables;
            if (!this.observers.size) {
                return Promise.resolve();
            }
            return this.queryManager.fetchQuery(this.queryId, this.options);
        };
        ObservableQuery.prototype.updateQuery = function (mapFn) {
            var queryManager = this.queryManager;
            var _a = queryManager.getQueryWithPreviousResult(this.queryId), previousResult = _a.previousResult, variables = _a.variables, document = _a.document;
            var newResult = tryFunctionOrLogError(function () {
                return mapFn(previousResult, { variables: variables });
            });
            if (newResult) {
                queryManager.dataStore.markUpdateQueryResult(document, variables, newResult);
                queryManager.broadcastQueries();
            }
        };
        ObservableQuery.prototype.stopPolling = function () {
            this.queryManager.stopPollingQuery(this.queryId);
            this.options.pollInterval = undefined;
        };
        ObservableQuery.prototype.startPolling = function (pollInterval) {
            assertNotCacheFirstOrOnly(this);
            this.options.pollInterval = pollInterval;
            this.queryManager.startPollingQuery(this.options, this.queryId);
        };
        ObservableQuery.prototype.updateLastResult = function (newResult) {
            var previousResult = this.lastResult;
            this.lastResult = newResult;
            this.lastResultSnapshot = this.queryManager.assumeImmutableResults
                ? newResult
                : cloneDeep(newResult);
            return previousResult;
        };
        ObservableQuery.prototype.onSubscribe = function (observer) {
            var _this = this;
            try {
                var subObserver = observer._subscription._observer;
                if (subObserver && !subObserver.error) {
                    subObserver.error = defaultSubscriptionObserverErrorCallback;
                }
            }
            catch (_a) { }
            var first = !this.observers.size;
            this.observers.add(observer);
            if (observer.next && this.lastResult)
                observer.next(this.lastResult);
            if (observer.error && this.lastError)
                observer.error(this.lastError);
            if (first) {
                this.setUpQuery();
            }
            return function () {
                if (_this.observers.delete(observer) && !_this.observers.size) {
                    _this.tearDownQuery();
                }
            };
        };
        ObservableQuery.prototype.setUpQuery = function () {
            var _this = this;
            var _a = this, queryManager = _a.queryManager, queryId = _a.queryId;
            if (this.shouldSubscribe) {
                queryManager.addObservableQuery(queryId, this);
            }
            if (this.options.pollInterval) {
                assertNotCacheFirstOrOnly(this);
                queryManager.startPollingQuery(this.options, queryId);
            }
            var onError = function (error) {
                _this.updateLastResult(__assign({}, _this.lastResult, { errors: error.graphQLErrors, networkStatus: NetworkStatus.error, loading: false }));
                iterateObserversSafely(_this.observers, 'error', _this.lastError = error);
            };
            queryManager.observeQuery(queryId, this.options, {
                next: function (result) {
                    if (_this.lastError || _this.isDifferentFromLastResult(result)) {
                        var previousResult_1 = _this.updateLastResult(result);
                        var _a = _this.options, query_1 = _a.query, variables = _a.variables, fetchPolicy_1 = _a.fetchPolicy;
                        if (queryManager.transform(query_1).hasClientExports) {
                            queryManager.getLocalState().addExportedVariables(query_1, variables).then(function (variables) {
                                var previousVariables = _this.variables;
                                _this.variables = _this.options.variables = variables;
                                if (!result.loading &&
                                    previousResult_1 &&
                                    fetchPolicy_1 !== 'cache-only' &&
                                    queryManager.transform(query_1).serverQuery &&
                                    !equal(previousVariables, variables)) {
                                    _this.refetch();
                                }
                                else {
                                    iterateObserversSafely(_this.observers, 'next', result);
                                }
                            });
                        }
                        else {
                            iterateObserversSafely(_this.observers, 'next', result);
                        }
                    }
                },
                error: onError,
            }).catch(onError);
        };
        ObservableQuery.prototype.tearDownQuery = function () {
            var queryManager = this.queryManager;
            this.isTornDown = true;
            queryManager.stopPollingQuery(this.queryId);
            this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
            this.subscriptions.clear();
            queryManager.removeObservableQuery(this.queryId);
            queryManager.stopQuery(this.queryId);
            this.observers.clear();
        };
        return ObservableQuery;
    }(Observable$1));
    function defaultSubscriptionObserverErrorCallback(error) {
         invariant.error('Unhandled error', error.message, error.stack);
    }
    function iterateObserversSafely(observers, method, argument) {
        var observersWithMethod = [];
        observers.forEach(function (obs) { return obs[method] && observersWithMethod.push(obs); });
        observersWithMethod.forEach(function (obs) { return obs[method](argument); });
    }
    function assertNotCacheFirstOrOnly(obsQuery) {
        var fetchPolicy = obsQuery.options.fetchPolicy;
         invariant(fetchPolicy !== 'cache-first' && fetchPolicy !== 'cache-only', 'Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
    }

    var MutationStore = (function () {
        function MutationStore() {
            this.store = {};
        }
        MutationStore.prototype.getStore = function () {
            return this.store;
        };
        MutationStore.prototype.get = function (mutationId) {
            return this.store[mutationId];
        };
        MutationStore.prototype.initMutation = function (mutationId, mutation, variables) {
            this.store[mutationId] = {
                mutation: mutation,
                variables: variables || {},
                loading: true,
                error: null,
            };
        };
        MutationStore.prototype.markMutationError = function (mutationId, error) {
            var mutation = this.store[mutationId];
            if (mutation) {
                mutation.loading = false;
                mutation.error = error;
            }
        };
        MutationStore.prototype.markMutationResult = function (mutationId) {
            var mutation = this.store[mutationId];
            if (mutation) {
                mutation.loading = false;
                mutation.error = null;
            }
        };
        MutationStore.prototype.reset = function () {
            this.store = {};
        };
        return MutationStore;
    }());

    var QueryStore = (function () {
        function QueryStore() {
            this.store = {};
        }
        QueryStore.prototype.getStore = function () {
            return this.store;
        };
        QueryStore.prototype.get = function (queryId) {
            return this.store[queryId];
        };
        QueryStore.prototype.initQuery = function (query) {
            var previousQuery = this.store[query.queryId];
             invariant(!previousQuery ||
                previousQuery.document === query.document ||
                equal(previousQuery.document, query.document), 'Internal Error: may not update existing query string in store');
            var isSetVariables = false;
            var previousVariables = null;
            if (query.storePreviousVariables &&
                previousQuery &&
                previousQuery.networkStatus !== NetworkStatus.loading) {
                if (!equal(previousQuery.variables, query.variables)) {
                    isSetVariables = true;
                    previousVariables = previousQuery.variables;
                }
            }
            var networkStatus;
            if (isSetVariables) {
                networkStatus = NetworkStatus.setVariables;
            }
            else if (query.isPoll) {
                networkStatus = NetworkStatus.poll;
            }
            else if (query.isRefetch) {
                networkStatus = NetworkStatus.refetch;
            }
            else {
                networkStatus = NetworkStatus.loading;
            }
            var graphQLErrors = [];
            if (previousQuery && previousQuery.graphQLErrors) {
                graphQLErrors = previousQuery.graphQLErrors;
            }
            this.store[query.queryId] = {
                document: query.document,
                variables: query.variables,
                previousVariables: previousVariables,
                networkError: null,
                graphQLErrors: graphQLErrors,
                networkStatus: networkStatus,
                metadata: query.metadata,
            };
            if (typeof query.fetchMoreForQueryId === 'string' &&
                this.store[query.fetchMoreForQueryId]) {
                this.store[query.fetchMoreForQueryId].networkStatus =
                    NetworkStatus.fetchMore;
            }
        };
        QueryStore.prototype.markQueryResult = function (queryId, result, fetchMoreForQueryId) {
            if (!this.store || !this.store[queryId])
                return;
            this.store[queryId].networkError = null;
            this.store[queryId].graphQLErrors = isNonEmptyArray(result.errors) ? result.errors : [];
            this.store[queryId].previousVariables = null;
            this.store[queryId].networkStatus = NetworkStatus.ready;
            if (typeof fetchMoreForQueryId === 'string' &&
                this.store[fetchMoreForQueryId]) {
                this.store[fetchMoreForQueryId].networkStatus = NetworkStatus.ready;
            }
        };
        QueryStore.prototype.markQueryError = function (queryId, error, fetchMoreForQueryId) {
            if (!this.store || !this.store[queryId])
                return;
            this.store[queryId].networkError = error;
            this.store[queryId].networkStatus = NetworkStatus.error;
            if (typeof fetchMoreForQueryId === 'string') {
                this.markQueryResultClient(fetchMoreForQueryId, true);
            }
        };
        QueryStore.prototype.markQueryResultClient = function (queryId, complete) {
            var storeValue = this.store && this.store[queryId];
            if (storeValue) {
                storeValue.networkError = null;
                storeValue.previousVariables = null;
                if (complete) {
                    storeValue.networkStatus = NetworkStatus.ready;
                }
            }
        };
        QueryStore.prototype.stopQuery = function (queryId) {
            delete this.store[queryId];
        };
        QueryStore.prototype.reset = function (observableQueryIds) {
            var _this = this;
            Object.keys(this.store).forEach(function (queryId) {
                if (observableQueryIds.indexOf(queryId) < 0) {
                    _this.stopQuery(queryId);
                }
                else {
                    _this.store[queryId].networkStatus = NetworkStatus.loading;
                }
            });
        };
        return QueryStore;
    }());

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    var LocalState = (function () {
        function LocalState(_a) {
            var cache = _a.cache, client = _a.client, resolvers = _a.resolvers, fragmentMatcher = _a.fragmentMatcher;
            this.cache = cache;
            if (client) {
                this.client = client;
            }
            if (resolvers) {
                this.addResolvers(resolvers);
            }
            if (fragmentMatcher) {
                this.setFragmentMatcher(fragmentMatcher);
            }
        }
        LocalState.prototype.addResolvers = function (resolvers) {
            var _this = this;
            this.resolvers = this.resolvers || {};
            if (Array.isArray(resolvers)) {
                resolvers.forEach(function (resolverGroup) {
                    _this.resolvers = mergeDeep(_this.resolvers, resolverGroup);
                });
            }
            else {
                this.resolvers = mergeDeep(this.resolvers, resolvers);
            }
        };
        LocalState.prototype.setResolvers = function (resolvers) {
            this.resolvers = {};
            this.addResolvers(resolvers);
        };
        LocalState.prototype.getResolvers = function () {
            return this.resolvers || {};
        };
        LocalState.prototype.runResolvers = function (_a) {
            var document = _a.document, remoteResult = _a.remoteResult, context = _a.context, variables = _a.variables, _b = _a.onlyRunForcedResolvers, onlyRunForcedResolvers = _b === void 0 ? false : _b;
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_c) {
                    if (document) {
                        return [2, this.resolveDocument(document, remoteResult.data, context, variables, this.fragmentMatcher, onlyRunForcedResolvers).then(function (localResult) { return (__assign({}, remoteResult, { data: localResult.result })); })];
                    }
                    return [2, remoteResult];
                });
            });
        };
        LocalState.prototype.setFragmentMatcher = function (fragmentMatcher) {
            this.fragmentMatcher = fragmentMatcher;
        };
        LocalState.prototype.getFragmentMatcher = function () {
            return this.fragmentMatcher;
        };
        LocalState.prototype.clientQuery = function (document) {
            if (hasDirectives(['client'], document)) {
                if (this.resolvers) {
                    return document;
                }
                 invariant.warn('Found @client directives in a query but no ApolloClient resolvers ' +
                    'were specified. This means ApolloClient local resolver handling ' +
                    'has been disabled, and @client directives will be passed through ' +
                    'to your link chain.');
            }
            return null;
        };
        LocalState.prototype.serverQuery = function (document) {
            return this.resolvers ? removeClientSetsFromDocument(document) : document;
        };
        LocalState.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var cache = this.cache;
            var newContext = __assign({}, context, { cache: cache, getCacheKey: function (obj) {
                    if (cache.config) {
                        return cache.config.dataIdFromObject(obj);
                    }
                    else {
                         invariant(false, 'To use context.getCacheKey, you need to use a cache that has ' +
                            'a configurable dataIdFromObject, like apollo-cache-inmemory.');
                    }
                } });
            return newContext;
        };
        LocalState.prototype.addExportedVariables = function (document, variables, context) {
            if (variables === void 0) { variables = {}; }
            if (context === void 0) { context = {}; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (document) {
                        return [2, this.resolveDocument(document, this.buildRootValueFromCache(document, variables) || {}, this.prepareContext(context), variables).then(function (data) { return (__assign({}, variables, data.exportedVariables)); })];
                    }
                    return [2, __assign({}, variables)];
                });
            });
        };
        LocalState.prototype.shouldForceResolvers = function (document) {
            var forceResolvers = false;
            visit(document, {
                Directive: {
                    enter: function (node) {
                        if (node.name.value === 'client' && node.arguments) {
                            forceResolvers = node.arguments.some(function (arg) {
                                return arg.name.value === 'always' &&
                                    arg.value.kind === 'BooleanValue' &&
                                    arg.value.value === true;
                            });
                            if (forceResolvers) {
                                return BREAK;
                            }
                        }
                    },
                },
            });
            return forceResolvers;
        };
        LocalState.prototype.buildRootValueFromCache = function (document, variables) {
            return this.cache.diff({
                query: buildQueryFromSelectionSet(document),
                variables: variables,
                returnPartialData: true,
                optimistic: false,
            }).result;
        };
        LocalState.prototype.resolveDocument = function (document, rootValue, context, variables, fragmentMatcher, onlyRunForcedResolvers) {
            if (context === void 0) { context = {}; }
            if (variables === void 0) { variables = {}; }
            if (fragmentMatcher === void 0) { fragmentMatcher = function () { return true; }; }
            if (onlyRunForcedResolvers === void 0) { onlyRunForcedResolvers = false; }
            return __awaiter(this, void 0, void 0, function () {
                var mainDefinition, fragments, fragmentMap, definitionOperation, defaultOperationType, _a, cache, client, execContext;
                return __generator(this, function (_b) {
                    mainDefinition = getMainDefinition(document);
                    fragments = getFragmentDefinitions(document);
                    fragmentMap = createFragmentMap(fragments);
                    definitionOperation = mainDefinition
                        .operation;
                    defaultOperationType = definitionOperation
                        ? capitalizeFirstLetter(definitionOperation)
                        : 'Query';
                    _a = this, cache = _a.cache, client = _a.client;
                    execContext = {
                        fragmentMap: fragmentMap,
                        context: __assign({}, context, { cache: cache,
                            client: client }),
                        variables: variables,
                        fragmentMatcher: fragmentMatcher,
                        defaultOperationType: defaultOperationType,
                        exportedVariables: {},
                        onlyRunForcedResolvers: onlyRunForcedResolvers,
                    };
                    return [2, this.resolveSelectionSet(mainDefinition.selectionSet, rootValue, execContext).then(function (result) { return ({
                            result: result,
                            exportedVariables: execContext.exportedVariables,
                        }); })];
                });
            });
        };
        LocalState.prototype.resolveSelectionSet = function (selectionSet, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var fragmentMap, context, variables, resultsToMerge, execute;
                var _this = this;
                return __generator(this, function (_a) {
                    fragmentMap = execContext.fragmentMap, context = execContext.context, variables = execContext.variables;
                    resultsToMerge = [rootValue];
                    execute = function (selection) { return __awaiter(_this, void 0, void 0, function () {
                        var fragment, typeCondition;
                        return __generator(this, function (_a) {
                            if (!shouldInclude(selection, variables)) {
                                return [2];
                            }
                            if (isField(selection)) {
                                return [2, this.resolveField(selection, rootValue, execContext).then(function (fieldResult) {
                                        var _a;
                                        if (typeof fieldResult !== 'undefined') {
                                            resultsToMerge.push((_a = {},
                                                _a[resultKeyNameFromField(selection)] = fieldResult,
                                                _a));
                                        }
                                    })];
                            }
                            if (isInlineFragment(selection)) {
                                fragment = selection;
                            }
                            else {
                                fragment = fragmentMap[selection.name.value];
                                 invariant(fragment, "No fragment named " + selection.name.value);
                            }
                            if (fragment && fragment.typeCondition) {
                                typeCondition = fragment.typeCondition.name.value;
                                if (execContext.fragmentMatcher(rootValue, typeCondition, context)) {
                                    return [2, this.resolveSelectionSet(fragment.selectionSet, rootValue, execContext).then(function (fragmentResult) {
                                            resultsToMerge.push(fragmentResult);
                                        })];
                                }
                            }
                            return [2];
                        });
                    }); };
                    return [2, Promise.all(selectionSet.selections.map(execute)).then(function () {
                            return mergeDeepArray(resultsToMerge);
                        })];
                });
            });
        };
        LocalState.prototype.resolveField = function (field, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var variables, fieldName, aliasedFieldName, aliasUsed, defaultResult, resultPromise, resolverType, resolverMap, resolve;
                var _this = this;
                return __generator(this, function (_a) {
                    variables = execContext.variables;
                    fieldName = field.name.value;
                    aliasedFieldName = resultKeyNameFromField(field);
                    aliasUsed = fieldName !== aliasedFieldName;
                    defaultResult = rootValue[aliasedFieldName] || rootValue[fieldName];
                    resultPromise = Promise.resolve(defaultResult);
                    if (!execContext.onlyRunForcedResolvers ||
                        this.shouldForceResolvers(field)) {
                        resolverType = rootValue.__typename || execContext.defaultOperationType;
                        resolverMap = this.resolvers && this.resolvers[resolverType];
                        if (resolverMap) {
                            resolve = resolverMap[aliasUsed ? fieldName : aliasedFieldName];
                            if (resolve) {
                                resultPromise = Promise.resolve(resolve(rootValue, argumentsObjectFromField(field, variables), execContext.context, { field: field }));
                            }
                        }
                    }
                    return [2, resultPromise.then(function (result) {
                            if (result === void 0) { result = defaultResult; }
                            if (field.directives) {
                                field.directives.forEach(function (directive) {
                                    if (directive.name.value === 'export' && directive.arguments) {
                                        directive.arguments.forEach(function (arg) {
                                            if (arg.name.value === 'as' && arg.value.kind === 'StringValue') {
                                                execContext.exportedVariables[arg.value.value] = result;
                                            }
                                        });
                                    }
                                });
                            }
                            if (!field.selectionSet) {
                                return result;
                            }
                            if (result == null) {
                                return result;
                            }
                            if (Array.isArray(result)) {
                                return _this.resolveSubSelectedArray(field, result, execContext);
                            }
                            if (field.selectionSet) {
                                return _this.resolveSelectionSet(field.selectionSet, result, execContext);
                            }
                        })];
                });
            });
        };
        LocalState.prototype.resolveSubSelectedArray = function (field, result, execContext) {
            var _this = this;
            return Promise.all(result.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return _this.resolveSubSelectedArray(field, item, execContext);
                }
                if (field.selectionSet) {
                    return _this.resolveSelectionSet(field.selectionSet, item, execContext);
                }
            }));
        };
        return LocalState;
    }());

    function multiplex(inner) {
        var observers = new Set();
        var sub = null;
        return new Observable$1(function (observer) {
            observers.add(observer);
            sub = sub || inner.subscribe({
                next: function (value) {
                    observers.forEach(function (obs) { return obs.next && obs.next(value); });
                },
                error: function (error) {
                    observers.forEach(function (obs) { return obs.error && obs.error(error); });
                },
                complete: function () {
                    observers.forEach(function (obs) { return obs.complete && obs.complete(); });
                },
            });
            return function () {
                if (observers.delete(observer) && !observers.size && sub) {
                    sub.unsubscribe();
                    sub = null;
                }
            };
        });
    }
    function asyncMap(observable, mapFn) {
        return new Observable$1(function (observer) {
            var next = observer.next, error = observer.error, complete = observer.complete;
            var activeNextCount = 0;
            var completed = false;
            var handler = {
                next: function (value) {
                    ++activeNextCount;
                    new Promise(function (resolve) {
                        resolve(mapFn(value));
                    }).then(function (result) {
                        --activeNextCount;
                        next && next.call(observer, result);
                        completed && handler.complete();
                    }, function (e) {
                        --activeNextCount;
                        error && error.call(observer, e);
                    });
                },
                error: function (e) {
                    error && error.call(observer, e);
                },
                complete: function () {
                    completed = true;
                    if (!activeNextCount) {
                        complete && complete.call(observer);
                    }
                },
            };
            var sub = observable.subscribe(handler);
            return function () { return sub.unsubscribe(); };
        });
    }

    var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
    var QueryManager = (function () {
        function QueryManager(_a) {
            var link = _a.link, _b = _a.queryDeduplication, queryDeduplication = _b === void 0 ? false : _b, store = _a.store, _c = _a.onBroadcast, onBroadcast = _c === void 0 ? function () { return undefined; } : _c, _d = _a.ssrMode, ssrMode = _d === void 0 ? false : _d, _e = _a.clientAwareness, clientAwareness = _e === void 0 ? {} : _e, localState = _a.localState, assumeImmutableResults = _a.assumeImmutableResults;
            this.mutationStore = new MutationStore();
            this.queryStore = new QueryStore();
            this.clientAwareness = {};
            this.idCounter = 1;
            this.queries = new Map();
            this.fetchQueryRejectFns = new Map();
            this.transformCache = new (canUseWeakMap ? WeakMap : Map)();
            this.inFlightLinkObservables = new Map();
            this.pollingInfoByQueryId = new Map();
            this.link = link;
            this.queryDeduplication = queryDeduplication;
            this.dataStore = store;
            this.onBroadcast = onBroadcast;
            this.clientAwareness = clientAwareness;
            this.localState = localState || new LocalState({ cache: store.getCache() });
            this.ssrMode = ssrMode;
            this.assumeImmutableResults = !!assumeImmutableResults;
        }
        QueryManager.prototype.stop = function () {
            var _this = this;
            this.queries.forEach(function (_info, queryId) {
                _this.stopQueryNoBroadcast(queryId);
            });
            this.fetchQueryRejectFns.forEach(function (reject) {
                reject( new InvariantError('QueryManager stopped while query was in flight'));
            });
        };
        QueryManager.prototype.mutate = function (_a) {
            var mutation = _a.mutation, variables = _a.variables, optimisticResponse = _a.optimisticResponse, updateQueriesByName = _a.updateQueries, _b = _a.refetchQueries, refetchQueries = _b === void 0 ? [] : _b, _c = _a.awaitRefetchQueries, awaitRefetchQueries = _c === void 0 ? false : _c, updateWithProxyFn = _a.update, _d = _a.errorPolicy, errorPolicy = _d === void 0 ? 'none' : _d, fetchPolicy = _a.fetchPolicy, _e = _a.context, context = _e === void 0 ? {} : _e;
            return __awaiter(this, void 0, void 0, function () {
                var mutationId, generateUpdateQueriesInfo, self;
                var _this = this;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                             invariant(mutation, 'mutation option is required. You must specify your GraphQL document in the mutation option.');
                             invariant(!fetchPolicy || fetchPolicy === 'no-cache', "fetchPolicy for mutations currently only supports the 'no-cache' policy");
                            mutationId = this.generateQueryId();
                            mutation = this.transform(mutation).document;
                            this.setQuery(mutationId, function () { return ({ document: mutation }); });
                            variables = this.getVariables(mutation, variables);
                            if (!this.transform(mutation).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(mutation, variables, context)];
                        case 1:
                            variables = _f.sent();
                            _f.label = 2;
                        case 2:
                            generateUpdateQueriesInfo = function () {
                                var ret = {};
                                if (updateQueriesByName) {
                                    _this.queries.forEach(function (_a, queryId) {
                                        var observableQuery = _a.observableQuery;
                                        if (observableQuery) {
                                            var queryName = observableQuery.queryName;
                                            if (queryName &&
                                                hasOwnProperty$2.call(updateQueriesByName, queryName)) {
                                                ret[queryId] = {
                                                    updater: updateQueriesByName[queryName],
                                                    query: _this.queryStore.get(queryId),
                                                };
                                            }
                                        }
                                    });
                                }
                                return ret;
                            };
                            this.mutationStore.initMutation(mutationId, mutation, variables);
                            this.dataStore.markMutationInit({
                                mutationId: mutationId,
                                document: mutation,
                                variables: variables,
                                updateQueries: generateUpdateQueriesInfo(),
                                update: updateWithProxyFn,
                                optimisticResponse: optimisticResponse,
                            });
                            this.broadcastQueries();
                            self = this;
                            return [2, new Promise(function (resolve, reject) {
                                    var storeResult;
                                    var error;
                                    self.getObservableFromLink(mutation, __assign({}, context, { optimisticResponse: optimisticResponse }), variables, false).subscribe({
                                        next: function (result) {
                                            if (graphQLResultHasError(result) && errorPolicy === 'none') {
                                                error = new ApolloError({
                                                    graphQLErrors: result.errors,
                                                });
                                                return;
                                            }
                                            self.mutationStore.markMutationResult(mutationId);
                                            if (fetchPolicy !== 'no-cache') {
                                                self.dataStore.markMutationResult({
                                                    mutationId: mutationId,
                                                    result: result,
                                                    document: mutation,
                                                    variables: variables,
                                                    updateQueries: generateUpdateQueriesInfo(),
                                                    update: updateWithProxyFn,
                                                });
                                            }
                                            storeResult = result;
                                        },
                                        error: function (err) {
                                            self.mutationStore.markMutationError(mutationId, err);
                                            self.dataStore.markMutationComplete({
                                                mutationId: mutationId,
                                                optimisticResponse: optimisticResponse,
                                            });
                                            self.broadcastQueries();
                                            self.setQuery(mutationId, function () { return ({ document: null }); });
                                            reject(new ApolloError({
                                                networkError: err,
                                            }));
                                        },
                                        complete: function () {
                                            if (error) {
                                                self.mutationStore.markMutationError(mutationId, error);
                                            }
                                            self.dataStore.markMutationComplete({
                                                mutationId: mutationId,
                                                optimisticResponse: optimisticResponse,
                                            });
                                            self.broadcastQueries();
                                            if (error) {
                                                reject(error);
                                                return;
                                            }
                                            if (typeof refetchQueries === 'function') {
                                                refetchQueries = refetchQueries(storeResult);
                                            }
                                            var refetchQueryPromises = [];
                                            if (isNonEmptyArray(refetchQueries)) {
                                                refetchQueries.forEach(function (refetchQuery) {
                                                    if (typeof refetchQuery === 'string') {
                                                        self.queries.forEach(function (_a) {
                                                            var observableQuery = _a.observableQuery;
                                                            if (observableQuery &&
                                                                observableQuery.queryName === refetchQuery) {
                                                                refetchQueryPromises.push(observableQuery.refetch());
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        var queryOptions = {
                                                            query: refetchQuery.query,
                                                            variables: refetchQuery.variables,
                                                            fetchPolicy: 'network-only',
                                                        };
                                                        if (refetchQuery.context) {
                                                            queryOptions.context = refetchQuery.context;
                                                        }
                                                        refetchQueryPromises.push(self.query(queryOptions));
                                                    }
                                                });
                                            }
                                            Promise.all(awaitRefetchQueries ? refetchQueryPromises : []).then(function () {
                                                self.setQuery(mutationId, function () { return ({ document: null }); });
                                                if (errorPolicy === 'ignore' &&
                                                    storeResult &&
                                                    graphQLResultHasError(storeResult)) {
                                                    delete storeResult.errors;
                                                }
                                                resolve(storeResult);
                                            });
                                        },
                                    });
                                })];
                    }
                });
            });
        };
        QueryManager.prototype.fetchQuery = function (queryId, options, fetchType, fetchMoreForQueryId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, metadata, _b, fetchPolicy, _c, context, query, variables, storeResult, isNetworkOnly, needToFetch, _d, complete, result, shouldFetch, requestId, cancel, networkResult;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = options.metadata, metadata = _a === void 0 ? null : _a, _b = options.fetchPolicy, fetchPolicy = _b === void 0 ? 'cache-first' : _b, _c = options.context, context = _c === void 0 ? {} : _c;
                            query = this.transform(options.query).document;
                            variables = this.getVariables(query, options.variables);
                            if (!this.transform(query).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(query, variables, context)];
                        case 1:
                            variables = _e.sent();
                            _e.label = 2;
                        case 2:
                            options = __assign({}, options, { variables: variables });
                            isNetworkOnly = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
                            needToFetch = isNetworkOnly;
                            if (!isNetworkOnly) {
                                _d = this.dataStore.getCache().diff({
                                    query: query,
                                    variables: variables,
                                    returnPartialData: true,
                                    optimistic: false,
                                }), complete = _d.complete, result = _d.result;
                                needToFetch = !complete || fetchPolicy === 'cache-and-network';
                                storeResult = result;
                            }
                            shouldFetch = needToFetch && fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby';
                            if (hasDirectives(['live'], query))
                                shouldFetch = true;
                            requestId = this.idCounter++;
                            cancel = fetchPolicy !== 'no-cache'
                                ? this.updateQueryWatch(queryId, query, options)
                                : undefined;
                            this.setQuery(queryId, function () { return ({
                                document: query,
                                lastRequestId: requestId,
                                invalidated: true,
                                cancel: cancel,
                            }); });
                            this.invalidate(fetchMoreForQueryId);
                            this.queryStore.initQuery({
                                queryId: queryId,
                                document: query,
                                storePreviousVariables: shouldFetch,
                                variables: variables,
                                isPoll: fetchType === FetchType.poll,
                                isRefetch: fetchType === FetchType.refetch,
                                metadata: metadata,
                                fetchMoreForQueryId: fetchMoreForQueryId,
                            });
                            this.broadcastQueries();
                            if (shouldFetch) {
                                networkResult = this.fetchRequest({
                                    requestId: requestId,
                                    queryId: queryId,
                                    document: query,
                                    options: options,
                                    fetchMoreForQueryId: fetchMoreForQueryId,
                                }).catch(function (error) {
                                    if (isApolloError(error)) {
                                        throw error;
                                    }
                                    else {
                                        if (requestId >= _this.getQuery(queryId).lastRequestId) {
                                            _this.queryStore.markQueryError(queryId, error, fetchMoreForQueryId);
                                            _this.invalidate(queryId);
                                            _this.invalidate(fetchMoreForQueryId);
                                            _this.broadcastQueries();
                                        }
                                        throw new ApolloError({ networkError: error });
                                    }
                                });
                                if (fetchPolicy !== 'cache-and-network') {
                                    return [2, networkResult];
                                }
                                networkResult.catch(function () { });
                            }
                            this.queryStore.markQueryResultClient(queryId, !shouldFetch);
                            this.invalidate(queryId);
                            this.invalidate(fetchMoreForQueryId);
                            if (this.transform(query).hasForcedResolvers) {
                                return [2, this.localState.runResolvers({
                                        document: query,
                                        remoteResult: { data: storeResult },
                                        context: context,
                                        variables: variables,
                                        onlyRunForcedResolvers: true,
                                    }).then(function (result) {
                                        _this.markQueryResult(queryId, result, options, fetchMoreForQueryId);
                                        _this.broadcastQueries();
                                        return result;
                                    })];
                            }
                            this.broadcastQueries();
                            return [2, { data: storeResult }];
                    }
                });
            });
        };
        QueryManager.prototype.markQueryResult = function (queryId, result, _a, fetchMoreForQueryId) {
            var fetchPolicy = _a.fetchPolicy, variables = _a.variables, errorPolicy = _a.errorPolicy;
            if (fetchPolicy === 'no-cache') {
                this.setQuery(queryId, function () { return ({
                    newData: { result: result.data, complete: true },
                }); });
            }
            else {
                this.dataStore.markQueryResult(result, this.getQuery(queryId).document, variables, fetchMoreForQueryId, errorPolicy === 'ignore' || errorPolicy === 'all');
            }
        };
        QueryManager.prototype.queryListenerForObserver = function (queryId, options, observer) {
            var _this = this;
            function invoke(method, argument) {
                if (observer[method]) {
                    try {
                        observer[method](argument);
                    }
                    catch (e) {
                         invariant.error(e);
                    }
                }
                else if (method === 'error') {
                     invariant.error(argument);
                }
            }
            return function (queryStoreValue, newData) {
                _this.invalidate(queryId, false);
                if (!queryStoreValue)
                    return;
                var _a = _this.getQuery(queryId), observableQuery = _a.observableQuery, document = _a.document;
                var fetchPolicy = observableQuery
                    ? observableQuery.options.fetchPolicy
                    : options.fetchPolicy;
                if (fetchPolicy === 'standby')
                    return;
                var loading = isNetworkRequestInFlight(queryStoreValue.networkStatus);
                var lastResult = observableQuery && observableQuery.getLastResult();
                var networkStatusChanged = !!(lastResult &&
                    lastResult.networkStatus !== queryStoreValue.networkStatus);
                var shouldNotifyIfLoading = options.returnPartialData ||
                    (!newData && queryStoreValue.previousVariables) ||
                    (networkStatusChanged && options.notifyOnNetworkStatusChange) ||
                    fetchPolicy === 'cache-only' ||
                    fetchPolicy === 'cache-and-network';
                if (loading && !shouldNotifyIfLoading) {
                    return;
                }
                var hasGraphQLErrors = isNonEmptyArray(queryStoreValue.graphQLErrors);
                var errorPolicy = observableQuery
                    && observableQuery.options.errorPolicy
                    || options.errorPolicy
                    || 'none';
                if (errorPolicy === 'none' && hasGraphQLErrors || queryStoreValue.networkError) {
                    return invoke('error', new ApolloError({
                        graphQLErrors: queryStoreValue.graphQLErrors,
                        networkError: queryStoreValue.networkError,
                    }));
                }
                try {
                    var data = void 0;
                    var isMissing = void 0;
                    if (newData) {
                        if (fetchPolicy !== 'no-cache' && fetchPolicy !== 'network-only') {
                            _this.setQuery(queryId, function () { return ({ newData: null }); });
                        }
                        data = newData.result;
                        isMissing = !newData.complete;
                    }
                    else {
                        var lastError = observableQuery && observableQuery.getLastError();
                        var errorStatusChanged = errorPolicy !== 'none' &&
                            (lastError && lastError.graphQLErrors) !==
                                queryStoreValue.graphQLErrors;
                        if (lastResult && lastResult.data && !errorStatusChanged) {
                            data = lastResult.data;
                            isMissing = false;
                        }
                        else {
                            var diffResult = _this.dataStore.getCache().diff({
                                query: document,
                                variables: queryStoreValue.previousVariables ||
                                    queryStoreValue.variables,
                                returnPartialData: true,
                                optimistic: true,
                            });
                            data = diffResult.result;
                            isMissing = !diffResult.complete;
                        }
                    }
                    var stale = isMissing && !(options.returnPartialData ||
                        fetchPolicy === 'cache-only');
                    var resultFromStore = {
                        data: stale ? lastResult && lastResult.data : data,
                        loading: loading,
                        networkStatus: queryStoreValue.networkStatus,
                        stale: stale,
                    };
                    if (errorPolicy === 'all' && hasGraphQLErrors) {
                        resultFromStore.errors = queryStoreValue.graphQLErrors;
                    }
                    invoke('next', resultFromStore);
                }
                catch (networkError) {
                    invoke('error', new ApolloError({ networkError: networkError }));
                }
            };
        };
        QueryManager.prototype.transform = function (document) {
            var transformCache = this.transformCache;
            if (!transformCache.has(document)) {
                var cache = this.dataStore.getCache();
                var transformed = cache.transformDocument(document);
                var forLink = removeConnectionDirectiveFromDocument(cache.transformForLink(transformed));
                var clientQuery = this.localState.clientQuery(transformed);
                var serverQuery = this.localState.serverQuery(forLink);
                var cacheEntry_1 = {
                    document: transformed,
                    hasClientExports: hasClientExports(transformed),
                    hasForcedResolvers: this.localState.shouldForceResolvers(transformed),
                    clientQuery: clientQuery,
                    serverQuery: serverQuery,
                    defaultVars: getDefaultValues(getOperationDefinition(transformed)),
                };
                var add = function (doc) {
                    if (doc && !transformCache.has(doc)) {
                        transformCache.set(doc, cacheEntry_1);
                    }
                };
                add(document);
                add(transformed);
                add(clientQuery);
                add(serverQuery);
            }
            return transformCache.get(document);
        };
        QueryManager.prototype.getVariables = function (document, variables) {
            return __assign({}, this.transform(document).defaultVars, variables);
        };
        QueryManager.prototype.watchQuery = function (options, shouldSubscribe) {
            if (shouldSubscribe === void 0) { shouldSubscribe = true; }
             invariant(options.fetchPolicy !== 'standby', 'client.watchQuery cannot be called with fetchPolicy set to "standby"');
            options.variables = this.getVariables(options.query, options.variables);
            if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
                options.notifyOnNetworkStatusChange = false;
            }
            var transformedOptions = __assign({}, options);
            return new ObservableQuery({
                queryManager: this,
                options: transformedOptions,
                shouldSubscribe: shouldSubscribe,
            });
        };
        QueryManager.prototype.query = function (options) {
            var _this = this;
             invariant(options.query, 'query option is required. You must specify your GraphQL document ' +
                'in the query option.');
             invariant(options.query.kind === 'Document', 'You must wrap the query string in a "gql" tag.');
             invariant(!options.returnPartialData, 'returnPartialData option only supported on watchQuery.');
             invariant(!options.pollInterval, 'pollInterval option only supported on watchQuery.');
            return new Promise(function (resolve, reject) {
                var watchedQuery = _this.watchQuery(options, false);
                _this.fetchQueryRejectFns.set("query:" + watchedQuery.queryId, reject);
                watchedQuery
                    .result()
                    .then(resolve, reject)
                    .then(function () {
                    return _this.fetchQueryRejectFns.delete("query:" + watchedQuery.queryId);
                });
            });
        };
        QueryManager.prototype.generateQueryId = function () {
            return String(this.idCounter++);
        };
        QueryManager.prototype.stopQueryInStore = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryInStoreNoBroadcast = function (queryId) {
            this.stopPollingQuery(queryId);
            this.queryStore.stopQuery(queryId);
            this.invalidate(queryId);
        };
        QueryManager.prototype.addQueryListener = function (queryId, listener) {
            this.setQuery(queryId, function (_a) {
                var listeners = _a.listeners;
                listeners.add(listener);
                return { invalidated: false };
            });
        };
        QueryManager.prototype.updateQueryWatch = function (queryId, document, options) {
            var _this = this;
            var cancel = this.getQuery(queryId).cancel;
            if (cancel)
                cancel();
            var previousResult = function () {
                var previousResult = null;
                var observableQuery = _this.getQuery(queryId).observableQuery;
                if (observableQuery) {
                    var lastResult = observableQuery.getLastResult();
                    if (lastResult) {
                        previousResult = lastResult.data;
                    }
                }
                return previousResult;
            };
            return this.dataStore.getCache().watch({
                query: document,
                variables: options.variables,
                optimistic: true,
                previousResult: previousResult,
                callback: function (newData) {
                    _this.setQuery(queryId, function () { return ({ invalidated: true, newData: newData }); });
                },
            });
        };
        QueryManager.prototype.addObservableQuery = function (queryId, observableQuery) {
            this.setQuery(queryId, function () { return ({ observableQuery: observableQuery }); });
        };
        QueryManager.prototype.removeObservableQuery = function (queryId) {
            var cancel = this.getQuery(queryId).cancel;
            this.setQuery(queryId, function () { return ({ observableQuery: null }); });
            if (cancel)
                cancel();
        };
        QueryManager.prototype.clearStore = function () {
            this.fetchQueryRejectFns.forEach(function (reject) {
                reject( new InvariantError('Store reset while query was in flight (not completed in link chain)'));
            });
            var resetIds = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery)
                    resetIds.push(queryId);
            });
            this.queryStore.reset(resetIds);
            this.mutationStore.reset();
            return this.dataStore.reset();
        };
        QueryManager.prototype.resetStore = function () {
            var _this = this;
            return this.clearStore().then(function () {
                return _this.reFetchObservableQueries();
            });
        };
        QueryManager.prototype.reFetchObservableQueries = function (includeStandby) {
            var _this = this;
            if (includeStandby === void 0) { includeStandby = false; }
            var observableQueryPromises = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery) {
                    var fetchPolicy = observableQuery.options.fetchPolicy;
                    observableQuery.resetLastResults();
                    if (fetchPolicy !== 'cache-only' &&
                        (includeStandby || fetchPolicy !== 'standby')) {
                        observableQueryPromises.push(observableQuery.refetch());
                    }
                    _this.setQuery(queryId, function () { return ({ newData: null }); });
                    _this.invalidate(queryId);
                }
            });
            this.broadcastQueries();
            return Promise.all(observableQueryPromises);
        };
        QueryManager.prototype.observeQuery = function (queryId, options, observer) {
            this.addQueryListener(queryId, this.queryListenerForObserver(queryId, options, observer));
            return this.fetchQuery(queryId, options);
        };
        QueryManager.prototype.startQuery = function (queryId, options, listener) {
             invariant.warn("The QueryManager.startQuery method has been deprecated");
            this.addQueryListener(queryId, listener);
            this.fetchQuery(queryId, options)
                .catch(function () { return undefined; });
            return queryId;
        };
        QueryManager.prototype.startGraphQLSubscription = function (_a) {
            var _this = this;
            var query = _a.query, fetchPolicy = _a.fetchPolicy, variables = _a.variables;
            query = this.transform(query).document;
            variables = this.getVariables(query, variables);
            var makeObservable = function (variables) {
                return _this.getObservableFromLink(query, {}, variables, false).map(function (result) {
                    if (!fetchPolicy || fetchPolicy !== 'no-cache') {
                        _this.dataStore.markSubscriptionResult(result, query, variables);
                        _this.broadcastQueries();
                    }
                    if (graphQLResultHasError(result)) {
                        throw new ApolloError({
                            graphQLErrors: result.errors,
                        });
                    }
                    return result;
                });
            };
            if (this.transform(query).hasClientExports) {
                var observablePromise_1 = this.localState.addExportedVariables(query, variables).then(makeObservable);
                return new Observable$1(function (observer) {
                    var sub = null;
                    observablePromise_1.then(function (observable) { return sub = observable.subscribe(observer); }, observer.error);
                    return function () { return sub && sub.unsubscribe(); };
                });
            }
            return makeObservable(variables);
        };
        QueryManager.prototype.stopQuery = function (queryId) {
            this.stopQueryNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryNoBroadcast = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.removeQuery(queryId);
        };
        QueryManager.prototype.removeQuery = function (queryId) {
            this.fetchQueryRejectFns.delete("query:" + queryId);
            this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
            this.getQuery(queryId).subscriptions.forEach(function (x) { return x.unsubscribe(); });
            this.queries.delete(queryId);
        };
        QueryManager.prototype.getCurrentQueryResult = function (observableQuery, optimistic) {
            if (optimistic === void 0) { optimistic = true; }
            var _a = observableQuery.options, variables = _a.variables, query = _a.query, fetchPolicy = _a.fetchPolicy, returnPartialData = _a.returnPartialData;
            var lastResult = observableQuery.getLastResult();
            var newData = this.getQuery(observableQuery.queryId).newData;
            if (newData && newData.complete) {
                return { data: newData.result, partial: false };
            }
            if (fetchPolicy === 'no-cache' || fetchPolicy === 'network-only') {
                return { data: undefined, partial: false };
            }
            var _b = this.dataStore.getCache().diff({
                query: query,
                variables: variables,
                previousResult: lastResult ? lastResult.data : undefined,
                returnPartialData: true,
                optimistic: optimistic,
            }), result = _b.result, complete = _b.complete;
            return {
                data: (complete || returnPartialData) ? result : void 0,
                partial: !complete,
            };
        };
        QueryManager.prototype.getQueryWithPreviousResult = function (queryIdOrObservable) {
            var observableQuery;
            if (typeof queryIdOrObservable === 'string') {
                var foundObserveableQuery = this.getQuery(queryIdOrObservable).observableQuery;
                 invariant(foundObserveableQuery, "ObservableQuery with this id doesn't exist: " + queryIdOrObservable);
                observableQuery = foundObserveableQuery;
            }
            else {
                observableQuery = queryIdOrObservable;
            }
            var _a = observableQuery.options, variables = _a.variables, query = _a.query;
            return {
                previousResult: this.getCurrentQueryResult(observableQuery, false).data,
                variables: variables,
                document: query,
            };
        };
        QueryManager.prototype.broadcastQueries = function () {
            var _this = this;
            this.onBroadcast();
            this.queries.forEach(function (info, id) {
                if (info.invalidated) {
                    info.listeners.forEach(function (listener) {
                        if (listener) {
                            listener(_this.queryStore.get(id), info.newData);
                        }
                    });
                }
            });
        };
        QueryManager.prototype.getLocalState = function () {
            return this.localState;
        };
        QueryManager.prototype.getObservableFromLink = function (query, context, variables, deduplication) {
            var _this = this;
            if (deduplication === void 0) { deduplication = this.queryDeduplication; }
            var observable;
            var serverQuery = this.transform(query).serverQuery;
            if (serverQuery) {
                var _a = this, inFlightLinkObservables_1 = _a.inFlightLinkObservables, link = _a.link;
                var operation = {
                    query: serverQuery,
                    variables: variables,
                    operationName: getOperationName(serverQuery) || void 0,
                    context: this.prepareContext(__assign({}, context, { forceFetch: !deduplication })),
                };
                context = operation.context;
                if (deduplication) {
                    var byVariables_1 = inFlightLinkObservables_1.get(serverQuery) || new Map();
                    inFlightLinkObservables_1.set(serverQuery, byVariables_1);
                    var varJson_1 = JSON.stringify(variables);
                    observable = byVariables_1.get(varJson_1);
                    if (!observable) {
                        byVariables_1.set(varJson_1, observable = multiplex(execute(link, operation)));
                        var cleanup = function () {
                            byVariables_1.delete(varJson_1);
                            if (!byVariables_1.size)
                                inFlightLinkObservables_1.delete(serverQuery);
                            cleanupSub_1.unsubscribe();
                        };
                        var cleanupSub_1 = observable.subscribe({
                            next: cleanup,
                            error: cleanup,
                            complete: cleanup,
                        });
                    }
                }
                else {
                    observable = multiplex(execute(link, operation));
                }
            }
            else {
                observable = Observable$1.of({ data: {} });
                context = this.prepareContext(context);
            }
            var clientQuery = this.transform(query).clientQuery;
            if (clientQuery) {
                observable = asyncMap(observable, function (result) {
                    return _this.localState.runResolvers({
                        document: clientQuery,
                        remoteResult: result,
                        context: context,
                        variables: variables,
                    });
                });
            }
            return observable;
        };
        QueryManager.prototype.fetchRequest = function (_a) {
            var _this = this;
            var requestId = _a.requestId, queryId = _a.queryId, document = _a.document, options = _a.options, fetchMoreForQueryId = _a.fetchMoreForQueryId;
            var variables = options.variables, _b = options.errorPolicy, errorPolicy = _b === void 0 ? 'none' : _b, fetchPolicy = options.fetchPolicy;
            var resultFromStore;
            var errorsFromStore;
            return new Promise(function (resolve, reject) {
                var observable = _this.getObservableFromLink(document, options.context, variables);
                var fqrfId = "fetchRequest:" + queryId;
                _this.fetchQueryRejectFns.set(fqrfId, reject);
                var cleanup = function () {
                    _this.fetchQueryRejectFns.delete(fqrfId);
                    _this.setQuery(queryId, function (_a) {
                        var subscriptions = _a.subscriptions;
                        subscriptions.delete(subscription);
                    });
                };
                var subscription = observable.map(function (result) {
                    if (requestId >= _this.getQuery(queryId).lastRequestId) {
                        _this.markQueryResult(queryId, result, options, fetchMoreForQueryId);
                        _this.queryStore.markQueryResult(queryId, result, fetchMoreForQueryId);
                        _this.invalidate(queryId);
                        _this.invalidate(fetchMoreForQueryId);
                        _this.broadcastQueries();
                    }
                    if (errorPolicy === 'none' && isNonEmptyArray(result.errors)) {
                        return reject(new ApolloError({
                            graphQLErrors: result.errors,
                        }));
                    }
                    if (errorPolicy === 'all') {
                        errorsFromStore = result.errors;
                    }
                    if (fetchMoreForQueryId || fetchPolicy === 'no-cache') {
                        resultFromStore = result.data;
                    }
                    else {
                        var _a = _this.dataStore.getCache().diff({
                            variables: variables,
                            query: document,
                            optimistic: false,
                            returnPartialData: true,
                        }), result_1 = _a.result, complete = _a.complete;
                        if (complete || options.returnPartialData) {
                            resultFromStore = result_1;
                        }
                    }
                }).subscribe({
                    error: function (error) {
                        cleanup();
                        reject(error);
                    },
                    complete: function () {
                        cleanup();
                        resolve({
                            data: resultFromStore,
                            errors: errorsFromStore,
                            loading: false,
                            networkStatus: NetworkStatus.ready,
                            stale: false,
                        });
                    },
                });
                _this.setQuery(queryId, function (_a) {
                    var subscriptions = _a.subscriptions;
                    subscriptions.add(subscription);
                });
            });
        };
        QueryManager.prototype.getQuery = function (queryId) {
            return (this.queries.get(queryId) || {
                listeners: new Set(),
                invalidated: false,
                document: null,
                newData: null,
                lastRequestId: 1,
                observableQuery: null,
                subscriptions: new Set(),
            });
        };
        QueryManager.prototype.setQuery = function (queryId, updater) {
            var prev = this.getQuery(queryId);
            var newInfo = __assign({}, prev, updater(prev));
            this.queries.set(queryId, newInfo);
        };
        QueryManager.prototype.invalidate = function (queryId, invalidated) {
            if (invalidated === void 0) { invalidated = true; }
            if (queryId) {
                this.setQuery(queryId, function () { return ({ invalidated: invalidated }); });
            }
        };
        QueryManager.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var newContext = this.localState.prepareContext(context);
            return __assign({}, newContext, { clientAwareness: this.clientAwareness });
        };
        QueryManager.prototype.checkInFlight = function (queryId) {
            var query = this.queryStore.get(queryId);
            return (query &&
                query.networkStatus !== NetworkStatus.ready &&
                query.networkStatus !== NetworkStatus.error);
        };
        QueryManager.prototype.startPollingQuery = function (options, queryId, listener) {
            var _this = this;
            var pollInterval = options.pollInterval;
             invariant(pollInterval, 'Attempted to start a polling query without a polling interval.');
            if (!this.ssrMode) {
                var info = this.pollingInfoByQueryId.get(queryId);
                if (!info) {
                    this.pollingInfoByQueryId.set(queryId, (info = {}));
                }
                info.interval = pollInterval;
                info.options = __assign({}, options, { fetchPolicy: 'network-only' });
                var maybeFetch_1 = function () {
                    var info = _this.pollingInfoByQueryId.get(queryId);
                    if (info) {
                        if (_this.checkInFlight(queryId)) {
                            poll_1();
                        }
                        else {
                            _this.fetchQuery(queryId, info.options, FetchType.poll).then(poll_1, poll_1);
                        }
                    }
                };
                var poll_1 = function () {
                    var info = _this.pollingInfoByQueryId.get(queryId);
                    if (info) {
                        clearTimeout(info.timeout);
                        info.timeout = setTimeout(maybeFetch_1, info.interval);
                    }
                };
                if (listener) {
                    this.addQueryListener(queryId, listener);
                }
                poll_1();
            }
            return queryId;
        };
        QueryManager.prototype.stopPollingQuery = function (queryId) {
            this.pollingInfoByQueryId.delete(queryId);
        };
        return QueryManager;
    }());

    var DataStore = (function () {
        function DataStore(initialCache) {
            this.cache = initialCache;
        }
        DataStore.prototype.getCache = function () {
            return this.cache;
        };
        DataStore.prototype.markQueryResult = function (result, document, variables, fetchMoreForQueryId, ignoreErrors) {
            if (ignoreErrors === void 0) { ignoreErrors = false; }
            var writeWithErrors = !graphQLResultHasError(result);
            if (ignoreErrors && graphQLResultHasError(result) && result.data) {
                writeWithErrors = true;
            }
            if (!fetchMoreForQueryId && writeWithErrors) {
                this.cache.write({
                    result: result.data,
                    dataId: 'ROOT_QUERY',
                    query: document,
                    variables: variables,
                });
            }
        };
        DataStore.prototype.markSubscriptionResult = function (result, document, variables) {
            if (!graphQLResultHasError(result)) {
                this.cache.write({
                    result: result.data,
                    dataId: 'ROOT_SUBSCRIPTION',
                    query: document,
                    variables: variables,
                });
            }
        };
        DataStore.prototype.markMutationInit = function (mutation) {
            var _this = this;
            if (mutation.optimisticResponse) {
                var optimistic_1;
                if (typeof mutation.optimisticResponse === 'function') {
                    optimistic_1 = mutation.optimisticResponse(mutation.variables);
                }
                else {
                    optimistic_1 = mutation.optimisticResponse;
                }
                this.cache.recordOptimisticTransaction(function (c) {
                    var orig = _this.cache;
                    _this.cache = c;
                    try {
                        _this.markMutationResult({
                            mutationId: mutation.mutationId,
                            result: { data: optimistic_1 },
                            document: mutation.document,
                            variables: mutation.variables,
                            updateQueries: mutation.updateQueries,
                            update: mutation.update,
                        });
                    }
                    finally {
                        _this.cache = orig;
                    }
                }, mutation.mutationId);
            }
        };
        DataStore.prototype.markMutationResult = function (mutation) {
            var _this = this;
            if (!graphQLResultHasError(mutation.result)) {
                var cacheWrites_1 = [{
                        result: mutation.result.data,
                        dataId: 'ROOT_MUTATION',
                        query: mutation.document,
                        variables: mutation.variables,
                    }];
                var updateQueries_1 = mutation.updateQueries;
                if (updateQueries_1) {
                    Object.keys(updateQueries_1).forEach(function (id) {
                        var _a = updateQueries_1[id], query = _a.query, updater = _a.updater;
                        var _b = _this.cache.diff({
                            query: query.document,
                            variables: query.variables,
                            returnPartialData: true,
                            optimistic: false,
                        }), currentQueryResult = _b.result, complete = _b.complete;
                        if (complete) {
                            var nextQueryResult = tryFunctionOrLogError(function () {
                                return updater(currentQueryResult, {
                                    mutationResult: mutation.result,
                                    queryName: getOperationName(query.document) || undefined,
                                    queryVariables: query.variables,
                                });
                            });
                            if (nextQueryResult) {
                                cacheWrites_1.push({
                                    result: nextQueryResult,
                                    dataId: 'ROOT_QUERY',
                                    query: query.document,
                                    variables: query.variables,
                                });
                            }
                        }
                    });
                }
                this.cache.performTransaction(function (c) {
                    cacheWrites_1.forEach(function (write) { return c.write(write); });
                    var update = mutation.update;
                    if (update) {
                        tryFunctionOrLogError(function () { return update(c, mutation.result); });
                    }
                });
            }
        };
        DataStore.prototype.markMutationComplete = function (_a) {
            var mutationId = _a.mutationId, optimisticResponse = _a.optimisticResponse;
            if (optimisticResponse) {
                this.cache.removeOptimistic(mutationId);
            }
        };
        DataStore.prototype.markUpdateQueryResult = function (document, variables, newResult) {
            this.cache.write({
                result: newResult,
                dataId: 'ROOT_QUERY',
                variables: variables,
                query: document,
            });
        };
        DataStore.prototype.reset = function () {
            return this.cache.reset();
        };
        return DataStore;
    }());

    var version = "2.6.4";

    var hasSuggestedDevtools = false;
    var ApolloClient = (function () {
        function ApolloClient(options) {
            var _this = this;
            this.defaultOptions = {};
            this.resetStoreCallbacks = [];
            this.clearStoreCallbacks = [];
            var cache = options.cache, _a = options.ssrMode, ssrMode = _a === void 0 ? false : _a, _b = options.ssrForceFetchDelay, ssrForceFetchDelay = _b === void 0 ? 0 : _b, connectToDevTools = options.connectToDevTools, _c = options.queryDeduplication, queryDeduplication = _c === void 0 ? true : _c, defaultOptions = options.defaultOptions, _d = options.assumeImmutableResults, assumeImmutableResults = _d === void 0 ? false : _d, resolvers = options.resolvers, typeDefs = options.typeDefs, fragmentMatcher = options.fragmentMatcher, clientAwarenessName = options.name, clientAwarenessVersion = options.version;
            var link = options.link;
            if (!link && resolvers) {
                link = ApolloLink.empty();
            }
            if (!link || !cache) {
                throw  new InvariantError("In order to initialize Apollo Client, you must specify 'link' and 'cache' properties in the options object.\n" +
                    "These options are part of the upgrade requirements when migrating from Apollo Client 1.x to Apollo Client 2.x.\n" +
                    "For more information, please visit: https://www.apollographql.com/docs/tutorial/client.html#apollo-client-setup");
            }
            this.link = link;
            this.cache = cache;
            this.store = new DataStore(cache);
            this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
            this.queryDeduplication = queryDeduplication;
            this.defaultOptions = defaultOptions || {};
            this.typeDefs = typeDefs;
            if (ssrForceFetchDelay) {
                setTimeout(function () { return (_this.disableNetworkFetches = false); }, ssrForceFetchDelay);
            }
            this.watchQuery = this.watchQuery.bind(this);
            this.query = this.query.bind(this);
            this.mutate = this.mutate.bind(this);
            this.resetStore = this.resetStore.bind(this);
            this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
            var defaultConnectToDevTools = 
                typeof window !== 'undefined' &&
                !window.__APOLLO_CLIENT__;
            if (typeof connectToDevTools === 'undefined'
                ? defaultConnectToDevTools
                : connectToDevTools && typeof window !== 'undefined') {
                window.__APOLLO_CLIENT__ = this;
            }
            if (!hasSuggestedDevtools && "development" !== 'production') {
                hasSuggestedDevtools = true;
                if (typeof window !== 'undefined' &&
                    window.document &&
                    window.top === window.self) {
                    if (typeof window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
                        if (window.navigator &&
                            window.navigator.userAgent &&
                            window.navigator.userAgent.indexOf('Chrome') > -1) {
                            console.debug('Download the Apollo DevTools ' +
                                'for a better development experience: ' +
                                'https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm');
                        }
                    }
                }
            }
            this.version = version;
            this.localState = new LocalState({
                cache: cache,
                client: this,
                resolvers: resolvers,
                fragmentMatcher: fragmentMatcher,
            });
            this.queryManager = new QueryManager({
                link: this.link,
                store: this.store,
                queryDeduplication: queryDeduplication,
                ssrMode: ssrMode,
                clientAwareness: {
                    name: clientAwarenessName,
                    version: clientAwarenessVersion,
                },
                localState: this.localState,
                assumeImmutableResults: assumeImmutableResults,
                onBroadcast: function () {
                    if (_this.devToolsHookCb) {
                        _this.devToolsHookCb({
                            action: {},
                            state: {
                                queries: _this.queryManager.queryStore.getStore(),
                                mutations: _this.queryManager.mutationStore.getStore(),
                            },
                            dataWithOptimisticResults: _this.cache.extract(true),
                        });
                    }
                },
            });
        }
        ApolloClient.prototype.stop = function () {
            this.queryManager.stop();
        };
        ApolloClient.prototype.watchQuery = function (options) {
            if (this.defaultOptions.watchQuery) {
                options = __assign({}, this.defaultOptions.watchQuery, options);
            }
            if (this.disableNetworkFetches &&
                (options.fetchPolicy === 'network-only' ||
                    options.fetchPolicy === 'cache-and-network')) {
                options = __assign({}, options, { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.watchQuery(options);
        };
        ApolloClient.prototype.query = function (options) {
            if (this.defaultOptions.query) {
                options = __assign({}, this.defaultOptions.query, options);
            }
             invariant(options.fetchPolicy !== 'cache-and-network', 'The cache-and-network fetchPolicy does not work with client.query, because ' +
                'client.query can only return a single result. Please use client.watchQuery ' +
                'to receive multiple results from the cache and the network, or consider ' +
                'using a different fetchPolicy, such as cache-first or network-only.');
            if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
                options = __assign({}, options, { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.query(options);
        };
        ApolloClient.prototype.mutate = function (options) {
            if (this.defaultOptions.mutate) {
                options = __assign({}, this.defaultOptions.mutate, options);
            }
            return this.queryManager.mutate(options);
        };
        ApolloClient.prototype.subscribe = function (options) {
            return this.queryManager.startGraphQLSubscription(options);
        };
        ApolloClient.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readQuery(options, optimistic);
        };
        ApolloClient.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readFragment(options, optimistic);
        };
        ApolloClient.prototype.writeQuery = function (options) {
            var result = this.cache.writeQuery(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.writeFragment = function (options) {
            var result = this.cache.writeFragment(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.writeData = function (options) {
            var result = this.cache.writeData(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.__actionHookForDevTools = function (cb) {
            this.devToolsHookCb = cb;
        };
        ApolloClient.prototype.__requestRaw = function (payload) {
            return execute(this.link, payload);
        };
        ApolloClient.prototype.initQueryManager = function () {
             invariant.warn('Calling the initQueryManager method is no longer necessary, ' +
                'and it will be removed from ApolloClient in version 3.0.');
            return this.queryManager;
        };
        ApolloClient.prototype.resetStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.resetStoreCallbacks.map(function (fn) { return fn(); })); })
                .then(function () { return _this.reFetchObservableQueries(); });
        };
        ApolloClient.prototype.clearStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.clearStoreCallbacks.map(function (fn) { return fn(); })); });
        };
        ApolloClient.prototype.onResetStore = function (cb) {
            var _this = this;
            this.resetStoreCallbacks.push(cb);
            return function () {
                _this.resetStoreCallbacks = _this.resetStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.onClearStore = function (cb) {
            var _this = this;
            this.clearStoreCallbacks.push(cb);
            return function () {
                _this.clearStoreCallbacks = _this.clearStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.reFetchObservableQueries = function (includeStandby) {
            return this.queryManager.reFetchObservableQueries(includeStandby);
        };
        ApolloClient.prototype.extract = function (optimistic) {
            return this.cache.extract(optimistic);
        };
        ApolloClient.prototype.restore = function (serializedState) {
            return this.cache.restore(serializedState);
        };
        ApolloClient.prototype.addResolvers = function (resolvers) {
            this.localState.addResolvers(resolvers);
        };
        ApolloClient.prototype.setResolvers = function (resolvers) {
            this.localState.setResolvers(resolvers);
        };
        ApolloClient.prototype.getResolvers = function () {
            return this.localState.getResolvers();
        };
        ApolloClient.prototype.setLocalStateFragmentMatcher = function (fragmentMatcher) {
            this.localState.setFragmentMatcher(fragmentMatcher);
        };
        return ApolloClient;
    }());

    function queryFromPojo(obj) {
        var op = {
            kind: 'OperationDefinition',
            operation: 'query',
            name: {
                kind: 'Name',
                value: 'GeneratedClientQuery',
            },
            selectionSet: selectionSetFromObj(obj),
        };
        var out = {
            kind: 'Document',
            definitions: [op],
        };
        return out;
    }
    function fragmentFromPojo(obj, typename) {
        var frag = {
            kind: 'FragmentDefinition',
            typeCondition: {
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: typename || '__FakeType',
                },
            },
            name: {
                kind: 'Name',
                value: 'GeneratedClientQuery',
            },
            selectionSet: selectionSetFromObj(obj),
        };
        var out = {
            kind: 'Document',
            definitions: [frag],
        };
        return out;
    }
    function selectionSetFromObj(obj) {
        if (typeof obj === 'number' ||
            typeof obj === 'boolean' ||
            typeof obj === 'string' ||
            typeof obj === 'undefined' ||
            obj === null) {
            return null;
        }
        if (Array.isArray(obj)) {
            return selectionSetFromObj(obj[0]);
        }
        var selections = [];
        Object.keys(obj).forEach(function (key) {
            var nestedSelSet = selectionSetFromObj(obj[key]);
            var field = {
                kind: 'Field',
                name: {
                    kind: 'Name',
                    value: key,
                },
                selectionSet: nestedSelSet || undefined,
            };
            selections.push(field);
        });
        var selectionSet = {
            kind: 'SelectionSet',
            selections: selections,
        };
        return selectionSet;
    }
    var justTypenameQuery = {
        kind: 'Document',
        definitions: [
            {
                kind: 'OperationDefinition',
                operation: 'query',
                name: null,
                variableDefinitions: null,
                directives: [],
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                        {
                            kind: 'Field',
                            alias: null,
                            name: {
                                kind: 'Name',
                                value: '__typename',
                            },
                            arguments: [],
                            directives: [],
                            selectionSet: null,
                        },
                    ],
                },
            },
        ],
    };

    var ApolloCache = (function () {
        function ApolloCache() {
        }
        ApolloCache.prototype.transformDocument = function (document) {
            return document;
        };
        ApolloCache.prototype.transformForLink = function (document) {
            return document;
        };
        ApolloCache.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.read({
                query: options.query,
                variables: options.variables,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.read({
                query: getFragmentQueryDocument(options.fragment, options.fragmentName),
                variables: options.variables,
                rootId: options.id,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.writeQuery = function (options) {
            this.write({
                dataId: 'ROOT_QUERY',
                result: options.data,
                query: options.query,
                variables: options.variables,
            });
        };
        ApolloCache.prototype.writeFragment = function (options) {
            this.write({
                dataId: options.id,
                result: options.data,
                variables: options.variables,
                query: getFragmentQueryDocument(options.fragment, options.fragmentName),
            });
        };
        ApolloCache.prototype.writeData = function (_a) {
            var id = _a.id, data = _a.data;
            if (typeof id !== 'undefined') {
                var typenameResult = null;
                try {
                    typenameResult = this.read({
                        rootId: id,
                        optimistic: false,
                        query: justTypenameQuery,
                    });
                }
                catch (e) {
                }
                var __typename = (typenameResult && typenameResult.__typename) || '__ClientData';
                var dataToWrite = Object.assign({ __typename: __typename }, data);
                this.writeFragment({
                    id: id,
                    fragment: fragmentFromPojo(dataToWrite, __typename),
                    data: dataToWrite,
                });
            }
            else {
                this.writeQuery({ query: queryFromPojo(data), data: data });
            }
        };
        return ApolloCache;
    }());

    // This currentContext variable will only be used if the makeSlotClass
    // function is called, which happens only if this is the first copy of the
    // @wry/context package to be imported.
    var currentContext = null;
    // This unique internal object is used to denote the absence of a value
    // for a given Slot, and is never exposed to outside code.
    var MISSING_VALUE = {};
    var idCounter = 1;
    // Although we can't do anything about the cost of duplicated code from
    // accidentally bundling multiple copies of the @wry/context package, we can
    // avoid creating the Slot class more than once using makeSlotClass.
    var makeSlotClass = function () { return /** @class */ (function () {
        function Slot() {
            // If you have a Slot object, you can find out its slot.id, but you cannot
            // guess the slot.id of a Slot you don't have access to, thanks to the
            // randomized suffix.
            this.id = [
                "slot",
                idCounter++,
                Date.now(),
                Math.random().toString(36).slice(2),
            ].join(":");
        }
        Slot.prototype.hasValue = function () {
            for (var context_1 = currentContext; context_1; context_1 = context_1.parent) {
                // We use the Slot object iself as a key to its value, which means the
                // value cannot be obtained without a reference to the Slot object.
                if (this.id in context_1.slots) {
                    var value = context_1.slots[this.id];
                    if (value === MISSING_VALUE)
                        break;
                    if (context_1 !== currentContext) {
                        // Cache the value in currentContext.slots so the next lookup will
                        // be faster. This caching is safe because the tree of contexts and
                        // the values of the slots are logically immutable.
                        currentContext.slots[this.id] = value;
                    }
                    return true;
                }
            }
            if (currentContext) {
                // If a value was not found for this Slot, it's never going to be found
                // no matter how many times we look it up, so we might as well cache
                // the absence of the value, too.
                currentContext.slots[this.id] = MISSING_VALUE;
            }
            return false;
        };
        Slot.prototype.getValue = function () {
            if (this.hasValue()) {
                return currentContext.slots[this.id];
            }
        };
        Slot.prototype.withValue = function (value, callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            var _a;
            var slots = (_a = {
                    __proto__: null
                },
                _a[this.id] = value,
                _a);
            var parent = currentContext;
            currentContext = { parent: parent, slots: slots };
            try {
                // Function.prototype.apply allows the arguments array argument to be
                // omitted or undefined, so args! is fine here.
                return callback.apply(thisArg, args);
            }
            finally {
                currentContext = parent;
            }
        };
        // Capture the current context and wrap a callback function so that it
        // reestablishes the captured context when called.
        Slot.bind = function (callback) {
            var context = currentContext;
            return function () {
                var saved = currentContext;
                try {
                    currentContext = context;
                    return callback.apply(this, arguments);
                }
                finally {
                    currentContext = saved;
                }
            };
        };
        // Immediately run a callback function without any captured context.
        Slot.noContext = function (callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            if (currentContext) {
                var saved = currentContext;
                try {
                    currentContext = null;
                    // Function.prototype.apply allows the arguments array argument to be
                    // omitted or undefined, so args! is fine here.
                    return callback.apply(thisArg, args);
                }
                finally {
                    currentContext = saved;
                }
            }
            else {
                return callback.apply(thisArg, args);
            }
        };
        return Slot;
    }()); };
    // We store a single global implementation of the Slot class as a permanent
    // non-enumerable symbol property of the Array constructor. This obfuscation
    // does nothing to prevent access to the Slot class, but at least it ensures
    // the implementation (i.e. currentContext) cannot be tampered with, and all
    // copies of the @wry/context package (hopefully just one) will share the
    // same Slot implementation. Since the first copy of the @wry/context package
    // to be imported wins, this technique imposes a very high cost for any
    // future breaking changes to the Slot class.
    var globalKey = "@wry/context:Slot";
    var host = Array;
    var Slot = host[globalKey] || function () {
        var Slot = makeSlotClass();
        try {
            Object.defineProperty(host, globalKey, {
                value: host[globalKey] = Slot,
                enumerable: false,
                writable: false,
                configurable: false,
            });
        }
        finally {
            return Slot;
        }
    }();

    var bind = Slot.bind, noContext = Slot.noContext;

    function defaultDispose() { }
    var Cache = /** @class */ (function () {
        function Cache(max, dispose) {
            if (max === void 0) { max = Infinity; }
            if (dispose === void 0) { dispose = defaultDispose; }
            this.max = max;
            this.dispose = dispose;
            this.map = new Map();
            this.newest = null;
            this.oldest = null;
        }
        Cache.prototype.has = function (key) {
            return this.map.has(key);
        };
        Cache.prototype.get = function (key) {
            var entry = this.getEntry(key);
            return entry && entry.value;
        };
        Cache.prototype.getEntry = function (key) {
            var entry = this.map.get(key);
            if (entry && entry !== this.newest) {
                var older = entry.older, newer = entry.newer;
                if (newer) {
                    newer.older = older;
                }
                if (older) {
                    older.newer = newer;
                }
                entry.older = this.newest;
                entry.older.newer = entry;
                entry.newer = null;
                this.newest = entry;
                if (entry === this.oldest) {
                    this.oldest = newer;
                }
            }
            return entry;
        };
        Cache.prototype.set = function (key, value) {
            var entry = this.getEntry(key);
            if (entry) {
                return entry.value = value;
            }
            entry = {
                key: key,
                value: value,
                newer: null,
                older: this.newest
            };
            if (this.newest) {
                this.newest.newer = entry;
            }
            this.newest = entry;
            this.oldest = this.oldest || entry;
            this.map.set(key, entry);
            return entry.value;
        };
        Cache.prototype.clean = function () {
            while (this.oldest && this.map.size > this.max) {
                this.delete(this.oldest.key);
            }
        };
        Cache.prototype.delete = function (key) {
            var entry = this.map.get(key);
            if (entry) {
                if (entry === this.newest) {
                    this.newest = entry.older;
                }
                if (entry === this.oldest) {
                    this.oldest = entry.newer;
                }
                if (entry.newer) {
                    entry.newer.older = entry.older;
                }
                if (entry.older) {
                    entry.older.newer = entry.newer;
                }
                this.map.delete(key);
                this.dispose(entry.value, key);
                return true;
            }
            return false;
        };
        return Cache;
    }());

    var parentEntrySlot = new Slot();

    var reusableEmptyArray = [];
    var emptySetPool = [];
    var POOL_TARGET_SIZE = 100;
    // Since this package might be used browsers, we should avoid using the
    // Node built-in assert module.
    function assert(condition, optionalMessage) {
        if (!condition) {
            throw new Error(optionalMessage || "assertion failure");
        }
    }
    function valueIs(a, b) {
        var len = a.length;
        return (
        // Unknown values are not equal to each other.
        len > 0 &&
            // Both values must be ordinary (or both exceptional) to be equal.
            len === b.length &&
            // The underlying value or exception must be the same.
            a[len - 1] === b[len - 1]);
    }
    function valueGet(value) {
        switch (value.length) {
            case 0: throw new Error("unknown value");
            case 1: return value[0];
            case 2: throw value[1];
        }
    }
    function valueCopy(value) {
        return value.slice(0);
    }
    var Entry = /** @class */ (function () {
        function Entry(fn, args) {
            this.fn = fn;
            this.args = args;
            this.parents = new Set();
            this.childValues = new Map();
            // When this Entry has children that are dirty, this property becomes
            // a Set containing other Entry objects, borrowed from emptySetPool.
            // When the set becomes empty, it gets recycled back to emptySetPool.
            this.dirtyChildren = null;
            this.dirty = true;
            this.recomputing = false;
            this.value = [];
            ++Entry.count;
        }
        // This is the most important method of the Entry API, because it
        // determines whether the cached this.value can be returned immediately,
        // or must be recomputed. The overall performance of the caching system
        // depends on the truth of the following observations: (1) this.dirty is
        // usually false, (2) this.dirtyChildren is usually null/empty, and thus
        // (3) valueGet(this.value) is usually returned without recomputation.
        Entry.prototype.recompute = function () {
            assert(!this.recomputing, "already recomputing");
            if (!rememberParent(this) && maybeReportOrphan(this)) {
                // The recipient of the entry.reportOrphan callback decided to dispose
                // of this orphan entry by calling entry.dispose(), so we don't need to
                // (and should not) proceed with the recomputation.
                return void 0;
            }
            return mightBeDirty(this)
                ? reallyRecompute(this)
                : valueGet(this.value);
        };
        Entry.prototype.setDirty = function () {
            if (this.dirty)
                return;
            this.dirty = true;
            this.value.length = 0;
            reportDirty(this);
            // We can go ahead and unsubscribe here, since any further dirty
            // notifications we receive will be redundant, and unsubscribing may
            // free up some resources, e.g. file watchers.
            maybeUnsubscribe(this);
        };
        Entry.prototype.dispose = function () {
            var _this = this;
            forgetChildren(this).forEach(maybeReportOrphan);
            maybeUnsubscribe(this);
            // Because this entry has been kicked out of the cache (in index.js),
            // we've lost the ability to find out if/when this entry becomes dirty,
            // whether that happens through a subscription, because of a direct call
            // to entry.setDirty(), or because one of its children becomes dirty.
            // Because of this loss of future information, we have to assume the
            // worst (that this entry might have become dirty very soon), so we must
            // immediately mark this entry's parents as dirty. Normally we could
            // just call entry.setDirty() rather than calling parent.setDirty() for
            // each parent, but that would leave this entry in parent.childValues
            // and parent.dirtyChildren, which would prevent the child from being
            // truly forgotten.
            this.parents.forEach(function (parent) {
                parent.setDirty();
                forgetChild(parent, _this);
            });
        };
        Entry.count = 0;
        return Entry;
    }());
    function rememberParent(child) {
        var parent = parentEntrySlot.getValue();
        if (parent) {
            child.parents.add(parent);
            if (!parent.childValues.has(child)) {
                parent.childValues.set(child, []);
            }
            if (mightBeDirty(child)) {
                reportDirtyChild(parent, child);
            }
            else {
                reportCleanChild(parent, child);
            }
            return parent;
        }
    }
    function reallyRecompute(entry) {
        // Since this recomputation is likely to re-remember some of this
        // entry's children, we forget our children here but do not call
        // maybeReportOrphan until after the recomputation finishes.
        var originalChildren = forgetChildren(entry);
        // Set entry as the parent entry while calling recomputeNewValue(entry).
        parentEntrySlot.withValue(entry, recomputeNewValue, [entry]);
        if (maybeSubscribe(entry)) {
            // If we successfully recomputed entry.value and did not fail to
            // (re)subscribe, then this Entry is no longer explicitly dirty.
            setClean(entry);
        }
        // Now that we've had a chance to re-remember any children that were
        // involved in the recomputation, we can safely report any orphan
        // children that remain.
        originalChildren.forEach(maybeReportOrphan);
        return valueGet(entry.value);
    }
    function recomputeNewValue(entry) {
        entry.recomputing = true;
        // Set entry.value as unknown.
        entry.value.length = 0;
        try {
            // If entry.fn succeeds, entry.value will become a normal Value.
            entry.value[0] = entry.fn.apply(null, entry.args);
        }
        catch (e) {
            // If entry.fn throws, entry.value will become exceptional.
            entry.value[1] = e;
        }
        // Either way, this line is always reached.
        entry.recomputing = false;
    }
    function mightBeDirty(entry) {
        return entry.dirty || !!(entry.dirtyChildren && entry.dirtyChildren.size);
    }
    function setClean(entry) {
        entry.dirty = false;
        if (mightBeDirty(entry)) {
            // This Entry may still have dirty children, in which case we can't
            // let our parents know we're clean just yet.
            return;
        }
        reportClean(entry);
    }
    function reportDirty(child) {
        child.parents.forEach(function (parent) { return reportDirtyChild(parent, child); });
    }
    function reportClean(child) {
        child.parents.forEach(function (parent) { return reportCleanChild(parent, child); });
    }
    // Let a parent Entry know that one of its children may be dirty.
    function reportDirtyChild(parent, child) {
        // Must have called rememberParent(child) before calling
        // reportDirtyChild(parent, child).
        assert(parent.childValues.has(child));
        assert(mightBeDirty(child));
        if (!parent.dirtyChildren) {
            parent.dirtyChildren = emptySetPool.pop() || new Set;
        }
        else if (parent.dirtyChildren.has(child)) {
            // If we already know this child is dirty, then we must have already
            // informed our own parents that we are dirty, so we can terminate
            // the recursion early.
            return;
        }
        parent.dirtyChildren.add(child);
        reportDirty(parent);
    }
    // Let a parent Entry know that one of its children is no longer dirty.
    function reportCleanChild(parent, child) {
        // Must have called rememberChild(child) before calling
        // reportCleanChild(parent, child).
        assert(parent.childValues.has(child));
        assert(!mightBeDirty(child));
        var childValue = parent.childValues.get(child);
        if (childValue.length === 0) {
            parent.childValues.set(child, valueCopy(child.value));
        }
        else if (!valueIs(childValue, child.value)) {
            parent.setDirty();
        }
        removeDirtyChild(parent, child);
        if (mightBeDirty(parent)) {
            return;
        }
        reportClean(parent);
    }
    function removeDirtyChild(parent, child) {
        var dc = parent.dirtyChildren;
        if (dc) {
            dc.delete(child);
            if (dc.size === 0) {
                if (emptySetPool.length < POOL_TARGET_SIZE) {
                    emptySetPool.push(dc);
                }
                parent.dirtyChildren = null;
            }
        }
    }
    // If the given entry has a reportOrphan method, and no remaining parents,
    // call entry.reportOrphan and return true iff it returns true. The
    // reportOrphan function should return true to indicate entry.dispose()
    // has been called, and the entry has been removed from any other caches
    // (see index.js for the only current example).
    function maybeReportOrphan(entry) {
        return entry.parents.size === 0 &&
            typeof entry.reportOrphan === "function" &&
            entry.reportOrphan() === true;
    }
    // Removes all children from this entry and returns an array of the
    // removed children.
    function forgetChildren(parent) {
        var children = reusableEmptyArray;
        if (parent.childValues.size > 0) {
            children = [];
            parent.childValues.forEach(function (_value, child) {
                forgetChild(parent, child);
                children.push(child);
            });
        }
        // After we forget all our children, this.dirtyChildren must be empty
        // and therefore must have been reset to null.
        assert(parent.dirtyChildren === null);
        return children;
    }
    function forgetChild(parent, child) {
        child.parents.delete(parent);
        parent.childValues.delete(child);
        removeDirtyChild(parent, child);
    }
    function maybeSubscribe(entry) {
        if (typeof entry.subscribe === "function") {
            try {
                maybeUnsubscribe(entry); // Prevent double subscriptions.
                entry.unsubscribe = entry.subscribe.apply(null, entry.args);
            }
            catch (e) {
                // If this Entry has a subscribe function and it threw an exception
                // (or an unsubscribe function it previously returned now throws),
                // return false to indicate that we were not able to subscribe (or
                // unsubscribe), and this Entry should remain dirty.
                entry.setDirty();
                return false;
            }
        }
        // Returning true indicates either that there was no entry.subscribe
        // function or that it succeeded.
        return true;
    }
    function maybeUnsubscribe(entry) {
        var unsubscribe = entry.unsubscribe;
        if (typeof unsubscribe === "function") {
            entry.unsubscribe = void 0;
            unsubscribe();
        }
    }

    // A trie data structure that holds object keys weakly, yet can also hold
    // non-object keys, unlike the native `WeakMap`.
    var KeyTrie = /** @class */ (function () {
        function KeyTrie(weakness) {
            this.weakness = weakness;
        }
        KeyTrie.prototype.lookup = function () {
            var array = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                array[_i] = arguments[_i];
            }
            return this.lookupArray(array);
        };
        KeyTrie.prototype.lookupArray = function (array) {
            var node = this;
            array.forEach(function (key) { return node = node.getChildTrie(key); });
            return node.data || (node.data = Object.create(null));
        };
        KeyTrie.prototype.getChildTrie = function (key) {
            var map = this.weakness && isObjRef(key)
                ? this.weak || (this.weak = new WeakMap())
                : this.strong || (this.strong = new Map());
            var child = map.get(key);
            if (!child)
                map.set(key, child = new KeyTrie(this.weakness));
            return child;
        };
        return KeyTrie;
    }());
    function isObjRef(value) {
        switch (typeof value) {
            case "object":
                if (value === null)
                    break;
            // Fall through to return true...
            case "function":
                return true;
        }
        return false;
    }

    // The defaultMakeCacheKey function is remarkably powerful, because it gives
    // a unique object for any shallow-identical list of arguments. If you need
    // to implement a custom makeCacheKey function, you may find it helpful to
    // delegate the final work to defaultMakeCacheKey, which is why we export it
    // here. However, you may want to avoid defaultMakeCacheKey if your runtime
    // does not support WeakMap, or you have the ability to return a string key.
    // In those cases, just write your own custom makeCacheKey functions.
    var keyTrie = new KeyTrie(typeof WeakMap === "function");
    function defaultMakeCacheKey() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return keyTrie.lookupArray(args);
    }
    var caches = new Set();
    function wrap(originalFunction, options) {
        if (options === void 0) { options = Object.create(null); }
        var cache = new Cache(options.max || Math.pow(2, 16), function (entry) { return entry.dispose(); });
        var disposable = !!options.disposable;
        var makeCacheKey = options.makeCacheKey || defaultMakeCacheKey;
        function optimistic() {
            if (disposable && !parentEntrySlot.hasValue()) {
                // If there's no current parent computation, and this wrapped
                // function is disposable (meaning we don't care about entry.value,
                // just dependency tracking), then we can short-cut everything else
                // in this function, because entry.recompute() is going to recycle
                // the entry object without recomputing anything, anyway.
                return void 0;
            }
            var key = makeCacheKey.apply(null, arguments);
            if (key === void 0) {
                return originalFunction.apply(null, arguments);
            }
            var args = Array.prototype.slice.call(arguments);
            var entry = cache.get(key);
            if (entry) {
                entry.args = args;
            }
            else {
                entry = new Entry(originalFunction, args);
                cache.set(key, entry);
                entry.subscribe = options.subscribe;
                if (disposable) {
                    entry.reportOrphan = function () { return cache.delete(key); };
                }
            }
            var value = entry.recompute();
            // Move this entry to the front of the least-recently used queue,
            // since we just finished computing its value.
            cache.set(key, entry);
            caches.add(cache);
            // Clean up any excess entries in the cache, but only if there is no
            // active parent entry, meaning we're not in the middle of a larger
            // computation that might be flummoxed by the cleaning.
            if (!parentEntrySlot.hasValue()) {
                caches.forEach(function (cache) { return cache.clean(); });
                caches.clear();
            }
            // If options.disposable is truthy, the caller of wrap is telling us
            // they don't care about the result of entry.recompute(), so we should
            // avoid returning the value, so it won't be accidentally used.
            return disposable ? void 0 : value;
        }
        optimistic.dirty = function () {
            var key = makeCacheKey.apply(null, arguments);
            var child = key !== void 0 && cache.get(key);
            if (child) {
                child.setDirty();
            }
        };
        return optimistic;
    }

    var haveWarned = false;
    function shouldWarn() {
        var answer = !haveWarned;
        if (!isTest()) {
            haveWarned = true;
        }
        return answer;
    }
    var HeuristicFragmentMatcher = (function () {
        function HeuristicFragmentMatcher() {
        }
        HeuristicFragmentMatcher.prototype.ensureReady = function () {
            return Promise.resolve();
        };
        HeuristicFragmentMatcher.prototype.canBypassInit = function () {
            return true;
        };
        HeuristicFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
            var obj = context.store.get(idValue.id);
            var isRootQuery = idValue.id === 'ROOT_QUERY';
            if (!obj) {
                return isRootQuery;
            }
            var _a = obj.__typename, __typename = _a === void 0 ? isRootQuery && 'Query' : _a;
            if (!__typename) {
                if (shouldWarn()) {
                     invariant.warn("You're using fragments in your queries, but either don't have the addTypename:\n  true option set in Apollo Client, or you are trying to write a fragment to the store without the __typename.\n   Please turn on the addTypename option and include __typename when writing fragments so that Apollo Client\n   can accurately match fragments.");
                     invariant.warn('Could not find __typename on Fragment ', typeCondition, obj);
                     invariant.warn("DEPRECATION WARNING: using fragments without __typename is unsupported behavior " +
                        "and will be removed in future versions of Apollo client. You should fix this and set addTypename to true now.");
                }
                return 'heuristic';
            }
            if (__typename === typeCondition) {
                return true;
            }
            if (shouldWarn()) {
                 invariant.error('You are using the simple (heuristic) fragment matcher, but your ' +
                    'queries contain union or interface types. Apollo Client will not be ' +
                    'able to accurately map fragments. To make this error go away, use ' +
                    'the `IntrospectionFragmentMatcher` as described in the docs: ' +
                    'https://www.apollographql.com/docs/react/advanced/fragments.html#fragment-matcher');
            }
            return 'heuristic';
        };
        return HeuristicFragmentMatcher;
    }());

    var hasOwn = Object.prototype.hasOwnProperty;
    var DepTrackingCache = (function () {
        function DepTrackingCache(data) {
            var _this = this;
            if (data === void 0) { data = Object.create(null); }
            this.data = data;
            this.depend = wrap(function (dataId) { return _this.data[dataId]; }, {
                disposable: true,
                makeCacheKey: function (dataId) {
                    return dataId;
                },
            });
        }
        DepTrackingCache.prototype.toObject = function () {
            return this.data;
        };
        DepTrackingCache.prototype.get = function (dataId) {
            this.depend(dataId);
            return this.data[dataId];
        };
        DepTrackingCache.prototype.set = function (dataId, value) {
            var oldValue = this.data[dataId];
            if (value !== oldValue) {
                this.data[dataId] = value;
                this.depend.dirty(dataId);
            }
        };
        DepTrackingCache.prototype.delete = function (dataId) {
            if (hasOwn.call(this.data, dataId)) {
                delete this.data[dataId];
                this.depend.dirty(dataId);
            }
        };
        DepTrackingCache.prototype.clear = function () {
            this.replace(null);
        };
        DepTrackingCache.prototype.replace = function (newData) {
            var _this = this;
            if (newData) {
                Object.keys(newData).forEach(function (dataId) {
                    _this.set(dataId, newData[dataId]);
                });
                Object.keys(this.data).forEach(function (dataId) {
                    if (!hasOwn.call(newData, dataId)) {
                        _this.delete(dataId);
                    }
                });
            }
            else {
                Object.keys(this.data).forEach(function (dataId) {
                    _this.delete(dataId);
                });
            }
        };
        return DepTrackingCache;
    }());
    function defaultNormalizedCacheFactory(seed) {
        return new DepTrackingCache(seed);
    }

    var StoreReader = (function () {
        function StoreReader(_a) {
            var _this = this;
            var _b = _a === void 0 ? {} : _a, _c = _b.cacheKeyRoot, cacheKeyRoot = _c === void 0 ? new KeyTrie(canUseWeakMap) : _c, _d = _b.freezeResults, freezeResults = _d === void 0 ? false : _d;
            var _e = this, executeStoreQuery = _e.executeStoreQuery, executeSelectionSet = _e.executeSelectionSet, executeSubSelectedArray = _e.executeSubSelectedArray;
            this.freezeResults = freezeResults;
            this.executeStoreQuery = wrap(function (options) {
                return executeStoreQuery.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, fragmentMatcher = _a.fragmentMatcher;
                    if (contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(contextValue.store, query, fragmentMatcher, JSON.stringify(variableValues), rootValue.id);
                    }
                }
            });
            this.executeSelectionSet = wrap(function (options) {
                return executeSelectionSet.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
                    if (execContext.contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(execContext.contextValue.store, selectionSet, execContext.fragmentMatcher, JSON.stringify(execContext.variableValues), rootValue.id);
                    }
                }
            });
            this.executeSubSelectedArray = wrap(function (options) {
                return executeSubSelectedArray.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var field = _a.field, array = _a.array, execContext = _a.execContext;
                    if (execContext.contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(execContext.contextValue.store, field, array, JSON.stringify(execContext.variableValues));
                    }
                }
            });
        }
        StoreReader.prototype.readQueryFromStore = function (options) {
            return this.diffQueryAgainstStore(__assign({}, options, { returnPartialData: false })).result;
        };
        StoreReader.prototype.diffQueryAgainstStore = function (_a) {
            var store = _a.store, query = _a.query, variables = _a.variables, previousResult = _a.previousResult, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? true : _b, _c = _a.rootId, rootId = _c === void 0 ? 'ROOT_QUERY' : _c, fragmentMatcherFunction = _a.fragmentMatcherFunction, config = _a.config;
            var queryDefinition = getQueryDefinition(query);
            variables = assign$1({}, getDefaultValues(queryDefinition), variables);
            var context = {
                store: store,
                dataIdFromObject: config && config.dataIdFromObject,
                cacheRedirects: (config && config.cacheRedirects) || {},
            };
            var execResult = this.executeStoreQuery({
                query: query,
                rootValue: {
                    type: 'id',
                    id: rootId,
                    generated: true,
                    typename: 'Query',
                },
                contextValue: context,
                variableValues: variables,
                fragmentMatcher: fragmentMatcherFunction,
            });
            var hasMissingFields = execResult.missing && execResult.missing.length > 0;
            if (hasMissingFields && !returnPartialData) {
                execResult.missing.forEach(function (info) {
                    if (info.tolerable)
                        return;
                    throw  new InvariantError("Can't find field " + info.fieldName + " on object " + JSON.stringify(info.object, null, 2) + ".");
                });
            }
            if (previousResult) {
                if (equal(previousResult, execResult.result)) {
                    execResult.result = previousResult;
                }
            }
            return {
                result: execResult.result,
                complete: !hasMissingFields,
            };
        };
        StoreReader.prototype.executeStoreQuery = function (_a) {
            var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, _b = _a.fragmentMatcher, fragmentMatcher = _b === void 0 ? defaultFragmentMatcher : _b;
            var mainDefinition = getMainDefinition(query);
            var fragments = getFragmentDefinitions(query);
            var fragmentMap = createFragmentMap(fragments);
            var execContext = {
                query: query,
                fragmentMap: fragmentMap,
                contextValue: contextValue,
                variableValues: variableValues,
                fragmentMatcher: fragmentMatcher,
            };
            return this.executeSelectionSet({
                selectionSet: mainDefinition.selectionSet,
                rootValue: rootValue,
                execContext: execContext,
            });
        };
        StoreReader.prototype.executeSelectionSet = function (_a) {
            var _this = this;
            var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
            var fragmentMap = execContext.fragmentMap, contextValue = execContext.contextValue, variables = execContext.variableValues;
            var finalResult = { result: null };
            var objectsToMerge = [];
            var object = contextValue.store.get(rootValue.id);
            var typename = (object && object.__typename) ||
                (rootValue.id === 'ROOT_QUERY' && 'Query') ||
                void 0;
            function handleMissing(result) {
                var _a;
                if (result.missing) {
                    finalResult.missing = finalResult.missing || [];
                    (_a = finalResult.missing).push.apply(_a, result.missing);
                }
                return result.result;
            }
            selectionSet.selections.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables)) {
                    return;
                }
                if (isField(selection)) {
                    var fieldResult = handleMissing(_this.executeField(object, typename, selection, execContext));
                    if (typeof fieldResult !== 'undefined') {
                        objectsToMerge.push((_a = {},
                            _a[resultKeyNameFromField(selection)] = fieldResult,
                            _a));
                    }
                }
                else {
                    var fragment = void 0;
                    if (isInlineFragment(selection)) {
                        fragment = selection;
                    }
                    else {
                        fragment = fragmentMap[selection.name.value];
                        if (!fragment) {
                            throw  new InvariantError("No fragment named " + selection.name.value);
                        }
                    }
                    var typeCondition = fragment.typeCondition && fragment.typeCondition.name.value;
                    var match = !typeCondition ||
                        execContext.fragmentMatcher(rootValue, typeCondition, contextValue);
                    if (match) {
                        var fragmentExecResult = _this.executeSelectionSet({
                            selectionSet: fragment.selectionSet,
                            rootValue: rootValue,
                            execContext: execContext,
                        });
                        if (match === 'heuristic' && fragmentExecResult.missing) {
                            fragmentExecResult = __assign({}, fragmentExecResult, { missing: fragmentExecResult.missing.map(function (info) {
                                    return __assign({}, info, { tolerable: true });
                                }) });
                        }
                        objectsToMerge.push(handleMissing(fragmentExecResult));
                    }
                }
            });
            finalResult.result = mergeDeepArray(objectsToMerge);
            if (this.freezeResults && "development" !== 'production') {
                Object.freeze(finalResult.result);
            }
            return finalResult;
        };
        StoreReader.prototype.executeField = function (object, typename, field, execContext) {
            var variables = execContext.variableValues, contextValue = execContext.contextValue;
            var fieldName = field.name.value;
            var args = argumentsObjectFromField(field, variables);
            var info = {
                resultKey: resultKeyNameFromField(field),
                directives: getDirectiveInfoFromField(field, variables),
            };
            var readStoreResult = readStoreResolver(object, typename, fieldName, args, contextValue, info);
            if (Array.isArray(readStoreResult.result)) {
                return this.combineExecResults(readStoreResult, this.executeSubSelectedArray({
                    field: field,
                    array: readStoreResult.result,
                    execContext: execContext,
                }));
            }
            if (!field.selectionSet) {
                assertSelectionSetForIdValue(field, readStoreResult.result);
                if (this.freezeResults && "development" !== 'production') {
                    maybeDeepFreeze(readStoreResult);
                }
                return readStoreResult;
            }
            if (readStoreResult.result == null) {
                return readStoreResult;
            }
            return this.combineExecResults(readStoreResult, this.executeSelectionSet({
                selectionSet: field.selectionSet,
                rootValue: readStoreResult.result,
                execContext: execContext,
            }));
        };
        StoreReader.prototype.combineExecResults = function () {
            var execResults = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                execResults[_i] = arguments[_i];
            }
            var missing;
            execResults.forEach(function (execResult) {
                if (execResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, execResult.missing);
                }
            });
            return {
                result: execResults.pop().result,
                missing: missing,
            };
        };
        StoreReader.prototype.executeSubSelectedArray = function (_a) {
            var _this = this;
            var field = _a.field, array = _a.array, execContext = _a.execContext;
            var missing;
            function handleMissing(childResult) {
                if (childResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, childResult.missing);
                }
                return childResult.result;
            }
            array = array.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return handleMissing(_this.executeSubSelectedArray({
                        field: field,
                        array: item,
                        execContext: execContext,
                    }));
                }
                if (field.selectionSet) {
                    return handleMissing(_this.executeSelectionSet({
                        selectionSet: field.selectionSet,
                        rootValue: item,
                        execContext: execContext,
                    }));
                }
                assertSelectionSetForIdValue(field, item);
                return item;
            });
            if (this.freezeResults && "development" !== 'production') {
                Object.freeze(array);
            }
            return { result: array, missing: missing };
        };
        return StoreReader;
    }());
    function assertSelectionSetForIdValue(field, value) {
        if (!field.selectionSet && isIdValue(value)) {
            throw  new InvariantError("Missing selection set for object of type " + value.typename + " returned for query field " + field.name.value);
        }
    }
    function defaultFragmentMatcher() {
        return true;
    }
    function readStoreResolver(object, typename, fieldName, args, context, _a) {
        var resultKey = _a.resultKey, directives = _a.directives;
        var storeKeyName = fieldName;
        if (args || directives) {
            storeKeyName = getStoreKeyName(storeKeyName, args, directives);
        }
        var fieldValue = void 0;
        if (object) {
            fieldValue = object[storeKeyName];
            if (typeof fieldValue === 'undefined' &&
                context.cacheRedirects &&
                typeof typename === 'string') {
                var type = context.cacheRedirects[typename];
                if (type) {
                    var resolver = type[fieldName];
                    if (resolver) {
                        fieldValue = resolver(object, args, {
                            getCacheKey: function (storeObj) {
                                var id = context.dataIdFromObject(storeObj);
                                return id && toIdValue({
                                    id: id,
                                    typename: storeObj.__typename,
                                });
                            },
                        });
                    }
                }
            }
        }
        if (typeof fieldValue === 'undefined') {
            return {
                result: fieldValue,
                missing: [{
                        object: object,
                        fieldName: storeKeyName,
                        tolerable: false,
                    }],
            };
        }
        if (isJsonValue(fieldValue)) {
            fieldValue = fieldValue.json;
        }
        return {
            result: fieldValue,
        };
    }

    var ObjectCache = (function () {
        function ObjectCache(data) {
            if (data === void 0) { data = Object.create(null); }
            this.data = data;
        }
        ObjectCache.prototype.toObject = function () {
            return this.data;
        };
        ObjectCache.prototype.get = function (dataId) {
            return this.data[dataId];
        };
        ObjectCache.prototype.set = function (dataId, value) {
            this.data[dataId] = value;
        };
        ObjectCache.prototype.delete = function (dataId) {
            this.data[dataId] = void 0;
        };
        ObjectCache.prototype.clear = function () {
            this.data = Object.create(null);
        };
        ObjectCache.prototype.replace = function (newData) {
            this.data = newData || Object.create(null);
        };
        return ObjectCache;
    }());

    var WriteError = (function (_super) {
        __extends(WriteError, _super);
        function WriteError() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = 'WriteError';
            return _this;
        }
        return WriteError;
    }(Error));
    function enhanceErrorWithDocument(error, document) {
        var enhancedError = new WriteError("Error writing result to store for query:\n " + JSON.stringify(document));
        enhancedError.message += '\n' + error.message;
        enhancedError.stack = error.stack;
        return enhancedError;
    }
    var StoreWriter = (function () {
        function StoreWriter() {
        }
        StoreWriter.prototype.writeQueryToStore = function (_a) {
            var query = _a.query, result = _a.result, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
            return this.writeResultToStore({
                dataId: 'ROOT_QUERY',
                result: result,
                document: query,
                store: store,
                variables: variables,
                dataIdFromObject: dataIdFromObject,
                fragmentMatcherFunction: fragmentMatcherFunction,
            });
        };
        StoreWriter.prototype.writeResultToStore = function (_a) {
            var dataId = _a.dataId, result = _a.result, document = _a.document, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
            var operationDefinition = getOperationDefinition(document);
            try {
                return this.writeSelectionSetToStore({
                    result: result,
                    dataId: dataId,
                    selectionSet: operationDefinition.selectionSet,
                    context: {
                        store: store,
                        processedData: {},
                        variables: assign$1({}, getDefaultValues(operationDefinition), variables),
                        dataIdFromObject: dataIdFromObject,
                        fragmentMap: createFragmentMap(getFragmentDefinitions(document)),
                        fragmentMatcherFunction: fragmentMatcherFunction,
                    },
                });
            }
            catch (e) {
                throw enhanceErrorWithDocument(e, document);
            }
        };
        StoreWriter.prototype.writeSelectionSetToStore = function (_a) {
            var _this = this;
            var result = _a.result, dataId = _a.dataId, selectionSet = _a.selectionSet, context = _a.context;
            var variables = context.variables, store = context.store, fragmentMap = context.fragmentMap;
            selectionSet.selections.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables)) {
                    return;
                }
                if (isField(selection)) {
                    var resultFieldKey = resultKeyNameFromField(selection);
                    var value = result[resultFieldKey];
                    if (typeof value !== 'undefined') {
                        _this.writeFieldToStore({
                            dataId: dataId,
                            value: value,
                            field: selection,
                            context: context,
                        });
                    }
                    else {
                        var isDefered = false;
                        var isClient = false;
                        if (selection.directives && selection.directives.length) {
                            isDefered = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'defer'; });
                            isClient = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'client'; });
                        }
                        if (!isDefered && !isClient && context.fragmentMatcherFunction) {
                             invariant.warn("Missing field " + resultFieldKey + " in " + JSON.stringify(result, null, 2).substring(0, 100));
                        }
                    }
                }
                else {
                    var fragment = void 0;
                    if (isInlineFragment(selection)) {
                        fragment = selection;
                    }
                    else {
                        fragment = (fragmentMap || {})[selection.name.value];
                         invariant(fragment, "No fragment named " + selection.name.value + ".");
                    }
                    var matches = true;
                    if (context.fragmentMatcherFunction && fragment.typeCondition) {
                        var id = dataId || 'self';
                        var idValue = toIdValue({ id: id, typename: undefined });
                        var fakeContext = {
                            store: new ObjectCache((_a = {}, _a[id] = result, _a)),
                            cacheRedirects: {},
                        };
                        var match = context.fragmentMatcherFunction(idValue, fragment.typeCondition.name.value, fakeContext);
                        if (!isProduction() && match === 'heuristic') {
                             invariant.error('WARNING: heuristic fragment matching going on!');
                        }
                        matches = !!match;
                    }
                    if (matches) {
                        _this.writeSelectionSetToStore({
                            result: result,
                            selectionSet: fragment.selectionSet,
                            dataId: dataId,
                            context: context,
                        });
                    }
                }
            });
            return store;
        };
        StoreWriter.prototype.writeFieldToStore = function (_a) {
            var _b;
            var field = _a.field, value = _a.value, dataId = _a.dataId, context = _a.context;
            var variables = context.variables, dataIdFromObject = context.dataIdFromObject, store = context.store;
            var storeValue;
            var storeObject;
            var storeFieldName = storeKeyNameFromField(field, variables);
            if (!field.selectionSet || value === null) {
                storeValue =
                    value != null && typeof value === 'object'
                        ?
                            { type: 'json', json: value }
                        :
                            value;
            }
            else if (Array.isArray(value)) {
                var generatedId = dataId + "." + storeFieldName;
                storeValue = this.processArrayValue(value, generatedId, field.selectionSet, context);
            }
            else {
                var valueDataId = dataId + "." + storeFieldName;
                var generated = true;
                if (!isGeneratedId(valueDataId)) {
                    valueDataId = '$' + valueDataId;
                }
                if (dataIdFromObject) {
                    var semanticId = dataIdFromObject(value);
                     invariant(!semanticId || !isGeneratedId(semanticId), 'IDs returned by dataIdFromObject cannot begin with the "$" character.');
                    if (semanticId ||
                        (typeof semanticId === 'number' && semanticId === 0)) {
                        valueDataId = semanticId;
                        generated = false;
                    }
                }
                if (!isDataProcessed(valueDataId, field, context.processedData)) {
                    this.writeSelectionSetToStore({
                        dataId: valueDataId,
                        result: value,
                        selectionSet: field.selectionSet,
                        context: context,
                    });
                }
                var typename = value.__typename;
                storeValue = toIdValue({ id: valueDataId, typename: typename }, generated);
                storeObject = store.get(dataId);
                var escapedId = storeObject && storeObject[storeFieldName];
                if (escapedId !== storeValue && isIdValue(escapedId)) {
                    var hadTypename = escapedId.typename !== undefined;
                    var hasTypename = typename !== undefined;
                    var typenameChanged = hadTypename && hasTypename && escapedId.typename !== typename;
                     invariant(!generated || escapedId.generated || typenameChanged, "Store error: the application attempted to write an object with no provided id but the store already contains an id of " + escapedId.id + " for this object. The selectionSet that was trying to be written is:\n" + JSON.stringify(field));
                     invariant(!hadTypename || hasTypename, "Store error: the application attempted to write an object with no provided typename but the store already contains an object with typename of " + escapedId.typename + " for the object of id " + escapedId.id + ". The selectionSet that was trying to be written is:\n" + JSON.stringify(field));
                    if (escapedId.generated) {
                        if (typenameChanged) {
                            if (!generated) {
                                store.delete(escapedId.id);
                            }
                        }
                        else {
                            mergeWithGenerated(escapedId.id, storeValue.id, store);
                        }
                    }
                }
            }
            storeObject = store.get(dataId);
            if (!storeObject || !equal(storeValue, storeObject[storeFieldName])) {
                store.set(dataId, __assign({}, storeObject, (_b = {}, _b[storeFieldName] = storeValue, _b)));
            }
        };
        StoreWriter.prototype.processArrayValue = function (value, generatedId, selectionSet, context) {
            var _this = this;
            return value.map(function (item, index) {
                if (item === null) {
                    return null;
                }
                var itemDataId = generatedId + "." + index;
                if (Array.isArray(item)) {
                    return _this.processArrayValue(item, itemDataId, selectionSet, context);
                }
                var generated = true;
                if (context.dataIdFromObject) {
                    var semanticId = context.dataIdFromObject(item);
                    if (semanticId) {
                        itemDataId = semanticId;
                        generated = false;
                    }
                }
                if (!isDataProcessed(itemDataId, selectionSet, context.processedData)) {
                    _this.writeSelectionSetToStore({
                        dataId: itemDataId,
                        result: item,
                        selectionSet: selectionSet,
                        context: context,
                    });
                }
                return toIdValue({ id: itemDataId, typename: item.__typename }, generated);
            });
        };
        return StoreWriter;
    }());
    function isGeneratedId(id) {
        return id[0] === '$';
    }
    function mergeWithGenerated(generatedKey, realKey, cache) {
        if (generatedKey === realKey) {
            return false;
        }
        var generated = cache.get(generatedKey);
        var real = cache.get(realKey);
        var madeChanges = false;
        Object.keys(generated).forEach(function (key) {
            var value = generated[key];
            var realValue = real[key];
            if (isIdValue(value) &&
                isGeneratedId(value.id) &&
                isIdValue(realValue) &&
                !equal(value, realValue) &&
                mergeWithGenerated(value.id, realValue.id, cache)) {
                madeChanges = true;
            }
        });
        cache.delete(generatedKey);
        var newRealValue = __assign({}, generated, real);
        if (equal(newRealValue, real)) {
            return madeChanges;
        }
        cache.set(realKey, newRealValue);
        return true;
    }
    function isDataProcessed(dataId, field, processedData) {
        if (!processedData) {
            return false;
        }
        if (processedData[dataId]) {
            if (processedData[dataId].indexOf(field) >= 0) {
                return true;
            }
            else {
                processedData[dataId].push(field);
            }
        }
        else {
            processedData[dataId] = [field];
        }
        return false;
    }

    var defaultConfig = {
        fragmentMatcher: new HeuristicFragmentMatcher(),
        dataIdFromObject: defaultDataIdFromObject,
        addTypename: true,
        resultCaching: true,
        freezeResults: false,
    };
    function defaultDataIdFromObject(result) {
        if (result.__typename) {
            if (result.id !== undefined) {
                return result.__typename + ":" + result.id;
            }
            if (result._id !== undefined) {
                return result.__typename + ":" + result._id;
            }
        }
        return null;
    }
    var hasOwn$1 = Object.prototype.hasOwnProperty;
    var OptimisticCacheLayer = (function (_super) {
        __extends(OptimisticCacheLayer, _super);
        function OptimisticCacheLayer(optimisticId, parent, transaction) {
            var _this = _super.call(this, Object.create(null)) || this;
            _this.optimisticId = optimisticId;
            _this.parent = parent;
            _this.transaction = transaction;
            return _this;
        }
        OptimisticCacheLayer.prototype.toObject = function () {
            return __assign({}, this.parent.toObject(), this.data);
        };
        OptimisticCacheLayer.prototype.get = function (dataId) {
            return hasOwn$1.call(this.data, dataId)
                ? this.data[dataId]
                : this.parent.get(dataId);
        };
        return OptimisticCacheLayer;
    }(ObjectCache));
    var InMemoryCache = (function (_super) {
        __extends(InMemoryCache, _super);
        function InMemoryCache(config) {
            if (config === void 0) { config = {}; }
            var _this = _super.call(this) || this;
            _this.watches = new Set();
            _this.typenameDocumentCache = new Map();
            _this.cacheKeyRoot = new KeyTrie(canUseWeakMap);
            _this.silenceBroadcast = false;
            _this.config = __assign({}, defaultConfig, config);
            if (_this.config.customResolvers) {
                 invariant.warn('customResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating customResolvers in the next major version.');
                _this.config.cacheRedirects = _this.config.customResolvers;
            }
            if (_this.config.cacheResolvers) {
                 invariant.warn('cacheResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating cacheResolvers in the next major version.');
                _this.config.cacheRedirects = _this.config.cacheResolvers;
            }
            _this.addTypename = !!_this.config.addTypename;
            _this.data = _this.config.resultCaching
                ? new DepTrackingCache()
                : new ObjectCache();
            _this.optimisticData = _this.data;
            _this.storeWriter = new StoreWriter();
            _this.storeReader = new StoreReader({
                cacheKeyRoot: _this.cacheKeyRoot,
                freezeResults: config.freezeResults,
            });
            var cache = _this;
            var maybeBroadcastWatch = cache.maybeBroadcastWatch;
            _this.maybeBroadcastWatch = wrap(function (c) {
                return maybeBroadcastWatch.call(_this, c);
            }, {
                makeCacheKey: function (c) {
                    if (c.optimistic) {
                        return;
                    }
                    if (c.previousResult) {
                        return;
                    }
                    if (cache.data instanceof DepTrackingCache) {
                        return cache.cacheKeyRoot.lookup(c.query, JSON.stringify(c.variables));
                    }
                }
            });
            return _this;
        }
        InMemoryCache.prototype.restore = function (data) {
            if (data)
                this.data.replace(data);
            return this;
        };
        InMemoryCache.prototype.extract = function (optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return (optimistic ? this.optimisticData : this.data).toObject();
        };
        InMemoryCache.prototype.read = function (options) {
            if (typeof options.rootId === 'string' &&
                typeof this.data.get(options.rootId) === 'undefined') {
                return null;
            }
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            return this.storeReader.readQueryFromStore({
                store: options.optimistic ? this.optimisticData : this.data,
                query: this.transformDocument(options.query),
                variables: options.variables,
                rootId: options.rootId,
                fragmentMatcherFunction: fragmentMatcherFunction,
                previousResult: options.previousResult,
                config: this.config,
            }) || null;
        };
        InMemoryCache.prototype.write = function (write) {
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            this.storeWriter.writeResultToStore({
                dataId: write.dataId,
                result: write.result,
                variables: write.variables,
                document: this.transformDocument(write.query),
                store: this.data,
                dataIdFromObject: this.config.dataIdFromObject,
                fragmentMatcherFunction: fragmentMatcherFunction,
            });
            this.broadcastWatches();
        };
        InMemoryCache.prototype.diff = function (query) {
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            return this.storeReader.diffQueryAgainstStore({
                store: query.optimistic ? this.optimisticData : this.data,
                query: this.transformDocument(query.query),
                variables: query.variables,
                returnPartialData: query.returnPartialData,
                previousResult: query.previousResult,
                fragmentMatcherFunction: fragmentMatcherFunction,
                config: this.config,
            });
        };
        InMemoryCache.prototype.watch = function (watch) {
            var _this = this;
            this.watches.add(watch);
            return function () {
                _this.watches.delete(watch);
            };
        };
        InMemoryCache.prototype.evict = function (query) {
            throw  new InvariantError("eviction is not implemented on InMemory Cache");
        };
        InMemoryCache.prototype.reset = function () {
            this.data.clear();
            this.broadcastWatches();
            return Promise.resolve();
        };
        InMemoryCache.prototype.removeOptimistic = function (idToRemove) {
            var toReapply = [];
            var removedCount = 0;
            var layer = this.optimisticData;
            while (layer instanceof OptimisticCacheLayer) {
                if (layer.optimisticId === idToRemove) {
                    ++removedCount;
                }
                else {
                    toReapply.push(layer);
                }
                layer = layer.parent;
            }
            if (removedCount > 0) {
                this.optimisticData = layer;
                while (toReapply.length > 0) {
                    var layer_1 = toReapply.pop();
                    this.performTransaction(layer_1.transaction, layer_1.optimisticId);
                }
                this.broadcastWatches();
            }
        };
        InMemoryCache.prototype.performTransaction = function (transaction, optimisticId) {
            var _a = this, data = _a.data, silenceBroadcast = _a.silenceBroadcast;
            this.silenceBroadcast = true;
            if (typeof optimisticId === 'string') {
                this.data = this.optimisticData = new OptimisticCacheLayer(optimisticId, this.optimisticData, transaction);
            }
            try {
                transaction(this);
            }
            finally {
                this.silenceBroadcast = silenceBroadcast;
                this.data = data;
            }
            this.broadcastWatches();
        };
        InMemoryCache.prototype.recordOptimisticTransaction = function (transaction, id) {
            return this.performTransaction(transaction, id);
        };
        InMemoryCache.prototype.transformDocument = function (document) {
            if (this.addTypename) {
                var result = this.typenameDocumentCache.get(document);
                if (!result) {
                    result = addTypenameToDocument(document);
                    this.typenameDocumentCache.set(document, result);
                    this.typenameDocumentCache.set(result, result);
                }
                return result;
            }
            return document;
        };
        InMemoryCache.prototype.broadcastWatches = function () {
            var _this = this;
            if (!this.silenceBroadcast) {
                this.watches.forEach(function (c) { return _this.maybeBroadcastWatch(c); });
            }
        };
        InMemoryCache.prototype.maybeBroadcastWatch = function (c) {
            c.callback(this.diff({
                query: c.query,
                variables: c.variables,
                previousResult: c.previousResult && c.previousResult(),
                optimistic: c.optimistic,
            }));
        };
        return InMemoryCache;
    }(ApolloCache));

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
     * Produces the value of a block string from its parsed raw value, similar to
     * CoffeeScript's block string, Python's docstring trim or Ruby's strip_heredoc.
     *
     * This implements the GraphQL spec's BlockStringValue() static algorithm.
     */
    function dedentBlockStringValue(rawString) {
      // Expand a block string's raw value into independent lines.
      var lines = rawString.split(/\r\n|[\n\r]/g); // Remove common indentation from all lines but first.

      var commonIndent = getBlockStringIndentation(lines);

      if (commonIndent !== 0) {
        for (var i = 1; i < lines.length; i++) {
          lines[i] = lines[i].slice(commonIndent);
        }
      } // Remove leading and trailing blank lines.


      while (lines.length > 0 && isBlank(lines[0])) {
        lines.shift();
      }

      while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
        lines.pop();
      } // Return a string of the lines joined with U+000A.


      return lines.join('\n');
    } // @internal

    function getBlockStringIndentation(lines) {
      var commonIndent = null;

      for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        var indent = leadingWhitespace(line);

        if (indent === line.length) {
          continue; // skip empty lines
        }

        if (commonIndent === null || indent < commonIndent) {
          commonIndent = indent;

          if (commonIndent === 0) {
            break;
          }
        }
      }

      return commonIndent === null ? 0 : commonIndent;
    }

    function leadingWhitespace(str) {
      var i = 0;

      while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
        i++;
      }

      return i;
    }

    function isBlank(str) {
      return leadingWhitespace(str) === str.length;
    }
    /**
     * Print a block string in the indented block form by adding a leading and
     * trailing blank line. However, if a block string starts with whitespace and is
     * a single-line, adding a leading blank line would strip that whitespace.
     */


    function printBlockString(value) {
      var indentation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var preferMultipleLines = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var isSingleLine = value.indexOf('\n') === -1;
      var hasLeadingSpace = value[0] === ' ' || value[0] === '\t';
      var hasTrailingQuote = value[value.length - 1] === '"';
      var printAsMultipleLines = !isSingleLine || hasTrailingQuote || preferMultipleLines;
      var result = ''; // Format a multi-line block quote to account for leading space.

      if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
        result += '\n' + indentation;
      }

      result += indentation ? value.replace(/\n/g, '\n' + indentation) : value;

      if (printAsMultipleLines) {
        result += '\n';
      }

      return '"""' + result.replace(/"""/g, '\\"""') + '"""';
    }

    /**
     * Converts an AST into a string, using one set of reasonable
     * formatting rules.
     */

    function print(ast) {
      return visit(ast, {
        leave: printDocASTReducer
      });
    } // TODO: provide better type coverage in future

    var printDocASTReducer = {
      Name: function Name(node) {
        return node.value;
      },
      Variable: function Variable(node) {
        return '$' + node.name;
      },
      // Document
      Document: function Document(node) {
        return join(node.definitions, '\n\n') + '\n';
      },
      OperationDefinition: function OperationDefinition(node) {
        var op = node.operation;
        var name = node.name;
        var varDefs = wrap$1('(', join(node.variableDefinitions, ', '), ')');
        var directives = join(node.directives, ' ');
        var selectionSet = node.selectionSet; // Anonymous queries with no directives or variable definitions can use
        // the query short form.

        return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
      },
      VariableDefinition: function VariableDefinition(_ref) {
        var variable = _ref.variable,
            type = _ref.type,
            defaultValue = _ref.defaultValue,
            directives = _ref.directives;
        return variable + ': ' + type + wrap$1(' = ', defaultValue) + wrap$1(' ', join(directives, ' '));
      },
      SelectionSet: function SelectionSet(_ref2) {
        var selections = _ref2.selections;
        return block(selections);
      },
      Field: function Field(_ref3) {
        var alias = _ref3.alias,
            name = _ref3.name,
            args = _ref3.arguments,
            directives = _ref3.directives,
            selectionSet = _ref3.selectionSet;
        return join([wrap$1('', alias, ': ') + name + wrap$1('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
      },
      Argument: function Argument(_ref4) {
        var name = _ref4.name,
            value = _ref4.value;
        return name + ': ' + value;
      },
      // Fragments
      FragmentSpread: function FragmentSpread(_ref5) {
        var name = _ref5.name,
            directives = _ref5.directives;
        return '...' + name + wrap$1(' ', join(directives, ' '));
      },
      InlineFragment: function InlineFragment(_ref6) {
        var typeCondition = _ref6.typeCondition,
            directives = _ref6.directives,
            selectionSet = _ref6.selectionSet;
        return join(['...', wrap$1('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
      },
      FragmentDefinition: function FragmentDefinition(_ref7) {
        var name = _ref7.name,
            typeCondition = _ref7.typeCondition,
            variableDefinitions = _ref7.variableDefinitions,
            directives = _ref7.directives,
            selectionSet = _ref7.selectionSet;
        return (// Note: fragment variable definitions are experimental and may be changed
          // or removed in the future.
          "fragment ".concat(name).concat(wrap$1('(', join(variableDefinitions, ', '), ')'), " ") + "on ".concat(typeCondition, " ").concat(wrap$1('', join(directives, ' '), ' ')) + selectionSet
        );
      },
      // Value
      IntValue: function IntValue(_ref8) {
        var value = _ref8.value;
        return value;
      },
      FloatValue: function FloatValue(_ref9) {
        var value = _ref9.value;
        return value;
      },
      StringValue: function StringValue(_ref10, key) {
        var value = _ref10.value,
            isBlockString = _ref10.block;
        return isBlockString ? printBlockString(value, key === 'description' ? '' : '  ') : JSON.stringify(value);
      },
      BooleanValue: function BooleanValue(_ref11) {
        var value = _ref11.value;
        return value ? 'true' : 'false';
      },
      NullValue: function NullValue() {
        return 'null';
      },
      EnumValue: function EnumValue(_ref12) {
        var value = _ref12.value;
        return value;
      },
      ListValue: function ListValue(_ref13) {
        var values = _ref13.values;
        return '[' + join(values, ', ') + ']';
      },
      ObjectValue: function ObjectValue(_ref14) {
        var fields = _ref14.fields;
        return '{' + join(fields, ', ') + '}';
      },
      ObjectField: function ObjectField(_ref15) {
        var name = _ref15.name,
            value = _ref15.value;
        return name + ': ' + value;
      },
      // Directive
      Directive: function Directive(_ref16) {
        var name = _ref16.name,
            args = _ref16.arguments;
        return '@' + name + wrap$1('(', join(args, ', '), ')');
      },
      // Type
      NamedType: function NamedType(_ref17) {
        var name = _ref17.name;
        return name;
      },
      ListType: function ListType(_ref18) {
        var type = _ref18.type;
        return '[' + type + ']';
      },
      NonNullType: function NonNullType(_ref19) {
        var type = _ref19.type;
        return type + '!';
      },
      // Type System Definitions
      SchemaDefinition: function SchemaDefinition(_ref20) {
        var directives = _ref20.directives,
            operationTypes = _ref20.operationTypes;
        return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
        var operation = _ref21.operation,
            type = _ref21.type;
        return operation + ': ' + type;
      },
      ScalarTypeDefinition: addDescription(function (_ref22) {
        var name = _ref22.name,
            directives = _ref22.directives;
        return join(['scalar', name, join(directives, ' ')], ' ');
      }),
      ObjectTypeDefinition: addDescription(function (_ref23) {
        var name = _ref23.name,
            interfaces = _ref23.interfaces,
            directives = _ref23.directives,
            fields = _ref23.fields;
        return join(['type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      }),
      FieldDefinition: addDescription(function (_ref24) {
        var name = _ref24.name,
            args = _ref24.arguments,
            type = _ref24.type,
            directives = _ref24.directives;
        return name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + ': ' + type + wrap$1(' ', join(directives, ' '));
      }),
      InputValueDefinition: addDescription(function (_ref25) {
        var name = _ref25.name,
            type = _ref25.type,
            defaultValue = _ref25.defaultValue,
            directives = _ref25.directives;
        return join([name + ': ' + type, wrap$1('= ', defaultValue), join(directives, ' ')], ' ');
      }),
      InterfaceTypeDefinition: addDescription(function (_ref26) {
        var name = _ref26.name,
            directives = _ref26.directives,
            fields = _ref26.fields;
        return join(['interface', name, join(directives, ' '), block(fields)], ' ');
      }),
      UnionTypeDefinition: addDescription(function (_ref27) {
        var name = _ref27.name,
            directives = _ref27.directives,
            types = _ref27.types;
        return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      }),
      EnumTypeDefinition: addDescription(function (_ref28) {
        var name = _ref28.name,
            directives = _ref28.directives,
            values = _ref28.values;
        return join(['enum', name, join(directives, ' '), block(values)], ' ');
      }),
      EnumValueDefinition: addDescription(function (_ref29) {
        var name = _ref29.name,
            directives = _ref29.directives;
        return join([name, join(directives, ' ')], ' ');
      }),
      InputObjectTypeDefinition: addDescription(function (_ref30) {
        var name = _ref30.name,
            directives = _ref30.directives,
            fields = _ref30.fields;
        return join(['input', name, join(directives, ' '), block(fields)], ' ');
      }),
      DirectiveDefinition: addDescription(function (_ref31) {
        var name = _ref31.name,
            args = _ref31.arguments,
            repeatable = _ref31.repeatable,
            locations = _ref31.locations;
        return 'directive @' + name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + (repeatable ? ' repeatable' : '') + ' on ' + join(locations, ' | ');
      }),
      SchemaExtension: function SchemaExtension(_ref32) {
        var directives = _ref32.directives,
            operationTypes = _ref32.operationTypes;
        return join(['extend schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
        var name = _ref33.name,
            directives = _ref33.directives;
        return join(['extend scalar', name, join(directives, ' ')], ' ');
      },
      ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
        var name = _ref34.name,
            interfaces = _ref34.interfaces,
            directives = _ref34.directives,
            fields = _ref34.fields;
        return join(['extend type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      },
      InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
        var name = _ref35.name,
            directives = _ref35.directives,
            fields = _ref35.fields;
        return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
      },
      UnionTypeExtension: function UnionTypeExtension(_ref36) {
        var name = _ref36.name,
            directives = _ref36.directives,
            types = _ref36.types;
        return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      },
      EnumTypeExtension: function EnumTypeExtension(_ref37) {
        var name = _ref37.name,
            directives = _ref37.directives,
            values = _ref37.values;
        return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
      },
      InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
        var name = _ref38.name,
            directives = _ref38.directives,
            fields = _ref38.fields;
        return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
      }
    };

    function addDescription(cb) {
      return function (node) {
        return join([node.description, cb(node)], '\n');
      };
    }
    /**
     * Given maybeArray, print an empty string if it is null or empty, otherwise
     * print all items together separated by separator if provided
     */


    function join(maybeArray, separator) {
      return maybeArray ? maybeArray.filter(function (x) {
        return x;
      }).join(separator || '') : '';
    }
    /**
     * Given array, print each item on its own line, wrapped in an
     * indented "{ }" block.
     */


    function block(array) {
      return array && array.length !== 0 ? '{\n' + indent(join(array, '\n')) + '\n}' : '';
    }
    /**
     * If maybeString is not null or empty, then wrap with start and end, otherwise
     * print an empty string.
     */


    function wrap$1(start, maybeString, end) {
      return maybeString ? start + maybeString + (end || '') : '';
    }

    function indent(maybeString) {
      return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
    }

    function isMultiline(string) {
      return string.indexOf('\n') !== -1;
    }

    function hasMultilineItems(maybeArray) {
      return maybeArray && maybeArray.some(isMultiline);
    }

    var printer = /*#__PURE__*/Object.freeze({
        __proto__: null,
        print: print
    });

    /**
     * The set of allowed kind values for AST nodes.
     */
    var Kind = Object.freeze({
      // Name
      NAME: 'Name',
      // Document
      DOCUMENT: 'Document',
      OPERATION_DEFINITION: 'OperationDefinition',
      VARIABLE_DEFINITION: 'VariableDefinition',
      SELECTION_SET: 'SelectionSet',
      FIELD: 'Field',
      ARGUMENT: 'Argument',
      // Fragments
      FRAGMENT_SPREAD: 'FragmentSpread',
      INLINE_FRAGMENT: 'InlineFragment',
      FRAGMENT_DEFINITION: 'FragmentDefinition',
      // Values
      VARIABLE: 'Variable',
      INT: 'IntValue',
      FLOAT: 'FloatValue',
      STRING: 'StringValue',
      BOOLEAN: 'BooleanValue',
      NULL: 'NullValue',
      ENUM: 'EnumValue',
      LIST: 'ListValue',
      OBJECT: 'ObjectValue',
      OBJECT_FIELD: 'ObjectField',
      // Directives
      DIRECTIVE: 'Directive',
      // Types
      NAMED_TYPE: 'NamedType',
      LIST_TYPE: 'ListType',
      NON_NULL_TYPE: 'NonNullType',
      // Type System Definitions
      SCHEMA_DEFINITION: 'SchemaDefinition',
      OPERATION_TYPE_DEFINITION: 'OperationTypeDefinition',
      // Type Definitions
      SCALAR_TYPE_DEFINITION: 'ScalarTypeDefinition',
      OBJECT_TYPE_DEFINITION: 'ObjectTypeDefinition',
      FIELD_DEFINITION: 'FieldDefinition',
      INPUT_VALUE_DEFINITION: 'InputValueDefinition',
      INTERFACE_TYPE_DEFINITION: 'InterfaceTypeDefinition',
      UNION_TYPE_DEFINITION: 'UnionTypeDefinition',
      ENUM_TYPE_DEFINITION: 'EnumTypeDefinition',
      ENUM_VALUE_DEFINITION: 'EnumValueDefinition',
      INPUT_OBJECT_TYPE_DEFINITION: 'InputObjectTypeDefinition',
      // Directive Definitions
      DIRECTIVE_DEFINITION: 'DirectiveDefinition',
      // Type System Extensions
      SCHEMA_EXTENSION: 'SchemaExtension',
      // Type Extensions
      SCALAR_TYPE_EXTENSION: 'ScalarTypeExtension',
      OBJECT_TYPE_EXTENSION: 'ObjectTypeExtension',
      INTERFACE_TYPE_EXTENSION: 'InterfaceTypeExtension',
      UNION_TYPE_EXTENSION: 'UnionTypeExtension',
      ENUM_TYPE_EXTENSION: 'EnumTypeExtension',
      INPUT_OBJECT_TYPE_EXTENSION: 'InputObjectTypeExtension'
    });
    /**
     * The enum type representing the possible kind values of AST nodes.
     */

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
                _a[result.default] = function () {
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

    var defaultHttpOptions = {
        includeQuery: true,
        includeExtensions: false,
    };
    var defaultHeaders = {
        accept: '*/*',
        'content-type': 'application/json',
    };
    var defaultOptions = {
        method: 'POST',
    };
    var fallbackHttpConfig = {
        http: defaultHttpOptions,
        headers: defaultHeaders,
        options: defaultOptions,
    };
    var throwServerError = function (response, result, message) {
        var error = new Error(message);
        error.name = 'ServerError';
        error.response = response;
        error.statusCode = response.status;
        error.result = result;
        throw error;
    };
    var parseAndCheckHttpResponse = function (operations) { return function (response) {
        return (response
            .text()
            .then(function (bodyText) {
            try {
                return JSON.parse(bodyText);
            }
            catch (err) {
                var parseError = err;
                parseError.name = 'ServerParseError';
                parseError.response = response;
                parseError.statusCode = response.status;
                parseError.bodyText = bodyText;
                return Promise.reject(parseError);
            }
        })
            .then(function (result) {
            if (response.status >= 300) {
                throwServerError(response, result, "Response not successful: Received status code " + response.status);
            }
            if (!Array.isArray(result) &&
                !result.hasOwnProperty('data') &&
                !result.hasOwnProperty('errors')) {
                throwServerError(response, result, "Server response was missing for query '" + (Array.isArray(operations)
                    ? operations.map(function (op) { return op.operationName; })
                    : operations.operationName) + "'.");
            }
            return result;
        }));
    }; };
    var checkFetcher = function (fetcher) {
        if (!fetcher && typeof fetch === 'undefined') {
            var library = 'unfetch';
            if (typeof window === 'undefined')
                library = 'node-fetch';
            throw  new InvariantError("\nfetch is not found globally and no fetcher passed, to fix pass a fetch for\nyour environment like https://www.npmjs.com/package/" + library + ".\n\nFor example:\nimport fetch from '" + library + "';\nimport { createHttpLink } from 'apollo-link-http';\n\nconst link = createHttpLink({ uri: '/graphql', fetch: fetch });");
        }
    };
    var createSignalIfSupported = function () {
        if (typeof AbortController === 'undefined')
            return { controller: false, signal: false };
        var controller = new AbortController();
        var signal = controller.signal;
        return { controller: controller, signal: signal };
    };
    var selectHttpOptionsAndBody = function (operation, fallbackConfig) {
        var configs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            configs[_i - 2] = arguments[_i];
        }
        var options = __assign({}, fallbackConfig.options, { headers: fallbackConfig.headers, credentials: fallbackConfig.credentials });
        var http = fallbackConfig.http;
        configs.forEach(function (config) {
            options = __assign({}, options, config.options, { headers: __assign({}, options.headers, config.headers) });
            if (config.credentials)
                options.credentials = config.credentials;
            http = __assign({}, http, config.http);
        });
        var operationName = operation.operationName, extensions = operation.extensions, variables = operation.variables, query = operation.query;
        var body = { operationName: operationName, variables: variables };
        if (http.includeExtensions)
            body.extensions = extensions;
        if (http.includeQuery)
            body.query = print(query);
        return {
            options: options,
            body: body,
        };
    };
    var serializeFetchParameter = function (p, label) {
        var serialized;
        try {
            serialized = JSON.stringify(p);
        }
        catch (e) {
            var parseError =  new InvariantError("Network request failed. " + label + " is not serializable: " + e.message);
            parseError.parseError = e;
            throw parseError;
        }
        return serialized;
    };
    var selectURI = function (operation, fallbackURI) {
        var context = operation.getContext();
        var contextURI = context.uri;
        if (contextURI) {
            return contextURI;
        }
        else if (typeof fallbackURI === 'function') {
            return fallbackURI(operation);
        }
        else {
            return fallbackURI || '/graphql';
        }
    };

    var createHttpLink = function (linkOptions) {
        if (linkOptions === void 0) { linkOptions = {}; }
        var _a = linkOptions.uri, uri = _a === void 0 ? '/graphql' : _a, fetcher = linkOptions.fetch, includeExtensions = linkOptions.includeExtensions, useGETForQueries = linkOptions.useGETForQueries, requestOptions = __rest(linkOptions, ["uri", "fetch", "includeExtensions", "useGETForQueries"]);
        checkFetcher(fetcher);
        if (!fetcher) {
            fetcher = fetch;
        }
        var linkConfig = {
            http: { includeExtensions: includeExtensions },
            options: requestOptions.fetchOptions,
            credentials: requestOptions.credentials,
            headers: requestOptions.headers,
        };
        return new ApolloLink(function (operation) {
            var chosenURI = selectURI(operation, uri);
            var context = operation.getContext();
            var clientAwarenessHeaders = {};
            if (context.clientAwareness) {
                var _a = context.clientAwareness, name_1 = _a.name, version = _a.version;
                if (name_1) {
                    clientAwarenessHeaders['apollographql-client-name'] = name_1;
                }
                if (version) {
                    clientAwarenessHeaders['apollographql-client-version'] = version;
                }
            }
            var contextHeaders = __assign({}, clientAwarenessHeaders, context.headers);
            var contextConfig = {
                http: context.http,
                options: context.fetchOptions,
                credentials: context.credentials,
                headers: contextHeaders,
            };
            var _b = selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig), options = _b.options, body = _b.body;
            var controller;
            if (!options.signal) {
                var _c = createSignalIfSupported(), _controller = _c.controller, signal = _c.signal;
                controller = _controller;
                if (controller)
                    options.signal = signal;
            }
            var definitionIsMutation = function (d) {
                return d.kind === 'OperationDefinition' && d.operation === 'mutation';
            };
            if (useGETForQueries &&
                !operation.query.definitions.some(definitionIsMutation)) {
                options.method = 'GET';
            }
            if (options.method === 'GET') {
                var _d = rewriteURIForGET(chosenURI, body), newURI = _d.newURI, parseError = _d.parseError;
                if (parseError) {
                    return fromError(parseError);
                }
                chosenURI = newURI;
            }
            else {
                try {
                    options.body = serializeFetchParameter(body, 'Payload');
                }
                catch (parseError) {
                    return fromError(parseError);
                }
            }
            return new Observable(function (observer) {
                fetcher(chosenURI, options)
                    .then(function (response) {
                    operation.setContext({ response: response });
                    return response;
                })
                    .then(parseAndCheckHttpResponse(operation))
                    .then(function (result) {
                    observer.next(result);
                    observer.complete();
                    return result;
                })
                    .catch(function (err) {
                    if (err.name === 'AbortError')
                        return;
                    if (err.result && err.result.errors && err.result.data) {
                        observer.next(err.result);
                    }
                    observer.error(err);
                });
                return function () {
                    if (controller)
                        controller.abort();
                };
            });
        });
    };
    function rewriteURIForGET(chosenURI, body) {
        var queryParams = [];
        var addQueryParam = function (key, value) {
            queryParams.push(key + "=" + encodeURIComponent(value));
        };
        if ('query' in body) {
            addQueryParam('query', body.query);
        }
        if (body.operationName) {
            addQueryParam('operationName', body.operationName);
        }
        if (body.variables) {
            var serializedVariables = void 0;
            try {
                serializedVariables = serializeFetchParameter(body.variables, 'Variables map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('variables', serializedVariables);
        }
        if (body.extensions) {
            var serializedExtensions = void 0;
            try {
                serializedExtensions = serializeFetchParameter(body.extensions, 'Extensions map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('extensions', serializedExtensions);
        }
        var fragment = '', preFragment = chosenURI;
        var fragmentStart = chosenURI.indexOf('#');
        if (fragmentStart !== -1) {
            fragment = chosenURI.substr(fragmentStart);
            preFragment = chosenURI.substr(0, fragmentStart);
        }
        var queryParamsPrefix = preFragment.indexOf('?') === -1 ? '?' : '&';
        var newURI = preFragment + queryParamsPrefix + queryParams.join('&') + fragment;
        return { newURI: newURI };
    }
    var HttpLink = (function (_super) {
        __extends(HttpLink, _super);
        function HttpLink(opts) {
            return _super.call(this, createHttpLink(opts).request) || this;
        }
        return HttpLink;
    }(ApolloLink));

    const headers = {'content-type': 'application/json'};
    const getHeaders = () => {
      return headers;
    };

    const cache = new InMemoryCache();
    //https://hasura-midcodes1.herokuapp.com/v1/graphql
    const wsLink = new WebSocketLink({
      uri: "ws://hasura-midcodes1.herokuapp.com/v1/graphql",
      options: {
        reconnect: true,
        lazy: true,
        connectionParams: () => {
          return { headers: getHeaders() };
        },
      },
    });

    const httpLink = new HttpLink({
      uri: "https://hasura-midcodes1.herokuapp.com/v1/graphql",
      headers: getHeaders()
    });

    const link = split(
      ({ query }) => {
        const { kind, operation } = getMainDefinition(query);
        return kind === "OperationDefinition" && operation === "subscription";
      },
      wsLink,
      httpLink
    );
     


    const client$1 = new ApolloClient({
      link,
      cache
    });

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

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

    var noop$1 = function () { };
    function observe(observable, initial) {
        if (!isObservable(observable)) {
            return readable(observable, noop$1);
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
    function setClient(client) {
        setContext(CLIENT, client);
    }

    var restoring = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();
    function restore(client, query, data) {
        restoring.add(client);
        afterHydrate(function () {
            restoring.delete(client);
        });
        client.writeQuery({ query: query, data: data });
    }
    function afterHydrate(callback) {
        // Attempt to wait for onMount (hydration of current component is complete),
        // but if that fails (e.g. outside of component initialization)
        // wait for next event loop for hydrate to complete
        try {
            onMount(callback);
        }
        catch (_error) {
            setTimeout(callback, 1);
        }
    }

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

    function subscribe$1(client, options) {
        var observable = client.subscribe(options);
        return observe(observable);
    }

    function devAssert(condition, message) {
      var booleanCondition = Boolean(condition);

      if (!booleanCondition) {
        throw new Error(message);
      }
    }

    /**
     * The `defineToJSON()` function defines toJSON() and inspect() prototype
     * methods, if no function provided they become aliases for toString().
     */

    function defineToJSON(classObject) {
      var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : classObject.prototype.toString;
      classObject.prototype.toJSON = fn;
      classObject.prototype.inspect = fn;

      if (nodejsCustomInspectSymbol) {
        classObject.prototype[nodejsCustomInspectSymbol] = fn;
      }
    }

    function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }

    /**
     * Return true if `value` is object-like. A value is object-like if it's not
     * `null` and has a `typeof` result of "object".
     */
    function isObjectLike(value) {
      return _typeof$1(value) == 'object' && value !== null;
    }

    /**
     * Represents a location in a Source.
     */

    /**
     * Takes a Source and a UTF-8 character offset, and returns the corresponding
     * line and column as a SourceLocation.
     */
    function getLocation(source, position) {
      var lineRegexp = /\r\n|[\n\r]/g;
      var line = 1;
      var column = position + 1;
      var match;

      while ((match = lineRegexp.exec(source.body)) && match.index < position) {
        line += 1;
        column = position + 1 - (match.index + match[0].length);
      }

      return {
        line: line,
        column: column
      };
    }

    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printLocation(location) {
      return printSourceLocation(location.source, getLocation(location.source, location.start));
    }
    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printSourceLocation(source, sourceLocation) {
      var firstLineColumnOffset = source.locationOffset.column - 1;
      var body = whitespace(firstLineColumnOffset) + source.body;
      var lineIndex = sourceLocation.line - 1;
      var lineOffset = source.locationOffset.line - 1;
      var lineNum = sourceLocation.line + lineOffset;
      var columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
      var columnNum = sourceLocation.column + columnOffset;
      var locationStr = "".concat(source.name, ":").concat(lineNum, ":").concat(columnNum, "\n");
      var lines = body.split(/\r\n|[\n\r]/g);
      var locationLine = lines[lineIndex]; // Special case for minified documents

      if (locationLine.length > 120) {
        var sublineIndex = Math.floor(columnNum / 80);
        var sublineColumnNum = columnNum % 80;
        var sublines = [];

        for (var i = 0; i < locationLine.length; i += 80) {
          sublines.push(locationLine.slice(i, i + 80));
        }

        return locationStr + printPrefixedLines([["".concat(lineNum), sublines[0]]].concat(sublines.slice(1, sublineIndex + 1).map(function (subline) {
          return ['', subline];
        }), [[' ', whitespace(sublineColumnNum - 1) + '^'], ['', sublines[sublineIndex + 1]]]));
      }

      return locationStr + printPrefixedLines([// Lines specified like this: ["prefix", "string"],
      ["".concat(lineNum - 1), lines[lineIndex - 1]], ["".concat(lineNum), locationLine], ['', whitespace(columnNum - 1) + '^'], ["".concat(lineNum + 1), lines[lineIndex + 1]]]);
    }

    function printPrefixedLines(lines) {
      var existingLines = lines.filter(function (_ref) {
        var _ = _ref[0],
            line = _ref[1];
        return line !== undefined;
      });
      var padLen = Math.max.apply(Math, existingLines.map(function (_ref2) {
        var prefix = _ref2[0];
        return prefix.length;
      }));
      return existingLines.map(function (_ref3) {
        var prefix = _ref3[0],
            line = _ref3[1];
        return lpad(padLen, prefix) + (line ? ' | ' + line : ' |');
      }).join('\n');
    }

    function whitespace(len) {
      return Array(len + 1).join(' ');
    }

    function lpad(len, str) {
      return whitespace(len - str.length) + str;
    }

    /**
     * A GraphQLError describes an Error found during the parse, validate, or
     * execute phases of performing a GraphQL operation. In addition to a message
     * and stack trace, it also includes information about the locations in a
     * GraphQL document and/or execution result that correspond to the Error.
     */

    function GraphQLError( // eslint-disable-line no-redeclare
    message, nodes, source, positions, path, originalError, extensions) {
      // Compute list of blame nodes.
      var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined; // Compute locations in the source for the given nodes/positions.


      var _source = source;

      if (!_source && _nodes) {
        var node = _nodes[0];
        _source = node && node.loc && node.loc.source;
      }

      var _positions = positions;

      if (!_positions && _nodes) {
        _positions = _nodes.reduce(function (list, node) {
          if (node.loc) {
            list.push(node.loc.start);
          }

          return list;
        }, []);
      }

      if (_positions && _positions.length === 0) {
        _positions = undefined;
      }

      var _locations;

      if (positions && source) {
        _locations = positions.map(function (pos) {
          return getLocation(source, pos);
        });
      } else if (_nodes) {
        _locations = _nodes.reduce(function (list, node) {
          if (node.loc) {
            list.push(getLocation(node.loc.source, node.loc.start));
          }

          return list;
        }, []);
      }

      var _extensions = extensions;

      if (_extensions == null && originalError != null) {
        var originalExtensions = originalError.extensions;

        if (isObjectLike(originalExtensions)) {
          _extensions = originalExtensions;
        }
      }

      Object.defineProperties(this, {
        message: {
          value: message,
          // By being enumerable, JSON.stringify will include `message` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: true,
          writable: true
        },
        locations: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: _locations || undefined,
          // By being enumerable, JSON.stringify will include `locations` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(_locations)
        },
        path: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: path || undefined,
          // By being enumerable, JSON.stringify will include `path` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(path)
        },
        nodes: {
          value: _nodes || undefined
        },
        source: {
          value: _source || undefined
        },
        positions: {
          value: _positions || undefined
        },
        originalError: {
          value: originalError
        },
        extensions: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: _extensions || undefined,
          // By being enumerable, JSON.stringify will include `path` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(_extensions)
        }
      }); // Include (non-enumerable) stack trace.

      if (originalError && originalError.stack) {
        Object.defineProperty(this, 'stack', {
          value: originalError.stack,
          writable: true,
          configurable: true
        });
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, GraphQLError);
      } else {
        Object.defineProperty(this, 'stack', {
          value: Error().stack,
          writable: true,
          configurable: true
        });
      }
    }
    GraphQLError.prototype = Object.create(Error.prototype, {
      constructor: {
        value: GraphQLError
      },
      name: {
        value: 'GraphQLError'
      },
      toString: {
        value: function toString() {
          return printError(this);
        }
      }
    });
    /**
     * Prints a GraphQLError to a string, representing useful location information
     * about the error's position in the source.
     */

    function printError(error) {
      var output = error.message;

      if (error.nodes) {
        for (var _i2 = 0, _error$nodes2 = error.nodes; _i2 < _error$nodes2.length; _i2++) {
          var node = _error$nodes2[_i2];

          if (node.loc) {
            output += '\n\n' + printLocation(node.loc);
          }
        }
      } else if (error.source && error.locations) {
        for (var _i4 = 0, _error$locations2 = error.locations; _i4 < _error$locations2.length; _i4++) {
          var location = _error$locations2[_i4];
          output += '\n\n' + printSourceLocation(error.source, location);
        }
      }

      return output;
    }

    /**
     * Produces a GraphQLError representing a syntax error, containing useful
     * descriptive information about the syntax error's position in the source.
     */

    function syntaxError(source, position, description) {
      return new GraphQLError("Syntax Error: ".concat(description), undefined, source, [position]);
    }

    /**
     * The `defineToStringTag()` function checks first to see if the runtime
     * supports the `Symbol` class and then if the `Symbol.toStringTag` constant
     * is defined as a `Symbol` instance. If both conditions are met, the
     * Symbol.toStringTag property is defined as a getter that returns the
     * supplied class constructor's name.
     *
     * @method defineToStringTag
     *
     * @param {Class<any>} classObject a class such as Object, String, Number but
     * typically one of your own creation through the class keyword; `class A {}`,
     * for example.
     */
    function defineToStringTag(classObject) {
      if (typeof Symbol === 'function' && Symbol.toStringTag) {
        Object.defineProperty(classObject.prototype, Symbol.toStringTag, {
          get: function get() {
            return this.constructor.name;
          }
        });
      }
    }

    /**
     * A representation of source input to GraphQL.
     * `name` and `locationOffset` are optional. They are useful for clients who
     * store GraphQL documents in source files; for example, if the GraphQL input
     * starts at line 40 in a file named Foo.graphql, it might be useful for name to
     * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
     * line and column in locationOffset are 1-indexed
     */
    var Source = function Source(body, name, locationOffset) {
      this.body = body;
      this.name = name || 'GraphQL request';
      this.locationOffset = locationOffset || {
        line: 1,
        column: 1
      };
      this.locationOffset.line > 0 || devAssert(0, 'line in locationOffset is 1-indexed and must be positive');
      this.locationOffset.column > 0 || devAssert(0, 'column in locationOffset is 1-indexed and must be positive');
    }; // Conditionally apply `[Symbol.toStringTag]` if `Symbol`s are supported

    defineToStringTag(Source);

    /**
     * An exported enum describing the different kinds of tokens that the
     * lexer emits.
     */
    var TokenKind = Object.freeze({
      SOF: '<SOF>',
      EOF: '<EOF>',
      BANG: '!',
      DOLLAR: '$',
      AMP: '&',
      PAREN_L: '(',
      PAREN_R: ')',
      SPREAD: '...',
      COLON: ':',
      EQUALS: '=',
      AT: '@',
      BRACKET_L: '[',
      BRACKET_R: ']',
      BRACE_L: '{',
      PIPE: '|',
      BRACE_R: '}',
      NAME: 'Name',
      INT: 'Int',
      FLOAT: 'Float',
      STRING: 'String',
      BLOCK_STRING: 'BlockString',
      COMMENT: 'Comment'
    });
    /**
     * The enum type representing the token kinds values.
     */

    /**
     * Given a Source object, this returns a Lexer for that source.
     * A Lexer is a stateful stream generator in that every time
     * it is advanced, it returns the next token in the Source. Assuming the
     * source lexes, the final Token emitted by the lexer will be of kind
     * EOF, after which the lexer will repeatedly return the same EOF token
     * whenever called.
     */

    function createLexer(source, options) {
      var startOfFileToken = new Tok(TokenKind.SOF, 0, 0, 0, 0, null);
      var lexer = {
        source: source,
        options: options,
        lastToken: startOfFileToken,
        token: startOfFileToken,
        line: 1,
        lineStart: 0,
        advance: advanceLexer,
        lookahead: lookahead
      };
      return lexer;
    }

    function advanceLexer() {
      this.lastToken = this.token;
      var token = this.token = this.lookahead();
      return token;
    }

    function lookahead() {
      var token = this.token;

      if (token.kind !== TokenKind.EOF) {
        do {
          // Note: next is only mutable during parsing, so we cast to allow this.
          token = token.next || (token.next = readToken(this, token));
        } while (token.kind === TokenKind.COMMENT);
      }

      return token;
    }
    /**
     * Helper function for constructing the Token object.
     */

    function Tok(kind, start, end, line, column, prev, value) {
      this.kind = kind;
      this.start = start;
      this.end = end;
      this.line = line;
      this.column = column;
      this.value = value;
      this.prev = prev;
      this.next = null;
    } // Print a simplified form when appearing in JSON/util.inspect.


    defineToJSON(Tok, function () {
      return {
        kind: this.kind,
        value: this.value,
        line: this.line,
        column: this.column
      };
    });

    function printCharCode(code) {
      return (// NaN/undefined represents access beyond the end of the file.
        isNaN(code) ? TokenKind.EOF : // Trust JSON for ASCII.
        code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
        "\"\\u".concat(('00' + code.toString(16).toUpperCase()).slice(-4), "\"")
      );
    }
    /**
     * Gets the next token from the source starting at the given position.
     *
     * This skips over whitespace until it finds the next lexable token, then lexes
     * punctuators immediately or calls the appropriate helper function for more
     * complicated tokens.
     */


    function readToken(lexer, prev) {
      var source = lexer.source;
      var body = source.body;
      var bodyLength = body.length;
      var pos = positionAfterWhitespace(body, prev.end, lexer);
      var line = lexer.line;
      var col = 1 + pos - lexer.lineStart;

      if (pos >= bodyLength) {
        return new Tok(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
      }

      var code = body.charCodeAt(pos); // SourceCharacter

      switch (code) {
        // !
        case 33:
          return new Tok(TokenKind.BANG, pos, pos + 1, line, col, prev);
        // #

        case 35:
          return readComment(source, pos, line, col, prev);
        // $

        case 36:
          return new Tok(TokenKind.DOLLAR, pos, pos + 1, line, col, prev);
        // &

        case 38:
          return new Tok(TokenKind.AMP, pos, pos + 1, line, col, prev);
        // (

        case 40:
          return new Tok(TokenKind.PAREN_L, pos, pos + 1, line, col, prev);
        // )

        case 41:
          return new Tok(TokenKind.PAREN_R, pos, pos + 1, line, col, prev);
        // .

        case 46:
          if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
            return new Tok(TokenKind.SPREAD, pos, pos + 3, line, col, prev);
          }

          break;
        // :

        case 58:
          return new Tok(TokenKind.COLON, pos, pos + 1, line, col, prev);
        // =

        case 61:
          return new Tok(TokenKind.EQUALS, pos, pos + 1, line, col, prev);
        // @

        case 64:
          return new Tok(TokenKind.AT, pos, pos + 1, line, col, prev);
        // [

        case 91:
          return new Tok(TokenKind.BRACKET_L, pos, pos + 1, line, col, prev);
        // ]

        case 93:
          return new Tok(TokenKind.BRACKET_R, pos, pos + 1, line, col, prev);
        // {

        case 123:
          return new Tok(TokenKind.BRACE_L, pos, pos + 1, line, col, prev);
        // |

        case 124:
          return new Tok(TokenKind.PIPE, pos, pos + 1, line, col, prev);
        // }

        case 125:
          return new Tok(TokenKind.BRACE_R, pos, pos + 1, line, col, prev);
        // A-Z _ a-z

        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 95:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          return readName(source, pos, line, col, prev);
        // - 0-9

        case 45:
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          return readNumber(source, pos, code, line, col, prev);
        // "

        case 34:
          if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
            return readBlockString(source, pos, line, col, prev, lexer);
          }

          return readString(source, pos, line, col, prev);
      }

      throw syntaxError(source, pos, unexpectedCharacterMessage(code));
    }
    /**
     * Report a message that an unexpected character was encountered.
     */


    function unexpectedCharacterMessage(code) {
      if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
        return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
      }

      if (code === 39) {
        // '
        return 'Unexpected single quote character (\'), did you mean to use a double quote (")?';
      }

      return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
    }
    /**
     * Reads from body starting at startPosition until it finds a non-whitespace
     * character, then returns the position of that character for lexing.
     */


    function positionAfterWhitespace(body, startPosition, lexer) {
      var bodyLength = body.length;
      var position = startPosition;

      while (position < bodyLength) {
        var code = body.charCodeAt(position); // tab | space | comma | BOM

        if (code === 9 || code === 32 || code === 44 || code === 0xfeff) {
          ++position;
        } else if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else {
          break;
        }
      }

      return position;
    }
    /**
     * Reads a comment token from the source file.
     *
     * #[\u0009\u0020-\uFFFF]*
     */


    function readComment(source, start, line, col, prev) {
      var body = source.body;
      var code;
      var position = start;

      do {
        code = body.charCodeAt(++position);
      } while (!isNaN(code) && ( // SourceCharacter but not LineTerminator
      code > 0x001f || code === 0x0009));

      return new Tok(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
    }
    /**
     * Reads a number token from the source file, either a float
     * or an int depending on whether a decimal point appears.
     *
     * Int:   -?(0|[1-9][0-9]*)
     * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
     */


    function readNumber(source, start, firstCode, line, col, prev) {
      var body = source.body;
      var code = firstCode;
      var position = start;
      var isFloat = false;

      if (code === 45) {
        // -
        code = body.charCodeAt(++position);
      }

      if (code === 48) {
        // 0
        code = body.charCodeAt(++position);

        if (code >= 48 && code <= 57) {
          throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
        }
      } else {
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 46) {
        // .
        isFloat = true;
        code = body.charCodeAt(++position);
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 69 || code === 101) {
        // E e
        isFloat = true;
        code = body.charCodeAt(++position);

        if (code === 43 || code === 45) {
          // + -
          code = body.charCodeAt(++position);
        }

        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      } // Numbers cannot be followed by . or e


      if (code === 46 || code === 69 || code === 101) {
        throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
      }

      return new Tok(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
    }
    /**
     * Returns the new position in the source after reading digits.
     */


    function readDigits(source, start, firstCode) {
      var body = source.body;
      var position = start;
      var code = firstCode;

      if (code >= 48 && code <= 57) {
        // 0 - 9
        do {
          code = body.charCodeAt(++position);
        } while (code >= 48 && code <= 57); // 0 - 9


        return position;
      }

      throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
    }
    /**
     * Reads a string token from the source file.
     *
     * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
     */


    function readString(source, start, line, col, prev) {
      var body = source.body;
      var position = start + 1;
      var chunkStart = position;
      var code = 0;
      var value = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position)) && // not LineTerminator
      code !== 0x000a && code !== 0x000d) {
        // Closing Quote (")
        if (code === 34) {
          value += body.slice(chunkStart, position);
          return new Tok(TokenKind.STRING, start, position + 1, line, col, prev, value);
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        ++position;

        if (code === 92) {
          // \
          value += body.slice(chunkStart, position - 1);
          code = body.charCodeAt(position);

          switch (code) {
            case 34:
              value += '"';
              break;

            case 47:
              value += '/';
              break;

            case 92:
              value += '\\';
              break;

            case 98:
              value += '\b';
              break;

            case 102:
              value += '\f';
              break;

            case 110:
              value += '\n';
              break;

            case 114:
              value += '\r';
              break;

            case 116:
              value += '\t';
              break;

            case 117:
              {
                // uXXXX
                var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));

                if (charCode < 0) {
                  var invalidSequence = body.slice(position + 1, position + 5);
                  throw syntaxError(source, position, "Invalid character escape sequence: \\u".concat(invalidSequence, "."));
                }

                value += String.fromCharCode(charCode);
                position += 4;
                break;
              }

            default:
              throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
          }

          ++position;
          chunkStart = position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Reads a block string token from the source file.
     *
     * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
     */


    function readBlockString(source, start, line, col, prev, lexer) {
      var body = source.body;
      var position = start + 3;
      var chunkStart = position;
      var code = 0;
      var rawValue = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
        // Closing Triple-Quote (""")
        if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
          rawValue += body.slice(chunkStart, position);
          return new Tok(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else if ( // Escape Triple-Quote (\""")
        code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
          rawValue += body.slice(chunkStart, position) + '"""';
          position += 4;
          chunkStart = position;
        } else {
          ++position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Converts four hexadecimal chars to the integer that the
     * string represents. For example, uniCharCode('0','0','0','f')
     * will return 15, and uniCharCode('0','0','f','f') returns 255.
     *
     * Returns a negative number on error, if a char was invalid.
     *
     * This is implemented by noting that char2hex() returns -1 on error,
     * which means the result of ORing the char2hex() will also be negative.
     */


    function uniCharCode(a, b, c, d) {
      return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
    }
    /**
     * Converts a hex character to its integer value.
     * '0' becomes 0, '9' becomes 9
     * 'A' becomes 10, 'F' becomes 15
     * 'a' becomes 10, 'f' becomes 15
     *
     * Returns -1 on error.
     */


    function char2hex(a) {
      return a >= 48 && a <= 57 ? a - 48 // 0-9
      : a >= 65 && a <= 70 ? a - 55 // A-F
      : a >= 97 && a <= 102 ? a - 87 // a-f
      : -1;
    }
    /**
     * Reads an alphanumeric + underscore name from the source.
     *
     * [_A-Za-z][_0-9A-Za-z]*
     */


    function readName(source, start, line, col, prev) {
      var body = source.body;
      var bodyLength = body.length;
      var position = start + 1;
      var code = 0;

      while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || // _
      code >= 48 && code <= 57 || // 0-9
      code >= 65 && code <= 90 || // A-Z
      code >= 97 && code <= 122) // a-z
      ) {
        ++position;
      }

      return new Tok(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
    }

    /**
     * The set of allowed directive location values.
     */
    var DirectiveLocation = Object.freeze({
      // Request Definitions
      QUERY: 'QUERY',
      MUTATION: 'MUTATION',
      SUBSCRIPTION: 'SUBSCRIPTION',
      FIELD: 'FIELD',
      FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
      FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
      INLINE_FRAGMENT: 'INLINE_FRAGMENT',
      VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
      // Type System Definitions
      SCHEMA: 'SCHEMA',
      SCALAR: 'SCALAR',
      OBJECT: 'OBJECT',
      FIELD_DEFINITION: 'FIELD_DEFINITION',
      ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
      INTERFACE: 'INTERFACE',
      UNION: 'UNION',
      ENUM: 'ENUM',
      ENUM_VALUE: 'ENUM_VALUE',
      INPUT_OBJECT: 'INPUT_OBJECT',
      INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
    });
    /**
     * The enum type representing the directive location values.
     */

    /**
     * Given a GraphQL source, parses it into a Document.
     * Throws GraphQLError if a syntax error is encountered.
     */
    function parse(source, options) {
      var parser = new Parser(source, options);
      return parser.parseDocument();
    }
    /**
     * Given a string containing a GraphQL value (ex. `[42]`), parse the AST for
     * that value.
     * Throws GraphQLError if a syntax error is encountered.
     *
     * This is useful within tools that operate upon GraphQL Values directly and
     * in isolation of complete GraphQL documents.
     *
     * Consider providing the results to the utility function: valueFromAST().
     */

    function parseValue(source, options) {
      var parser = new Parser(source, options);
      parser.expectToken(TokenKind.SOF);
      var value = parser.parseValueLiteral(false);
      parser.expectToken(TokenKind.EOF);
      return value;
    }
    /**
     * Given a string containing a GraphQL Type (ex. `[Int!]`), parse the AST for
     * that type.
     * Throws GraphQLError if a syntax error is encountered.
     *
     * This is useful within tools that operate upon GraphQL Types directly and
     * in isolation of complete GraphQL documents.
     *
     * Consider providing the results to the utility function: typeFromAST().
     */

    function parseType(source, options) {
      var parser = new Parser(source, options);
      parser.expectToken(TokenKind.SOF);
      var type = parser.parseTypeReference();
      parser.expectToken(TokenKind.EOF);
      return type;
    }

    var Parser =
    /*#__PURE__*/
    function () {
      function Parser(source, options) {
        var sourceObj = typeof source === 'string' ? new Source(source) : source;
        sourceObj instanceof Source || devAssert(0, "Must provide Source. Received: ".concat(inspect(sourceObj)));
        this._lexer = createLexer(sourceObj);
        this._options = options || {};
      }
      /**
       * Converts a name lex token into a name parse node.
       */


      var _proto = Parser.prototype;

      _proto.parseName = function parseName() {
        var token = this.expectToken(TokenKind.NAME);
        return {
          kind: Kind.NAME,
          value: token.value,
          loc: this.loc(token)
        };
      } // Implements the parsing rules in the Document section.

      /**
       * Document : Definition+
       */
      ;

      _proto.parseDocument = function parseDocument() {
        var start = this._lexer.token;
        return {
          kind: Kind.DOCUMENT,
          definitions: this.many(TokenKind.SOF, this.parseDefinition, TokenKind.EOF),
          loc: this.loc(start)
        };
      }
      /**
       * Definition :
       *   - ExecutableDefinition
       *   - TypeSystemDefinition
       *   - TypeSystemExtension
       *
       * ExecutableDefinition :
       *   - OperationDefinition
       *   - FragmentDefinition
       */
      ;

      _proto.parseDefinition = function parseDefinition() {
        if (this.peek(TokenKind.NAME)) {
          switch (this._lexer.token.value) {
            case 'query':
            case 'mutation':
            case 'subscription':
              return this.parseOperationDefinition();

            case 'fragment':
              return this.parseFragmentDefinition();

            case 'schema':
            case 'scalar':
            case 'type':
            case 'interface':
            case 'union':
            case 'enum':
            case 'input':
            case 'directive':
              return this.parseTypeSystemDefinition();

            case 'extend':
              return this.parseTypeSystemExtension();
          }
        } else if (this.peek(TokenKind.BRACE_L)) {
          return this.parseOperationDefinition();
        } else if (this.peekDescription()) {
          return this.parseTypeSystemDefinition();
        }

        throw this.unexpected();
      } // Implements the parsing rules in the Operations section.

      /**
       * OperationDefinition :
       *  - SelectionSet
       *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
       */
      ;

      _proto.parseOperationDefinition = function parseOperationDefinition() {
        var start = this._lexer.token;

        if (this.peek(TokenKind.BRACE_L)) {
          return {
            kind: Kind.OPERATION_DEFINITION,
            operation: 'query',
            name: undefined,
            variableDefinitions: [],
            directives: [],
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start)
          };
        }

        var operation = this.parseOperationType();
        var name;

        if (this.peek(TokenKind.NAME)) {
          name = this.parseName();
        }

        return {
          kind: Kind.OPERATION_DEFINITION,
          operation: operation,
          name: name,
          variableDefinitions: this.parseVariableDefinitions(),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * OperationType : one of query mutation subscription
       */
      ;

      _proto.parseOperationType = function parseOperationType() {
        var operationToken = this.expectToken(TokenKind.NAME);

        switch (operationToken.value) {
          case 'query':
            return 'query';

          case 'mutation':
            return 'mutation';

          case 'subscription':
            return 'subscription';
        }

        throw this.unexpected(operationToken);
      }
      /**
       * VariableDefinitions : ( VariableDefinition+ )
       */
      ;

      _proto.parseVariableDefinitions = function parseVariableDefinitions() {
        return this.optionalMany(TokenKind.PAREN_L, this.parseVariableDefinition, TokenKind.PAREN_R);
      }
      /**
       * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
       */
      ;

      _proto.parseVariableDefinition = function parseVariableDefinition() {
        var start = this._lexer.token;
        return {
          kind: Kind.VARIABLE_DEFINITION,
          variable: this.parseVariable(),
          type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
          defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseValueLiteral(true) : undefined,
          directives: this.parseDirectives(true),
          loc: this.loc(start)
        };
      }
      /**
       * Variable : $ Name
       */
      ;

      _proto.parseVariable = function parseVariable() {
        var start = this._lexer.token;
        this.expectToken(TokenKind.DOLLAR);
        return {
          kind: Kind.VARIABLE,
          name: this.parseName(),
          loc: this.loc(start)
        };
      }
      /**
       * SelectionSet : { Selection+ }
       */
      ;

      _proto.parseSelectionSet = function parseSelectionSet() {
        var start = this._lexer.token;
        return {
          kind: Kind.SELECTION_SET,
          selections: this.many(TokenKind.BRACE_L, this.parseSelection, TokenKind.BRACE_R),
          loc: this.loc(start)
        };
      }
      /**
       * Selection :
       *   - Field
       *   - FragmentSpread
       *   - InlineFragment
       */
      ;

      _proto.parseSelection = function parseSelection() {
        return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
      }
      /**
       * Field : Alias? Name Arguments? Directives? SelectionSet?
       *
       * Alias : Name :
       */
      ;

      _proto.parseField = function parseField() {
        var start = this._lexer.token;
        var nameOrAlias = this.parseName();
        var alias;
        var name;

        if (this.expectOptionalToken(TokenKind.COLON)) {
          alias = nameOrAlias;
          name = this.parseName();
        } else {
          name = nameOrAlias;
        }

        return {
          kind: Kind.FIELD,
          alias: alias,
          name: name,
          arguments: this.parseArguments(false),
          directives: this.parseDirectives(false),
          selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : undefined,
          loc: this.loc(start)
        };
      }
      /**
       * Arguments[Const] : ( Argument[?Const]+ )
       */
      ;

      _proto.parseArguments = function parseArguments(isConst) {
        var item = isConst ? this.parseConstArgument : this.parseArgument;
        return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
      }
      /**
       * Argument[Const] : Name : Value[?Const]
       */
      ;

      _proto.parseArgument = function parseArgument() {
        var start = this._lexer.token;
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        return {
          kind: Kind.ARGUMENT,
          name: name,
          value: this.parseValueLiteral(false),
          loc: this.loc(start)
        };
      };

      _proto.parseConstArgument = function parseConstArgument() {
        var start = this._lexer.token;
        return {
          kind: Kind.ARGUMENT,
          name: this.parseName(),
          value: (this.expectToken(TokenKind.COLON), this.parseValueLiteral(true)),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Fragments section.

      /**
       * Corresponds to both FragmentSpread and InlineFragment in the spec.
       *
       * FragmentSpread : ... FragmentName Directives?
       *
       * InlineFragment : ... TypeCondition? Directives? SelectionSet
       */
      ;

      _proto.parseFragment = function parseFragment() {
        var start = this._lexer.token;
        this.expectToken(TokenKind.SPREAD);
        var hasTypeCondition = this.expectOptionalKeyword('on');

        if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
          return {
            kind: Kind.FRAGMENT_SPREAD,
            name: this.parseFragmentName(),
            directives: this.parseDirectives(false),
            loc: this.loc(start)
          };
        }

        return {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition: hasTypeCondition ? this.parseNamedType() : undefined,
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * FragmentDefinition :
       *   - fragment FragmentName on TypeCondition Directives? SelectionSet
       *
       * TypeCondition : NamedType
       */
      ;

      _proto.parseFragmentDefinition = function parseFragmentDefinition() {
        var start = this._lexer.token;
        this.expectKeyword('fragment'); // Experimental support for defining variables within fragments changes
        // the grammar of FragmentDefinition:
        //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet

        if (this._options.experimentalFragmentVariables) {
          return {
            kind: Kind.FRAGMENT_DEFINITION,
            name: this.parseFragmentName(),
            variableDefinitions: this.parseVariableDefinitions(),
            typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
            directives: this.parseDirectives(false),
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start)
          };
        }

        return {
          kind: Kind.FRAGMENT_DEFINITION,
          name: this.parseFragmentName(),
          typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * FragmentName : Name but not `on`
       */
      ;

      _proto.parseFragmentName = function parseFragmentName() {
        if (this._lexer.token.value === 'on') {
          throw this.unexpected();
        }

        return this.parseName();
      } // Implements the parsing rules in the Values section.

      /**
       * Value[Const] :
       *   - [~Const] Variable
       *   - IntValue
       *   - FloatValue
       *   - StringValue
       *   - BooleanValue
       *   - NullValue
       *   - EnumValue
       *   - ListValue[?Const]
       *   - ObjectValue[?Const]
       *
       * BooleanValue : one of `true` `false`
       *
       * NullValue : `null`
       *
       * EnumValue : Name but not `true`, `false` or `null`
       */
      ;

      _proto.parseValueLiteral = function parseValueLiteral(isConst) {
        var token = this._lexer.token;

        switch (token.kind) {
          case TokenKind.BRACKET_L:
            return this.parseList(isConst);

          case TokenKind.BRACE_L:
            return this.parseObject(isConst);

          case TokenKind.INT:
            this._lexer.advance();

            return {
              kind: Kind.INT,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.FLOAT:
            this._lexer.advance();

            return {
              kind: Kind.FLOAT,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.STRING:
          case TokenKind.BLOCK_STRING:
            return this.parseStringLiteral();

          case TokenKind.NAME:
            if (token.value === 'true' || token.value === 'false') {
              this._lexer.advance();

              return {
                kind: Kind.BOOLEAN,
                value: token.value === 'true',
                loc: this.loc(token)
              };
            } else if (token.value === 'null') {
              this._lexer.advance();

              return {
                kind: Kind.NULL,
                loc: this.loc(token)
              };
            }

            this._lexer.advance();

            return {
              kind: Kind.ENUM,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.DOLLAR:
            if (!isConst) {
              return this.parseVariable();
            }

            break;
        }

        throw this.unexpected();
      };

      _proto.parseStringLiteral = function parseStringLiteral() {
        var token = this._lexer.token;

        this._lexer.advance();

        return {
          kind: Kind.STRING,
          value: token.value,
          block: token.kind === TokenKind.BLOCK_STRING,
          loc: this.loc(token)
        };
      }
      /**
       * ListValue[Const] :
       *   - [ ]
       *   - [ Value[?Const]+ ]
       */
      ;

      _proto.parseList = function parseList(isConst) {
        var _this = this;

        var start = this._lexer.token;

        var item = function item() {
          return _this.parseValueLiteral(isConst);
        };

        return {
          kind: Kind.LIST,
          values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
          loc: this.loc(start)
        };
      }
      /**
       * ObjectValue[Const] :
       *   - { }
       *   - { ObjectField[?Const]+ }
       */
      ;

      _proto.parseObject = function parseObject(isConst) {
        var _this2 = this;

        var start = this._lexer.token;

        var item = function item() {
          return _this2.parseObjectField(isConst);
        };

        return {
          kind: Kind.OBJECT,
          fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R),
          loc: this.loc(start)
        };
      }
      /**
       * ObjectField[Const] : Name : Value[?Const]
       */
      ;

      _proto.parseObjectField = function parseObjectField(isConst) {
        var start = this._lexer.token;
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        return {
          kind: Kind.OBJECT_FIELD,
          name: name,
          value: this.parseValueLiteral(isConst),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Directives section.

      /**
       * Directives[Const] : Directive[?Const]+
       */
      ;

      _proto.parseDirectives = function parseDirectives(isConst) {
        var directives = [];

        while (this.peek(TokenKind.AT)) {
          directives.push(this.parseDirective(isConst));
        }

        return directives;
      }
      /**
       * Directive[Const] : @ Name Arguments[?Const]?
       */
      ;

      _proto.parseDirective = function parseDirective(isConst) {
        var start = this._lexer.token;
        this.expectToken(TokenKind.AT);
        return {
          kind: Kind.DIRECTIVE,
          name: this.parseName(),
          arguments: this.parseArguments(isConst),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Types section.

      /**
       * Type :
       *   - NamedType
       *   - ListType
       *   - NonNullType
       */
      ;

      _proto.parseTypeReference = function parseTypeReference() {
        var start = this._lexer.token;
        var type;

        if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
          type = this.parseTypeReference();
          this.expectToken(TokenKind.BRACKET_R);
          type = {
            kind: Kind.LIST_TYPE,
            type: type,
            loc: this.loc(start)
          };
        } else {
          type = this.parseNamedType();
        }

        if (this.expectOptionalToken(TokenKind.BANG)) {
          return {
            kind: Kind.NON_NULL_TYPE,
            type: type,
            loc: this.loc(start)
          };
        }

        return type;
      }
      /**
       * NamedType : Name
       */
      ;

      _proto.parseNamedType = function parseNamedType() {
        var start = this._lexer.token;
        return {
          kind: Kind.NAMED_TYPE,
          name: this.parseName(),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Type Definition section.

      /**
       * TypeSystemDefinition :
       *   - SchemaDefinition
       *   - TypeDefinition
       *   - DirectiveDefinition
       *
       * TypeDefinition :
       *   - ScalarTypeDefinition
       *   - ObjectTypeDefinition
       *   - InterfaceTypeDefinition
       *   - UnionTypeDefinition
       *   - EnumTypeDefinition
       *   - InputObjectTypeDefinition
       */
      ;

      _proto.parseTypeSystemDefinition = function parseTypeSystemDefinition() {
        // Many definitions begin with a description and require a lookahead.
        var keywordToken = this.peekDescription() ? this._lexer.lookahead() : this._lexer.token;

        if (keywordToken.kind === TokenKind.NAME) {
          switch (keywordToken.value) {
            case 'schema':
              return this.parseSchemaDefinition();

            case 'scalar':
              return this.parseScalarTypeDefinition();

            case 'type':
              return this.parseObjectTypeDefinition();

            case 'interface':
              return this.parseInterfaceTypeDefinition();

            case 'union':
              return this.parseUnionTypeDefinition();

            case 'enum':
              return this.parseEnumTypeDefinition();

            case 'input':
              return this.parseInputObjectTypeDefinition();

            case 'directive':
              return this.parseDirectiveDefinition();
          }
        }

        throw this.unexpected(keywordToken);
      };

      _proto.peekDescription = function peekDescription() {
        return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
      }
      /**
       * Description : StringValue
       */
      ;

      _proto.parseDescription = function parseDescription() {
        if (this.peekDescription()) {
          return this.parseStringLiteral();
        }
      }
      /**
       * SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
       */
      ;

      _proto.parseSchemaDefinition = function parseSchemaDefinition() {
        var start = this._lexer.token;
        this.expectKeyword('schema');
        var directives = this.parseDirectives(true);
        var operationTypes = this.many(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
        return {
          kind: Kind.SCHEMA_DEFINITION,
          directives: directives,
          operationTypes: operationTypes,
          loc: this.loc(start)
        };
      }
      /**
       * OperationTypeDefinition : OperationType : NamedType
       */
      ;

      _proto.parseOperationTypeDefinition = function parseOperationTypeDefinition() {
        var start = this._lexer.token;
        var operation = this.parseOperationType();
        this.expectToken(TokenKind.COLON);
        var type = this.parseNamedType();
        return {
          kind: Kind.OPERATION_TYPE_DEFINITION,
          operation: operation,
          type: type,
          loc: this.loc(start)
        };
      }
      /**
       * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
       */
      ;

      _proto.parseScalarTypeDefinition = function parseScalarTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('scalar');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.SCALAR_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ObjectTypeDefinition :
       *   Description?
       *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
       */
      ;

      _proto.parseObjectTypeDefinition = function parseObjectTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('type');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();
        return {
          kind: Kind.OBJECT_TYPE_DEFINITION,
          description: description,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * ImplementsInterfaces :
       *   - implements `&`? NamedType
       *   - ImplementsInterfaces & NamedType
       */
      ;

      _proto.parseImplementsInterfaces = function parseImplementsInterfaces() {
        var types = [];

        if (this.expectOptionalKeyword('implements')) {
          // Optional leading ampersand
          this.expectOptionalToken(TokenKind.AMP);

          do {
            types.push(this.parseNamedType());
          } while (this.expectOptionalToken(TokenKind.AMP) || // Legacy support for the SDL?
          this._options.allowLegacySDLImplementsInterfaces && this.peek(TokenKind.NAME));
        }

        return types;
      }
      /**
       * FieldsDefinition : { FieldDefinition+ }
       */
      ;

      _proto.parseFieldsDefinition = function parseFieldsDefinition() {
        // Legacy support for the SDL?
        if (this._options.allowLegacySDLEmptyFields && this.peek(TokenKind.BRACE_L) && this._lexer.lookahead().kind === TokenKind.BRACE_R) {
          this._lexer.advance();

          this._lexer.advance();

          return [];
        }

        return this.optionalMany(TokenKind.BRACE_L, this.parseFieldDefinition, TokenKind.BRACE_R);
      }
      /**
       * FieldDefinition :
       *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
       */
      ;

      _proto.parseFieldDefinition = function parseFieldDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        var args = this.parseArgumentDefs();
        this.expectToken(TokenKind.COLON);
        var type = this.parseTypeReference();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.FIELD_DEFINITION,
          description: description,
          name: name,
          arguments: args,
          type: type,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ArgumentsDefinition : ( InputValueDefinition+ )
       */
      ;

      _proto.parseArgumentDefs = function parseArgumentDefs() {
        return this.optionalMany(TokenKind.PAREN_L, this.parseInputValueDef, TokenKind.PAREN_R);
      }
      /**
       * InputValueDefinition :
       *   - Description? Name : Type DefaultValue? Directives[Const]?
       */
      ;

      _proto.parseInputValueDef = function parseInputValueDef() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        var type = this.parseTypeReference();
        var defaultValue;

        if (this.expectOptionalToken(TokenKind.EQUALS)) {
          defaultValue = this.parseValueLiteral(true);
        }

        var directives = this.parseDirectives(true);
        return {
          kind: Kind.INPUT_VALUE_DEFINITION,
          description: description,
          name: name,
          type: type,
          defaultValue: defaultValue,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * InterfaceTypeDefinition :
       *   - Description? interface Name Directives[Const]? FieldsDefinition?
       */
      ;

      _proto.parseInterfaceTypeDefinition = function parseInterfaceTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('interface');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();
        return {
          kind: Kind.INTERFACE_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * UnionTypeDefinition :
       *   - Description? union Name Directives[Const]? UnionMemberTypes?
       */
      ;

      _proto.parseUnionTypeDefinition = function parseUnionTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('union');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var types = this.parseUnionMemberTypes();
        return {
          kind: Kind.UNION_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          types: types,
          loc: this.loc(start)
        };
      }
      /**
       * UnionMemberTypes :
       *   - = `|`? NamedType
       *   - UnionMemberTypes | NamedType
       */
      ;

      _proto.parseUnionMemberTypes = function parseUnionMemberTypes() {
        var types = [];

        if (this.expectOptionalToken(TokenKind.EQUALS)) {
          // Optional leading pipe
          this.expectOptionalToken(TokenKind.PIPE);

          do {
            types.push(this.parseNamedType());
          } while (this.expectOptionalToken(TokenKind.PIPE));
        }

        return types;
      }
      /**
       * EnumTypeDefinition :
       *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
       */
      ;

      _proto.parseEnumTypeDefinition = function parseEnumTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('enum');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var values = this.parseEnumValuesDefinition();
        return {
          kind: Kind.ENUM_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          values: values,
          loc: this.loc(start)
        };
      }
      /**
       * EnumValuesDefinition : { EnumValueDefinition+ }
       */
      ;

      _proto.parseEnumValuesDefinition = function parseEnumValuesDefinition() {
        return this.optionalMany(TokenKind.BRACE_L, this.parseEnumValueDefinition, TokenKind.BRACE_R);
      }
      /**
       * EnumValueDefinition : Description? EnumValue Directives[Const]?
       *
       * EnumValue : Name
       */
      ;

      _proto.parseEnumValueDefinition = function parseEnumValueDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.ENUM_VALUE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * InputObjectTypeDefinition :
       *   - Description? input Name Directives[Const]? InputFieldsDefinition?
       */
      ;

      _proto.parseInputObjectTypeDefinition = function parseInputObjectTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('input');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseInputFieldsDefinition();
        return {
          kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * InputFieldsDefinition : { InputValueDefinition+ }
       */
      ;

      _proto.parseInputFieldsDefinition = function parseInputFieldsDefinition() {
        return this.optionalMany(TokenKind.BRACE_L, this.parseInputValueDef, TokenKind.BRACE_R);
      }
      /**
       * TypeSystemExtension :
       *   - SchemaExtension
       *   - TypeExtension
       *
       * TypeExtension :
       *   - ScalarTypeExtension
       *   - ObjectTypeExtension
       *   - InterfaceTypeExtension
       *   - UnionTypeExtension
       *   - EnumTypeExtension
       *   - InputObjectTypeDefinition
       */
      ;

      _proto.parseTypeSystemExtension = function parseTypeSystemExtension() {
        var keywordToken = this._lexer.lookahead();

        if (keywordToken.kind === TokenKind.NAME) {
          switch (keywordToken.value) {
            case 'schema':
              return this.parseSchemaExtension();

            case 'scalar':
              return this.parseScalarTypeExtension();

            case 'type':
              return this.parseObjectTypeExtension();

            case 'interface':
              return this.parseInterfaceTypeExtension();

            case 'union':
              return this.parseUnionTypeExtension();

            case 'enum':
              return this.parseEnumTypeExtension();

            case 'input':
              return this.parseInputObjectTypeExtension();
          }
        }

        throw this.unexpected(keywordToken);
      }
      /**
       * SchemaExtension :
       *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
       *  - extend schema Directives[Const]
       */
      ;

      _proto.parseSchemaExtension = function parseSchemaExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('schema');
        var directives = this.parseDirectives(true);
        var operationTypes = this.optionalMany(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);

        if (directives.length === 0 && operationTypes.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.SCHEMA_EXTENSION,
          directives: directives,
          operationTypes: operationTypes,
          loc: this.loc(start)
        };
      }
      /**
       * ScalarTypeExtension :
       *   - extend scalar Name Directives[Const]
       */
      ;

      _proto.parseScalarTypeExtension = function parseScalarTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('scalar');
        var name = this.parseName();
        var directives = this.parseDirectives(true);

        if (directives.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.SCALAR_TYPE_EXTENSION,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ObjectTypeExtension :
       *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
       *  - extend type Name ImplementsInterfaces? Directives[Const]
       *  - extend type Name ImplementsInterfaces
       */
      ;

      _proto.parseObjectTypeExtension = function parseObjectTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('type');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();

        if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.OBJECT_TYPE_EXTENSION,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * InterfaceTypeExtension :
       *   - extend interface Name Directives[Const]? FieldsDefinition
       *   - extend interface Name Directives[Const]
       */
      ;

      _proto.parseInterfaceTypeExtension = function parseInterfaceTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('interface');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();

        if (directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.INTERFACE_TYPE_EXTENSION,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * UnionTypeExtension :
       *   - extend union Name Directives[Const]? UnionMemberTypes
       *   - extend union Name Directives[Const]
       */
      ;

      _proto.parseUnionTypeExtension = function parseUnionTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('union');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var types = this.parseUnionMemberTypes();

        if (directives.length === 0 && types.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.UNION_TYPE_EXTENSION,
          name: name,
          directives: directives,
          types: types,
          loc: this.loc(start)
        };
      }
      /**
       * EnumTypeExtension :
       *   - extend enum Name Directives[Const]? EnumValuesDefinition
       *   - extend enum Name Directives[Const]
       */
      ;

      _proto.parseEnumTypeExtension = function parseEnumTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('enum');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var values = this.parseEnumValuesDefinition();

        if (directives.length === 0 && values.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.ENUM_TYPE_EXTENSION,
          name: name,
          directives: directives,
          values: values,
          loc: this.loc(start)
        };
      }
      /**
       * InputObjectTypeExtension :
       *   - extend input Name Directives[Const]? InputFieldsDefinition
       *   - extend input Name Directives[Const]
       */
      ;

      _proto.parseInputObjectTypeExtension = function parseInputObjectTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('input');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseInputFieldsDefinition();

        if (directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * DirectiveDefinition :
       *   - Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations
       */
      ;

      _proto.parseDirectiveDefinition = function parseDirectiveDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('directive');
        this.expectToken(TokenKind.AT);
        var name = this.parseName();
        var args = this.parseArgumentDefs();
        var repeatable = this.expectOptionalKeyword('repeatable');
        this.expectKeyword('on');
        var locations = this.parseDirectiveLocations();
        return {
          kind: Kind.DIRECTIVE_DEFINITION,
          description: description,
          name: name,
          arguments: args,
          repeatable: repeatable,
          locations: locations,
          loc: this.loc(start)
        };
      }
      /**
       * DirectiveLocations :
       *   - `|`? DirectiveLocation
       *   - DirectiveLocations | DirectiveLocation
       */
      ;

      _proto.parseDirectiveLocations = function parseDirectiveLocations() {
        // Optional leading pipe
        this.expectOptionalToken(TokenKind.PIPE);
        var locations = [];

        do {
          locations.push(this.parseDirectiveLocation());
        } while (this.expectOptionalToken(TokenKind.PIPE));

        return locations;
      }
      /*
       * DirectiveLocation :
       *   - ExecutableDirectiveLocation
       *   - TypeSystemDirectiveLocation
       *
       * ExecutableDirectiveLocation : one of
       *   `QUERY`
       *   `MUTATION`
       *   `SUBSCRIPTION`
       *   `FIELD`
       *   `FRAGMENT_DEFINITION`
       *   `FRAGMENT_SPREAD`
       *   `INLINE_FRAGMENT`
       *
       * TypeSystemDirectiveLocation : one of
       *   `SCHEMA`
       *   `SCALAR`
       *   `OBJECT`
       *   `FIELD_DEFINITION`
       *   `ARGUMENT_DEFINITION`
       *   `INTERFACE`
       *   `UNION`
       *   `ENUM`
       *   `ENUM_VALUE`
       *   `INPUT_OBJECT`
       *   `INPUT_FIELD_DEFINITION`
       */
      ;

      _proto.parseDirectiveLocation = function parseDirectiveLocation() {
        var start = this._lexer.token;
        var name = this.parseName();

        if (DirectiveLocation[name.value] !== undefined) {
          return name;
        }

        throw this.unexpected(start);
      } // Core parsing utility functions

      /**
       * Returns a location object, used to identify the place in
       * the source that created a given parsed object.
       */
      ;

      _proto.loc = function loc(startToken) {
        if (!this._options.noLocation) {
          return new Loc(startToken, this._lexer.lastToken, this._lexer.source);
        }
      }
      /**
       * Determines if the next token is of a given kind
       */
      ;

      _proto.peek = function peek(kind) {
        return this._lexer.token.kind === kind;
      }
      /**
       * If the next token is of the given kind, return that token after advancing
       * the lexer. Otherwise, do not change the parser state and throw an error.
       */
      ;

      _proto.expectToken = function expectToken(kind) {
        var token = this._lexer.token;

        if (token.kind === kind) {
          this._lexer.advance();

          return token;
        }

        throw syntaxError(this._lexer.source, token.start, "Expected ".concat(kind, ", found ").concat(getTokenDesc(token)));
      }
      /**
       * If the next token is of the given kind, return that token after advancing
       * the lexer. Otherwise, do not change the parser state and return undefined.
       */
      ;

      _proto.expectOptionalToken = function expectOptionalToken(kind) {
        var token = this._lexer.token;

        if (token.kind === kind) {
          this._lexer.advance();

          return token;
        }

        return undefined;
      }
      /**
       * If the next token is a given keyword, advance the lexer.
       * Otherwise, do not change the parser state and throw an error.
       */
      ;

      _proto.expectKeyword = function expectKeyword(value) {
        var token = this._lexer.token;

        if (token.kind === TokenKind.NAME && token.value === value) {
          this._lexer.advance();
        } else {
          throw syntaxError(this._lexer.source, token.start, "Expected \"".concat(value, "\", found ").concat(getTokenDesc(token)));
        }
      }
      /**
       * If the next token is a given keyword, return "true" after advancing
       * the lexer. Otherwise, do not change the parser state and return "false".
       */
      ;

      _proto.expectOptionalKeyword = function expectOptionalKeyword(value) {
        var token = this._lexer.token;

        if (token.kind === TokenKind.NAME && token.value === value) {
          this._lexer.advance();

          return true;
        }

        return false;
      }
      /**
       * Helper function for creating an error when an unexpected lexed token
       * is encountered.
       */
      ;

      _proto.unexpected = function unexpected(atToken) {
        var token = atToken || this._lexer.token;
        return syntaxError(this._lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token)));
      }
      /**
       * Returns a possibly empty list of parse nodes, determined by
       * the parseFn. This list begins with a lex token of openKind
       * and ends with a lex token of closeKind. Advances the parser
       * to the next lex token after the closing token.
       */
      ;

      _proto.any = function any(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        var nodes = [];

        while (!this.expectOptionalToken(closeKind)) {
          nodes.push(parseFn.call(this));
        }

        return nodes;
      }
      /**
       * Returns a list of parse nodes, determined by the parseFn.
       * It can be empty only if open token is missing otherwise it will always
       * return non-empty list that begins with a lex token of openKind and ends
       * with a lex token of closeKind. Advances the parser to the next lex token
       * after the closing token.
       */
      ;

      _proto.optionalMany = function optionalMany(openKind, parseFn, closeKind) {
        if (this.expectOptionalToken(openKind)) {
          var nodes = [];

          do {
            nodes.push(parseFn.call(this));
          } while (!this.expectOptionalToken(closeKind));

          return nodes;
        }

        return [];
      }
      /**
       * Returns a non-empty list of parse nodes, determined by
       * the parseFn. This list begins with a lex token of openKind
       * and ends with a lex token of closeKind. Advances the parser
       * to the next lex token after the closing token.
       */
      ;

      _proto.many = function many(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        var nodes = [];

        do {
          nodes.push(parseFn.call(this));
        } while (!this.expectOptionalToken(closeKind));

        return nodes;
      };

      return Parser;
    }();

    function Loc(startToken, endToken, source) {
      this.start = startToken.start;
      this.end = endToken.end;
      this.startToken = startToken;
      this.endToken = endToken;
      this.source = source;
    } // Print a simplified form when appearing in JSON/util.inspect.


    defineToJSON(Loc, function () {
      return {
        start: this.start,
        end: this.end
      };
    });
    /**
     * A helper function to describe a token as a string for debugging
     */

    function getTokenDesc(token) {
      var value = token.value;
      return value ? "".concat(token.kind, " \"").concat(value, "\"") : token.kind;
    }

    var parser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        parse: parse,
        parseValue: parseValue,
        parseType: parseType
    });

    var parser$1 = getCjsExportFromNamespace(parser);

    var parse$1 = parser$1.parse;

    // Strip insignificant whitespace
    // Note that this could do a lot more, such as reorder fields etc.
    function normalize(string) {
      return string.replace(/[\s,]+/g, ' ').trim();
    }

    // A map docString -> graphql document
    var docCache = {};

    // A map fragmentName -> [normalized source]
    var fragmentSourceMap = {};

    function cacheKeyFromLoc(loc) {
      return normalize(loc.source.body.substring(loc.start, loc.end));
    }

    // For testing.
    function resetCaches() {
      docCache = {};
      fragmentSourceMap = {};
    }

    // Take a unstripped parsed document (query/mutation or even fragment), and
    // check all fragment definitions, checking for name->source uniqueness.
    // We also want to make sure only unique fragments exist in the document.
    var printFragmentWarnings = true;
    function processFragments(ast) {
      var astFragmentMap = {};
      var definitions = [];

      for (var i = 0; i < ast.definitions.length; i++) {
        var fragmentDefinition = ast.definitions[i];

        if (fragmentDefinition.kind === 'FragmentDefinition') {
          var fragmentName = fragmentDefinition.name.value;
          var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);

          // We know something about this fragment
          if (fragmentSourceMap.hasOwnProperty(fragmentName) && !fragmentSourceMap[fragmentName][sourceKey]) {

            // this is a problem because the app developer is trying to register another fragment with
            // the same name as one previously registered. So, we tell them about it.
            if (printFragmentWarnings) {
              console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
                + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
                + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
            }

            fragmentSourceMap[fragmentName][sourceKey] = true;

          } else if (!fragmentSourceMap.hasOwnProperty(fragmentName)) {
            fragmentSourceMap[fragmentName] = {};
            fragmentSourceMap[fragmentName][sourceKey] = true;
          }

          if (!astFragmentMap[sourceKey]) {
            astFragmentMap[sourceKey] = true;
            definitions.push(fragmentDefinition);
          }
        } else {
          definitions.push(fragmentDefinition);
        }
      }

      ast.definitions = definitions;
      return ast;
    }

    function disableFragmentWarnings() {
      printFragmentWarnings = false;
    }

    function stripLoc(doc, removeLocAtThisLevel) {
      var docType = Object.prototype.toString.call(doc);

      if (docType === '[object Array]') {
        return doc.map(function (d) {
          return stripLoc(d, removeLocAtThisLevel);
        });
      }

      if (docType !== '[object Object]') {
        throw new Error('Unexpected input.');
      }

      // We don't want to remove the root loc field so we can use it
      // for fragment substitution (see below)
      if (removeLocAtThisLevel && doc.loc) {
        delete doc.loc;
      }

      // https://github.com/apollographql/graphql-tag/issues/40
      if (doc.loc) {
        delete doc.loc.startToken;
        delete doc.loc.endToken;
      }

      var keys = Object.keys(doc);
      var key;
      var value;
      var valueType;

      for (key in keys) {
        if (keys.hasOwnProperty(key)) {
          value = doc[keys[key]];
          valueType = Object.prototype.toString.call(value);

          if (valueType === '[object Object]' || valueType === '[object Array]') {
            doc[keys[key]] = stripLoc(value, true);
          }
        }
      }

      return doc;
    }

    var experimentalFragmentVariables = false;
    function parseDocument(doc) {
      var cacheKey = normalize(doc);

      if (docCache[cacheKey]) {
        return docCache[cacheKey];
      }

      var parsed = parse$1(doc, { experimentalFragmentVariables: experimentalFragmentVariables });
      if (!parsed || parsed.kind !== 'Document') {
        throw new Error('Not a valid GraphQL document.');
      }

      // check that all "new" fragments inside the documents are consistent with
      // existing fragments of the same name
      parsed = processFragments(parsed);
      parsed = stripLoc(parsed, false);
      docCache[cacheKey] = parsed;

      return parsed;
    }

    function enableExperimentalFragmentVariables() {
      experimentalFragmentVariables = true;
    }

    function disableExperimentalFragmentVariables() {
      experimentalFragmentVariables = false;
    }

    // XXX This should eventually disallow arbitrary string interpolation, like Relay does
    function gql(/* arguments */) {
      var args = Array.prototype.slice.call(arguments);

      var literals = args[0];

      // We always get literals[0] and then matching post literals for each arg given
      var result = (typeof(literals) === "string") ? literals : literals[0];

      for (var i = 1; i < args.length; i++) {
        if (args[i] && args[i].kind && args[i].kind === 'Document') {
          result += args[i].loc.source.body;
        } else {
          result += args[i];
        }

        result += literals[i];
      }

      return parseDocument(result);
    }

    // Support typescript, which isn't as nice as Babel about default exports
    gql.default = gql;
    gql.resetCaches = resetCaches;
    gql.disableFragmentWarnings = disableFragmentWarnings;
    gql.enableExperimentalFragmentVariables = enableExperimentalFragmentVariables;
    gql.disableExperimentalFragmentVariables = disableExperimentalFragmentVariables;

    var src = gql;

    /* src/Scans.svelte generated by Svelte v3.16.0 */

    const { console: console_1 } = globals;
    const file = "src/Scans.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (42:2) {:catch error}
    function create_catch_block(ctx) {
    	let li;
    	let t0;
    	let t1_value = /*error*/ ctx[7] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text("Error loading authors: ");
    			t1 = text(t1_value);
    			add_location(li, file, 42, 4, 748);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scans*/ 1 && t1_value !== (t1_value = /*error*/ ctx[7] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(42:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (36:2) {:then result}
    function create_then_block(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*result*/ ctx[6].data.scanned;
    	const get_key = ctx => /*scan*/ ctx[3].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    		each_1_else.c();
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			const each_value = /*result*/ ctx[6].data.scanned;
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block, each_1_anchor, get_each_context);

    			if (each_value.length) {
    				if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			} else if (!each_1_else) {
    				each_1_else = create_else_block(ctx);
    				each_1_else.c();
    				each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    			}
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(36:2) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {:else}
    function create_else_block(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "No authors found";
    			add_location(li, file, 39, 6, 689);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#each result.data.scanned as scan (scan.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let t_value = /*scan*/ ctx[3].scan + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file, 37, 6, 650);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scans*/ 1 && t_value !== (t_value = /*scan*/ ctx[3].scan + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(37:4) {#each result.data.scanned as scan (scan.id)}",
    		ctx
    	});

    	return block;
    }

    // (34:17)      <li>Loading...</li>   {:then result}
    function create_pending_block(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "Loading...";
    			add_location(li, file, 34, 4, 557);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(34:17)      <li>Loading...</li>   {:then result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let ul;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 7
    	};

    	handle_promise(promise = /*$scans*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			info.block.c();
    			add_location(ul, file, 32, 0, 530);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			info.block.m(ul, info.anchor = null);
    			info.mount = () => ul;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$scans*/ 1 && promise !== (promise = /*$scans*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[6] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const SCANS = src`
{
  scanned(order_by: {created_at: desc}) {
    scan
  }
}

  `;

    console.log(SCANS);

    async function preload() {
    	return {
    		ScannedCache: await client$1.query({ query: SCANS })
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $scans;
    	let { ScannedCache } = $$props;
    	restore(client$1, SCANS, ScannedCache.data);
    	const scans = query(client$1, { query: SCANS });
    	validate_store(scans, "scans");
    	component_subscribe($$self, scans, value => $$invalidate(0, $scans = value));
    	const writable_props = ["ScannedCache"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Scans> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("ScannedCache" in $$props) $$invalidate(1, ScannedCache = $$props.ScannedCache);
    	};

    	$$self.$capture_state = () => {
    		return { ScannedCache, $scans };
    	};

    	$$self.$inject_state = $$props => {
    		if ("ScannedCache" in $$props) $$invalidate(1, ScannedCache = $$props.ScannedCache);
    		if ("$scans" in $$props) scans.set($scans = $$props.$scans);
    	};

    	return [$scans, ScannedCache];
    }

    class Scans extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { ScannedCache: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scans",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*ScannedCache*/ ctx[1] === undefined && !("ScannedCache" in props)) {
    			console_1.warn("<Scans> was created without expected prop 'ScannedCache'");
    		}
    	}

    	get ScannedCache() {
    		throw new Error("<Scans>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ScannedCache(value) {
    		throw new Error("<Scans>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ScansSub.svelte generated by Svelte v3.16.0 */
    const file$1 = "src/ScansSub.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (24:2) {:catch error}
    function create_catch_block$1(ctx) {
    	let li;
    	let t0;
    	let t1_value = /*error*/ ctx[5] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text("Error loading authors: ");
    			t1 = text(t1_value);
    			add_location(li, file$1, 24, 4, 521);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$Scans*/ 1 && t1_value !== (t1_value = /*error*/ ctx[5] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(24:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {:then result}
    function create_then_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*result*/ ctx[4].data.scanned;
    	const get_key = ctx => /*scan*/ ctx[1].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$1(ctx);
    		each_1_else.c();
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			const each_value = /*result*/ ctx[4].data.scanned;
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);

    			if (each_value.length) {
    				if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			} else if (!each_1_else) {
    				each_1_else = create_else_block$1(ctx);
    				each_1_else.c();
    				each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    			}
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(18:2) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {:else}
    function create_else_block$1(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "No authors found";
    			add_location(li, file$1, 21, 6, 462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(21:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each result.data.scanned as scan (scan.id)}
    function create_each_block$1(key_1, ctx) {
    	let li;
    	let t_value = /*scan*/ ctx[1].scan + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file$1, 19, 6, 423);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$Scans*/ 1 && t_value !== (t_value = /*scan*/ ctx[1].scan + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:4) {#each result.data.scanned as scan (scan.id)}",
    		ctx
    	});

    	return block;
    }

    // (16:17)      <li>Loading...</li>   {:then result}
    function create_pending_block$1(ctx) {
    	let li;

    	const block = {
    		c: function create() {
    			li = element("li");
    			li.textContent = "Loading...";
    			add_location(li, file$1, 16, 4, 330);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(16:17)      <li>Loading...</li>   {:then result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ul;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 4,
    		error: 5
    	};

    	handle_promise(promise = /*$Scans*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			info.block.c();
    			add_location(ul, file$1, 14, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			info.block.m(ul, info.anchor = null);
    			info.mount = () => ul;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$Scans*/ 1 && promise !== (promise = /*$Scans*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[4] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const QUERY = src`
subscription {
  scanned(order_by: {created_at: desc}) {
    scan
  }
}
  `;

    const Scans$1 = subscribe$1(client$1, { query: QUERY });

    function instance$1($$self, $$props, $$invalidate) {
    	let $Scans;
    	validate_store(Scans$1, "Scans");
    	component_subscribe($$self, Scans$1, $$value => $$invalidate(0, $Scans = $$value));

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$Scans" in $$props) Scans$1.set($Scans = $$props.$Scans);
    	};

    	return [$Scans];
    }

    class ScansSub extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScansSub",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css = "/*! bulma.io v0.8.0 | MIT License | github.com/jgthms/bulma */\n@-webkit-keyframes spinAround {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(359deg);\n  }\n}\n@keyframes spinAround {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(359deg);\n  }\n}\n\n.delete, .modal-close, .is-unselectable, .button, .file, .breadcrumb, .pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis, .tabs {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n.select:not(.is-multiple):not(.is-loading)::after, .navbar-link:not(.is-arrowless)::after {\n  border: 3px solid transparent;\n  border-radius: 2px;\n  border-right: 0;\n  border-top: 0;\n  content: \" \";\n  display: block;\n  height: 0.625em;\n  margin-top: -0.4375em;\n  pointer-events: none;\n  position: absolute;\n  top: 50%;\n  transform: rotate(-45deg);\n  transform-origin: center;\n  width: 0.625em;\n}\n\n.box:not(:last-child), .content:not(:last-child), .notification:not(:last-child), .progress:not(:last-child), .table:not(:last-child), .table-container:not(:last-child), .title:not(:last-child),\n.subtitle:not(:last-child), .block:not(:last-child), .highlight:not(:last-child), .breadcrumb:not(:last-child), .level:not(:last-child), .list:not(:last-child), .message:not(:last-child), .pagination:not(:last-child), .tabs:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.delete, .modal-close {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  background-color: rgba(10, 10, 10, 0.2);\n  border: none;\n  border-radius: 290486px;\n  cursor: pointer;\n  pointer-events: auto;\n  display: inline-block;\n  flex-grow: 0;\n  flex-shrink: 0;\n  font-size: 0;\n  height: 20px;\n  max-height: 20px;\n  max-width: 20px;\n  min-height: 20px;\n  min-width: 20px;\n  outline: none;\n  position: relative;\n  vertical-align: top;\n  width: 20px;\n}\n\n.delete::before, .modal-close::before, .delete::after, .modal-close::after {\n  background-color: white;\n  content: \"\";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\n\n.delete::before, .modal-close::before {\n  height: 2px;\n  width: 50%;\n}\n\n.delete::after, .modal-close::after {\n  height: 50%;\n  width: 2px;\n}\n\n.delete:hover, .modal-close:hover, .delete:focus, .modal-close:focus {\n  background-color: rgba(10, 10, 10, 0.3);\n}\n\n.delete:active, .modal-close:active {\n  background-color: rgba(10, 10, 10, 0.4);\n}\n\n.is-small.delete, .is-small.modal-close {\n  height: 16px;\n  max-height: 16px;\n  max-width: 16px;\n  min-height: 16px;\n  min-width: 16px;\n  width: 16px;\n}\n\n.is-medium.delete, .is-medium.modal-close {\n  height: 24px;\n  max-height: 24px;\n  max-width: 24px;\n  min-height: 24px;\n  min-width: 24px;\n  width: 24px;\n}\n\n.is-large.delete, .is-large.modal-close {\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n}\n\n.button.is-loading::after, .loader, .select.is-loading::after, .control.is-loading::after {\n  -webkit-animation: spinAround 500ms infinite linear;\n          animation: spinAround 500ms infinite linear;\n  border: 2px solid #dbdbdb;\n  border-radius: 290486px;\n  border-right-color: transparent;\n  border-top-color: transparent;\n  content: \"\";\n  display: block;\n  height: 1em;\n  position: relative;\n  width: 1em;\n}\n\n.is-overlay, .image.is-square img,\n.image.is-square .has-ratio, .image.is-1by1 img,\n.image.is-1by1 .has-ratio, .image.is-5by4 img,\n.image.is-5by4 .has-ratio, .image.is-4by3 img,\n.image.is-4by3 .has-ratio, .image.is-3by2 img,\n.image.is-3by2 .has-ratio, .image.is-5by3 img,\n.image.is-5by3 .has-ratio, .image.is-16by9 img,\n.image.is-16by9 .has-ratio, .image.is-2by1 img,\n.image.is-2by1 .has-ratio, .image.is-3by1 img,\n.image.is-3by1 .has-ratio, .image.is-4by5 img,\n.image.is-4by5 .has-ratio, .image.is-3by4 img,\n.image.is-3by4 .has-ratio, .image.is-2by3 img,\n.image.is-2by3 .has-ratio, .image.is-3by5 img,\n.image.is-3by5 .has-ratio, .image.is-9by16 img,\n.image.is-9by16 .has-ratio, .image.is-1by2 img,\n.image.is-1by2 .has-ratio, .image.is-1by3 img,\n.image.is-1by3 .has-ratio, .modal, .modal-background, .hero-video {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n\n.button, .input, .textarea, .select select, .file-cta,\n.file-name, .pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  align-items: center;\n  border: 1px solid transparent;\n  border-radius: 4px;\n  box-shadow: none;\n  display: inline-flex;\n  font-size: 1rem;\n  height: 2.5em;\n  justify-content: flex-start;\n  line-height: 1.5;\n  padding-bottom: calc(0.5em - 1px);\n  padding-left: calc(0.75em - 1px);\n  padding-right: calc(0.75em - 1px);\n  padding-top: calc(0.5em - 1px);\n  position: relative;\n  vertical-align: top;\n}\n\n.button:focus, .input:focus, .textarea:focus, .select select:focus, .file-cta:focus,\n.file-name:focus, .pagination-previous:focus,\n.pagination-next:focus,\n.pagination-link:focus,\n.pagination-ellipsis:focus, .is-focused.button, .is-focused.input, .is-focused.textarea, .select select.is-focused, .is-focused.file-cta,\n.is-focused.file-name, .is-focused.pagination-previous,\n.is-focused.pagination-next,\n.is-focused.pagination-link,\n.is-focused.pagination-ellipsis, .button:active, .input:active, .textarea:active, .select select:active, .file-cta:active,\n.file-name:active, .pagination-previous:active,\n.pagination-next:active,\n.pagination-link:active,\n.pagination-ellipsis:active, .is-active.button, .is-active.input, .is-active.textarea, .select select.is-active, .is-active.file-cta,\n.is-active.file-name, .is-active.pagination-previous,\n.is-active.pagination-next,\n.is-active.pagination-link,\n.is-active.pagination-ellipsis {\n  outline: none;\n}\n\n.button[disabled], .input[disabled], .textarea[disabled], .select select[disabled], .file-cta[disabled],\n.file-name[disabled], .pagination-previous[disabled],\n.pagination-next[disabled],\n.pagination-link[disabled],\n.pagination-ellipsis[disabled],\nfieldset[disabled] .button,\nfieldset[disabled] .input,\nfieldset[disabled] .textarea,\nfieldset[disabled] .select select,\n.select fieldset[disabled] select,\nfieldset[disabled] .file-cta,\nfieldset[disabled] .file-name,\nfieldset[disabled] .pagination-previous,\nfieldset[disabled] .pagination-next,\nfieldset[disabled] .pagination-link,\nfieldset[disabled] .pagination-ellipsis {\n  cursor: not-allowed;\n}\n\n/*! minireset.css v0.0.6 | MIT License | github.com/jgthms/minireset.css */\nhtml,\nbody,\np,\nol,\nul,\nli,\ndl,\ndt,\ndd,\nblockquote,\nfigure,\nfieldset,\nlegend,\ntextarea,\npre,\niframe,\nhr,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  margin: 0;\n  padding: 0;\n}\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: 100%;\n  font-weight: normal;\n}\n\nul {\n  list-style: none;\n}\n\nbutton,\ninput,\nselect,\ntextarea {\n  margin: 0;\n}\n\nhtml {\n  box-sizing: border-box;\n}\n\n*, *::before, *::after {\n  box-sizing: inherit;\n}\n\nimg,\nvideo {\n  height: auto;\n  max-width: 100%;\n}\n\niframe {\n  border: 0;\n}\n\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\n\ntd,\nth {\n  padding: 0;\n}\n\ntd:not([align]),\nth:not([align]) {\n  text-align: left;\n}\n\nhtml {\n  background-color: white;\n  font-size: 16px;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  min-width: 300px;\n  overflow-x: hidden;\n  overflow-y: scroll;\n  text-rendering: optimizeLegibility;\n  -webkit-text-size-adjust: 100%;\n     -moz-text-size-adjust: 100%;\n      -ms-text-size-adjust: 100%;\n          text-size-adjust: 100%;\n}\n\narticle,\naside,\nfigure,\nfooter,\nheader,\nhgroup,\nsection {\n  display: block;\n}\n\nbody,\nbutton,\ninput,\nselect,\ntextarea {\n  font-family: BlinkMacSystemFont, -apple-system, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", \"Helvetica\", \"Arial\", sans-serif;\n}\n\ncode,\npre {\n  -moz-osx-font-smoothing: auto;\n  -webkit-font-smoothing: auto;\n  font-family: monospace;\n}\n\nbody {\n  color: #4a4a4a;\n  font-size: 1em;\n  font-weight: 400;\n  line-height: 1.5;\n}\n\na {\n  color: #3273dc;\n  cursor: pointer;\n  text-decoration: none;\n}\n\na strong {\n  color: currentColor;\n}\n\na:hover {\n  color: #363636;\n}\n\ncode {\n  background-color: whitesmoke;\n  color: #f14668;\n  font-size: 0.875em;\n  font-weight: normal;\n  padding: 0.25em 0.5em 0.25em;\n}\n\nhr {\n  background-color: whitesmoke;\n  border: none;\n  display: block;\n  height: 2px;\n  margin: 1.5rem 0;\n}\n\nimg {\n  height: auto;\n  max-width: 100%;\n}\n\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  vertical-align: baseline;\n}\n\nsmall {\n  font-size: 0.875em;\n}\n\nspan {\n  font-style: inherit;\n  font-weight: inherit;\n}\n\nstrong {\n  color: #363636;\n  font-weight: 700;\n}\n\nfieldset {\n  border: none;\n}\n\npre {\n  -webkit-overflow-scrolling: touch;\n  background-color: whitesmoke;\n  color: #4a4a4a;\n  font-size: 0.875em;\n  overflow-x: auto;\n  padding: 1.25rem 1.5rem;\n  white-space: pre;\n  word-wrap: normal;\n}\n\npre code {\n  background-color: transparent;\n  color: currentColor;\n  font-size: 1em;\n  padding: 0;\n}\n\ntable td,\ntable th {\n  vertical-align: top;\n}\n\ntable td:not([align]),\ntable th:not([align]) {\n  text-align: left;\n}\n\ntable th {\n  color: #363636;\n}\n\n.is-clearfix::after {\n  clear: both;\n  content: \" \";\n  display: table;\n}\n\n.is-pulled-left {\n  float: left !important;\n}\n\n.is-pulled-right {\n  float: right !important;\n}\n\n.is-clipped {\n  overflow: hidden !important;\n}\n\n.is-size-1 {\n  font-size: 3rem !important;\n}\n\n.is-size-2 {\n  font-size: 2.5rem !important;\n}\n\n.is-size-3 {\n  font-size: 2rem !important;\n}\n\n.is-size-4 {\n  font-size: 1.5rem !important;\n}\n\n.is-size-5 {\n  font-size: 1.25rem !important;\n}\n\n.is-size-6 {\n  font-size: 1rem !important;\n}\n\n.is-size-7 {\n  font-size: 0.75rem !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-size-1-mobile {\n    font-size: 3rem !important;\n  }\n  .is-size-2-mobile {\n    font-size: 2.5rem !important;\n  }\n  .is-size-3-mobile {\n    font-size: 2rem !important;\n  }\n  .is-size-4-mobile {\n    font-size: 1.5rem !important;\n  }\n  .is-size-5-mobile {\n    font-size: 1.25rem !important;\n  }\n  .is-size-6-mobile {\n    font-size: 1rem !important;\n  }\n  .is-size-7-mobile {\n    font-size: 0.75rem !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-size-1-tablet {\n    font-size: 3rem !important;\n  }\n  .is-size-2-tablet {\n    font-size: 2.5rem !important;\n  }\n  .is-size-3-tablet {\n    font-size: 2rem !important;\n  }\n  .is-size-4-tablet {\n    font-size: 1.5rem !important;\n  }\n  .is-size-5-tablet {\n    font-size: 1.25rem !important;\n  }\n  .is-size-6-tablet {\n    font-size: 1rem !important;\n  }\n  .is-size-7-tablet {\n    font-size: 0.75rem !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-size-1-touch {\n    font-size: 3rem !important;\n  }\n  .is-size-2-touch {\n    font-size: 2.5rem !important;\n  }\n  .is-size-3-touch {\n    font-size: 2rem !important;\n  }\n  .is-size-4-touch {\n    font-size: 1.5rem !important;\n  }\n  .is-size-5-touch {\n    font-size: 1.25rem !important;\n  }\n  .is-size-6-touch {\n    font-size: 1rem !important;\n  }\n  .is-size-7-touch {\n    font-size: 0.75rem !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-size-1-desktop {\n    font-size: 3rem !important;\n  }\n  .is-size-2-desktop {\n    font-size: 2.5rem !important;\n  }\n  .is-size-3-desktop {\n    font-size: 2rem !important;\n  }\n  .is-size-4-desktop {\n    font-size: 1.5rem !important;\n  }\n  .is-size-5-desktop {\n    font-size: 1.25rem !important;\n  }\n  .is-size-6-desktop {\n    font-size: 1rem !important;\n  }\n  .is-size-7-desktop {\n    font-size: 0.75rem !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-size-1-widescreen {\n    font-size: 3rem !important;\n  }\n  .is-size-2-widescreen {\n    font-size: 2.5rem !important;\n  }\n  .is-size-3-widescreen {\n    font-size: 2rem !important;\n  }\n  .is-size-4-widescreen {\n    font-size: 1.5rem !important;\n  }\n  .is-size-5-widescreen {\n    font-size: 1.25rem !important;\n  }\n  .is-size-6-widescreen {\n    font-size: 1rem !important;\n  }\n  .is-size-7-widescreen {\n    font-size: 0.75rem !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-size-1-fullhd {\n    font-size: 3rem !important;\n  }\n  .is-size-2-fullhd {\n    font-size: 2.5rem !important;\n  }\n  .is-size-3-fullhd {\n    font-size: 2rem !important;\n  }\n  .is-size-4-fullhd {\n    font-size: 1.5rem !important;\n  }\n  .is-size-5-fullhd {\n    font-size: 1.25rem !important;\n  }\n  .is-size-6-fullhd {\n    font-size: 1rem !important;\n  }\n  .is-size-7-fullhd {\n    font-size: 0.75rem !important;\n  }\n}\n\n.has-text-centered {\n  text-align: center !important;\n}\n\n.has-text-justified {\n  text-align: justify !important;\n}\n\n.has-text-left {\n  text-align: left !important;\n}\n\n.has-text-right {\n  text-align: right !important;\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-centered-mobile {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-centered-tablet {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-centered-tablet-only {\n    text-align: center !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-centered-touch {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-centered-desktop {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-centered-desktop-only {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-centered-widescreen {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-centered-widescreen-only {\n    text-align: center !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-centered-fullhd {\n    text-align: center !important;\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-justified-mobile {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-justified-tablet {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-justified-tablet-only {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-justified-touch {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-justified-desktop {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-justified-desktop-only {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-justified-widescreen {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-justified-widescreen-only {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-justified-fullhd {\n    text-align: justify !important;\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-left-mobile {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-left-tablet {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-left-tablet-only {\n    text-align: left !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-left-touch {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-left-desktop {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-left-desktop-only {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-left-widescreen {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-left-widescreen-only {\n    text-align: left !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-left-fullhd {\n    text-align: left !important;\n  }\n}\n\n@media screen and (max-width: 768px) {\n  .has-text-right-mobile {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .has-text-right-tablet {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .has-text-right-tablet-only {\n    text-align: right !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .has-text-right-touch {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .has-text-right-desktop {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .has-text-right-desktop-only {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .has-text-right-widescreen {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .has-text-right-widescreen-only {\n    text-align: right !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .has-text-right-fullhd {\n    text-align: right !important;\n  }\n}\n\n.is-capitalized {\n  text-transform: capitalize !important;\n}\n\n.is-lowercase {\n  text-transform: lowercase !important;\n}\n\n.is-uppercase {\n  text-transform: uppercase !important;\n}\n\n.is-italic {\n  font-style: italic !important;\n}\n\n.has-text-white {\n  color: white !important;\n}\n\na.has-text-white:hover, a.has-text-white:focus {\n  color: #e6e6e6 !important;\n}\n\n.has-background-white {\n  background-color: white !important;\n}\n\n.has-text-black {\n  color: #0a0a0a !important;\n}\n\na.has-text-black:hover, a.has-text-black:focus {\n  color: black !important;\n}\n\n.has-background-black {\n  background-color: #0a0a0a !important;\n}\n\n.has-text-light {\n  color: whitesmoke !important;\n}\n\na.has-text-light:hover, a.has-text-light:focus {\n  color: #dbdbdb !important;\n}\n\n.has-background-light {\n  background-color: whitesmoke !important;\n}\n\n.has-text-dark {\n  color: #363636 !important;\n}\n\na.has-text-dark:hover, a.has-text-dark:focus {\n  color: #1c1c1c !important;\n}\n\n.has-background-dark {\n  background-color: #363636 !important;\n}\n\n.has-text-primary {\n  color: #00d1b2 !important;\n}\n\na.has-text-primary:hover, a.has-text-primary:focus {\n  color: #009e86 !important;\n}\n\n.has-background-primary {\n  background-color: #00d1b2 !important;\n}\n\n.has-text-link {\n  color: #3273dc !important;\n}\n\na.has-text-link:hover, a.has-text-link:focus {\n  color: #205bbc !important;\n}\n\n.has-background-link {\n  background-color: #3273dc !important;\n}\n\n.has-text-info {\n  color: #3298dc !important;\n}\n\na.has-text-info:hover, a.has-text-info:focus {\n  color: #207dbc !important;\n}\n\n.has-background-info {\n  background-color: #3298dc !important;\n}\n\n.has-text-success {\n  color: #48c774 !important;\n}\n\na.has-text-success:hover, a.has-text-success:focus {\n  color: #34a85c !important;\n}\n\n.has-background-success {\n  background-color: #48c774 !important;\n}\n\n.has-text-warning {\n  color: #ffdd57 !important;\n}\n\na.has-text-warning:hover, a.has-text-warning:focus {\n  color: #ffd324 !important;\n}\n\n.has-background-warning {\n  background-color: #ffdd57 !important;\n}\n\n.has-text-danger {\n  color: #f14668 !important;\n}\n\na.has-text-danger:hover, a.has-text-danger:focus {\n  color: #ee1742 !important;\n}\n\n.has-background-danger {\n  background-color: #f14668 !important;\n}\n\n.has-text-black-bis {\n  color: #121212 !important;\n}\n\n.has-background-black-bis {\n  background-color: #121212 !important;\n}\n\n.has-text-black-ter {\n  color: #242424 !important;\n}\n\n.has-background-black-ter {\n  background-color: #242424 !important;\n}\n\n.has-text-grey-darker {\n  color: #363636 !important;\n}\n\n.has-background-grey-darker {\n  background-color: #363636 !important;\n}\n\n.has-text-grey-dark {\n  color: #4a4a4a !important;\n}\n\n.has-background-grey-dark {\n  background-color: #4a4a4a !important;\n}\n\n.has-text-grey {\n  color: #7a7a7a !important;\n}\n\n.has-background-grey {\n  background-color: #7a7a7a !important;\n}\n\n.has-text-grey-light {\n  color: #b5b5b5 !important;\n}\n\n.has-background-grey-light {\n  background-color: #b5b5b5 !important;\n}\n\n.has-text-grey-lighter {\n  color: #dbdbdb !important;\n}\n\n.has-background-grey-lighter {\n  background-color: #dbdbdb !important;\n}\n\n.has-text-white-ter {\n  color: whitesmoke !important;\n}\n\n.has-background-white-ter {\n  background-color: whitesmoke !important;\n}\n\n.has-text-white-bis {\n  color: #fafafa !important;\n}\n\n.has-background-white-bis {\n  background-color: #fafafa !important;\n}\n\n.has-text-weight-light {\n  font-weight: 300 !important;\n}\n\n.has-text-weight-normal {\n  font-weight: 400 !important;\n}\n\n.has-text-weight-medium {\n  font-weight: 500 !important;\n}\n\n.has-text-weight-semibold {\n  font-weight: 600 !important;\n}\n\n.has-text-weight-bold {\n  font-weight: 700 !important;\n}\n\n.is-family-primary {\n  font-family: BlinkMacSystemFont, -apple-system, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", \"Helvetica\", \"Arial\", sans-serif !important;\n}\n\n.is-family-secondary {\n  font-family: BlinkMacSystemFont, -apple-system, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", \"Helvetica\", \"Arial\", sans-serif !important;\n}\n\n.is-family-sans-serif {\n  font-family: BlinkMacSystemFont, -apple-system, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", \"Helvetica\", \"Arial\", sans-serif !important;\n}\n\n.is-family-monospace {\n  font-family: monospace !important;\n}\n\n.is-family-code {\n  font-family: monospace !important;\n}\n\n.is-block {\n  display: block !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-block-mobile {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-block-tablet {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-block-tablet-only {\n    display: block !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-block-touch {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-block-desktop {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-block-desktop-only {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-block-widescreen {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-block-widescreen-only {\n    display: block !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-block-fullhd {\n    display: block !important;\n  }\n}\n\n.is-flex {\n  display: flex !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-flex-mobile {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-flex-tablet {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-flex-tablet-only {\n    display: flex !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-flex-touch {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-flex-desktop {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-flex-desktop-only {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-flex-widescreen {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-flex-widescreen-only {\n    display: flex !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-flex-fullhd {\n    display: flex !important;\n  }\n}\n\n.is-inline {\n  display: inline !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-mobile {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-tablet {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-inline-tablet-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-inline-touch {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-inline-desktop {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-inline-desktop-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-inline-widescreen {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-inline-widescreen-only {\n    display: inline !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-inline-fullhd {\n    display: inline !important;\n  }\n}\n\n.is-inline-block {\n  display: inline-block !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-block-mobile {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-block-tablet {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-inline-block-tablet-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-inline-block-touch {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-inline-block-desktop {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-inline-block-desktop-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-inline-block-widescreen {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-inline-block-widescreen-only {\n    display: inline-block !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-inline-block-fullhd {\n    display: inline-block !important;\n  }\n}\n\n.is-inline-flex {\n  display: inline-flex !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-inline-flex-mobile {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-inline-flex-tablet {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-inline-flex-tablet-only {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-inline-flex-touch {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-inline-flex-desktop {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-inline-flex-desktop-only {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-inline-flex-widescreen {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-inline-flex-widescreen-only {\n    display: inline-flex !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-inline-flex-fullhd {\n    display: inline-flex !important;\n  }\n}\n\n.is-hidden {\n  display: none !important;\n}\n\n.is-sr-only {\n  border: none !important;\n  clip: rect(0, 0, 0, 0) !important;\n  height: 0.01em !important;\n  overflow: hidden !important;\n  padding: 0 !important;\n  position: absolute !important;\n  white-space: nowrap !important;\n  width: 0.01em !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-hidden-mobile {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-hidden-tablet {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-hidden-tablet-only {\n    display: none !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-hidden-touch {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-hidden-desktop {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-hidden-desktop-only {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-hidden-widescreen {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-hidden-widescreen-only {\n    display: none !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-hidden-fullhd {\n    display: none !important;\n  }\n}\n\n.is-invisible {\n  visibility: hidden !important;\n}\n\n@media screen and (max-width: 768px) {\n  .is-invisible-mobile {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .is-invisible-tablet {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .is-invisible-tablet-only {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .is-invisible-touch {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .is-invisible-desktop {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .is-invisible-desktop-only {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .is-invisible-widescreen {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .is-invisible-widescreen-only {\n    visibility: hidden !important;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .is-invisible-fullhd {\n    visibility: hidden !important;\n  }\n}\n\n.is-marginless {\n  margin: 0 !important;\n}\n\n.is-paddingless {\n  padding: 0 !important;\n}\n\n.is-radiusless {\n  border-radius: 0 !important;\n}\n\n.is-shadowless {\n  box-shadow: none !important;\n}\n\n.is-relative {\n  position: relative !important;\n}\n\n.box {\n  background-color: white;\n  border-radius: 6px;\n  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);\n  color: #4a4a4a;\n  display: block;\n  padding: 1.25rem;\n}\n\na.box:hover, a.box:focus {\n  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0 0 1px #3273dc;\n}\n\na.box:active {\n  box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2), 0 0 0 1px #3273dc;\n}\n\n.button {\n  background-color: white;\n  border-color: #dbdbdb;\n  border-width: 1px;\n  color: #363636;\n  cursor: pointer;\n  justify-content: center;\n  padding-bottom: calc(0.5em - 1px);\n  padding-left: 1em;\n  padding-right: 1em;\n  padding-top: calc(0.5em - 1px);\n  text-align: center;\n  white-space: nowrap;\n}\n\n.button strong {\n  color: inherit;\n}\n\n.button .icon, .button .icon.is-small, .button .icon.is-medium, .button .icon.is-large {\n  height: 1.5em;\n  width: 1.5em;\n}\n\n.button .icon:first-child:not(:last-child) {\n  margin-left: calc(-0.5em - 1px);\n  margin-right: 0.25em;\n}\n\n.button .icon:last-child:not(:first-child) {\n  margin-left: 0.25em;\n  margin-right: calc(-0.5em - 1px);\n}\n\n.button .icon:first-child:last-child {\n  margin-left: calc(-0.5em - 1px);\n  margin-right: calc(-0.5em - 1px);\n}\n\n.button:hover, .button.is-hovered {\n  border-color: #b5b5b5;\n  color: #363636;\n}\n\n.button:focus, .button.is-focused {\n  border-color: #3273dc;\n  color: #363636;\n}\n\n.button:focus:not(:active), .button.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);\n}\n\n.button:active, .button.is-active {\n  border-color: #4a4a4a;\n  color: #363636;\n}\n\n.button.is-text {\n  background-color: transparent;\n  border-color: transparent;\n  color: #4a4a4a;\n  text-decoration: underline;\n}\n\n.button.is-text:hover, .button.is-text.is-hovered, .button.is-text:focus, .button.is-text.is-focused {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.button.is-text:active, .button.is-text.is-active {\n  background-color: #e8e8e8;\n  color: #363636;\n}\n\n.button.is-text[disabled],\nfieldset[disabled] .button.is-text {\n  background-color: transparent;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-white {\n  background-color: white;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.button.is-white:hover, .button.is-white.is-hovered {\n  background-color: #f9f9f9;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.button.is-white:focus, .button.is-white.is-focused {\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.button.is-white:focus:not(:active), .button.is-white.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.25);\n}\n\n.button.is-white:active, .button.is-white.is-active {\n  background-color: #f2f2f2;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.button.is-white[disabled],\nfieldset[disabled] .button.is-white {\n  background-color: white;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-white.is-inverted {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.button.is-white.is-inverted:hover, .button.is-white.is-inverted.is-hovered {\n  background-color: black;\n}\n\n.button.is-white.is-inverted[disabled],\nfieldset[disabled] .button.is-white.is-inverted {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  box-shadow: none;\n  color: white;\n}\n\n.button.is-white.is-loading::after {\n  border-color: transparent transparent #0a0a0a #0a0a0a !important;\n}\n\n.button.is-white.is-outlined {\n  background-color: transparent;\n  border-color: white;\n  color: white;\n}\n\n.button.is-white.is-outlined:hover, .button.is-white.is-outlined.is-hovered, .button.is-white.is-outlined:focus, .button.is-white.is-outlined.is-focused {\n  background-color: white;\n  border-color: white;\n  color: #0a0a0a;\n}\n\n.button.is-white.is-outlined.is-loading::after {\n  border-color: transparent transparent white white !important;\n}\n\n.button.is-white.is-outlined.is-loading:hover::after, .button.is-white.is-outlined.is-loading.is-hovered::after, .button.is-white.is-outlined.is-loading:focus::after, .button.is-white.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #0a0a0a #0a0a0a !important;\n}\n\n.button.is-white.is-outlined[disabled],\nfieldset[disabled] .button.is-white.is-outlined {\n  background-color: transparent;\n  border-color: white;\n  box-shadow: none;\n  color: white;\n}\n\n.button.is-white.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  color: #0a0a0a;\n}\n\n.button.is-white.is-inverted.is-outlined:hover, .button.is-white.is-inverted.is-outlined.is-hovered, .button.is-white.is-inverted.is-outlined:focus, .button.is-white.is-inverted.is-outlined.is-focused {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.button.is-white.is-inverted.is-outlined.is-loading:hover::after, .button.is-white.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-white.is-inverted.is-outlined.is-loading:focus::after, .button.is-white.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent white white !important;\n}\n\n.button.is-white.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-white.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  box-shadow: none;\n  color: #0a0a0a;\n}\n\n.button.is-black {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  color: white;\n}\n\n.button.is-black:hover, .button.is-black.is-hovered {\n  background-color: #040404;\n  border-color: transparent;\n  color: white;\n}\n\n.button.is-black:focus, .button.is-black.is-focused {\n  border-color: transparent;\n  color: white;\n}\n\n.button.is-black:focus:not(:active), .button.is-black.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);\n}\n\n.button.is-black:active, .button.is-black.is-active {\n  background-color: black;\n  border-color: transparent;\n  color: white;\n}\n\n.button.is-black[disabled],\nfieldset[disabled] .button.is-black {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-black.is-inverted {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-inverted:hover, .button.is-black.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-black.is-inverted[disabled],\nfieldset[disabled] .button.is-black.is-inverted {\n  background-color: white;\n  border-color: transparent;\n  box-shadow: none;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-loading::after {\n  border-color: transparent transparent white white !important;\n}\n\n.button.is-black.is-outlined {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-outlined:hover, .button.is-black.is-outlined.is-hovered, .button.is-black.is-outlined:focus, .button.is-black.is-outlined.is-focused {\n  background-color: #0a0a0a;\n  border-color: #0a0a0a;\n  color: white;\n}\n\n.button.is-black.is-outlined.is-loading::after {\n  border-color: transparent transparent #0a0a0a #0a0a0a !important;\n}\n\n.button.is-black.is-outlined.is-loading:hover::after, .button.is-black.is-outlined.is-loading.is-hovered::after, .button.is-black.is-outlined.is-loading:focus::after, .button.is-black.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent white white !important;\n}\n\n.button.is-black.is-outlined[disabled],\nfieldset[disabled] .button.is-black.is-outlined {\n  background-color: transparent;\n  border-color: #0a0a0a;\n  box-shadow: none;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: white;\n  color: white;\n}\n\n.button.is-black.is-inverted.is-outlined:hover, .button.is-black.is-inverted.is-outlined.is-hovered, .button.is-black.is-inverted.is-outlined:focus, .button.is-black.is-inverted.is-outlined.is-focused {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.button.is-black.is-inverted.is-outlined.is-loading:hover::after, .button.is-black.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-black.is-inverted.is-outlined.is-loading:focus::after, .button.is-black.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #0a0a0a #0a0a0a !important;\n}\n\n.button.is-black.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-black.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: white;\n  box-shadow: none;\n  color: white;\n}\n\n.button.is-light {\n  background-color: whitesmoke;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light:hover, .button.is-light.is-hovered {\n  background-color: #eeeeee;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light:focus, .button.is-light.is-focused {\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light:focus:not(:active), .button.is-light.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(245, 245, 245, 0.25);\n}\n\n.button.is-light:active, .button.is-light.is-active {\n  background-color: #e8e8e8;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light[disabled],\nfieldset[disabled] .button.is-light {\n  background-color: whitesmoke;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-light.is-inverted {\n  background-color: rgba(0, 0, 0, 0.7);\n  color: whitesmoke;\n}\n\n.button.is-light.is-inverted:hover, .button.is-light.is-inverted.is-hovered {\n  background-color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light.is-inverted[disabled],\nfieldset[disabled] .button.is-light.is-inverted {\n  background-color: rgba(0, 0, 0, 0.7);\n  border-color: transparent;\n  box-shadow: none;\n  color: whitesmoke;\n}\n\n.button.is-light.is-loading::after {\n  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;\n}\n\n.button.is-light.is-outlined {\n  background-color: transparent;\n  border-color: whitesmoke;\n  color: whitesmoke;\n}\n\n.button.is-light.is-outlined:hover, .button.is-light.is-outlined.is-hovered, .button.is-light.is-outlined:focus, .button.is-light.is-outlined.is-focused {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light.is-outlined.is-loading::after {\n  border-color: transparent transparent whitesmoke whitesmoke !important;\n}\n\n.button.is-light.is-outlined.is-loading:hover::after, .button.is-light.is-outlined.is-loading.is-hovered::after, .button.is-light.is-outlined.is-loading:focus::after, .button.is-light.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;\n}\n\n.button.is-light.is-outlined[disabled],\nfieldset[disabled] .button.is-light.is-outlined {\n  background-color: transparent;\n  border-color: whitesmoke;\n  box-shadow: none;\n  color: whitesmoke;\n}\n\n.button.is-light.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: rgba(0, 0, 0, 0.7);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-light.is-inverted.is-outlined:hover, .button.is-light.is-inverted.is-outlined.is-hovered, .button.is-light.is-inverted.is-outlined:focus, .button.is-light.is-inverted.is-outlined.is-focused {\n  background-color: rgba(0, 0, 0, 0.7);\n  color: whitesmoke;\n}\n\n.button.is-light.is-inverted.is-outlined.is-loading:hover::after, .button.is-light.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-light.is-inverted.is-outlined.is-loading:focus::after, .button.is-light.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent whitesmoke whitesmoke !important;\n}\n\n.button.is-light.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-light.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: rgba(0, 0, 0, 0.7);\n  box-shadow: none;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-dark {\n  background-color: #363636;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-dark:hover, .button.is-dark.is-hovered {\n  background-color: #2f2f2f;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-dark:focus, .button.is-dark.is-focused {\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-dark:focus:not(:active), .button.is-dark.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);\n}\n\n.button.is-dark:active, .button.is-dark.is-active {\n  background-color: #292929;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-dark[disabled],\nfieldset[disabled] .button.is-dark {\n  background-color: #363636;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-dark.is-inverted {\n  background-color: #fff;\n  color: #363636;\n}\n\n.button.is-dark.is-inverted:hover, .button.is-dark.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-dark.is-inverted[disabled],\nfieldset[disabled] .button.is-dark.is-inverted {\n  background-color: #fff;\n  border-color: transparent;\n  box-shadow: none;\n  color: #363636;\n}\n\n.button.is-dark.is-loading::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-dark.is-outlined {\n  background-color: transparent;\n  border-color: #363636;\n  color: #363636;\n}\n\n.button.is-dark.is-outlined:hover, .button.is-dark.is-outlined.is-hovered, .button.is-dark.is-outlined:focus, .button.is-dark.is-outlined.is-focused {\n  background-color: #363636;\n  border-color: #363636;\n  color: #fff;\n}\n\n.button.is-dark.is-outlined.is-loading::after {\n  border-color: transparent transparent #363636 #363636 !important;\n}\n\n.button.is-dark.is-outlined.is-loading:hover::after, .button.is-dark.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-outlined.is-loading:focus::after, .button.is-dark.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-dark.is-outlined[disabled],\nfieldset[disabled] .button.is-dark.is-outlined {\n  background-color: transparent;\n  border-color: #363636;\n  box-shadow: none;\n  color: #363636;\n}\n\n.button.is-dark.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-dark.is-inverted.is-outlined:hover, .button.is-dark.is-inverted.is-outlined.is-hovered, .button.is-dark.is-inverted.is-outlined:focus, .button.is-dark.is-inverted.is-outlined.is-focused {\n  background-color: #fff;\n  color: #363636;\n}\n\n.button.is-dark.is-inverted.is-outlined.is-loading:hover::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-dark.is-inverted.is-outlined.is-loading:focus::after, .button.is-dark.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #363636 #363636 !important;\n}\n\n.button.is-dark.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-dark.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  box-shadow: none;\n  color: #fff;\n}\n\n.button.is-primary {\n  background-color: #00d1b2;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-primary:hover, .button.is-primary.is-hovered {\n  background-color: #00c4a7;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-primary:focus, .button.is-primary.is-focused {\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-primary:focus:not(:active), .button.is-primary.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);\n}\n\n.button.is-primary:active, .button.is-primary.is-active {\n  background-color: #00b89c;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-primary[disabled],\nfieldset[disabled] .button.is-primary {\n  background-color: #00d1b2;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-primary.is-inverted {\n  background-color: #fff;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-inverted:hover, .button.is-primary.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-primary.is-inverted[disabled],\nfieldset[disabled] .button.is-primary.is-inverted {\n  background-color: #fff;\n  border-color: transparent;\n  box-shadow: none;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-loading::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-primary.is-outlined {\n  background-color: transparent;\n  border-color: #00d1b2;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-outlined:hover, .button.is-primary.is-outlined.is-hovered, .button.is-primary.is-outlined:focus, .button.is-primary.is-outlined.is-focused {\n  background-color: #00d1b2;\n  border-color: #00d1b2;\n  color: #fff;\n}\n\n.button.is-primary.is-outlined.is-loading::after {\n  border-color: transparent transparent #00d1b2 #00d1b2 !important;\n}\n\n.button.is-primary.is-outlined.is-loading:hover::after, .button.is-primary.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-outlined.is-loading:focus::after, .button.is-primary.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-primary.is-outlined[disabled],\nfieldset[disabled] .button.is-primary.is-outlined {\n  background-color: transparent;\n  border-color: #00d1b2;\n  box-shadow: none;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-primary.is-inverted.is-outlined:hover, .button.is-primary.is-inverted.is-outlined.is-hovered, .button.is-primary.is-inverted.is-outlined:focus, .button.is-primary.is-inverted.is-outlined.is-focused {\n  background-color: #fff;\n  color: #00d1b2;\n}\n\n.button.is-primary.is-inverted.is-outlined.is-loading:hover::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-primary.is-inverted.is-outlined.is-loading:focus::after, .button.is-primary.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #00d1b2 #00d1b2 !important;\n}\n\n.button.is-primary.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-primary.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  box-shadow: none;\n  color: #fff;\n}\n\n.button.is-primary.is-light {\n  background-color: #ebfffc;\n  color: #00947e;\n}\n\n.button.is-primary.is-light:hover, .button.is-primary.is-light.is-hovered {\n  background-color: #defffa;\n  border-color: transparent;\n  color: #00947e;\n}\n\n.button.is-primary.is-light:active, .button.is-primary.is-light.is-active {\n  background-color: #d1fff8;\n  border-color: transparent;\n  color: #00947e;\n}\n\n.button.is-link {\n  background-color: #3273dc;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-link:hover, .button.is-link.is-hovered {\n  background-color: #276cda;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-link:focus, .button.is-link.is-focused {\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-link:focus:not(:active), .button.is-link.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);\n}\n\n.button.is-link:active, .button.is-link.is-active {\n  background-color: #2366d1;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-link[disabled],\nfieldset[disabled] .button.is-link {\n  background-color: #3273dc;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-link.is-inverted {\n  background-color: #fff;\n  color: #3273dc;\n}\n\n.button.is-link.is-inverted:hover, .button.is-link.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-link.is-inverted[disabled],\nfieldset[disabled] .button.is-link.is-inverted {\n  background-color: #fff;\n  border-color: transparent;\n  box-shadow: none;\n  color: #3273dc;\n}\n\n.button.is-link.is-loading::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-link.is-outlined {\n  background-color: transparent;\n  border-color: #3273dc;\n  color: #3273dc;\n}\n\n.button.is-link.is-outlined:hover, .button.is-link.is-outlined.is-hovered, .button.is-link.is-outlined:focus, .button.is-link.is-outlined.is-focused {\n  background-color: #3273dc;\n  border-color: #3273dc;\n  color: #fff;\n}\n\n.button.is-link.is-outlined.is-loading::after {\n  border-color: transparent transparent #3273dc #3273dc !important;\n}\n\n.button.is-link.is-outlined.is-loading:hover::after, .button.is-link.is-outlined.is-loading.is-hovered::after, .button.is-link.is-outlined.is-loading:focus::after, .button.is-link.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-link.is-outlined[disabled],\nfieldset[disabled] .button.is-link.is-outlined {\n  background-color: transparent;\n  border-color: #3273dc;\n  box-shadow: none;\n  color: #3273dc;\n}\n\n.button.is-link.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-link.is-inverted.is-outlined:hover, .button.is-link.is-inverted.is-outlined.is-hovered, .button.is-link.is-inverted.is-outlined:focus, .button.is-link.is-inverted.is-outlined.is-focused {\n  background-color: #fff;\n  color: #3273dc;\n}\n\n.button.is-link.is-inverted.is-outlined.is-loading:hover::after, .button.is-link.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-link.is-inverted.is-outlined.is-loading:focus::after, .button.is-link.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #3273dc #3273dc !important;\n}\n\n.button.is-link.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-link.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  box-shadow: none;\n  color: #fff;\n}\n\n.button.is-link.is-light {\n  background-color: #eef3fc;\n  color: #2160c4;\n}\n\n.button.is-link.is-light:hover, .button.is-link.is-light.is-hovered {\n  background-color: #e3ecfa;\n  border-color: transparent;\n  color: #2160c4;\n}\n\n.button.is-link.is-light:active, .button.is-link.is-light.is-active {\n  background-color: #d8e4f8;\n  border-color: transparent;\n  color: #2160c4;\n}\n\n.button.is-info {\n  background-color: #3298dc;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-info:hover, .button.is-info.is-hovered {\n  background-color: #2793da;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-info:focus, .button.is-info.is-focused {\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-info:focus:not(:active), .button.is-info.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(50, 152, 220, 0.25);\n}\n\n.button.is-info:active, .button.is-info.is-active {\n  background-color: #238cd1;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-info[disabled],\nfieldset[disabled] .button.is-info {\n  background-color: #3298dc;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-info.is-inverted {\n  background-color: #fff;\n  color: #3298dc;\n}\n\n.button.is-info.is-inverted:hover, .button.is-info.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-info.is-inverted[disabled],\nfieldset[disabled] .button.is-info.is-inverted {\n  background-color: #fff;\n  border-color: transparent;\n  box-shadow: none;\n  color: #3298dc;\n}\n\n.button.is-info.is-loading::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-info.is-outlined {\n  background-color: transparent;\n  border-color: #3298dc;\n  color: #3298dc;\n}\n\n.button.is-info.is-outlined:hover, .button.is-info.is-outlined.is-hovered, .button.is-info.is-outlined:focus, .button.is-info.is-outlined.is-focused {\n  background-color: #3298dc;\n  border-color: #3298dc;\n  color: #fff;\n}\n\n.button.is-info.is-outlined.is-loading::after {\n  border-color: transparent transparent #3298dc #3298dc !important;\n}\n\n.button.is-info.is-outlined.is-loading:hover::after, .button.is-info.is-outlined.is-loading.is-hovered::after, .button.is-info.is-outlined.is-loading:focus::after, .button.is-info.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-info.is-outlined[disabled],\nfieldset[disabled] .button.is-info.is-outlined {\n  background-color: transparent;\n  border-color: #3298dc;\n  box-shadow: none;\n  color: #3298dc;\n}\n\n.button.is-info.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-info.is-inverted.is-outlined:hover, .button.is-info.is-inverted.is-outlined.is-hovered, .button.is-info.is-inverted.is-outlined:focus, .button.is-info.is-inverted.is-outlined.is-focused {\n  background-color: #fff;\n  color: #3298dc;\n}\n\n.button.is-info.is-inverted.is-outlined.is-loading:hover::after, .button.is-info.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-info.is-inverted.is-outlined.is-loading:focus::after, .button.is-info.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #3298dc #3298dc !important;\n}\n\n.button.is-info.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-info.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  box-shadow: none;\n  color: #fff;\n}\n\n.button.is-info.is-light {\n  background-color: #eef6fc;\n  color: #1d72aa;\n}\n\n.button.is-info.is-light:hover, .button.is-info.is-light.is-hovered {\n  background-color: #e3f1fa;\n  border-color: transparent;\n  color: #1d72aa;\n}\n\n.button.is-info.is-light:active, .button.is-info.is-light.is-active {\n  background-color: #d8ebf8;\n  border-color: transparent;\n  color: #1d72aa;\n}\n\n.button.is-success {\n  background-color: #48c774;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-success:hover, .button.is-success.is-hovered {\n  background-color: #3ec46d;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-success:focus, .button.is-success.is-focused {\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-success:focus:not(:active), .button.is-success.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(72, 199, 116, 0.25);\n}\n\n.button.is-success:active, .button.is-success.is-active {\n  background-color: #3abb67;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-success[disabled],\nfieldset[disabled] .button.is-success {\n  background-color: #48c774;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-success.is-inverted {\n  background-color: #fff;\n  color: #48c774;\n}\n\n.button.is-success.is-inverted:hover, .button.is-success.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-success.is-inverted[disabled],\nfieldset[disabled] .button.is-success.is-inverted {\n  background-color: #fff;\n  border-color: transparent;\n  box-shadow: none;\n  color: #48c774;\n}\n\n.button.is-success.is-loading::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-success.is-outlined {\n  background-color: transparent;\n  border-color: #48c774;\n  color: #48c774;\n}\n\n.button.is-success.is-outlined:hover, .button.is-success.is-outlined.is-hovered, .button.is-success.is-outlined:focus, .button.is-success.is-outlined.is-focused {\n  background-color: #48c774;\n  border-color: #48c774;\n  color: #fff;\n}\n\n.button.is-success.is-outlined.is-loading::after {\n  border-color: transparent transparent #48c774 #48c774 !important;\n}\n\n.button.is-success.is-outlined.is-loading:hover::after, .button.is-success.is-outlined.is-loading.is-hovered::after, .button.is-success.is-outlined.is-loading:focus::after, .button.is-success.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-success.is-outlined[disabled],\nfieldset[disabled] .button.is-success.is-outlined {\n  background-color: transparent;\n  border-color: #48c774;\n  box-shadow: none;\n  color: #48c774;\n}\n\n.button.is-success.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-success.is-inverted.is-outlined:hover, .button.is-success.is-inverted.is-outlined.is-hovered, .button.is-success.is-inverted.is-outlined:focus, .button.is-success.is-inverted.is-outlined.is-focused {\n  background-color: #fff;\n  color: #48c774;\n}\n\n.button.is-success.is-inverted.is-outlined.is-loading:hover::after, .button.is-success.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-success.is-inverted.is-outlined.is-loading:focus::after, .button.is-success.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #48c774 #48c774 !important;\n}\n\n.button.is-success.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-success.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  box-shadow: none;\n  color: #fff;\n}\n\n.button.is-success.is-light {\n  background-color: #effaf3;\n  color: #257942;\n}\n\n.button.is-success.is-light:hover, .button.is-success.is-light.is-hovered {\n  background-color: #e6f7ec;\n  border-color: transparent;\n  color: #257942;\n}\n\n.button.is-success.is-light:active, .button.is-success.is-light.is-active {\n  background-color: #dcf4e4;\n  border-color: transparent;\n  color: #257942;\n}\n\n.button.is-warning {\n  background-color: #ffdd57;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning:hover, .button.is-warning.is-hovered {\n  background-color: #ffdb4a;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning:focus, .button.is-warning.is-focused {\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning:focus:not(:active), .button.is-warning.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(255, 221, 87, 0.25);\n}\n\n.button.is-warning:active, .button.is-warning.is-active {\n  background-color: #ffd83d;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning[disabled],\nfieldset[disabled] .button.is-warning {\n  background-color: #ffdd57;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-warning.is-inverted {\n  background-color: rgba(0, 0, 0, 0.7);\n  color: #ffdd57;\n}\n\n.button.is-warning.is-inverted:hover, .button.is-warning.is-inverted.is-hovered {\n  background-color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-inverted[disabled],\nfieldset[disabled] .button.is-warning.is-inverted {\n  background-color: rgba(0, 0, 0, 0.7);\n  border-color: transparent;\n  box-shadow: none;\n  color: #ffdd57;\n}\n\n.button.is-warning.is-loading::after {\n  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;\n}\n\n.button.is-warning.is-outlined {\n  background-color: transparent;\n  border-color: #ffdd57;\n  color: #ffdd57;\n}\n\n.button.is-warning.is-outlined:hover, .button.is-warning.is-outlined.is-hovered, .button.is-warning.is-outlined:focus, .button.is-warning.is-outlined.is-focused {\n  background-color: #ffdd57;\n  border-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-outlined.is-loading::after {\n  border-color: transparent transparent #ffdd57 #ffdd57 !important;\n}\n\n.button.is-warning.is-outlined.is-loading:hover::after, .button.is-warning.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-outlined.is-loading:focus::after, .button.is-warning.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;\n}\n\n.button.is-warning.is-outlined[disabled],\nfieldset[disabled] .button.is-warning.is-outlined {\n  background-color: transparent;\n  border-color: #ffdd57;\n  box-shadow: none;\n  color: #ffdd57;\n}\n\n.button.is-warning.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: rgba(0, 0, 0, 0.7);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-inverted.is-outlined:hover, .button.is-warning.is-inverted.is-outlined.is-hovered, .button.is-warning.is-inverted.is-outlined:focus, .button.is-warning.is-inverted.is-outlined.is-focused {\n  background-color: rgba(0, 0, 0, 0.7);\n  color: #ffdd57;\n}\n\n.button.is-warning.is-inverted.is-outlined.is-loading:hover::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-warning.is-inverted.is-outlined.is-loading:focus::after, .button.is-warning.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #ffdd57 #ffdd57 !important;\n}\n\n.button.is-warning.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-warning.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: rgba(0, 0, 0, 0.7);\n  box-shadow: none;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.button.is-warning.is-light {\n  background-color: #fffbeb;\n  color: #947600;\n}\n\n.button.is-warning.is-light:hover, .button.is-warning.is-light.is-hovered {\n  background-color: #fff8de;\n  border-color: transparent;\n  color: #947600;\n}\n\n.button.is-warning.is-light:active, .button.is-warning.is-light.is-active {\n  background-color: #fff6d1;\n  border-color: transparent;\n  color: #947600;\n}\n\n.button.is-danger {\n  background-color: #f14668;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-danger:hover, .button.is-danger.is-hovered {\n  background-color: #f03a5f;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-danger:focus, .button.is-danger.is-focused {\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-danger:focus:not(:active), .button.is-danger.is-focused:not(:active) {\n  box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);\n}\n\n.button.is-danger:active, .button.is-danger.is-active {\n  background-color: #ef2e55;\n  border-color: transparent;\n  color: #fff;\n}\n\n.button.is-danger[disabled],\nfieldset[disabled] .button.is-danger {\n  background-color: #f14668;\n  border-color: transparent;\n  box-shadow: none;\n}\n\n.button.is-danger.is-inverted {\n  background-color: #fff;\n  color: #f14668;\n}\n\n.button.is-danger.is-inverted:hover, .button.is-danger.is-inverted.is-hovered {\n  background-color: #f2f2f2;\n}\n\n.button.is-danger.is-inverted[disabled],\nfieldset[disabled] .button.is-danger.is-inverted {\n  background-color: #fff;\n  border-color: transparent;\n  box-shadow: none;\n  color: #f14668;\n}\n\n.button.is-danger.is-loading::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-danger.is-outlined {\n  background-color: transparent;\n  border-color: #f14668;\n  color: #f14668;\n}\n\n.button.is-danger.is-outlined:hover, .button.is-danger.is-outlined.is-hovered, .button.is-danger.is-outlined:focus, .button.is-danger.is-outlined.is-focused {\n  background-color: #f14668;\n  border-color: #f14668;\n  color: #fff;\n}\n\n.button.is-danger.is-outlined.is-loading::after {\n  border-color: transparent transparent #f14668 #f14668 !important;\n}\n\n.button.is-danger.is-outlined.is-loading:hover::after, .button.is-danger.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-outlined.is-loading:focus::after, .button.is-danger.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #fff #fff !important;\n}\n\n.button.is-danger.is-outlined[disabled],\nfieldset[disabled] .button.is-danger.is-outlined {\n  background-color: transparent;\n  border-color: #f14668;\n  box-shadow: none;\n  color: #f14668;\n}\n\n.button.is-danger.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  color: #fff;\n}\n\n.button.is-danger.is-inverted.is-outlined:hover, .button.is-danger.is-inverted.is-outlined.is-hovered, .button.is-danger.is-inverted.is-outlined:focus, .button.is-danger.is-inverted.is-outlined.is-focused {\n  background-color: #fff;\n  color: #f14668;\n}\n\n.button.is-danger.is-inverted.is-outlined.is-loading:hover::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-hovered::after, .button.is-danger.is-inverted.is-outlined.is-loading:focus::after, .button.is-danger.is-inverted.is-outlined.is-loading.is-focused::after {\n  border-color: transparent transparent #f14668 #f14668 !important;\n}\n\n.button.is-danger.is-inverted.is-outlined[disabled],\nfieldset[disabled] .button.is-danger.is-inverted.is-outlined {\n  background-color: transparent;\n  border-color: #fff;\n  box-shadow: none;\n  color: #fff;\n}\n\n.button.is-danger.is-light {\n  background-color: #feecf0;\n  color: #cc0f35;\n}\n\n.button.is-danger.is-light:hover, .button.is-danger.is-light.is-hovered {\n  background-color: #fde0e6;\n  border-color: transparent;\n  color: #cc0f35;\n}\n\n.button.is-danger.is-light:active, .button.is-danger.is-light.is-active {\n  background-color: #fcd4dc;\n  border-color: transparent;\n  color: #cc0f35;\n}\n\n.button.is-small {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.button.is-normal {\n  font-size: 1rem;\n}\n\n.button.is-medium {\n  font-size: 1.25rem;\n}\n\n.button.is-large {\n  font-size: 1.5rem;\n}\n\n.button[disabled],\nfieldset[disabled] .button {\n  background-color: white;\n  border-color: #dbdbdb;\n  box-shadow: none;\n  opacity: 0.5;\n}\n\n.button.is-fullwidth {\n  display: flex;\n  width: 100%;\n}\n\n.button.is-loading {\n  color: transparent !important;\n  pointer-events: none;\n}\n\n.button.is-loading::after {\n  position: absolute;\n  left: calc(50% - (1em / 2));\n  top: calc(50% - (1em / 2));\n  position: absolute !important;\n}\n\n.button.is-static {\n  background-color: whitesmoke;\n  border-color: #dbdbdb;\n  color: #7a7a7a;\n  box-shadow: none;\n  pointer-events: none;\n}\n\n.button.is-rounded {\n  border-radius: 290486px;\n  padding-left: calc(1em + 0.25em);\n  padding-right: calc(1em + 0.25em);\n}\n\n.buttons {\n  align-items: center;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.buttons .button {\n  margin-bottom: 0.5rem;\n}\n\n.buttons .button:not(:last-child):not(.is-fullwidth) {\n  margin-right: 0.5rem;\n}\n\n.buttons:last-child {\n  margin-bottom: -0.5rem;\n}\n\n.buttons:not(:last-child) {\n  margin-bottom: 1rem;\n}\n\n.buttons.are-small .button:not(.is-normal):not(.is-medium):not(.is-large) {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.buttons.are-medium .button:not(.is-small):not(.is-normal):not(.is-large) {\n  font-size: 1.25rem;\n}\n\n.buttons.are-large .button:not(.is-small):not(.is-normal):not(.is-medium) {\n  font-size: 1.5rem;\n}\n\n.buttons.has-addons .button:not(:first-child) {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.buttons.has-addons .button:not(:last-child) {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n  margin-right: -1px;\n}\n\n.buttons.has-addons .button:last-child {\n  margin-right: 0;\n}\n\n.buttons.has-addons .button:hover, .buttons.has-addons .button.is-hovered {\n  z-index: 2;\n}\n\n.buttons.has-addons .button:focus, .buttons.has-addons .button.is-focused, .buttons.has-addons .button:active, .buttons.has-addons .button.is-active, .buttons.has-addons .button.is-selected {\n  z-index: 3;\n}\n\n.buttons.has-addons .button:focus:hover, .buttons.has-addons .button.is-focused:hover, .buttons.has-addons .button:active:hover, .buttons.has-addons .button.is-active:hover, .buttons.has-addons .button.is-selected:hover {\n  z-index: 4;\n}\n\n.buttons.has-addons .button.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.buttons.is-centered {\n  justify-content: center;\n}\n\n.buttons.is-centered:not(.has-addons) .button:not(.is-fullwidth) {\n  margin-left: 0.25rem;\n  margin-right: 0.25rem;\n}\n\n.buttons.is-right {\n  justify-content: flex-end;\n}\n\n.buttons.is-right:not(.has-addons) .button:not(.is-fullwidth) {\n  margin-left: 0.25rem;\n  margin-right: 0.25rem;\n}\n\n.container {\n  flex-grow: 1;\n  margin: 0 auto;\n  position: relative;\n  width: auto;\n}\n\n.container.is-fluid {\n  max-width: none;\n  padding-left: 32px;\n  padding-right: 32px;\n  width: 100%;\n}\n\n@media screen and (min-width: 1024px) {\n  .container {\n    max-width: 960px;\n  }\n}\n\n@media screen and (max-width: 1215px) {\n  .container.is-widescreen {\n    max-width: 1152px;\n  }\n}\n\n@media screen and (max-width: 1407px) {\n  .container.is-fullhd {\n    max-width: 1344px;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .container {\n    max-width: 1152px;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .container {\n    max-width: 1344px;\n  }\n}\n\n.content li + li {\n  margin-top: 0.25em;\n}\n\n.content p:not(:last-child),\n.content dl:not(:last-child),\n.content ol:not(:last-child),\n.content ul:not(:last-child),\n.content blockquote:not(:last-child),\n.content pre:not(:last-child),\n.content table:not(:last-child) {\n  margin-bottom: 1em;\n}\n\n.content h1,\n.content h2,\n.content h3,\n.content h4,\n.content h5,\n.content h6 {\n  color: #363636;\n  font-weight: 600;\n  line-height: 1.125;\n}\n\n.content h1 {\n  font-size: 2em;\n  margin-bottom: 0.5em;\n}\n\n.content h1:not(:first-child) {\n  margin-top: 1em;\n}\n\n.content h2 {\n  font-size: 1.75em;\n  margin-bottom: 0.5714em;\n}\n\n.content h2:not(:first-child) {\n  margin-top: 1.1428em;\n}\n\n.content h3 {\n  font-size: 1.5em;\n  margin-bottom: 0.6666em;\n}\n\n.content h3:not(:first-child) {\n  margin-top: 1.3333em;\n}\n\n.content h4 {\n  font-size: 1.25em;\n  margin-bottom: 0.8em;\n}\n\n.content h5 {\n  font-size: 1.125em;\n  margin-bottom: 0.8888em;\n}\n\n.content h6 {\n  font-size: 1em;\n  margin-bottom: 1em;\n}\n\n.content blockquote {\n  background-color: whitesmoke;\n  border-left: 5px solid #dbdbdb;\n  padding: 1.25em 1.5em;\n}\n\n.content ol {\n  list-style-position: outside;\n  margin-left: 2em;\n  margin-top: 1em;\n}\n\n.content ol:not([type]) {\n  list-style-type: decimal;\n}\n\n.content ol:not([type]).is-lower-alpha {\n  list-style-type: lower-alpha;\n}\n\n.content ol:not([type]).is-lower-roman {\n  list-style-type: lower-roman;\n}\n\n.content ol:not([type]).is-upper-alpha {\n  list-style-type: upper-alpha;\n}\n\n.content ol:not([type]).is-upper-roman {\n  list-style-type: upper-roman;\n}\n\n.content ul {\n  list-style: disc outside;\n  margin-left: 2em;\n  margin-top: 1em;\n}\n\n.content ul ul {\n  list-style-type: circle;\n  margin-top: 0.5em;\n}\n\n.content ul ul ul {\n  list-style-type: square;\n}\n\n.content dd {\n  margin-left: 2em;\n}\n\n.content figure {\n  margin-left: 2em;\n  margin-right: 2em;\n  text-align: center;\n}\n\n.content figure:not(:first-child) {\n  margin-top: 2em;\n}\n\n.content figure:not(:last-child) {\n  margin-bottom: 2em;\n}\n\n.content figure img {\n  display: inline-block;\n}\n\n.content figure figcaption {\n  font-style: italic;\n}\n\n.content pre {\n  -webkit-overflow-scrolling: touch;\n  overflow-x: auto;\n  padding: 1.25em 1.5em;\n  white-space: pre;\n  word-wrap: normal;\n}\n\n.content sup,\n.content sub {\n  font-size: 75%;\n}\n\n.content table {\n  width: 100%;\n}\n\n.content table td,\n.content table th {\n  border: 1px solid #dbdbdb;\n  border-width: 0 0 1px;\n  padding: 0.5em 0.75em;\n  vertical-align: top;\n}\n\n.content table th {\n  color: #363636;\n}\n\n.content table th:not([align]) {\n  text-align: left;\n}\n\n.content table thead td,\n.content table thead th {\n  border-width: 0 0 2px;\n  color: #363636;\n}\n\n.content table tfoot td,\n.content table tfoot th {\n  border-width: 2px 0 0;\n  color: #363636;\n}\n\n.content table tbody tr:last-child td,\n.content table tbody tr:last-child th {\n  border-bottom-width: 0;\n}\n\n.content .tabs li + li {\n  margin-top: 0;\n}\n\n.content.is-small {\n  font-size: 0.75rem;\n}\n\n.content.is-medium {\n  font-size: 1.25rem;\n}\n\n.content.is-large {\n  font-size: 1.5rem;\n}\n\n.icon {\n  align-items: center;\n  display: inline-flex;\n  justify-content: center;\n  height: 1.5rem;\n  width: 1.5rem;\n}\n\n.icon.is-small {\n  height: 1rem;\n  width: 1rem;\n}\n\n.icon.is-medium {\n  height: 2rem;\n  width: 2rem;\n}\n\n.icon.is-large {\n  height: 3rem;\n  width: 3rem;\n}\n\n.image {\n  display: block;\n  position: relative;\n}\n\n.image img {\n  display: block;\n  height: auto;\n  width: 100%;\n}\n\n.image img.is-rounded {\n  border-radius: 290486px;\n}\n\n.image.is-fullwidth {\n  width: 100%;\n}\n\n.image.is-square img,\n.image.is-square .has-ratio, .image.is-1by1 img,\n.image.is-1by1 .has-ratio, .image.is-5by4 img,\n.image.is-5by4 .has-ratio, .image.is-4by3 img,\n.image.is-4by3 .has-ratio, .image.is-3by2 img,\n.image.is-3by2 .has-ratio, .image.is-5by3 img,\n.image.is-5by3 .has-ratio, .image.is-16by9 img,\n.image.is-16by9 .has-ratio, .image.is-2by1 img,\n.image.is-2by1 .has-ratio, .image.is-3by1 img,\n.image.is-3by1 .has-ratio, .image.is-4by5 img,\n.image.is-4by5 .has-ratio, .image.is-3by4 img,\n.image.is-3by4 .has-ratio, .image.is-2by3 img,\n.image.is-2by3 .has-ratio, .image.is-3by5 img,\n.image.is-3by5 .has-ratio, .image.is-9by16 img,\n.image.is-9by16 .has-ratio, .image.is-1by2 img,\n.image.is-1by2 .has-ratio, .image.is-1by3 img,\n.image.is-1by3 .has-ratio {\n  height: 100%;\n  width: 100%;\n}\n\n.image.is-square, .image.is-1by1 {\n  padding-top: 100%;\n}\n\n.image.is-5by4 {\n  padding-top: 80%;\n}\n\n.image.is-4by3 {\n  padding-top: 75%;\n}\n\n.image.is-3by2 {\n  padding-top: 66.6666%;\n}\n\n.image.is-5by3 {\n  padding-top: 60%;\n}\n\n.image.is-16by9 {\n  padding-top: 56.25%;\n}\n\n.image.is-2by1 {\n  padding-top: 50%;\n}\n\n.image.is-3by1 {\n  padding-top: 33.3333%;\n}\n\n.image.is-4by5 {\n  padding-top: 125%;\n}\n\n.image.is-3by4 {\n  padding-top: 133.3333%;\n}\n\n.image.is-2by3 {\n  padding-top: 150%;\n}\n\n.image.is-3by5 {\n  padding-top: 166.6666%;\n}\n\n.image.is-9by16 {\n  padding-top: 177.7777%;\n}\n\n.image.is-1by2 {\n  padding-top: 200%;\n}\n\n.image.is-1by3 {\n  padding-top: 300%;\n}\n\n.image.is-16x16 {\n  height: 16px;\n  width: 16px;\n}\n\n.image.is-24x24 {\n  height: 24px;\n  width: 24px;\n}\n\n.image.is-32x32 {\n  height: 32px;\n  width: 32px;\n}\n\n.image.is-48x48 {\n  height: 48px;\n  width: 48px;\n}\n\n.image.is-64x64 {\n  height: 64px;\n  width: 64px;\n}\n\n.image.is-96x96 {\n  height: 96px;\n  width: 96px;\n}\n\n.image.is-128x128 {\n  height: 128px;\n  width: 128px;\n}\n\n.notification {\n  background-color: whitesmoke;\n  border-radius: 4px;\n  padding: 1.25rem 2.5rem 1.25rem 1.5rem;\n  position: relative;\n}\n\n.notification a:not(.button):not(.dropdown-item) {\n  color: currentColor;\n  text-decoration: underline;\n}\n\n.notification strong {\n  color: currentColor;\n}\n\n.notification code,\n.notification pre {\n  background: white;\n}\n\n.notification pre code {\n  background: transparent;\n}\n\n.notification > .delete {\n  position: absolute;\n  right: 0.5rem;\n  top: 0.5rem;\n}\n\n.notification .title,\n.notification .subtitle,\n.notification .content {\n  color: currentColor;\n}\n\n.notification.is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.notification.is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.notification.is-light {\n  background-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.notification.is-dark {\n  background-color: #363636;\n  color: #fff;\n}\n\n.notification.is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.notification.is-link {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.notification.is-info {\n  background-color: #3298dc;\n  color: #fff;\n}\n\n.notification.is-success {\n  background-color: #48c774;\n  color: #fff;\n}\n\n.notification.is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.notification.is-danger {\n  background-color: #f14668;\n  color: #fff;\n}\n\n.progress {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  border: none;\n  border-radius: 290486px;\n  display: block;\n  height: 1rem;\n  overflow: hidden;\n  padding: 0;\n  width: 100%;\n}\n\n.progress::-webkit-progress-bar {\n  background-color: #ededed;\n}\n\n.progress::-webkit-progress-value {\n  background-color: #4a4a4a;\n}\n\n.progress::-moz-progress-bar {\n  background-color: #4a4a4a;\n}\n\n.progress::-ms-fill {\n  background-color: #4a4a4a;\n  border: none;\n}\n\n.progress.is-white::-webkit-progress-value {\n  background-color: white;\n}\n\n.progress.is-white::-moz-progress-bar {\n  background-color: white;\n}\n\n.progress.is-white::-ms-fill {\n  background-color: white;\n}\n\n.progress.is-white:indeterminate {\n  background-image: linear-gradient(to right, white 30%, #ededed 30%);\n}\n\n.progress.is-black::-webkit-progress-value {\n  background-color: #0a0a0a;\n}\n\n.progress.is-black::-moz-progress-bar {\n  background-color: #0a0a0a;\n}\n\n.progress.is-black::-ms-fill {\n  background-color: #0a0a0a;\n}\n\n.progress.is-black:indeterminate {\n  background-image: linear-gradient(to right, #0a0a0a 30%, #ededed 30%);\n}\n\n.progress.is-light::-webkit-progress-value {\n  background-color: whitesmoke;\n}\n\n.progress.is-light::-moz-progress-bar {\n  background-color: whitesmoke;\n}\n\n.progress.is-light::-ms-fill {\n  background-color: whitesmoke;\n}\n\n.progress.is-light:indeterminate {\n  background-image: linear-gradient(to right, whitesmoke 30%, #ededed 30%);\n}\n\n.progress.is-dark::-webkit-progress-value {\n  background-color: #363636;\n}\n\n.progress.is-dark::-moz-progress-bar {\n  background-color: #363636;\n}\n\n.progress.is-dark::-ms-fill {\n  background-color: #363636;\n}\n\n.progress.is-dark:indeterminate {\n  background-image: linear-gradient(to right, #363636 30%, #ededed 30%);\n}\n\n.progress.is-primary::-webkit-progress-value {\n  background-color: #00d1b2;\n}\n\n.progress.is-primary::-moz-progress-bar {\n  background-color: #00d1b2;\n}\n\n.progress.is-primary::-ms-fill {\n  background-color: #00d1b2;\n}\n\n.progress.is-primary:indeterminate {\n  background-image: linear-gradient(to right, #00d1b2 30%, #ededed 30%);\n}\n\n.progress.is-link::-webkit-progress-value {\n  background-color: #3273dc;\n}\n\n.progress.is-link::-moz-progress-bar {\n  background-color: #3273dc;\n}\n\n.progress.is-link::-ms-fill {\n  background-color: #3273dc;\n}\n\n.progress.is-link:indeterminate {\n  background-image: linear-gradient(to right, #3273dc 30%, #ededed 30%);\n}\n\n.progress.is-info::-webkit-progress-value {\n  background-color: #3298dc;\n}\n\n.progress.is-info::-moz-progress-bar {\n  background-color: #3298dc;\n}\n\n.progress.is-info::-ms-fill {\n  background-color: #3298dc;\n}\n\n.progress.is-info:indeterminate {\n  background-image: linear-gradient(to right, #3298dc 30%, #ededed 30%);\n}\n\n.progress.is-success::-webkit-progress-value {\n  background-color: #48c774;\n}\n\n.progress.is-success::-moz-progress-bar {\n  background-color: #48c774;\n}\n\n.progress.is-success::-ms-fill {\n  background-color: #48c774;\n}\n\n.progress.is-success:indeterminate {\n  background-image: linear-gradient(to right, #48c774 30%, #ededed 30%);\n}\n\n.progress.is-warning::-webkit-progress-value {\n  background-color: #ffdd57;\n}\n\n.progress.is-warning::-moz-progress-bar {\n  background-color: #ffdd57;\n}\n\n.progress.is-warning::-ms-fill {\n  background-color: #ffdd57;\n}\n\n.progress.is-warning:indeterminate {\n  background-image: linear-gradient(to right, #ffdd57 30%, #ededed 30%);\n}\n\n.progress.is-danger::-webkit-progress-value {\n  background-color: #f14668;\n}\n\n.progress.is-danger::-moz-progress-bar {\n  background-color: #f14668;\n}\n\n.progress.is-danger::-ms-fill {\n  background-color: #f14668;\n}\n\n.progress.is-danger:indeterminate {\n  background-image: linear-gradient(to right, #f14668 30%, #ededed 30%);\n}\n\n.progress:indeterminate {\n  -webkit-animation-duration: 1.5s;\n          animation-duration: 1.5s;\n  -webkit-animation-iteration-count: infinite;\n          animation-iteration-count: infinite;\n  -webkit-animation-name: moveIndeterminate;\n          animation-name: moveIndeterminate;\n  -webkit-animation-timing-function: linear;\n          animation-timing-function: linear;\n  background-color: #ededed;\n  background-image: linear-gradient(to right, #4a4a4a 30%, #ededed 30%);\n  background-position: top left;\n  background-repeat: no-repeat;\n  background-size: 150% 150%;\n}\n\n.progress:indeterminate::-webkit-progress-bar {\n  background-color: transparent;\n}\n\n.progress:indeterminate::-moz-progress-bar {\n  background-color: transparent;\n}\n\n.progress.is-small {\n  height: 0.75rem;\n}\n\n.progress.is-medium {\n  height: 1.25rem;\n}\n\n.progress.is-large {\n  height: 1.5rem;\n}\n\n@-webkit-keyframes moveIndeterminate {\n  from {\n    background-position: 200% 0;\n  }\n  to {\n    background-position: -200% 0;\n  }\n}\n\n@keyframes moveIndeterminate {\n  from {\n    background-position: 200% 0;\n  }\n  to {\n    background-position: -200% 0;\n  }\n}\n\n.table {\n  background-color: white;\n  color: #363636;\n}\n\n.table td,\n.table th {\n  border: 1px solid #dbdbdb;\n  border-width: 0 0 1px;\n  padding: 0.5em 0.75em;\n  vertical-align: top;\n}\n\n.table td.is-white,\n.table th.is-white {\n  background-color: white;\n  border-color: white;\n  color: #0a0a0a;\n}\n\n.table td.is-black,\n.table th.is-black {\n  background-color: #0a0a0a;\n  border-color: #0a0a0a;\n  color: white;\n}\n\n.table td.is-light,\n.table th.is-light {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.table td.is-dark,\n.table th.is-dark {\n  background-color: #363636;\n  border-color: #363636;\n  color: #fff;\n}\n\n.table td.is-primary,\n.table th.is-primary {\n  background-color: #00d1b2;\n  border-color: #00d1b2;\n  color: #fff;\n}\n\n.table td.is-link,\n.table th.is-link {\n  background-color: #3273dc;\n  border-color: #3273dc;\n  color: #fff;\n}\n\n.table td.is-info,\n.table th.is-info {\n  background-color: #3298dc;\n  border-color: #3298dc;\n  color: #fff;\n}\n\n.table td.is-success,\n.table th.is-success {\n  background-color: #48c774;\n  border-color: #48c774;\n  color: #fff;\n}\n\n.table td.is-warning,\n.table th.is-warning {\n  background-color: #ffdd57;\n  border-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.table td.is-danger,\n.table th.is-danger {\n  background-color: #f14668;\n  border-color: #f14668;\n  color: #fff;\n}\n\n.table td.is-narrow,\n.table th.is-narrow {\n  white-space: nowrap;\n  width: 1%;\n}\n\n.table td.is-selected,\n.table th.is-selected {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.table td.is-selected a,\n.table td.is-selected strong,\n.table th.is-selected a,\n.table th.is-selected strong {\n  color: currentColor;\n}\n\n.table th {\n  color: #363636;\n}\n\n.table th:not([align]) {\n  text-align: left;\n}\n\n.table tr.is-selected {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.table tr.is-selected a,\n.table tr.is-selected strong {\n  color: currentColor;\n}\n\n.table tr.is-selected td,\n.table tr.is-selected th {\n  border-color: #fff;\n  color: currentColor;\n}\n\n.table thead {\n  background-color: transparent;\n}\n\n.table thead td,\n.table thead th {\n  border-width: 0 0 2px;\n  color: #363636;\n}\n\n.table tfoot {\n  background-color: transparent;\n}\n\n.table tfoot td,\n.table tfoot th {\n  border-width: 2px 0 0;\n  color: #363636;\n}\n\n.table tbody {\n  background-color: transparent;\n}\n\n.table tbody tr:last-child td,\n.table tbody tr:last-child th {\n  border-bottom-width: 0;\n}\n\n.table.is-bordered td,\n.table.is-bordered th {\n  border-width: 1px;\n}\n\n.table.is-bordered tr:last-child td,\n.table.is-bordered tr:last-child th {\n  border-bottom-width: 1px;\n}\n\n.table.is-fullwidth {\n  width: 100%;\n}\n\n.table.is-hoverable tbody tr:not(.is-selected):hover {\n  background-color: #fafafa;\n}\n\n.table.is-hoverable.is-striped tbody tr:not(.is-selected):hover {\n  background-color: #fafafa;\n}\n\n.table.is-hoverable.is-striped tbody tr:not(.is-selected):hover:nth-child(even) {\n  background-color: whitesmoke;\n}\n\n.table.is-narrow td,\n.table.is-narrow th {\n  padding: 0.25em 0.5em;\n}\n\n.table.is-striped tbody tr:not(.is-selected):nth-child(even) {\n  background-color: #fafafa;\n}\n\n.table-container {\n  -webkit-overflow-scrolling: touch;\n  overflow: auto;\n  overflow-y: hidden;\n  max-width: 100%;\n}\n\n.tags {\n  align-items: center;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.tags .tag {\n  margin-bottom: 0.5rem;\n}\n\n.tags .tag:not(:last-child) {\n  margin-right: 0.5rem;\n}\n\n.tags:last-child {\n  margin-bottom: -0.5rem;\n}\n\n.tags:not(:last-child) {\n  margin-bottom: 1rem;\n}\n\n.tags.are-medium .tag:not(.is-normal):not(.is-large) {\n  font-size: 1rem;\n}\n\n.tags.are-large .tag:not(.is-normal):not(.is-medium) {\n  font-size: 1.25rem;\n}\n\n.tags.is-centered {\n  justify-content: center;\n}\n\n.tags.is-centered .tag {\n  margin-right: 0.25rem;\n  margin-left: 0.25rem;\n}\n\n.tags.is-right {\n  justify-content: flex-end;\n}\n\n.tags.is-right .tag:not(:first-child) {\n  margin-left: 0.5rem;\n}\n\n.tags.is-right .tag:not(:last-child) {\n  margin-right: 0;\n}\n\n.tags.has-addons .tag {\n  margin-right: 0;\n}\n\n.tags.has-addons .tag:not(:first-child) {\n  margin-left: 0;\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.tags.has-addons .tag:not(:last-child) {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.tag:not(body) {\n  align-items: center;\n  background-color: whitesmoke;\n  border-radius: 4px;\n  color: #4a4a4a;\n  display: inline-flex;\n  font-size: 0.75rem;\n  height: 2em;\n  justify-content: center;\n  line-height: 1.5;\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n  white-space: nowrap;\n}\n\n.tag:not(body) .delete {\n  margin-left: 0.25rem;\n  margin-right: -0.375rem;\n}\n\n.tag:not(body).is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.tag:not(body).is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.tag:not(body).is-light {\n  background-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.tag:not(body).is-dark {\n  background-color: #363636;\n  color: #fff;\n}\n\n.tag:not(body).is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.tag:not(body).is-primary.is-light {\n  background-color: #ebfffc;\n  color: #00947e;\n}\n\n.tag:not(body).is-link {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.tag:not(body).is-link.is-light {\n  background-color: #eef3fc;\n  color: #2160c4;\n}\n\n.tag:not(body).is-info {\n  background-color: #3298dc;\n  color: #fff;\n}\n\n.tag:not(body).is-info.is-light {\n  background-color: #eef6fc;\n  color: #1d72aa;\n}\n\n.tag:not(body).is-success {\n  background-color: #48c774;\n  color: #fff;\n}\n\n.tag:not(body).is-success.is-light {\n  background-color: #effaf3;\n  color: #257942;\n}\n\n.tag:not(body).is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.tag:not(body).is-warning.is-light {\n  background-color: #fffbeb;\n  color: #947600;\n}\n\n.tag:not(body).is-danger {\n  background-color: #f14668;\n  color: #fff;\n}\n\n.tag:not(body).is-danger.is-light {\n  background-color: #feecf0;\n  color: #cc0f35;\n}\n\n.tag:not(body).is-normal {\n  font-size: 0.75rem;\n}\n\n.tag:not(body).is-medium {\n  font-size: 1rem;\n}\n\n.tag:not(body).is-large {\n  font-size: 1.25rem;\n}\n\n.tag:not(body) .icon:first-child:not(:last-child) {\n  margin-left: -0.375em;\n  margin-right: 0.1875em;\n}\n\n.tag:not(body) .icon:last-child:not(:first-child) {\n  margin-left: 0.1875em;\n  margin-right: -0.375em;\n}\n\n.tag:not(body) .icon:first-child:last-child {\n  margin-left: -0.375em;\n  margin-right: -0.375em;\n}\n\n.tag:not(body).is-delete {\n  margin-left: 1px;\n  padding: 0;\n  position: relative;\n  width: 2em;\n}\n\n.tag:not(body).is-delete::before, .tag:not(body).is-delete::after {\n  background-color: currentColor;\n  content: \"\";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\n\n.tag:not(body).is-delete::before {\n  height: 1px;\n  width: 50%;\n}\n\n.tag:not(body).is-delete::after {\n  height: 50%;\n  width: 1px;\n}\n\n.tag:not(body).is-delete:hover, .tag:not(body).is-delete:focus {\n  background-color: #e8e8e8;\n}\n\n.tag:not(body).is-delete:active {\n  background-color: #dbdbdb;\n}\n\n.tag:not(body).is-rounded {\n  border-radius: 290486px;\n}\n\na.tag:hover {\n  text-decoration: underline;\n}\n\n.title,\n.subtitle {\n  word-break: break-word;\n}\n\n.title em,\n.title span,\n.subtitle em,\n.subtitle span {\n  font-weight: inherit;\n}\n\n.title sub,\n.subtitle sub {\n  font-size: 0.75em;\n}\n\n.title sup,\n.subtitle sup {\n  font-size: 0.75em;\n}\n\n.title .tag,\n.subtitle .tag {\n  vertical-align: middle;\n}\n\n.title {\n  color: #363636;\n  font-size: 2rem;\n  font-weight: 600;\n  line-height: 1.125;\n}\n\n.title strong {\n  color: inherit;\n  font-weight: inherit;\n}\n\n.title + .highlight {\n  margin-top: -0.75rem;\n}\n\n.title:not(.is-spaced) + .subtitle {\n  margin-top: -1.25rem;\n}\n\n.title.is-1 {\n  font-size: 3rem;\n}\n\n.title.is-2 {\n  font-size: 2.5rem;\n}\n\n.title.is-3 {\n  font-size: 2rem;\n}\n\n.title.is-4 {\n  font-size: 1.5rem;\n}\n\n.title.is-5 {\n  font-size: 1.25rem;\n}\n\n.title.is-6 {\n  font-size: 1rem;\n}\n\n.title.is-7 {\n  font-size: 0.75rem;\n}\n\n.subtitle {\n  color: #4a4a4a;\n  font-size: 1.25rem;\n  font-weight: 400;\n  line-height: 1.25;\n}\n\n.subtitle strong {\n  color: #363636;\n  font-weight: 600;\n}\n\n.subtitle:not(.is-spaced) + .title {\n  margin-top: -1.25rem;\n}\n\n.subtitle.is-1 {\n  font-size: 3rem;\n}\n\n.subtitle.is-2 {\n  font-size: 2.5rem;\n}\n\n.subtitle.is-3 {\n  font-size: 2rem;\n}\n\n.subtitle.is-4 {\n  font-size: 1.5rem;\n}\n\n.subtitle.is-5 {\n  font-size: 1.25rem;\n}\n\n.subtitle.is-6 {\n  font-size: 1rem;\n}\n\n.subtitle.is-7 {\n  font-size: 0.75rem;\n}\n\n.heading {\n  display: block;\n  font-size: 11px;\n  letter-spacing: 1px;\n  margin-bottom: 5px;\n  text-transform: uppercase;\n}\n\n.highlight {\n  font-weight: 400;\n  max-width: 100%;\n  overflow: hidden;\n  padding: 0;\n}\n\n.highlight pre {\n  overflow: auto;\n  max-width: 100%;\n}\n\n.number {\n  align-items: center;\n  background-color: whitesmoke;\n  border-radius: 290486px;\n  display: inline-flex;\n  font-size: 1.25rem;\n  height: 2em;\n  justify-content: center;\n  margin-right: 1.5rem;\n  min-width: 2.5em;\n  padding: 0.25rem 0.5rem;\n  text-align: center;\n  vertical-align: top;\n}\n\n.input, .textarea, .select select {\n  background-color: white;\n  border-color: #dbdbdb;\n  border-radius: 4px;\n  color: #363636;\n}\n\n.input::-moz-placeholder, .textarea::-moz-placeholder, .select select::-moz-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input::-webkit-input-placeholder, .textarea::-webkit-input-placeholder, .select select::-webkit-input-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input:-moz-placeholder, .textarea:-moz-placeholder, .select select:-moz-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input:-ms-input-placeholder, .textarea:-ms-input-placeholder, .select select:-ms-input-placeholder {\n  color: rgba(54, 54, 54, 0.3);\n}\n\n.input:hover, .textarea:hover, .select select:hover, .is-hovered.input, .is-hovered.textarea, .select select.is-hovered {\n  border-color: #b5b5b5;\n}\n\n.input:focus, .textarea:focus, .select select:focus, .is-focused.input, .is-focused.textarea, .select select.is-focused, .input:active, .textarea:active, .select select:active, .is-active.input, .is-active.textarea, .select select.is-active {\n  border-color: #3273dc;\n  box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);\n}\n\n.input[disabled], .textarea[disabled], .select select[disabled],\nfieldset[disabled] .input,\nfieldset[disabled] .textarea,\nfieldset[disabled] .select select,\n.select fieldset[disabled] select {\n  background-color: whitesmoke;\n  border-color: whitesmoke;\n  box-shadow: none;\n  color: #7a7a7a;\n}\n\n.input[disabled]::-moz-placeholder, .textarea[disabled]::-moz-placeholder, .select select[disabled]::-moz-placeholder,\nfieldset[disabled] .input::-moz-placeholder,\nfieldset[disabled] .textarea::-moz-placeholder,\nfieldset[disabled] .select select::-moz-placeholder,\n.select fieldset[disabled] select::-moz-placeholder {\n  color: rgba(122, 122, 122, 0.3);\n}\n\n.input[disabled]::-webkit-input-placeholder, .textarea[disabled]::-webkit-input-placeholder, .select select[disabled]::-webkit-input-placeholder,\nfieldset[disabled] .input::-webkit-input-placeholder,\nfieldset[disabled] .textarea::-webkit-input-placeholder,\nfieldset[disabled] .select select::-webkit-input-placeholder,\n.select fieldset[disabled] select::-webkit-input-placeholder {\n  color: rgba(122, 122, 122, 0.3);\n}\n\n.input[disabled]:-moz-placeholder, .textarea[disabled]:-moz-placeholder, .select select[disabled]:-moz-placeholder,\nfieldset[disabled] .input:-moz-placeholder,\nfieldset[disabled] .textarea:-moz-placeholder,\nfieldset[disabled] .select select:-moz-placeholder,\n.select fieldset[disabled] select:-moz-placeholder {\n  color: rgba(122, 122, 122, 0.3);\n}\n\n.input[disabled]:-ms-input-placeholder, .textarea[disabled]:-ms-input-placeholder, .select select[disabled]:-ms-input-placeholder,\nfieldset[disabled] .input:-ms-input-placeholder,\nfieldset[disabled] .textarea:-ms-input-placeholder,\nfieldset[disabled] .select select:-ms-input-placeholder,\n.select fieldset[disabled] select:-ms-input-placeholder {\n  color: rgba(122, 122, 122, 0.3);\n}\n\n.input, .textarea {\n  box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);\n  max-width: 100%;\n  width: 100%;\n}\n\n.input[readonly], .textarea[readonly] {\n  box-shadow: none;\n}\n\n.is-white.input, .is-white.textarea {\n  border-color: white;\n}\n\n.is-white.input:focus, .is-white.textarea:focus, .is-white.is-focused.input, .is-white.is-focused.textarea, .is-white.input:active, .is-white.textarea:active, .is-white.is-active.input, .is-white.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.25);\n}\n\n.is-black.input, .is-black.textarea {\n  border-color: #0a0a0a;\n}\n\n.is-black.input:focus, .is-black.textarea:focus, .is-black.is-focused.input, .is-black.is-focused.textarea, .is-black.input:active, .is-black.textarea:active, .is-black.is-active.input, .is-black.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);\n}\n\n.is-light.input, .is-light.textarea {\n  border-color: whitesmoke;\n}\n\n.is-light.input:focus, .is-light.textarea:focus, .is-light.is-focused.input, .is-light.is-focused.textarea, .is-light.input:active, .is-light.textarea:active, .is-light.is-active.input, .is-light.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(245, 245, 245, 0.25);\n}\n\n.is-dark.input, .is-dark.textarea {\n  border-color: #363636;\n}\n\n.is-dark.input:focus, .is-dark.textarea:focus, .is-dark.is-focused.input, .is-dark.is-focused.textarea, .is-dark.input:active, .is-dark.textarea:active, .is-dark.is-active.input, .is-dark.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);\n}\n\n.is-primary.input, .is-primary.textarea {\n  border-color: #00d1b2;\n}\n\n.is-primary.input:focus, .is-primary.textarea:focus, .is-primary.is-focused.input, .is-primary.is-focused.textarea, .is-primary.input:active, .is-primary.textarea:active, .is-primary.is-active.input, .is-primary.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);\n}\n\n.is-link.input, .is-link.textarea {\n  border-color: #3273dc;\n}\n\n.is-link.input:focus, .is-link.textarea:focus, .is-link.is-focused.input, .is-link.is-focused.textarea, .is-link.input:active, .is-link.textarea:active, .is-link.is-active.input, .is-link.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);\n}\n\n.is-info.input, .is-info.textarea {\n  border-color: #3298dc;\n}\n\n.is-info.input:focus, .is-info.textarea:focus, .is-info.is-focused.input, .is-info.is-focused.textarea, .is-info.input:active, .is-info.textarea:active, .is-info.is-active.input, .is-info.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(50, 152, 220, 0.25);\n}\n\n.is-success.input, .is-success.textarea {\n  border-color: #48c774;\n}\n\n.is-success.input:focus, .is-success.textarea:focus, .is-success.is-focused.input, .is-success.is-focused.textarea, .is-success.input:active, .is-success.textarea:active, .is-success.is-active.input, .is-success.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(72, 199, 116, 0.25);\n}\n\n.is-warning.input, .is-warning.textarea {\n  border-color: #ffdd57;\n}\n\n.is-warning.input:focus, .is-warning.textarea:focus, .is-warning.is-focused.input, .is-warning.is-focused.textarea, .is-warning.input:active, .is-warning.textarea:active, .is-warning.is-active.input, .is-warning.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(255, 221, 87, 0.25);\n}\n\n.is-danger.input, .is-danger.textarea {\n  border-color: #f14668;\n}\n\n.is-danger.input:focus, .is-danger.textarea:focus, .is-danger.is-focused.input, .is-danger.is-focused.textarea, .is-danger.input:active, .is-danger.textarea:active, .is-danger.is-active.input, .is-danger.is-active.textarea {\n  box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);\n}\n\n.is-small.input, .is-small.textarea {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.is-medium.input, .is-medium.textarea {\n  font-size: 1.25rem;\n}\n\n.is-large.input, .is-large.textarea {\n  font-size: 1.5rem;\n}\n\n.is-fullwidth.input, .is-fullwidth.textarea {\n  display: block;\n  width: 100%;\n}\n\n.is-inline.input, .is-inline.textarea {\n  display: inline;\n  width: auto;\n}\n\n.input.is-rounded {\n  border-radius: 290486px;\n  padding-left: calc(calc(0.75em - 1px) + 0.375em);\n  padding-right: calc(calc(0.75em - 1px) + 0.375em);\n}\n\n.input.is-static {\n  background-color: transparent;\n  border-color: transparent;\n  box-shadow: none;\n  padding-left: 0;\n  padding-right: 0;\n}\n\n.textarea {\n  display: block;\n  max-width: 100%;\n  min-width: 100%;\n  padding: calc(0.75em - 1px);\n  resize: vertical;\n}\n\n.textarea:not([rows]) {\n  max-height: 40em;\n  min-height: 8em;\n}\n\n.textarea[rows] {\n  height: initial;\n}\n\n.textarea.has-fixed-size {\n  resize: none;\n}\n\n.checkbox, .radio {\n  cursor: pointer;\n  display: inline-block;\n  line-height: 1.25;\n  position: relative;\n}\n\n.checkbox input, .radio input {\n  cursor: pointer;\n}\n\n.checkbox:hover, .radio:hover {\n  color: #363636;\n}\n\n.checkbox[disabled], .radio[disabled],\nfieldset[disabled] .checkbox,\nfieldset[disabled] .radio {\n  color: #7a7a7a;\n  cursor: not-allowed;\n}\n\n.radio + .radio {\n  margin-left: 0.5em;\n}\n\n.select {\n  display: inline-block;\n  max-width: 100%;\n  position: relative;\n  vertical-align: top;\n}\n\n.select:not(.is-multiple) {\n  height: 2.5em;\n}\n\n.select:not(.is-multiple):not(.is-loading)::after {\n  border-color: #3273dc;\n  right: 1.125em;\n  z-index: 4;\n}\n\n.select.is-rounded select {\n  border-radius: 290486px;\n  padding-left: 1em;\n}\n\n.select select {\n  cursor: pointer;\n  display: block;\n  font-size: 1em;\n  max-width: 100%;\n  outline: none;\n}\n\n.select select::-ms-expand {\n  display: none;\n}\n\n.select select[disabled]:hover,\nfieldset[disabled] .select select:hover {\n  border-color: whitesmoke;\n}\n\n.select select:not([multiple]) {\n  padding-right: 2.5em;\n}\n\n.select select[multiple] {\n  height: auto;\n  padding: 0;\n}\n\n.select select[multiple] option {\n  padding: 0.5em 1em;\n}\n\n.select:not(.is-multiple):not(.is-loading):hover::after {\n  border-color: #363636;\n}\n\n.select.is-white:not(:hover)::after {\n  border-color: white;\n}\n\n.select.is-white select {\n  border-color: white;\n}\n\n.select.is-white select:hover, .select.is-white select.is-hovered {\n  border-color: #f2f2f2;\n}\n\n.select.is-white select:focus, .select.is-white select.is-focused, .select.is-white select:active, .select.is-white select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.25);\n}\n\n.select.is-black:not(:hover)::after {\n  border-color: #0a0a0a;\n}\n\n.select.is-black select {\n  border-color: #0a0a0a;\n}\n\n.select.is-black select:hover, .select.is-black select.is-hovered {\n  border-color: black;\n}\n\n.select.is-black select:focus, .select.is-black select.is-focused, .select.is-black select:active, .select.is-black select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(10, 10, 10, 0.25);\n}\n\n.select.is-light:not(:hover)::after {\n  border-color: whitesmoke;\n}\n\n.select.is-light select {\n  border-color: whitesmoke;\n}\n\n.select.is-light select:hover, .select.is-light select.is-hovered {\n  border-color: #e8e8e8;\n}\n\n.select.is-light select:focus, .select.is-light select.is-focused, .select.is-light select:active, .select.is-light select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(245, 245, 245, 0.25);\n}\n\n.select.is-dark:not(:hover)::after {\n  border-color: #363636;\n}\n\n.select.is-dark select {\n  border-color: #363636;\n}\n\n.select.is-dark select:hover, .select.is-dark select.is-hovered {\n  border-color: #292929;\n}\n\n.select.is-dark select:focus, .select.is-dark select.is-focused, .select.is-dark select:active, .select.is-dark select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(54, 54, 54, 0.25);\n}\n\n.select.is-primary:not(:hover)::after {\n  border-color: #00d1b2;\n}\n\n.select.is-primary select {\n  border-color: #00d1b2;\n}\n\n.select.is-primary select:hover, .select.is-primary select.is-hovered {\n  border-color: #00b89c;\n}\n\n.select.is-primary select:focus, .select.is-primary select.is-focused, .select.is-primary select:active, .select.is-primary select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);\n}\n\n.select.is-link:not(:hover)::after {\n  border-color: #3273dc;\n}\n\n.select.is-link select {\n  border-color: #3273dc;\n}\n\n.select.is-link select:hover, .select.is-link select.is-hovered {\n  border-color: #2366d1;\n}\n\n.select.is-link select:focus, .select.is-link select.is-focused, .select.is-link select:active, .select.is-link select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);\n}\n\n.select.is-info:not(:hover)::after {\n  border-color: #3298dc;\n}\n\n.select.is-info select {\n  border-color: #3298dc;\n}\n\n.select.is-info select:hover, .select.is-info select.is-hovered {\n  border-color: #238cd1;\n}\n\n.select.is-info select:focus, .select.is-info select.is-focused, .select.is-info select:active, .select.is-info select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(50, 152, 220, 0.25);\n}\n\n.select.is-success:not(:hover)::after {\n  border-color: #48c774;\n}\n\n.select.is-success select {\n  border-color: #48c774;\n}\n\n.select.is-success select:hover, .select.is-success select.is-hovered {\n  border-color: #3abb67;\n}\n\n.select.is-success select:focus, .select.is-success select.is-focused, .select.is-success select:active, .select.is-success select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(72, 199, 116, 0.25);\n}\n\n.select.is-warning:not(:hover)::after {\n  border-color: #ffdd57;\n}\n\n.select.is-warning select {\n  border-color: #ffdd57;\n}\n\n.select.is-warning select:hover, .select.is-warning select.is-hovered {\n  border-color: #ffd83d;\n}\n\n.select.is-warning select:focus, .select.is-warning select.is-focused, .select.is-warning select:active, .select.is-warning select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(255, 221, 87, 0.25);\n}\n\n.select.is-danger:not(:hover)::after {\n  border-color: #f14668;\n}\n\n.select.is-danger select {\n  border-color: #f14668;\n}\n\n.select.is-danger select:hover, .select.is-danger select.is-hovered {\n  border-color: #ef2e55;\n}\n\n.select.is-danger select:focus, .select.is-danger select.is-focused, .select.is-danger select:active, .select.is-danger select.is-active {\n  box-shadow: 0 0 0 0.125em rgba(241, 70, 104, 0.25);\n}\n\n.select.is-small {\n  border-radius: 2px;\n  font-size: 0.75rem;\n}\n\n.select.is-medium {\n  font-size: 1.25rem;\n}\n\n.select.is-large {\n  font-size: 1.5rem;\n}\n\n.select.is-disabled::after {\n  border-color: #7a7a7a;\n}\n\n.select.is-fullwidth {\n  width: 100%;\n}\n\n.select.is-fullwidth select {\n  width: 100%;\n}\n\n.select.is-loading::after {\n  margin-top: 0;\n  position: absolute;\n  right: 0.625em;\n  top: 0.625em;\n  transform: none;\n}\n\n.select.is-loading.is-small:after {\n  font-size: 0.75rem;\n}\n\n.select.is-loading.is-medium:after {\n  font-size: 1.25rem;\n}\n\n.select.is-loading.is-large:after {\n  font-size: 1.5rem;\n}\n\n.file {\n  align-items: stretch;\n  display: flex;\n  justify-content: flex-start;\n  position: relative;\n}\n\n.file.is-white .file-cta {\n  background-color: white;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.file.is-white:hover .file-cta, .file.is-white.is-hovered .file-cta {\n  background-color: #f9f9f9;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.file.is-white:focus .file-cta, .file.is-white.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(255, 255, 255, 0.25);\n  color: #0a0a0a;\n}\n\n.file.is-white:active .file-cta, .file.is-white.is-active .file-cta {\n  background-color: #f2f2f2;\n  border-color: transparent;\n  color: #0a0a0a;\n}\n\n.file.is-black .file-cta {\n  background-color: #0a0a0a;\n  border-color: transparent;\n  color: white;\n}\n\n.file.is-black:hover .file-cta, .file.is-black.is-hovered .file-cta {\n  background-color: #040404;\n  border-color: transparent;\n  color: white;\n}\n\n.file.is-black:focus .file-cta, .file.is-black.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(10, 10, 10, 0.25);\n  color: white;\n}\n\n.file.is-black:active .file-cta, .file.is-black.is-active .file-cta {\n  background-color: black;\n  border-color: transparent;\n  color: white;\n}\n\n.file.is-light .file-cta {\n  background-color: whitesmoke;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-light:hover .file-cta, .file.is-light.is-hovered .file-cta {\n  background-color: #eeeeee;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-light:focus .file-cta, .file.is-light.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(245, 245, 245, 0.25);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-light:active .file-cta, .file.is-light.is-active .file-cta {\n  background-color: #e8e8e8;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-dark .file-cta {\n  background-color: #363636;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-dark:hover .file-cta, .file.is-dark.is-hovered .file-cta {\n  background-color: #2f2f2f;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-dark:focus .file-cta, .file.is-dark.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(54, 54, 54, 0.25);\n  color: #fff;\n}\n\n.file.is-dark:active .file-cta, .file.is-dark.is-active .file-cta {\n  background-color: #292929;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-primary .file-cta {\n  background-color: #00d1b2;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-primary:hover .file-cta, .file.is-primary.is-hovered .file-cta {\n  background-color: #00c4a7;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-primary:focus .file-cta, .file.is-primary.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(0, 209, 178, 0.25);\n  color: #fff;\n}\n\n.file.is-primary:active .file-cta, .file.is-primary.is-active .file-cta {\n  background-color: #00b89c;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-link .file-cta {\n  background-color: #3273dc;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-link:hover .file-cta, .file.is-link.is-hovered .file-cta {\n  background-color: #276cda;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-link:focus .file-cta, .file.is-link.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(50, 115, 220, 0.25);\n  color: #fff;\n}\n\n.file.is-link:active .file-cta, .file.is-link.is-active .file-cta {\n  background-color: #2366d1;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-info .file-cta {\n  background-color: #3298dc;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-info:hover .file-cta, .file.is-info.is-hovered .file-cta {\n  background-color: #2793da;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-info:focus .file-cta, .file.is-info.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(50, 152, 220, 0.25);\n  color: #fff;\n}\n\n.file.is-info:active .file-cta, .file.is-info.is-active .file-cta {\n  background-color: #238cd1;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-success .file-cta {\n  background-color: #48c774;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-success:hover .file-cta, .file.is-success.is-hovered .file-cta {\n  background-color: #3ec46d;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-success:focus .file-cta, .file.is-success.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(72, 199, 116, 0.25);\n  color: #fff;\n}\n\n.file.is-success:active .file-cta, .file.is-success.is-active .file-cta {\n  background-color: #3abb67;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-warning .file-cta {\n  background-color: #ffdd57;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-warning:hover .file-cta, .file.is-warning.is-hovered .file-cta {\n  background-color: #ffdb4a;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-warning:focus .file-cta, .file.is-warning.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(255, 221, 87, 0.25);\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-warning:active .file-cta, .file.is-warning.is-active .file-cta {\n  background-color: #ffd83d;\n  border-color: transparent;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.file.is-danger .file-cta {\n  background-color: #f14668;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-danger:hover .file-cta, .file.is-danger.is-hovered .file-cta {\n  background-color: #f03a5f;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-danger:focus .file-cta, .file.is-danger.is-focused .file-cta {\n  border-color: transparent;\n  box-shadow: 0 0 0.5em rgba(241, 70, 104, 0.25);\n  color: #fff;\n}\n\n.file.is-danger:active .file-cta, .file.is-danger.is-active .file-cta {\n  background-color: #ef2e55;\n  border-color: transparent;\n  color: #fff;\n}\n\n.file.is-small {\n  font-size: 0.75rem;\n}\n\n.file.is-medium {\n  font-size: 1.25rem;\n}\n\n.file.is-medium .file-icon .fa {\n  font-size: 21px;\n}\n\n.file.is-large {\n  font-size: 1.5rem;\n}\n\n.file.is-large .file-icon .fa {\n  font-size: 28px;\n}\n\n.file.has-name .file-cta {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.file.has-name .file-name {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.file.has-name.is-empty .file-cta {\n  border-radius: 4px;\n}\n\n.file.has-name.is-empty .file-name {\n  display: none;\n}\n\n.file.is-boxed .file-label {\n  flex-direction: column;\n}\n\n.file.is-boxed .file-cta {\n  flex-direction: column;\n  height: auto;\n  padding: 1em 3em;\n}\n\n.file.is-boxed .file-name {\n  border-width: 0 1px 1px;\n}\n\n.file.is-boxed .file-icon {\n  height: 1.5em;\n  width: 1.5em;\n}\n\n.file.is-boxed .file-icon .fa {\n  font-size: 21px;\n}\n\n.file.is-boxed.is-small .file-icon .fa {\n  font-size: 14px;\n}\n\n.file.is-boxed.is-medium .file-icon .fa {\n  font-size: 28px;\n}\n\n.file.is-boxed.is-large .file-icon .fa {\n  font-size: 35px;\n}\n\n.file.is-boxed.has-name .file-cta {\n  border-radius: 4px 4px 0 0;\n}\n\n.file.is-boxed.has-name .file-name {\n  border-radius: 0 0 4px 4px;\n  border-width: 0 1px 1px;\n}\n\n.file.is-centered {\n  justify-content: center;\n}\n\n.file.is-fullwidth .file-label {\n  width: 100%;\n}\n\n.file.is-fullwidth .file-name {\n  flex-grow: 1;\n  max-width: none;\n}\n\n.file.is-right {\n  justify-content: flex-end;\n}\n\n.file.is-right .file-cta {\n  border-radius: 0 4px 4px 0;\n}\n\n.file.is-right .file-name {\n  border-radius: 4px 0 0 4px;\n  border-width: 1px 0 1px 1px;\n  order: -1;\n}\n\n.file-label {\n  align-items: stretch;\n  display: flex;\n  cursor: pointer;\n  justify-content: flex-start;\n  overflow: hidden;\n  position: relative;\n}\n\n.file-label:hover .file-cta {\n  background-color: #eeeeee;\n  color: #363636;\n}\n\n.file-label:hover .file-name {\n  border-color: #d5d5d5;\n}\n\n.file-label:active .file-cta {\n  background-color: #e8e8e8;\n  color: #363636;\n}\n\n.file-label:active .file-name {\n  border-color: #cfcfcf;\n}\n\n.file-input {\n  height: 100%;\n  left: 0;\n  opacity: 0;\n  outline: none;\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n\n.file-cta,\n.file-name {\n  border-color: #dbdbdb;\n  border-radius: 4px;\n  font-size: 1em;\n  padding-left: 1em;\n  padding-right: 1em;\n  white-space: nowrap;\n}\n\n.file-cta {\n  background-color: whitesmoke;\n  color: #4a4a4a;\n}\n\n.file-name {\n  border-color: #dbdbdb;\n  border-style: solid;\n  border-width: 1px 1px 1px 0;\n  display: block;\n  max-width: 16em;\n  overflow: hidden;\n  text-align: left;\n  text-overflow: ellipsis;\n}\n\n.file-icon {\n  align-items: center;\n  display: flex;\n  height: 1em;\n  justify-content: center;\n  margin-right: 0.5em;\n  width: 1em;\n}\n\n.file-icon .fa {\n  font-size: 14px;\n}\n\n.label {\n  color: #363636;\n  display: block;\n  font-size: 1rem;\n  font-weight: 700;\n}\n\n.label:not(:last-child) {\n  margin-bottom: 0.5em;\n}\n\n.label.is-small {\n  font-size: 0.75rem;\n}\n\n.label.is-medium {\n  font-size: 1.25rem;\n}\n\n.label.is-large {\n  font-size: 1.5rem;\n}\n\n.help {\n  display: block;\n  font-size: 0.75rem;\n  margin-top: 0.25rem;\n}\n\n.help.is-white {\n  color: white;\n}\n\n.help.is-black {\n  color: #0a0a0a;\n}\n\n.help.is-light {\n  color: whitesmoke;\n}\n\n.help.is-dark {\n  color: #363636;\n}\n\n.help.is-primary {\n  color: #00d1b2;\n}\n\n.help.is-link {\n  color: #3273dc;\n}\n\n.help.is-info {\n  color: #3298dc;\n}\n\n.help.is-success {\n  color: #48c774;\n}\n\n.help.is-warning {\n  color: #ffdd57;\n}\n\n.help.is-danger {\n  color: #f14668;\n}\n\n.field:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.field.has-addons {\n  display: flex;\n  justify-content: flex-start;\n}\n\n.field.has-addons .control:not(:last-child) {\n  margin-right: -1px;\n}\n\n.field.has-addons .control:not(:first-child):not(:last-child) .button,\n.field.has-addons .control:not(:first-child):not(:last-child) .input,\n.field.has-addons .control:not(:first-child):not(:last-child) .select select {\n  border-radius: 0;\n}\n\n.field.has-addons .control:first-child:not(:only-child) .button,\n.field.has-addons .control:first-child:not(:only-child) .input,\n.field.has-addons .control:first-child:not(:only-child) .select select {\n  border-bottom-right-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.field.has-addons .control:last-child:not(:only-child) .button,\n.field.has-addons .control:last-child:not(:only-child) .input,\n.field.has-addons .control:last-child:not(:only-child) .select select {\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n}\n\n.field.has-addons .control .button:not([disabled]):hover, .field.has-addons .control .button:not([disabled]).is-hovered,\n.field.has-addons .control .input:not([disabled]):hover,\n.field.has-addons .control .input:not([disabled]).is-hovered,\n.field.has-addons .control .select select:not([disabled]):hover,\n.field.has-addons .control .select select:not([disabled]).is-hovered {\n  z-index: 2;\n}\n\n.field.has-addons .control .button:not([disabled]):focus, .field.has-addons .control .button:not([disabled]).is-focused, .field.has-addons .control .button:not([disabled]):active, .field.has-addons .control .button:not([disabled]).is-active,\n.field.has-addons .control .input:not([disabled]):focus,\n.field.has-addons .control .input:not([disabled]).is-focused,\n.field.has-addons .control .input:not([disabled]):active,\n.field.has-addons .control .input:not([disabled]).is-active,\n.field.has-addons .control .select select:not([disabled]):focus,\n.field.has-addons .control .select select:not([disabled]).is-focused,\n.field.has-addons .control .select select:not([disabled]):active,\n.field.has-addons .control .select select:not([disabled]).is-active {\n  z-index: 3;\n}\n\n.field.has-addons .control .button:not([disabled]):focus:hover, .field.has-addons .control .button:not([disabled]).is-focused:hover, .field.has-addons .control .button:not([disabled]):active:hover, .field.has-addons .control .button:not([disabled]).is-active:hover,\n.field.has-addons .control .input:not([disabled]):focus:hover,\n.field.has-addons .control .input:not([disabled]).is-focused:hover,\n.field.has-addons .control .input:not([disabled]):active:hover,\n.field.has-addons .control .input:not([disabled]).is-active:hover,\n.field.has-addons .control .select select:not([disabled]):focus:hover,\n.field.has-addons .control .select select:not([disabled]).is-focused:hover,\n.field.has-addons .control .select select:not([disabled]):active:hover,\n.field.has-addons .control .select select:not([disabled]).is-active:hover {\n  z-index: 4;\n}\n\n.field.has-addons .control.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.field.has-addons.has-addons-centered {\n  justify-content: center;\n}\n\n.field.has-addons.has-addons-right {\n  justify-content: flex-end;\n}\n\n.field.has-addons.has-addons-fullwidth .control {\n  flex-grow: 1;\n  flex-shrink: 0;\n}\n\n.field.is-grouped {\n  display: flex;\n  justify-content: flex-start;\n}\n\n.field.is-grouped > .control {\n  flex-shrink: 0;\n}\n\n.field.is-grouped > .control:not(:last-child) {\n  margin-bottom: 0;\n  margin-right: 0.75rem;\n}\n\n.field.is-grouped > .control.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.field.is-grouped.is-grouped-centered {\n  justify-content: center;\n}\n\n.field.is-grouped.is-grouped-right {\n  justify-content: flex-end;\n}\n\n.field.is-grouped.is-grouped-multiline {\n  flex-wrap: wrap;\n}\n\n.field.is-grouped.is-grouped-multiline > .control:last-child, .field.is-grouped.is-grouped-multiline > .control:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.field.is-grouped.is-grouped-multiline:last-child {\n  margin-bottom: -0.75rem;\n}\n\n.field.is-grouped.is-grouped-multiline:not(:last-child) {\n  margin-bottom: 0;\n}\n\n@media screen and (min-width: 769px), print {\n  .field.is-horizontal {\n    display: flex;\n  }\n}\n\n.field-label .label {\n  font-size: inherit;\n}\n\n@media screen and (max-width: 768px) {\n  .field-label {\n    margin-bottom: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .field-label {\n    flex-basis: 0;\n    flex-grow: 1;\n    flex-shrink: 0;\n    margin-right: 1.5rem;\n    text-align: right;\n  }\n  .field-label.is-small {\n    font-size: 0.75rem;\n    padding-top: 0.375em;\n  }\n  .field-label.is-normal {\n    padding-top: 0.375em;\n  }\n  .field-label.is-medium {\n    font-size: 1.25rem;\n    padding-top: 0.375em;\n  }\n  .field-label.is-large {\n    font-size: 1.5rem;\n    padding-top: 0.375em;\n  }\n}\n\n.field-body .field .field {\n  margin-bottom: 0;\n}\n\n@media screen and (min-width: 769px), print {\n  .field-body {\n    display: flex;\n    flex-basis: 0;\n    flex-grow: 5;\n    flex-shrink: 1;\n  }\n  .field-body .field {\n    margin-bottom: 0;\n  }\n  .field-body > .field {\n    flex-shrink: 1;\n  }\n  .field-body > .field:not(.is-narrow) {\n    flex-grow: 1;\n  }\n  .field-body > .field:not(:last-child) {\n    margin-right: 0.75rem;\n  }\n}\n\n.control {\n  box-sizing: border-box;\n  clear: both;\n  font-size: 1rem;\n  position: relative;\n  text-align: left;\n}\n\n.control.has-icons-left .input:focus ~ .icon,\n.control.has-icons-left .select:focus ~ .icon, .control.has-icons-right .input:focus ~ .icon,\n.control.has-icons-right .select:focus ~ .icon {\n  color: #4a4a4a;\n}\n\n.control.has-icons-left .input.is-small ~ .icon,\n.control.has-icons-left .select.is-small ~ .icon, .control.has-icons-right .input.is-small ~ .icon,\n.control.has-icons-right .select.is-small ~ .icon {\n  font-size: 0.75rem;\n}\n\n.control.has-icons-left .input.is-medium ~ .icon,\n.control.has-icons-left .select.is-medium ~ .icon, .control.has-icons-right .input.is-medium ~ .icon,\n.control.has-icons-right .select.is-medium ~ .icon {\n  font-size: 1.25rem;\n}\n\n.control.has-icons-left .input.is-large ~ .icon,\n.control.has-icons-left .select.is-large ~ .icon, .control.has-icons-right .input.is-large ~ .icon,\n.control.has-icons-right .select.is-large ~ .icon {\n  font-size: 1.5rem;\n}\n\n.control.has-icons-left .icon, .control.has-icons-right .icon {\n  color: #dbdbdb;\n  height: 2.5em;\n  pointer-events: none;\n  position: absolute;\n  top: 0;\n  width: 2.5em;\n  z-index: 4;\n}\n\n.control.has-icons-left .input,\n.control.has-icons-left .select select {\n  padding-left: 2.5em;\n}\n\n.control.has-icons-left .icon.is-left {\n  left: 0;\n}\n\n.control.has-icons-right .input,\n.control.has-icons-right .select select {\n  padding-right: 2.5em;\n}\n\n.control.has-icons-right .icon.is-right {\n  right: 0;\n}\n\n.control.is-loading::after {\n  position: absolute !important;\n  right: 0.625em;\n  top: 0.625em;\n  z-index: 4;\n}\n\n.control.is-loading.is-small:after {\n  font-size: 0.75rem;\n}\n\n.control.is-loading.is-medium:after {\n  font-size: 1.25rem;\n}\n\n.control.is-loading.is-large:after {\n  font-size: 1.5rem;\n}\n\n.breadcrumb {\n  font-size: 1rem;\n  white-space: nowrap;\n}\n\n.breadcrumb a {\n  align-items: center;\n  color: #3273dc;\n  display: flex;\n  justify-content: center;\n  padding: 0 0.75em;\n}\n\n.breadcrumb a:hover {\n  color: #363636;\n}\n\n.breadcrumb li {\n  align-items: center;\n  display: flex;\n}\n\n.breadcrumb li:first-child a {\n  padding-left: 0;\n}\n\n.breadcrumb li.is-active a {\n  color: #363636;\n  cursor: default;\n  pointer-events: none;\n}\n\n.breadcrumb li + li::before {\n  color: #b5b5b5;\n  content: \"\\0002f\";\n}\n\n.breadcrumb ul,\n.breadcrumb ol {\n  align-items: flex-start;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-start;\n}\n\n.breadcrumb .icon:first-child {\n  margin-right: 0.5em;\n}\n\n.breadcrumb .icon:last-child {\n  margin-left: 0.5em;\n}\n\n.breadcrumb.is-centered ol,\n.breadcrumb.is-centered ul {\n  justify-content: center;\n}\n\n.breadcrumb.is-right ol,\n.breadcrumb.is-right ul {\n  justify-content: flex-end;\n}\n\n.breadcrumb.is-small {\n  font-size: 0.75rem;\n}\n\n.breadcrumb.is-medium {\n  font-size: 1.25rem;\n}\n\n.breadcrumb.is-large {\n  font-size: 1.5rem;\n}\n\n.breadcrumb.has-arrow-separator li + li::before {\n  content: \"\\02192\";\n}\n\n.breadcrumb.has-bullet-separator li + li::before {\n  content: \"\\02022\";\n}\n\n.breadcrumb.has-dot-separator li + li::before {\n  content: \"\\000b7\";\n}\n\n.breadcrumb.has-succeeds-separator li + li::before {\n  content: \"\\0227B\";\n}\n\n.card {\n  background-color: white;\n  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);\n  color: #4a4a4a;\n  max-width: 100%;\n  position: relative;\n}\n\n.card-header {\n  background-color: transparent;\n  align-items: stretch;\n  box-shadow: 0 0.125em 0.25em rgba(10, 10, 10, 0.1);\n  display: flex;\n}\n\n.card-header-title {\n  align-items: center;\n  color: #363636;\n  display: flex;\n  flex-grow: 1;\n  font-weight: 700;\n  padding: 0.75rem 1rem;\n}\n\n.card-header-title.is-centered {\n  justify-content: center;\n}\n\n.card-header-icon {\n  align-items: center;\n  cursor: pointer;\n  display: flex;\n  justify-content: center;\n  padding: 0.75rem 1rem;\n}\n\n.card-image {\n  display: block;\n  position: relative;\n}\n\n.card-content {\n  background-color: transparent;\n  padding: 1.5rem;\n}\n\n.card-footer {\n  background-color: transparent;\n  border-top: 1px solid #ededed;\n  align-items: stretch;\n  display: flex;\n}\n\n.card-footer-item {\n  align-items: center;\n  display: flex;\n  flex-basis: 0;\n  flex-grow: 1;\n  flex-shrink: 0;\n  justify-content: center;\n  padding: 0.75rem;\n}\n\n.card-footer-item:not(:last-child) {\n  border-right: 1px solid #ededed;\n}\n\n.card .media:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.dropdown {\n  display: inline-flex;\n  position: relative;\n  vertical-align: top;\n}\n\n.dropdown.is-active .dropdown-menu, .dropdown.is-hoverable:hover .dropdown-menu {\n  display: block;\n}\n\n.dropdown.is-right .dropdown-menu {\n  left: auto;\n  right: 0;\n}\n\n.dropdown.is-up .dropdown-menu {\n  bottom: 100%;\n  padding-bottom: 4px;\n  padding-top: initial;\n  top: auto;\n}\n\n.dropdown-menu {\n  display: none;\n  left: 0;\n  min-width: 12rem;\n  padding-top: 4px;\n  position: absolute;\n  top: 100%;\n  z-index: 20;\n}\n\n.dropdown-content {\n  background-color: white;\n  border-radius: 4px;\n  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);\n  padding-bottom: 0.5rem;\n  padding-top: 0.5rem;\n}\n\n.dropdown-item {\n  color: #4a4a4a;\n  display: block;\n  font-size: 0.875rem;\n  line-height: 1.5;\n  padding: 0.375rem 1rem;\n  position: relative;\n}\n\na.dropdown-item,\nbutton.dropdown-item {\n  padding-right: 3rem;\n  text-align: left;\n  white-space: nowrap;\n  width: 100%;\n}\n\na.dropdown-item:hover,\nbutton.dropdown-item:hover {\n  background-color: whitesmoke;\n  color: #0a0a0a;\n}\n\na.dropdown-item.is-active,\nbutton.dropdown-item.is-active {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.dropdown-divider {\n  background-color: #ededed;\n  border: none;\n  display: block;\n  height: 1px;\n  margin: 0.5rem 0;\n}\n\n.level {\n  align-items: center;\n  justify-content: space-between;\n}\n\n.level code {\n  border-radius: 4px;\n}\n\n.level img {\n  display: inline-block;\n  vertical-align: top;\n}\n\n.level.is-mobile {\n  display: flex;\n}\n\n.level.is-mobile .level-left,\n.level.is-mobile .level-right {\n  display: flex;\n}\n\n.level.is-mobile .level-left + .level-right {\n  margin-top: 0;\n}\n\n.level.is-mobile .level-item:not(:last-child) {\n  margin-bottom: 0;\n  margin-right: 0.75rem;\n}\n\n.level.is-mobile .level-item:not(.is-narrow) {\n  flex-grow: 1;\n}\n\n@media screen and (min-width: 769px), print {\n  .level {\n    display: flex;\n  }\n  .level > .level-item:not(.is-narrow) {\n    flex-grow: 1;\n  }\n}\n\n.level-item {\n  align-items: center;\n  display: flex;\n  flex-basis: auto;\n  flex-grow: 0;\n  flex-shrink: 0;\n  justify-content: center;\n}\n\n.level-item .title,\n.level-item .subtitle {\n  margin-bottom: 0;\n}\n\n@media screen and (max-width: 768px) {\n  .level-item:not(:last-child) {\n    margin-bottom: 0.75rem;\n  }\n}\n\n.level-left,\n.level-right {\n  flex-basis: auto;\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.level-left .level-item.is-flexible,\n.level-right .level-item.is-flexible {\n  flex-grow: 1;\n}\n\n@media screen and (min-width: 769px), print {\n  .level-left .level-item:not(:last-child),\n  .level-right .level-item:not(:last-child) {\n    margin-right: 0.75rem;\n  }\n}\n\n.level-left {\n  align-items: center;\n  justify-content: flex-start;\n}\n\n@media screen and (max-width: 768px) {\n  .level-left + .level-right {\n    margin-top: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .level-left {\n    display: flex;\n  }\n}\n\n.level-right {\n  align-items: center;\n  justify-content: flex-end;\n}\n\n@media screen and (min-width: 769px), print {\n  .level-right {\n    display: flex;\n  }\n}\n\n.list {\n  background-color: white;\n  border-radius: 4px;\n  box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n}\n\n.list-item {\n  display: block;\n  padding: 0.5em 1em;\n}\n\n.list-item:not(a) {\n  color: #4a4a4a;\n}\n\n.list-item:first-child {\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n}\n\n.list-item:last-child {\n  border-bottom-left-radius: 4px;\n  border-bottom-right-radius: 4px;\n}\n\n.list-item:not(:last-child) {\n  border-bottom: 1px solid #dbdbdb;\n}\n\n.list-item.is-active {\n  background-color: #3273dc;\n  color: #fff;\n}\n\na.list-item {\n  background-color: whitesmoke;\n  cursor: pointer;\n}\n\n.media {\n  align-items: flex-start;\n  display: flex;\n  text-align: left;\n}\n\n.media .content:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.media .media {\n  border-top: 1px solid rgba(219, 219, 219, 0.5);\n  display: flex;\n  padding-top: 0.75rem;\n}\n\n.media .media .content:not(:last-child),\n.media .media .control:not(:last-child) {\n  margin-bottom: 0.5rem;\n}\n\n.media .media .media {\n  padding-top: 0.5rem;\n}\n\n.media .media .media + .media {\n  margin-top: 0.5rem;\n}\n\n.media + .media {\n  border-top: 1px solid rgba(219, 219, 219, 0.5);\n  margin-top: 1rem;\n  padding-top: 1rem;\n}\n\n.media.is-large + .media {\n  margin-top: 1.5rem;\n  padding-top: 1.5rem;\n}\n\n.media-left,\n.media-right {\n  flex-basis: auto;\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.media-left {\n  margin-right: 1rem;\n}\n\n.media-right {\n  margin-left: 1rem;\n}\n\n.media-content {\n  flex-basis: auto;\n  flex-grow: 1;\n  flex-shrink: 1;\n  text-align: left;\n}\n\n@media screen and (max-width: 768px) {\n  .media-content {\n    overflow-x: auto;\n  }\n}\n\n.menu {\n  font-size: 1rem;\n}\n\n.menu.is-small {\n  font-size: 0.75rem;\n}\n\n.menu.is-medium {\n  font-size: 1.25rem;\n}\n\n.menu.is-large {\n  font-size: 1.5rem;\n}\n\n.menu-list {\n  line-height: 1.25;\n}\n\n.menu-list a {\n  border-radius: 2px;\n  color: #4a4a4a;\n  display: block;\n  padding: 0.5em 0.75em;\n}\n\n.menu-list a:hover {\n  background-color: whitesmoke;\n  color: #363636;\n}\n\n.menu-list a.is-active {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.menu-list li ul {\n  border-left: 1px solid #dbdbdb;\n  margin: 0.75em;\n  padding-left: 0.75em;\n}\n\n.menu-label {\n  color: #7a7a7a;\n  font-size: 0.75em;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.menu-label:not(:first-child) {\n  margin-top: 1em;\n}\n\n.menu-label:not(:last-child) {\n  margin-bottom: 1em;\n}\n\n.message {\n  background-color: whitesmoke;\n  border-radius: 4px;\n  font-size: 1rem;\n}\n\n.message strong {\n  color: currentColor;\n}\n\n.message a:not(.button):not(.tag):not(.dropdown-item) {\n  color: currentColor;\n  text-decoration: underline;\n}\n\n.message.is-small {\n  font-size: 0.75rem;\n}\n\n.message.is-medium {\n  font-size: 1.25rem;\n}\n\n.message.is-large {\n  font-size: 1.5rem;\n}\n\n.message.is-white {\n  background-color: white;\n}\n\n.message.is-white .message-header {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.message.is-white .message-body {\n  border-color: white;\n}\n\n.message.is-black {\n  background-color: #fafafa;\n}\n\n.message.is-black .message-header {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.message.is-black .message-body {\n  border-color: #0a0a0a;\n}\n\n.message.is-light {\n  background-color: #fafafa;\n}\n\n.message.is-light .message-header {\n  background-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.message.is-light .message-body {\n  border-color: whitesmoke;\n}\n\n.message.is-dark {\n  background-color: #fafafa;\n}\n\n.message.is-dark .message-header {\n  background-color: #363636;\n  color: #fff;\n}\n\n.message.is-dark .message-body {\n  border-color: #363636;\n}\n\n.message.is-primary {\n  background-color: #ebfffc;\n}\n\n.message.is-primary .message-header {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.message.is-primary .message-body {\n  border-color: #00d1b2;\n  color: #00947e;\n}\n\n.message.is-link {\n  background-color: #eef3fc;\n}\n\n.message.is-link .message-header {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.message.is-link .message-body {\n  border-color: #3273dc;\n  color: #2160c4;\n}\n\n.message.is-info {\n  background-color: #eef6fc;\n}\n\n.message.is-info .message-header {\n  background-color: #3298dc;\n  color: #fff;\n}\n\n.message.is-info .message-body {\n  border-color: #3298dc;\n  color: #1d72aa;\n}\n\n.message.is-success {\n  background-color: #effaf3;\n}\n\n.message.is-success .message-header {\n  background-color: #48c774;\n  color: #fff;\n}\n\n.message.is-success .message-body {\n  border-color: #48c774;\n  color: #257942;\n}\n\n.message.is-warning {\n  background-color: #fffbeb;\n}\n\n.message.is-warning .message-header {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.message.is-warning .message-body {\n  border-color: #ffdd57;\n  color: #947600;\n}\n\n.message.is-danger {\n  background-color: #feecf0;\n}\n\n.message.is-danger .message-header {\n  background-color: #f14668;\n  color: #fff;\n}\n\n.message.is-danger .message-body {\n  border-color: #f14668;\n  color: #cc0f35;\n}\n\n.message-header {\n  align-items: center;\n  background-color: #4a4a4a;\n  border-radius: 4px 4px 0 0;\n  color: #fff;\n  display: flex;\n  font-weight: 700;\n  justify-content: space-between;\n  line-height: 1.25;\n  padding: 0.75em 1em;\n  position: relative;\n}\n\n.message-header .delete {\n  flex-grow: 0;\n  flex-shrink: 0;\n  margin-left: 0.75em;\n}\n\n.message-header + .message-body {\n  border-width: 0;\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n\n.message-body {\n  border-color: #dbdbdb;\n  border-radius: 4px;\n  border-style: solid;\n  border-width: 0 0 0 4px;\n  color: #4a4a4a;\n  padding: 1.25em 1.5em;\n}\n\n.message-body code,\n.message-body pre {\n  background-color: white;\n}\n\n.message-body pre code {\n  background-color: transparent;\n}\n\n.modal {\n  align-items: center;\n  display: none;\n  flex-direction: column;\n  justify-content: center;\n  overflow: hidden;\n  position: fixed;\n  z-index: 40;\n}\n\n.modal.is-active {\n  display: flex;\n}\n\n.modal-background {\n  background-color: rgba(10, 10, 10, 0.86);\n}\n\n.modal-content,\n.modal-card {\n  margin: 0 20px;\n  max-height: calc(100vh - 160px);\n  overflow: auto;\n  position: relative;\n  width: 100%;\n}\n\n@media screen and (min-width: 769px), print {\n  .modal-content,\n  .modal-card {\n    margin: 0 auto;\n    max-height: calc(100vh - 40px);\n    width: 640px;\n  }\n}\n\n.modal-close {\n  background: none;\n  height: 40px;\n  position: fixed;\n  right: 20px;\n  top: 20px;\n  width: 40px;\n}\n\n.modal-card {\n  display: flex;\n  flex-direction: column;\n  max-height: calc(100vh - 40px);\n  overflow: hidden;\n  -ms-overflow-y: visible;\n}\n\n.modal-card-head,\n.modal-card-foot {\n  align-items: center;\n  background-color: whitesmoke;\n  display: flex;\n  flex-shrink: 0;\n  justify-content: flex-start;\n  padding: 20px;\n  position: relative;\n}\n\n.modal-card-head {\n  border-bottom: 1px solid #dbdbdb;\n  border-top-left-radius: 6px;\n  border-top-right-radius: 6px;\n}\n\n.modal-card-title {\n  color: #363636;\n  flex-grow: 1;\n  flex-shrink: 0;\n  font-size: 1.5rem;\n  line-height: 1;\n}\n\n.modal-card-foot {\n  border-bottom-left-radius: 6px;\n  border-bottom-right-radius: 6px;\n  border-top: 1px solid #dbdbdb;\n}\n\n.modal-card-foot .button:not(:last-child) {\n  margin-right: 0.5em;\n}\n\n.modal-card-body {\n  -webkit-overflow-scrolling: touch;\n  background-color: white;\n  flex-grow: 1;\n  flex-shrink: 1;\n  overflow: auto;\n  padding: 20px;\n}\n\n.navbar {\n  background-color: white;\n  min-height: 3.25rem;\n  position: relative;\n  z-index: 30;\n}\n\n.navbar.is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.navbar.is-white .navbar-brand > .navbar-item,\n.navbar.is-white .navbar-brand .navbar-link {\n  color: #0a0a0a;\n}\n\n.navbar.is-white .navbar-brand > a.navbar-item:focus, .navbar.is-white .navbar-brand > a.navbar-item:hover, .navbar.is-white .navbar-brand > a.navbar-item.is-active,\n.navbar.is-white .navbar-brand .navbar-link:focus,\n.navbar.is-white .navbar-brand .navbar-link:hover,\n.navbar.is-white .navbar-brand .navbar-link.is-active {\n  background-color: #f2f2f2;\n  color: #0a0a0a;\n}\n\n.navbar.is-white .navbar-brand .navbar-link::after {\n  border-color: #0a0a0a;\n}\n\n.navbar.is-white .navbar-burger {\n  color: #0a0a0a;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-white .navbar-start > .navbar-item,\n  .navbar.is-white .navbar-start .navbar-link,\n  .navbar.is-white .navbar-end > .navbar-item,\n  .navbar.is-white .navbar-end .navbar-link {\n    color: #0a0a0a;\n  }\n  .navbar.is-white .navbar-start > a.navbar-item:focus, .navbar.is-white .navbar-start > a.navbar-item:hover, .navbar.is-white .navbar-start > a.navbar-item.is-active,\n  .navbar.is-white .navbar-start .navbar-link:focus,\n  .navbar.is-white .navbar-start .navbar-link:hover,\n  .navbar.is-white .navbar-start .navbar-link.is-active,\n  .navbar.is-white .navbar-end > a.navbar-item:focus,\n  .navbar.is-white .navbar-end > a.navbar-item:hover,\n  .navbar.is-white .navbar-end > a.navbar-item.is-active,\n  .navbar.is-white .navbar-end .navbar-link:focus,\n  .navbar.is-white .navbar-end .navbar-link:hover,\n  .navbar.is-white .navbar-end .navbar-link.is-active {\n    background-color: #f2f2f2;\n    color: #0a0a0a;\n  }\n  .navbar.is-white .navbar-start .navbar-link::after,\n  .navbar.is-white .navbar-end .navbar-link::after {\n    border-color: #0a0a0a;\n  }\n  .navbar.is-white .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-white .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-white .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #f2f2f2;\n    color: #0a0a0a;\n  }\n  .navbar.is-white .navbar-dropdown a.navbar-item.is-active {\n    background-color: white;\n    color: #0a0a0a;\n  }\n}\n\n.navbar.is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.navbar.is-black .navbar-brand > .navbar-item,\n.navbar.is-black .navbar-brand .navbar-link {\n  color: white;\n}\n\n.navbar.is-black .navbar-brand > a.navbar-item:focus, .navbar.is-black .navbar-brand > a.navbar-item:hover, .navbar.is-black .navbar-brand > a.navbar-item.is-active,\n.navbar.is-black .navbar-brand .navbar-link:focus,\n.navbar.is-black .navbar-brand .navbar-link:hover,\n.navbar.is-black .navbar-brand .navbar-link.is-active {\n  background-color: black;\n  color: white;\n}\n\n.navbar.is-black .navbar-brand .navbar-link::after {\n  border-color: white;\n}\n\n.navbar.is-black .navbar-burger {\n  color: white;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-black .navbar-start > .navbar-item,\n  .navbar.is-black .navbar-start .navbar-link,\n  .navbar.is-black .navbar-end > .navbar-item,\n  .navbar.is-black .navbar-end .navbar-link {\n    color: white;\n  }\n  .navbar.is-black .navbar-start > a.navbar-item:focus, .navbar.is-black .navbar-start > a.navbar-item:hover, .navbar.is-black .navbar-start > a.navbar-item.is-active,\n  .navbar.is-black .navbar-start .navbar-link:focus,\n  .navbar.is-black .navbar-start .navbar-link:hover,\n  .navbar.is-black .navbar-start .navbar-link.is-active,\n  .navbar.is-black .navbar-end > a.navbar-item:focus,\n  .navbar.is-black .navbar-end > a.navbar-item:hover,\n  .navbar.is-black .navbar-end > a.navbar-item.is-active,\n  .navbar.is-black .navbar-end .navbar-link:focus,\n  .navbar.is-black .navbar-end .navbar-link:hover,\n  .navbar.is-black .navbar-end .navbar-link.is-active {\n    background-color: black;\n    color: white;\n  }\n  .navbar.is-black .navbar-start .navbar-link::after,\n  .navbar.is-black .navbar-end .navbar-link::after {\n    border-color: white;\n  }\n  .navbar.is-black .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-black .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-black .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: black;\n    color: white;\n  }\n  .navbar.is-black .navbar-dropdown a.navbar-item.is-active {\n    background-color: #0a0a0a;\n    color: white;\n  }\n}\n\n.navbar.is-light {\n  background-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-light .navbar-brand > .navbar-item,\n.navbar.is-light .navbar-brand .navbar-link {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-light .navbar-brand > a.navbar-item:focus, .navbar.is-light .navbar-brand > a.navbar-item:hover, .navbar.is-light .navbar-brand > a.navbar-item.is-active,\n.navbar.is-light .navbar-brand .navbar-link:focus,\n.navbar.is-light .navbar-brand .navbar-link:hover,\n.navbar.is-light .navbar-brand .navbar-link.is-active {\n  background-color: #e8e8e8;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-light .navbar-brand .navbar-link::after {\n  border-color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-light .navbar-burger {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-light .navbar-start > .navbar-item,\n  .navbar.is-light .navbar-start .navbar-link,\n  .navbar.is-light .navbar-end > .navbar-item,\n  .navbar.is-light .navbar-end .navbar-link {\n    color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-light .navbar-start > a.navbar-item:focus, .navbar.is-light .navbar-start > a.navbar-item:hover, .navbar.is-light .navbar-start > a.navbar-item.is-active,\n  .navbar.is-light .navbar-start .navbar-link:focus,\n  .navbar.is-light .navbar-start .navbar-link:hover,\n  .navbar.is-light .navbar-start .navbar-link.is-active,\n  .navbar.is-light .navbar-end > a.navbar-item:focus,\n  .navbar.is-light .navbar-end > a.navbar-item:hover,\n  .navbar.is-light .navbar-end > a.navbar-item.is-active,\n  .navbar.is-light .navbar-end .navbar-link:focus,\n  .navbar.is-light .navbar-end .navbar-link:hover,\n  .navbar.is-light .navbar-end .navbar-link.is-active {\n    background-color: #e8e8e8;\n    color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-light .navbar-start .navbar-link::after,\n  .navbar.is-light .navbar-end .navbar-link::after {\n    border-color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-light .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-light .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-light .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #e8e8e8;\n    color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-light .navbar-dropdown a.navbar-item.is-active {\n    background-color: whitesmoke;\n    color: rgba(0, 0, 0, 0.7);\n  }\n}\n\n.navbar.is-dark {\n  background-color: #363636;\n  color: #fff;\n}\n\n.navbar.is-dark .navbar-brand > .navbar-item,\n.navbar.is-dark .navbar-brand .navbar-link {\n  color: #fff;\n}\n\n.navbar.is-dark .navbar-brand > a.navbar-item:focus, .navbar.is-dark .navbar-brand > a.navbar-item:hover, .navbar.is-dark .navbar-brand > a.navbar-item.is-active,\n.navbar.is-dark .navbar-brand .navbar-link:focus,\n.navbar.is-dark .navbar-brand .navbar-link:hover,\n.navbar.is-dark .navbar-brand .navbar-link.is-active {\n  background-color: #292929;\n  color: #fff;\n}\n\n.navbar.is-dark .navbar-brand .navbar-link::after {\n  border-color: #fff;\n}\n\n.navbar.is-dark .navbar-burger {\n  color: #fff;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-dark .navbar-start > .navbar-item,\n  .navbar.is-dark .navbar-start .navbar-link,\n  .navbar.is-dark .navbar-end > .navbar-item,\n  .navbar.is-dark .navbar-end .navbar-link {\n    color: #fff;\n  }\n  .navbar.is-dark .navbar-start > a.navbar-item:focus, .navbar.is-dark .navbar-start > a.navbar-item:hover, .navbar.is-dark .navbar-start > a.navbar-item.is-active,\n  .navbar.is-dark .navbar-start .navbar-link:focus,\n  .navbar.is-dark .navbar-start .navbar-link:hover,\n  .navbar.is-dark .navbar-start .navbar-link.is-active,\n  .navbar.is-dark .navbar-end > a.navbar-item:focus,\n  .navbar.is-dark .navbar-end > a.navbar-item:hover,\n  .navbar.is-dark .navbar-end > a.navbar-item.is-active,\n  .navbar.is-dark .navbar-end .navbar-link:focus,\n  .navbar.is-dark .navbar-end .navbar-link:hover,\n  .navbar.is-dark .navbar-end .navbar-link.is-active {\n    background-color: #292929;\n    color: #fff;\n  }\n  .navbar.is-dark .navbar-start .navbar-link::after,\n  .navbar.is-dark .navbar-end .navbar-link::after {\n    border-color: #fff;\n  }\n  .navbar.is-dark .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-dark .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-dark .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #292929;\n    color: #fff;\n  }\n  .navbar.is-dark .navbar-dropdown a.navbar-item.is-active {\n    background-color: #363636;\n    color: #fff;\n  }\n}\n\n.navbar.is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.navbar.is-primary .navbar-brand > .navbar-item,\n.navbar.is-primary .navbar-brand .navbar-link {\n  color: #fff;\n}\n\n.navbar.is-primary .navbar-brand > a.navbar-item:focus, .navbar.is-primary .navbar-brand > a.navbar-item:hover, .navbar.is-primary .navbar-brand > a.navbar-item.is-active,\n.navbar.is-primary .navbar-brand .navbar-link:focus,\n.navbar.is-primary .navbar-brand .navbar-link:hover,\n.navbar.is-primary .navbar-brand .navbar-link.is-active {\n  background-color: #00b89c;\n  color: #fff;\n}\n\n.navbar.is-primary .navbar-brand .navbar-link::after {\n  border-color: #fff;\n}\n\n.navbar.is-primary .navbar-burger {\n  color: #fff;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-primary .navbar-start > .navbar-item,\n  .navbar.is-primary .navbar-start .navbar-link,\n  .navbar.is-primary .navbar-end > .navbar-item,\n  .navbar.is-primary .navbar-end .navbar-link {\n    color: #fff;\n  }\n  .navbar.is-primary .navbar-start > a.navbar-item:focus, .navbar.is-primary .navbar-start > a.navbar-item:hover, .navbar.is-primary .navbar-start > a.navbar-item.is-active,\n  .navbar.is-primary .navbar-start .navbar-link:focus,\n  .navbar.is-primary .navbar-start .navbar-link:hover,\n  .navbar.is-primary .navbar-start .navbar-link.is-active,\n  .navbar.is-primary .navbar-end > a.navbar-item:focus,\n  .navbar.is-primary .navbar-end > a.navbar-item:hover,\n  .navbar.is-primary .navbar-end > a.navbar-item.is-active,\n  .navbar.is-primary .navbar-end .navbar-link:focus,\n  .navbar.is-primary .navbar-end .navbar-link:hover,\n  .navbar.is-primary .navbar-end .navbar-link.is-active {\n    background-color: #00b89c;\n    color: #fff;\n  }\n  .navbar.is-primary .navbar-start .navbar-link::after,\n  .navbar.is-primary .navbar-end .navbar-link::after {\n    border-color: #fff;\n  }\n  .navbar.is-primary .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-primary .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-primary .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #00b89c;\n    color: #fff;\n  }\n  .navbar.is-primary .navbar-dropdown a.navbar-item.is-active {\n    background-color: #00d1b2;\n    color: #fff;\n  }\n}\n\n.navbar.is-link {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.navbar.is-link .navbar-brand > .navbar-item,\n.navbar.is-link .navbar-brand .navbar-link {\n  color: #fff;\n}\n\n.navbar.is-link .navbar-brand > a.navbar-item:focus, .navbar.is-link .navbar-brand > a.navbar-item:hover, .navbar.is-link .navbar-brand > a.navbar-item.is-active,\n.navbar.is-link .navbar-brand .navbar-link:focus,\n.navbar.is-link .navbar-brand .navbar-link:hover,\n.navbar.is-link .navbar-brand .navbar-link.is-active {\n  background-color: #2366d1;\n  color: #fff;\n}\n\n.navbar.is-link .navbar-brand .navbar-link::after {\n  border-color: #fff;\n}\n\n.navbar.is-link .navbar-burger {\n  color: #fff;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-link .navbar-start > .navbar-item,\n  .navbar.is-link .navbar-start .navbar-link,\n  .navbar.is-link .navbar-end > .navbar-item,\n  .navbar.is-link .navbar-end .navbar-link {\n    color: #fff;\n  }\n  .navbar.is-link .navbar-start > a.navbar-item:focus, .navbar.is-link .navbar-start > a.navbar-item:hover, .navbar.is-link .navbar-start > a.navbar-item.is-active,\n  .navbar.is-link .navbar-start .navbar-link:focus,\n  .navbar.is-link .navbar-start .navbar-link:hover,\n  .navbar.is-link .navbar-start .navbar-link.is-active,\n  .navbar.is-link .navbar-end > a.navbar-item:focus,\n  .navbar.is-link .navbar-end > a.navbar-item:hover,\n  .navbar.is-link .navbar-end > a.navbar-item.is-active,\n  .navbar.is-link .navbar-end .navbar-link:focus,\n  .navbar.is-link .navbar-end .navbar-link:hover,\n  .navbar.is-link .navbar-end .navbar-link.is-active {\n    background-color: #2366d1;\n    color: #fff;\n  }\n  .navbar.is-link .navbar-start .navbar-link::after,\n  .navbar.is-link .navbar-end .navbar-link::after {\n    border-color: #fff;\n  }\n  .navbar.is-link .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-link .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-link .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #2366d1;\n    color: #fff;\n  }\n  .navbar.is-link .navbar-dropdown a.navbar-item.is-active {\n    background-color: #3273dc;\n    color: #fff;\n  }\n}\n\n.navbar.is-info {\n  background-color: #3298dc;\n  color: #fff;\n}\n\n.navbar.is-info .navbar-brand > .navbar-item,\n.navbar.is-info .navbar-brand .navbar-link {\n  color: #fff;\n}\n\n.navbar.is-info .navbar-brand > a.navbar-item:focus, .navbar.is-info .navbar-brand > a.navbar-item:hover, .navbar.is-info .navbar-brand > a.navbar-item.is-active,\n.navbar.is-info .navbar-brand .navbar-link:focus,\n.navbar.is-info .navbar-brand .navbar-link:hover,\n.navbar.is-info .navbar-brand .navbar-link.is-active {\n  background-color: #238cd1;\n  color: #fff;\n}\n\n.navbar.is-info .navbar-brand .navbar-link::after {\n  border-color: #fff;\n}\n\n.navbar.is-info .navbar-burger {\n  color: #fff;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-info .navbar-start > .navbar-item,\n  .navbar.is-info .navbar-start .navbar-link,\n  .navbar.is-info .navbar-end > .navbar-item,\n  .navbar.is-info .navbar-end .navbar-link {\n    color: #fff;\n  }\n  .navbar.is-info .navbar-start > a.navbar-item:focus, .navbar.is-info .navbar-start > a.navbar-item:hover, .navbar.is-info .navbar-start > a.navbar-item.is-active,\n  .navbar.is-info .navbar-start .navbar-link:focus,\n  .navbar.is-info .navbar-start .navbar-link:hover,\n  .navbar.is-info .navbar-start .navbar-link.is-active,\n  .navbar.is-info .navbar-end > a.navbar-item:focus,\n  .navbar.is-info .navbar-end > a.navbar-item:hover,\n  .navbar.is-info .navbar-end > a.navbar-item.is-active,\n  .navbar.is-info .navbar-end .navbar-link:focus,\n  .navbar.is-info .navbar-end .navbar-link:hover,\n  .navbar.is-info .navbar-end .navbar-link.is-active {\n    background-color: #238cd1;\n    color: #fff;\n  }\n  .navbar.is-info .navbar-start .navbar-link::after,\n  .navbar.is-info .navbar-end .navbar-link::after {\n    border-color: #fff;\n  }\n  .navbar.is-info .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-info .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-info .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #238cd1;\n    color: #fff;\n  }\n  .navbar.is-info .navbar-dropdown a.navbar-item.is-active {\n    background-color: #3298dc;\n    color: #fff;\n  }\n}\n\n.navbar.is-success {\n  background-color: #48c774;\n  color: #fff;\n}\n\n.navbar.is-success .navbar-brand > .navbar-item,\n.navbar.is-success .navbar-brand .navbar-link {\n  color: #fff;\n}\n\n.navbar.is-success .navbar-brand > a.navbar-item:focus, .navbar.is-success .navbar-brand > a.navbar-item:hover, .navbar.is-success .navbar-brand > a.navbar-item.is-active,\n.navbar.is-success .navbar-brand .navbar-link:focus,\n.navbar.is-success .navbar-brand .navbar-link:hover,\n.navbar.is-success .navbar-brand .navbar-link.is-active {\n  background-color: #3abb67;\n  color: #fff;\n}\n\n.navbar.is-success .navbar-brand .navbar-link::after {\n  border-color: #fff;\n}\n\n.navbar.is-success .navbar-burger {\n  color: #fff;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-success .navbar-start > .navbar-item,\n  .navbar.is-success .navbar-start .navbar-link,\n  .navbar.is-success .navbar-end > .navbar-item,\n  .navbar.is-success .navbar-end .navbar-link {\n    color: #fff;\n  }\n  .navbar.is-success .navbar-start > a.navbar-item:focus, .navbar.is-success .navbar-start > a.navbar-item:hover, .navbar.is-success .navbar-start > a.navbar-item.is-active,\n  .navbar.is-success .navbar-start .navbar-link:focus,\n  .navbar.is-success .navbar-start .navbar-link:hover,\n  .navbar.is-success .navbar-start .navbar-link.is-active,\n  .navbar.is-success .navbar-end > a.navbar-item:focus,\n  .navbar.is-success .navbar-end > a.navbar-item:hover,\n  .navbar.is-success .navbar-end > a.navbar-item.is-active,\n  .navbar.is-success .navbar-end .navbar-link:focus,\n  .navbar.is-success .navbar-end .navbar-link:hover,\n  .navbar.is-success .navbar-end .navbar-link.is-active {\n    background-color: #3abb67;\n    color: #fff;\n  }\n  .navbar.is-success .navbar-start .navbar-link::after,\n  .navbar.is-success .navbar-end .navbar-link::after {\n    border-color: #fff;\n  }\n  .navbar.is-success .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-success .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-success .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #3abb67;\n    color: #fff;\n  }\n  .navbar.is-success .navbar-dropdown a.navbar-item.is-active {\n    background-color: #48c774;\n    color: #fff;\n  }\n}\n\n.navbar.is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-warning .navbar-brand > .navbar-item,\n.navbar.is-warning .navbar-brand .navbar-link {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-warning .navbar-brand > a.navbar-item:focus, .navbar.is-warning .navbar-brand > a.navbar-item:hover, .navbar.is-warning .navbar-brand > a.navbar-item.is-active,\n.navbar.is-warning .navbar-brand .navbar-link:focus,\n.navbar.is-warning .navbar-brand .navbar-link:hover,\n.navbar.is-warning .navbar-brand .navbar-link.is-active {\n  background-color: #ffd83d;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-warning .navbar-brand .navbar-link::after {\n  border-color: rgba(0, 0, 0, 0.7);\n}\n\n.navbar.is-warning .navbar-burger {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-warning .navbar-start > .navbar-item,\n  .navbar.is-warning .navbar-start .navbar-link,\n  .navbar.is-warning .navbar-end > .navbar-item,\n  .navbar.is-warning .navbar-end .navbar-link {\n    color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-warning .navbar-start > a.navbar-item:focus, .navbar.is-warning .navbar-start > a.navbar-item:hover, .navbar.is-warning .navbar-start > a.navbar-item.is-active,\n  .navbar.is-warning .navbar-start .navbar-link:focus,\n  .navbar.is-warning .navbar-start .navbar-link:hover,\n  .navbar.is-warning .navbar-start .navbar-link.is-active,\n  .navbar.is-warning .navbar-end > a.navbar-item:focus,\n  .navbar.is-warning .navbar-end > a.navbar-item:hover,\n  .navbar.is-warning .navbar-end > a.navbar-item.is-active,\n  .navbar.is-warning .navbar-end .navbar-link:focus,\n  .navbar.is-warning .navbar-end .navbar-link:hover,\n  .navbar.is-warning .navbar-end .navbar-link.is-active {\n    background-color: #ffd83d;\n    color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-warning .navbar-start .navbar-link::after,\n  .navbar.is-warning .navbar-end .navbar-link::after {\n    border-color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-warning .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-warning .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-warning .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #ffd83d;\n    color: rgba(0, 0, 0, 0.7);\n  }\n  .navbar.is-warning .navbar-dropdown a.navbar-item.is-active {\n    background-color: #ffdd57;\n    color: rgba(0, 0, 0, 0.7);\n  }\n}\n\n.navbar.is-danger {\n  background-color: #f14668;\n  color: #fff;\n}\n\n.navbar.is-danger .navbar-brand > .navbar-item,\n.navbar.is-danger .navbar-brand .navbar-link {\n  color: #fff;\n}\n\n.navbar.is-danger .navbar-brand > a.navbar-item:focus, .navbar.is-danger .navbar-brand > a.navbar-item:hover, .navbar.is-danger .navbar-brand > a.navbar-item.is-active,\n.navbar.is-danger .navbar-brand .navbar-link:focus,\n.navbar.is-danger .navbar-brand .navbar-link:hover,\n.navbar.is-danger .navbar-brand .navbar-link.is-active {\n  background-color: #ef2e55;\n  color: #fff;\n}\n\n.navbar.is-danger .navbar-brand .navbar-link::after {\n  border-color: #fff;\n}\n\n.navbar.is-danger .navbar-burger {\n  color: #fff;\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar.is-danger .navbar-start > .navbar-item,\n  .navbar.is-danger .navbar-start .navbar-link,\n  .navbar.is-danger .navbar-end > .navbar-item,\n  .navbar.is-danger .navbar-end .navbar-link {\n    color: #fff;\n  }\n  .navbar.is-danger .navbar-start > a.navbar-item:focus, .navbar.is-danger .navbar-start > a.navbar-item:hover, .navbar.is-danger .navbar-start > a.navbar-item.is-active,\n  .navbar.is-danger .navbar-start .navbar-link:focus,\n  .navbar.is-danger .navbar-start .navbar-link:hover,\n  .navbar.is-danger .navbar-start .navbar-link.is-active,\n  .navbar.is-danger .navbar-end > a.navbar-item:focus,\n  .navbar.is-danger .navbar-end > a.navbar-item:hover,\n  .navbar.is-danger .navbar-end > a.navbar-item.is-active,\n  .navbar.is-danger .navbar-end .navbar-link:focus,\n  .navbar.is-danger .navbar-end .navbar-link:hover,\n  .navbar.is-danger .navbar-end .navbar-link.is-active {\n    background-color: #ef2e55;\n    color: #fff;\n  }\n  .navbar.is-danger .navbar-start .navbar-link::after,\n  .navbar.is-danger .navbar-end .navbar-link::after {\n    border-color: #fff;\n  }\n  .navbar.is-danger .navbar-item.has-dropdown:focus .navbar-link,\n  .navbar.is-danger .navbar-item.has-dropdown:hover .navbar-link,\n  .navbar.is-danger .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #ef2e55;\n    color: #fff;\n  }\n  .navbar.is-danger .navbar-dropdown a.navbar-item.is-active {\n    background-color: #f14668;\n    color: #fff;\n  }\n}\n\n.navbar > .container {\n  align-items: stretch;\n  display: flex;\n  min-height: 3.25rem;\n  width: 100%;\n}\n\n.navbar.has-shadow {\n  box-shadow: 0 2px 0 0 whitesmoke;\n}\n\n.navbar.is-fixed-bottom, .navbar.is-fixed-top {\n  left: 0;\n  position: fixed;\n  right: 0;\n  z-index: 30;\n}\n\n.navbar.is-fixed-bottom {\n  bottom: 0;\n}\n\n.navbar.is-fixed-bottom.has-shadow {\n  box-shadow: 0 -2px 0 0 whitesmoke;\n}\n\n.navbar.is-fixed-top {\n  top: 0;\n}\n\nhtml.has-navbar-fixed-top,\nbody.has-navbar-fixed-top {\n  padding-top: 3.25rem;\n}\n\nhtml.has-navbar-fixed-bottom,\nbody.has-navbar-fixed-bottom {\n  padding-bottom: 3.25rem;\n}\n\n.navbar-brand,\n.navbar-tabs {\n  align-items: stretch;\n  display: flex;\n  flex-shrink: 0;\n  min-height: 3.25rem;\n}\n\n.navbar-brand a.navbar-item:focus, .navbar-brand a.navbar-item:hover {\n  background-color: transparent;\n}\n\n.navbar-tabs {\n  -webkit-overflow-scrolling: touch;\n  max-width: 100vw;\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n\n.navbar-burger {\n  color: #4a4a4a;\n  cursor: pointer;\n  display: block;\n  height: 3.25rem;\n  position: relative;\n  width: 3.25rem;\n  margin-left: auto;\n}\n\n.navbar-burger span {\n  background-color: currentColor;\n  display: block;\n  height: 1px;\n  left: calc(50% - 8px);\n  position: absolute;\n  transform-origin: center;\n  transition-duration: 86ms;\n  transition-property: background-color, opacity, transform;\n  transition-timing-function: ease-out;\n  width: 16px;\n}\n\n.navbar-burger span:nth-child(1) {\n  top: calc(50% - 6px);\n}\n\n.navbar-burger span:nth-child(2) {\n  top: calc(50% - 1px);\n}\n\n.navbar-burger span:nth-child(3) {\n  top: calc(50% + 4px);\n}\n\n.navbar-burger:hover {\n  background-color: rgba(0, 0, 0, 0.05);\n}\n\n.navbar-burger.is-active span:nth-child(1) {\n  transform: translateY(5px) rotate(45deg);\n}\n\n.navbar-burger.is-active span:nth-child(2) {\n  opacity: 0;\n}\n\n.navbar-burger.is-active span:nth-child(3) {\n  transform: translateY(-5px) rotate(-45deg);\n}\n\n.navbar-menu {\n  display: none;\n}\n\n.navbar-item,\n.navbar-link {\n  color: #4a4a4a;\n  display: block;\n  line-height: 1.5;\n  padding: 0.5rem 0.75rem;\n  position: relative;\n}\n\n.navbar-item .icon:only-child,\n.navbar-link .icon:only-child {\n  margin-left: -0.25rem;\n  margin-right: -0.25rem;\n}\n\na.navbar-item,\n.navbar-link {\n  cursor: pointer;\n}\n\na.navbar-item:focus, a.navbar-item:focus-within, a.navbar-item:hover, a.navbar-item.is-active,\n.navbar-link:focus,\n.navbar-link:focus-within,\n.navbar-link:hover,\n.navbar-link.is-active {\n  background-color: #fafafa;\n  color: #3273dc;\n}\n\n.navbar-item {\n  display: block;\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.navbar-item img {\n  max-height: 1.75rem;\n}\n\n.navbar-item.has-dropdown {\n  padding: 0;\n}\n\n.navbar-item.is-expanded {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.navbar-item.is-tab {\n  border-bottom: 1px solid transparent;\n  min-height: 3.25rem;\n  padding-bottom: calc(0.5rem - 1px);\n}\n\n.navbar-item.is-tab:focus, .navbar-item.is-tab:hover {\n  background-color: transparent;\n  border-bottom-color: #3273dc;\n}\n\n.navbar-item.is-tab.is-active {\n  background-color: transparent;\n  border-bottom-color: #3273dc;\n  border-bottom-style: solid;\n  border-bottom-width: 3px;\n  color: #3273dc;\n  padding-bottom: calc(0.5rem - 3px);\n}\n\n.navbar-content {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.navbar-link:not(.is-arrowless) {\n  padding-right: 2.5em;\n}\n\n.navbar-link:not(.is-arrowless)::after {\n  border-color: #3273dc;\n  margin-top: -0.375em;\n  right: 1.125em;\n}\n\n.navbar-dropdown {\n  font-size: 0.875rem;\n  padding-bottom: 0.5rem;\n  padding-top: 0.5rem;\n}\n\n.navbar-dropdown .navbar-item {\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n}\n\n.navbar-divider {\n  background-color: whitesmoke;\n  border: none;\n  display: none;\n  height: 2px;\n  margin: 0.5rem 0;\n}\n\n@media screen and (max-width: 1023px) {\n  .navbar > .container {\n    display: block;\n  }\n  .navbar-brand .navbar-item,\n  .navbar-tabs .navbar-item {\n    align-items: center;\n    display: flex;\n  }\n  .navbar-link::after {\n    display: none;\n  }\n  .navbar-menu {\n    background-color: white;\n    box-shadow: 0 8px 16px rgba(10, 10, 10, 0.1);\n    padding: 0.5rem 0;\n  }\n  .navbar-menu.is-active {\n    display: block;\n  }\n  .navbar.is-fixed-bottom-touch, .navbar.is-fixed-top-touch {\n    left: 0;\n    position: fixed;\n    right: 0;\n    z-index: 30;\n  }\n  .navbar.is-fixed-bottom-touch {\n    bottom: 0;\n  }\n  .navbar.is-fixed-bottom-touch.has-shadow {\n    box-shadow: 0 -2px 3px rgba(10, 10, 10, 0.1);\n  }\n  .navbar.is-fixed-top-touch {\n    top: 0;\n  }\n  .navbar.is-fixed-top .navbar-menu, .navbar.is-fixed-top-touch .navbar-menu {\n    -webkit-overflow-scrolling: touch;\n    max-height: calc(100vh - 3.25rem);\n    overflow: auto;\n  }\n  html.has-navbar-fixed-top-touch,\n  body.has-navbar-fixed-top-touch {\n    padding-top: 3.25rem;\n  }\n  html.has-navbar-fixed-bottom-touch,\n  body.has-navbar-fixed-bottom-touch {\n    padding-bottom: 3.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .navbar,\n  .navbar-menu,\n  .navbar-start,\n  .navbar-end {\n    align-items: stretch;\n    display: flex;\n  }\n  .navbar {\n    min-height: 3.25rem;\n  }\n  .navbar.is-spaced {\n    padding: 1rem 2rem;\n  }\n  .navbar.is-spaced .navbar-start,\n  .navbar.is-spaced .navbar-end {\n    align-items: center;\n  }\n  .navbar.is-spaced a.navbar-item,\n  .navbar.is-spaced .navbar-link {\n    border-radius: 4px;\n  }\n  .navbar.is-transparent a.navbar-item:focus, .navbar.is-transparent a.navbar-item:hover, .navbar.is-transparent a.navbar-item.is-active,\n  .navbar.is-transparent .navbar-link:focus,\n  .navbar.is-transparent .navbar-link:hover,\n  .navbar.is-transparent .navbar-link.is-active {\n    background-color: transparent !important;\n  }\n  .navbar.is-transparent .navbar-item.has-dropdown.is-active .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:focus .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:focus-within .navbar-link, .navbar.is-transparent .navbar-item.has-dropdown.is-hoverable:hover .navbar-link {\n    background-color: transparent !important;\n  }\n  .navbar.is-transparent .navbar-dropdown a.navbar-item:focus, .navbar.is-transparent .navbar-dropdown a.navbar-item:hover {\n    background-color: whitesmoke;\n    color: #0a0a0a;\n  }\n  .navbar.is-transparent .navbar-dropdown a.navbar-item.is-active {\n    background-color: whitesmoke;\n    color: #3273dc;\n  }\n  .navbar-burger {\n    display: none;\n  }\n  .navbar-item,\n  .navbar-link {\n    align-items: center;\n    display: flex;\n  }\n  .navbar-item {\n    display: flex;\n  }\n  .navbar-item.has-dropdown {\n    align-items: stretch;\n  }\n  .navbar-item.has-dropdown-up .navbar-link::after {\n    transform: rotate(135deg) translate(0.25em, -0.25em);\n  }\n  .navbar-item.has-dropdown-up .navbar-dropdown {\n    border-bottom: 2px solid #dbdbdb;\n    border-radius: 6px 6px 0 0;\n    border-top: none;\n    bottom: 100%;\n    box-shadow: 0 -8px 8px rgba(10, 10, 10, 0.1);\n    top: auto;\n  }\n  .navbar-item.is-active .navbar-dropdown, .navbar-item.is-hoverable:focus .navbar-dropdown, .navbar-item.is-hoverable:focus-within .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown {\n    display: block;\n  }\n  .navbar.is-spaced .navbar-item.is-active .navbar-dropdown, .navbar-item.is-active .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:focus .navbar-dropdown, .navbar-item.is-hoverable:focus .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:focus-within .navbar-dropdown, .navbar-item.is-hoverable:focus-within .navbar-dropdown.is-boxed, .navbar.is-spaced .navbar-item.is-hoverable:hover .navbar-dropdown, .navbar-item.is-hoverable:hover .navbar-dropdown.is-boxed {\n    opacity: 1;\n    pointer-events: auto;\n    transform: translateY(0);\n  }\n  .navbar-menu {\n    flex-grow: 1;\n    flex-shrink: 0;\n  }\n  .navbar-start {\n    justify-content: flex-start;\n    margin-right: auto;\n  }\n  .navbar-end {\n    justify-content: flex-end;\n    margin-left: auto;\n  }\n  .navbar-dropdown {\n    background-color: white;\n    border-bottom-left-radius: 6px;\n    border-bottom-right-radius: 6px;\n    border-top: 2px solid #dbdbdb;\n    box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1);\n    display: none;\n    font-size: 0.875rem;\n    left: 0;\n    min-width: 100%;\n    position: absolute;\n    top: 100%;\n    z-index: 20;\n  }\n  .navbar-dropdown .navbar-item {\n    padding: 0.375rem 1rem;\n    white-space: nowrap;\n  }\n  .navbar-dropdown a.navbar-item {\n    padding-right: 3rem;\n  }\n  .navbar-dropdown a.navbar-item:focus, .navbar-dropdown a.navbar-item:hover {\n    background-color: whitesmoke;\n    color: #0a0a0a;\n  }\n  .navbar-dropdown a.navbar-item.is-active {\n    background-color: whitesmoke;\n    color: #3273dc;\n  }\n  .navbar.is-spaced .navbar-dropdown, .navbar-dropdown.is-boxed {\n    border-radius: 6px;\n    border-top: none;\n    box-shadow: 0 8px 8px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n    display: block;\n    opacity: 0;\n    pointer-events: none;\n    top: calc(100% + (-4px));\n    transform: translateY(-5px);\n    transition-duration: 86ms;\n    transition-property: opacity, transform;\n  }\n  .navbar-dropdown.is-right {\n    left: auto;\n    right: 0;\n  }\n  .navbar-divider {\n    display: block;\n  }\n  .navbar > .container .navbar-brand,\n  .container > .navbar .navbar-brand {\n    margin-left: -.75rem;\n  }\n  .navbar > .container .navbar-menu,\n  .container > .navbar .navbar-menu {\n    margin-right: -.75rem;\n  }\n  .navbar.is-fixed-bottom-desktop, .navbar.is-fixed-top-desktop {\n    left: 0;\n    position: fixed;\n    right: 0;\n    z-index: 30;\n  }\n  .navbar.is-fixed-bottom-desktop {\n    bottom: 0;\n  }\n  .navbar.is-fixed-bottom-desktop.has-shadow {\n    box-shadow: 0 -2px 3px rgba(10, 10, 10, 0.1);\n  }\n  .navbar.is-fixed-top-desktop {\n    top: 0;\n  }\n  html.has-navbar-fixed-top-desktop,\n  body.has-navbar-fixed-top-desktop {\n    padding-top: 3.25rem;\n  }\n  html.has-navbar-fixed-bottom-desktop,\n  body.has-navbar-fixed-bottom-desktop {\n    padding-bottom: 3.25rem;\n  }\n  html.has-spaced-navbar-fixed-top,\n  body.has-spaced-navbar-fixed-top {\n    padding-top: 5.25rem;\n  }\n  html.has-spaced-navbar-fixed-bottom,\n  body.has-spaced-navbar-fixed-bottom {\n    padding-bottom: 5.25rem;\n  }\n  a.navbar-item.is-active,\n  .navbar-link.is-active {\n    color: #0a0a0a;\n  }\n  a.navbar-item.is-active:not(:focus):not(:hover),\n  .navbar-link.is-active:not(:focus):not(:hover) {\n    background-color: transparent;\n  }\n  .navbar-item.has-dropdown:focus .navbar-link, .navbar-item.has-dropdown:hover .navbar-link, .navbar-item.has-dropdown.is-active .navbar-link {\n    background-color: #fafafa;\n  }\n}\n\n.hero.is-fullheight-with-navbar {\n  min-height: calc(100vh - 3.25rem);\n}\n\n.pagination {\n  font-size: 1rem;\n  margin: -0.25rem;\n}\n\n.pagination.is-small {\n  font-size: 0.75rem;\n}\n\n.pagination.is-medium {\n  font-size: 1.25rem;\n}\n\n.pagination.is-large {\n  font-size: 1.5rem;\n}\n\n.pagination.is-rounded .pagination-previous,\n.pagination.is-rounded .pagination-next {\n  padding-left: 1em;\n  padding-right: 1em;\n  border-radius: 290486px;\n}\n\n.pagination.is-rounded .pagination-link {\n  border-radius: 290486px;\n}\n\n.pagination,\n.pagination-list {\n  align-items: center;\n  display: flex;\n  justify-content: center;\n  text-align: center;\n}\n\n.pagination-previous,\n.pagination-next,\n.pagination-link,\n.pagination-ellipsis {\n  font-size: 1em;\n  justify-content: center;\n  margin: 0.25rem;\n  padding-left: 0.5em;\n  padding-right: 0.5em;\n  text-align: center;\n}\n\n.pagination-previous,\n.pagination-next,\n.pagination-link {\n  border-color: #dbdbdb;\n  color: #363636;\n  min-width: 2.5em;\n}\n\n.pagination-previous:hover,\n.pagination-next:hover,\n.pagination-link:hover {\n  border-color: #b5b5b5;\n  color: #363636;\n}\n\n.pagination-previous:focus,\n.pagination-next:focus,\n.pagination-link:focus {\n  border-color: #3273dc;\n}\n\n.pagination-previous:active,\n.pagination-next:active,\n.pagination-link:active {\n  box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.2);\n}\n\n.pagination-previous[disabled],\n.pagination-next[disabled],\n.pagination-link[disabled] {\n  background-color: #dbdbdb;\n  border-color: #dbdbdb;\n  box-shadow: none;\n  color: #7a7a7a;\n  opacity: 0.5;\n}\n\n.pagination-previous,\n.pagination-next {\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n  white-space: nowrap;\n}\n\n.pagination-link.is-current {\n  background-color: #3273dc;\n  border-color: #3273dc;\n  color: #fff;\n}\n\n.pagination-ellipsis {\n  color: #b5b5b5;\n  pointer-events: none;\n}\n\n.pagination-list {\n  flex-wrap: wrap;\n}\n\n@media screen and (max-width: 768px) {\n  .pagination {\n    flex-wrap: wrap;\n  }\n  .pagination-previous,\n  .pagination-next {\n    flex-grow: 1;\n    flex-shrink: 1;\n  }\n  .pagination-list li {\n    flex-grow: 1;\n    flex-shrink: 1;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .pagination-list {\n    flex-grow: 1;\n    flex-shrink: 1;\n    justify-content: flex-start;\n    order: 1;\n  }\n  .pagination-previous {\n    order: 2;\n  }\n  .pagination-next {\n    order: 3;\n  }\n  .pagination {\n    justify-content: space-between;\n  }\n  .pagination.is-centered .pagination-previous {\n    order: 1;\n  }\n  .pagination.is-centered .pagination-list {\n    justify-content: center;\n    order: 2;\n  }\n  .pagination.is-centered .pagination-next {\n    order: 3;\n  }\n  .pagination.is-right .pagination-previous {\n    order: 1;\n  }\n  .pagination.is-right .pagination-next {\n    order: 2;\n  }\n  .pagination.is-right .pagination-list {\n    justify-content: flex-end;\n    order: 3;\n  }\n}\n\n.panel {\n  border-radius: 6px;\n  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);\n  font-size: 1rem;\n}\n\n.panel:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.panel.is-white .panel-heading {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.panel.is-white .panel-tabs a.is-active {\n  border-bottom-color: white;\n}\n\n.panel.is-white .panel-block.is-active .panel-icon {\n  color: white;\n}\n\n.panel.is-black .panel-heading {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.panel.is-black .panel-tabs a.is-active {\n  border-bottom-color: #0a0a0a;\n}\n\n.panel.is-black .panel-block.is-active .panel-icon {\n  color: #0a0a0a;\n}\n\n.panel.is-light .panel-heading {\n  background-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.panel.is-light .panel-tabs a.is-active {\n  border-bottom-color: whitesmoke;\n}\n\n.panel.is-light .panel-block.is-active .panel-icon {\n  color: whitesmoke;\n}\n\n.panel.is-dark .panel-heading {\n  background-color: #363636;\n  color: #fff;\n}\n\n.panel.is-dark .panel-tabs a.is-active {\n  border-bottom-color: #363636;\n}\n\n.panel.is-dark .panel-block.is-active .panel-icon {\n  color: #363636;\n}\n\n.panel.is-primary .panel-heading {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.panel.is-primary .panel-tabs a.is-active {\n  border-bottom-color: #00d1b2;\n}\n\n.panel.is-primary .panel-block.is-active .panel-icon {\n  color: #00d1b2;\n}\n\n.panel.is-link .panel-heading {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.panel.is-link .panel-tabs a.is-active {\n  border-bottom-color: #3273dc;\n}\n\n.panel.is-link .panel-block.is-active .panel-icon {\n  color: #3273dc;\n}\n\n.panel.is-info .panel-heading {\n  background-color: #3298dc;\n  color: #fff;\n}\n\n.panel.is-info .panel-tabs a.is-active {\n  border-bottom-color: #3298dc;\n}\n\n.panel.is-info .panel-block.is-active .panel-icon {\n  color: #3298dc;\n}\n\n.panel.is-success .panel-heading {\n  background-color: #48c774;\n  color: #fff;\n}\n\n.panel.is-success .panel-tabs a.is-active {\n  border-bottom-color: #48c774;\n}\n\n.panel.is-success .panel-block.is-active .panel-icon {\n  color: #48c774;\n}\n\n.panel.is-warning .panel-heading {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.panel.is-warning .panel-tabs a.is-active {\n  border-bottom-color: #ffdd57;\n}\n\n.panel.is-warning .panel-block.is-active .panel-icon {\n  color: #ffdd57;\n}\n\n.panel.is-danger .panel-heading {\n  background-color: #f14668;\n  color: #fff;\n}\n\n.panel.is-danger .panel-tabs a.is-active {\n  border-bottom-color: #f14668;\n}\n\n.panel.is-danger .panel-block.is-active .panel-icon {\n  color: #f14668;\n}\n\n.panel-tabs:not(:last-child),\n.panel-block:not(:last-child) {\n  border-bottom: 1px solid #ededed;\n}\n\n.panel-heading {\n  background-color: #ededed;\n  border-radius: 6px 6px 0 0;\n  color: #363636;\n  font-size: 1.25em;\n  font-weight: 700;\n  line-height: 1.25;\n  padding: 0.75em 1em;\n}\n\n.panel-tabs {\n  align-items: flex-end;\n  display: flex;\n  font-size: 0.875em;\n  justify-content: center;\n}\n\n.panel-tabs a {\n  border-bottom: 1px solid #dbdbdb;\n  margin-bottom: -1px;\n  padding: 0.5em;\n}\n\n.panel-tabs a.is-active {\n  border-bottom-color: #4a4a4a;\n  color: #363636;\n}\n\n.panel-list a {\n  color: #4a4a4a;\n}\n\n.panel-list a:hover {\n  color: #3273dc;\n}\n\n.panel-block {\n  align-items: center;\n  color: #363636;\n  display: flex;\n  justify-content: flex-start;\n  padding: 0.5em 0.75em;\n}\n\n.panel-block input[type=\"checkbox\"] {\n  margin-right: 0.75em;\n}\n\n.panel-block > .control {\n  flex-grow: 1;\n  flex-shrink: 1;\n  width: 100%;\n}\n\n.panel-block.is-wrapped {\n  flex-wrap: wrap;\n}\n\n.panel-block.is-active {\n  border-left-color: #3273dc;\n  color: #363636;\n}\n\n.panel-block.is-active .panel-icon {\n  color: #3273dc;\n}\n\n.panel-block:last-child {\n  border-bottom-left-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\n\na.panel-block,\nlabel.panel-block {\n  cursor: pointer;\n}\n\na.panel-block:hover,\nlabel.panel-block:hover {\n  background-color: whitesmoke;\n}\n\n.panel-icon {\n  display: inline-block;\n  font-size: 14px;\n  height: 1em;\n  line-height: 1em;\n  text-align: center;\n  vertical-align: top;\n  width: 1em;\n  color: #7a7a7a;\n  margin-right: 0.75em;\n}\n\n.panel-icon .fa {\n  font-size: inherit;\n  line-height: inherit;\n}\n\n.tabs {\n  -webkit-overflow-scrolling: touch;\n  align-items: stretch;\n  display: flex;\n  font-size: 1rem;\n  justify-content: space-between;\n  overflow: hidden;\n  overflow-x: auto;\n  white-space: nowrap;\n}\n\n.tabs a {\n  align-items: center;\n  border-bottom-color: #dbdbdb;\n  border-bottom-style: solid;\n  border-bottom-width: 1px;\n  color: #4a4a4a;\n  display: flex;\n  justify-content: center;\n  margin-bottom: -1px;\n  padding: 0.5em 1em;\n  vertical-align: top;\n}\n\n.tabs a:hover {\n  border-bottom-color: #363636;\n  color: #363636;\n}\n\n.tabs li {\n  display: block;\n}\n\n.tabs li.is-active a {\n  border-bottom-color: #3273dc;\n  color: #3273dc;\n}\n\n.tabs ul {\n  align-items: center;\n  border-bottom-color: #dbdbdb;\n  border-bottom-style: solid;\n  border-bottom-width: 1px;\n  display: flex;\n  flex-grow: 1;\n  flex-shrink: 0;\n  justify-content: flex-start;\n}\n\n.tabs ul.is-left {\n  padding-right: 0.75em;\n}\n\n.tabs ul.is-center {\n  flex: none;\n  justify-content: center;\n  padding-left: 0.75em;\n  padding-right: 0.75em;\n}\n\n.tabs ul.is-right {\n  justify-content: flex-end;\n  padding-left: 0.75em;\n}\n\n.tabs .icon:first-child {\n  margin-right: 0.5em;\n}\n\n.tabs .icon:last-child {\n  margin-left: 0.5em;\n}\n\n.tabs.is-centered ul {\n  justify-content: center;\n}\n\n.tabs.is-right ul {\n  justify-content: flex-end;\n}\n\n.tabs.is-boxed a {\n  border: 1px solid transparent;\n  border-radius: 4px 4px 0 0;\n}\n\n.tabs.is-boxed a:hover {\n  background-color: whitesmoke;\n  border-bottom-color: #dbdbdb;\n}\n\n.tabs.is-boxed li.is-active a {\n  background-color: white;\n  border-color: #dbdbdb;\n  border-bottom-color: transparent !important;\n}\n\n.tabs.is-fullwidth li {\n  flex-grow: 1;\n  flex-shrink: 0;\n}\n\n.tabs.is-toggle a {\n  border-color: #dbdbdb;\n  border-style: solid;\n  border-width: 1px;\n  margin-bottom: 0;\n  position: relative;\n}\n\n.tabs.is-toggle a:hover {\n  background-color: whitesmoke;\n  border-color: #b5b5b5;\n  z-index: 2;\n}\n\n.tabs.is-toggle li + li {\n  margin-left: -1px;\n}\n\n.tabs.is-toggle li:first-child a {\n  border-radius: 4px 0 0 4px;\n}\n\n.tabs.is-toggle li:last-child a {\n  border-radius: 0 4px 4px 0;\n}\n\n.tabs.is-toggle li.is-active a {\n  background-color: #3273dc;\n  border-color: #3273dc;\n  color: #fff;\n  z-index: 1;\n}\n\n.tabs.is-toggle ul {\n  border-bottom: none;\n}\n\n.tabs.is-toggle.is-toggle-rounded li:first-child a {\n  border-bottom-left-radius: 290486px;\n  border-top-left-radius: 290486px;\n  padding-left: 1.25em;\n}\n\n.tabs.is-toggle.is-toggle-rounded li:last-child a {\n  border-bottom-right-radius: 290486px;\n  border-top-right-radius: 290486px;\n  padding-right: 1.25em;\n}\n\n.tabs.is-small {\n  font-size: 0.75rem;\n}\n\n.tabs.is-medium {\n  font-size: 1.25rem;\n}\n\n.tabs.is-large {\n  font-size: 1.5rem;\n}\n\n.column {\n  display: block;\n  flex-basis: 0;\n  flex-grow: 1;\n  flex-shrink: 1;\n  padding: 0.75rem;\n}\n\n.columns.is-mobile > .column.is-narrow {\n  flex: none;\n}\n\n.columns.is-mobile > .column.is-full {\n  flex: none;\n  width: 100%;\n}\n\n.columns.is-mobile > .column.is-three-quarters {\n  flex: none;\n  width: 75%;\n}\n\n.columns.is-mobile > .column.is-two-thirds {\n  flex: none;\n  width: 66.6666%;\n}\n\n.columns.is-mobile > .column.is-half {\n  flex: none;\n  width: 50%;\n}\n\n.columns.is-mobile > .column.is-one-third {\n  flex: none;\n  width: 33.3333%;\n}\n\n.columns.is-mobile > .column.is-one-quarter {\n  flex: none;\n  width: 25%;\n}\n\n.columns.is-mobile > .column.is-one-fifth {\n  flex: none;\n  width: 20%;\n}\n\n.columns.is-mobile > .column.is-two-fifths {\n  flex: none;\n  width: 40%;\n}\n\n.columns.is-mobile > .column.is-three-fifths {\n  flex: none;\n  width: 60%;\n}\n\n.columns.is-mobile > .column.is-four-fifths {\n  flex: none;\n  width: 80%;\n}\n\n.columns.is-mobile > .column.is-offset-three-quarters {\n  margin-left: 75%;\n}\n\n.columns.is-mobile > .column.is-offset-two-thirds {\n  margin-left: 66.6666%;\n}\n\n.columns.is-mobile > .column.is-offset-half {\n  margin-left: 50%;\n}\n\n.columns.is-mobile > .column.is-offset-one-third {\n  margin-left: 33.3333%;\n}\n\n.columns.is-mobile > .column.is-offset-one-quarter {\n  margin-left: 25%;\n}\n\n.columns.is-mobile > .column.is-offset-one-fifth {\n  margin-left: 20%;\n}\n\n.columns.is-mobile > .column.is-offset-two-fifths {\n  margin-left: 40%;\n}\n\n.columns.is-mobile > .column.is-offset-three-fifths {\n  margin-left: 60%;\n}\n\n.columns.is-mobile > .column.is-offset-four-fifths {\n  margin-left: 80%;\n}\n\n.columns.is-mobile > .column.is-0 {\n  flex: none;\n  width: 0%;\n}\n\n.columns.is-mobile > .column.is-offset-0 {\n  margin-left: 0%;\n}\n\n.columns.is-mobile > .column.is-1 {\n  flex: none;\n  width: 8.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-1 {\n  margin-left: 8.33333%;\n}\n\n.columns.is-mobile > .column.is-2 {\n  flex: none;\n  width: 16.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-2 {\n  margin-left: 16.66667%;\n}\n\n.columns.is-mobile > .column.is-3 {\n  flex: none;\n  width: 25%;\n}\n\n.columns.is-mobile > .column.is-offset-3 {\n  margin-left: 25%;\n}\n\n.columns.is-mobile > .column.is-4 {\n  flex: none;\n  width: 33.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-4 {\n  margin-left: 33.33333%;\n}\n\n.columns.is-mobile > .column.is-5 {\n  flex: none;\n  width: 41.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-5 {\n  margin-left: 41.66667%;\n}\n\n.columns.is-mobile > .column.is-6 {\n  flex: none;\n  width: 50%;\n}\n\n.columns.is-mobile > .column.is-offset-6 {\n  margin-left: 50%;\n}\n\n.columns.is-mobile > .column.is-7 {\n  flex: none;\n  width: 58.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-7 {\n  margin-left: 58.33333%;\n}\n\n.columns.is-mobile > .column.is-8 {\n  flex: none;\n  width: 66.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-8 {\n  margin-left: 66.66667%;\n}\n\n.columns.is-mobile > .column.is-9 {\n  flex: none;\n  width: 75%;\n}\n\n.columns.is-mobile > .column.is-offset-9 {\n  margin-left: 75%;\n}\n\n.columns.is-mobile > .column.is-10 {\n  flex: none;\n  width: 83.33333%;\n}\n\n.columns.is-mobile > .column.is-offset-10 {\n  margin-left: 83.33333%;\n}\n\n.columns.is-mobile > .column.is-11 {\n  flex: none;\n  width: 91.66667%;\n}\n\n.columns.is-mobile > .column.is-offset-11 {\n  margin-left: 91.66667%;\n}\n\n.columns.is-mobile > .column.is-12 {\n  flex: none;\n  width: 100%;\n}\n\n.columns.is-mobile > .column.is-offset-12 {\n  margin-left: 100%;\n}\n\n@media screen and (max-width: 768px) {\n  .column.is-narrow-mobile {\n    flex: none;\n  }\n  .column.is-full-mobile {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-mobile {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-mobile {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-mobile {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-mobile {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-mobile {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-mobile {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-mobile {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-mobile {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-mobile {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-mobile {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-mobile {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-mobile {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-mobile {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-mobile {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-mobile {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-mobile {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-mobile {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-mobile {\n    margin-left: 80%;\n  }\n  .column.is-0-mobile {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-mobile {\n    margin-left: 0%;\n  }\n  .column.is-1-mobile {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-mobile {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-mobile {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-mobile {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-mobile {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-mobile {\n    margin-left: 25%;\n  }\n  .column.is-4-mobile {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-mobile {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-mobile {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-mobile {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-mobile {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-mobile {\n    margin-left: 50%;\n  }\n  .column.is-7-mobile {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-mobile {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-mobile {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-mobile {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-mobile {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-mobile {\n    margin-left: 75%;\n  }\n  .column.is-10-mobile {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-mobile {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-mobile {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-mobile {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-mobile {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-mobile {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .column.is-narrow, .column.is-narrow-tablet {\n    flex: none;\n  }\n  .column.is-full, .column.is-full-tablet {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters, .column.is-three-quarters-tablet {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds, .column.is-two-thirds-tablet {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half, .column.is-half-tablet {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third, .column.is-one-third-tablet {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter, .column.is-one-quarter-tablet {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth, .column.is-one-fifth-tablet {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths, .column.is-two-fifths-tablet {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths, .column.is-three-fifths-tablet {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths, .column.is-four-fifths-tablet {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters, .column.is-offset-three-quarters-tablet {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds, .column.is-offset-two-thirds-tablet {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half, .column.is-offset-half-tablet {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third, .column.is-offset-one-third-tablet {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter, .column.is-offset-one-quarter-tablet {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth, .column.is-offset-one-fifth-tablet {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths, .column.is-offset-two-fifths-tablet {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths, .column.is-offset-three-fifths-tablet {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths, .column.is-offset-four-fifths-tablet {\n    margin-left: 80%;\n  }\n  .column.is-0, .column.is-0-tablet {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0, .column.is-offset-0-tablet {\n    margin-left: 0%;\n  }\n  .column.is-1, .column.is-1-tablet {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1, .column.is-offset-1-tablet {\n    margin-left: 8.33333%;\n  }\n  .column.is-2, .column.is-2-tablet {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2, .column.is-offset-2-tablet {\n    margin-left: 16.66667%;\n  }\n  .column.is-3, .column.is-3-tablet {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3, .column.is-offset-3-tablet {\n    margin-left: 25%;\n  }\n  .column.is-4, .column.is-4-tablet {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4, .column.is-offset-4-tablet {\n    margin-left: 33.33333%;\n  }\n  .column.is-5, .column.is-5-tablet {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5, .column.is-offset-5-tablet {\n    margin-left: 41.66667%;\n  }\n  .column.is-6, .column.is-6-tablet {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6, .column.is-offset-6-tablet {\n    margin-left: 50%;\n  }\n  .column.is-7, .column.is-7-tablet {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7, .column.is-offset-7-tablet {\n    margin-left: 58.33333%;\n  }\n  .column.is-8, .column.is-8-tablet {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8, .column.is-offset-8-tablet {\n    margin-left: 66.66667%;\n  }\n  .column.is-9, .column.is-9-tablet {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9, .column.is-offset-9-tablet {\n    margin-left: 75%;\n  }\n  .column.is-10, .column.is-10-tablet {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10, .column.is-offset-10-tablet {\n    margin-left: 83.33333%;\n  }\n  .column.is-11, .column.is-11-tablet {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11, .column.is-offset-11-tablet {\n    margin-left: 91.66667%;\n  }\n  .column.is-12, .column.is-12-tablet {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12, .column.is-offset-12-tablet {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .column.is-narrow-touch {\n    flex: none;\n  }\n  .column.is-full-touch {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-touch {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-touch {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-touch {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-touch {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-touch {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-touch {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-touch {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-touch {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-touch {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-touch {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-touch {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-touch {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-touch {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-touch {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-touch {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-touch {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-touch {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-touch {\n    margin-left: 80%;\n  }\n  .column.is-0-touch {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-touch {\n    margin-left: 0%;\n  }\n  .column.is-1-touch {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-touch {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-touch {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-touch {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-touch {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-touch {\n    margin-left: 25%;\n  }\n  .column.is-4-touch {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-touch {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-touch {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-touch {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-touch {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-touch {\n    margin-left: 50%;\n  }\n  .column.is-7-touch {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-touch {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-touch {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-touch {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-touch {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-touch {\n    margin-left: 75%;\n  }\n  .column.is-10-touch {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-touch {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-touch {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-touch {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-touch {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-touch {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .column.is-narrow-desktop {\n    flex: none;\n  }\n  .column.is-full-desktop {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-desktop {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-desktop {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-desktop {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-desktop {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-desktop {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-desktop {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-desktop {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-desktop {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-desktop {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-desktop {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-desktop {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-desktop {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-desktop {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-desktop {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-desktop {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-desktop {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-desktop {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-desktop {\n    margin-left: 80%;\n  }\n  .column.is-0-desktop {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-desktop {\n    margin-left: 0%;\n  }\n  .column.is-1-desktop {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-desktop {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-desktop {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-desktop {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-desktop {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-desktop {\n    margin-left: 25%;\n  }\n  .column.is-4-desktop {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-desktop {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-desktop {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-desktop {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-desktop {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-desktop {\n    margin-left: 50%;\n  }\n  .column.is-7-desktop {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-desktop {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-desktop {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-desktop {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-desktop {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-desktop {\n    margin-left: 75%;\n  }\n  .column.is-10-desktop {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-desktop {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-desktop {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-desktop {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-desktop {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-desktop {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .column.is-narrow-widescreen {\n    flex: none;\n  }\n  .column.is-full-widescreen {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-widescreen {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-widescreen {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-widescreen {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-widescreen {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-widescreen {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-widescreen {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-widescreen {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-widescreen {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-widescreen {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-widescreen {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-widescreen {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-widescreen {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-widescreen {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-widescreen {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-widescreen {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-widescreen {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-widescreen {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-widescreen {\n    margin-left: 80%;\n  }\n  .column.is-0-widescreen {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-widescreen {\n    margin-left: 0%;\n  }\n  .column.is-1-widescreen {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-widescreen {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-widescreen {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-widescreen {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-widescreen {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-widescreen {\n    margin-left: 25%;\n  }\n  .column.is-4-widescreen {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-widescreen {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-widescreen {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-widescreen {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-widescreen {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-widescreen {\n    margin-left: 50%;\n  }\n  .column.is-7-widescreen {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-widescreen {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-widescreen {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-widescreen {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-widescreen {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-widescreen {\n    margin-left: 75%;\n  }\n  .column.is-10-widescreen {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-widescreen {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-widescreen {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-widescreen {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-widescreen {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-widescreen {\n    margin-left: 100%;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .column.is-narrow-fullhd {\n    flex: none;\n  }\n  .column.is-full-fullhd {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-three-quarters-fullhd {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-two-thirds-fullhd {\n    flex: none;\n    width: 66.6666%;\n  }\n  .column.is-half-fullhd {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-one-third-fullhd {\n    flex: none;\n    width: 33.3333%;\n  }\n  .column.is-one-quarter-fullhd {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-one-fifth-fullhd {\n    flex: none;\n    width: 20%;\n  }\n  .column.is-two-fifths-fullhd {\n    flex: none;\n    width: 40%;\n  }\n  .column.is-three-fifths-fullhd {\n    flex: none;\n    width: 60%;\n  }\n  .column.is-four-fifths-fullhd {\n    flex: none;\n    width: 80%;\n  }\n  .column.is-offset-three-quarters-fullhd {\n    margin-left: 75%;\n  }\n  .column.is-offset-two-thirds-fullhd {\n    margin-left: 66.6666%;\n  }\n  .column.is-offset-half-fullhd {\n    margin-left: 50%;\n  }\n  .column.is-offset-one-third-fullhd {\n    margin-left: 33.3333%;\n  }\n  .column.is-offset-one-quarter-fullhd {\n    margin-left: 25%;\n  }\n  .column.is-offset-one-fifth-fullhd {\n    margin-left: 20%;\n  }\n  .column.is-offset-two-fifths-fullhd {\n    margin-left: 40%;\n  }\n  .column.is-offset-three-fifths-fullhd {\n    margin-left: 60%;\n  }\n  .column.is-offset-four-fifths-fullhd {\n    margin-left: 80%;\n  }\n  .column.is-0-fullhd {\n    flex: none;\n    width: 0%;\n  }\n  .column.is-offset-0-fullhd {\n    margin-left: 0%;\n  }\n  .column.is-1-fullhd {\n    flex: none;\n    width: 8.33333%;\n  }\n  .column.is-offset-1-fullhd {\n    margin-left: 8.33333%;\n  }\n  .column.is-2-fullhd {\n    flex: none;\n    width: 16.66667%;\n  }\n  .column.is-offset-2-fullhd {\n    margin-left: 16.66667%;\n  }\n  .column.is-3-fullhd {\n    flex: none;\n    width: 25%;\n  }\n  .column.is-offset-3-fullhd {\n    margin-left: 25%;\n  }\n  .column.is-4-fullhd {\n    flex: none;\n    width: 33.33333%;\n  }\n  .column.is-offset-4-fullhd {\n    margin-left: 33.33333%;\n  }\n  .column.is-5-fullhd {\n    flex: none;\n    width: 41.66667%;\n  }\n  .column.is-offset-5-fullhd {\n    margin-left: 41.66667%;\n  }\n  .column.is-6-fullhd {\n    flex: none;\n    width: 50%;\n  }\n  .column.is-offset-6-fullhd {\n    margin-left: 50%;\n  }\n  .column.is-7-fullhd {\n    flex: none;\n    width: 58.33333%;\n  }\n  .column.is-offset-7-fullhd {\n    margin-left: 58.33333%;\n  }\n  .column.is-8-fullhd {\n    flex: none;\n    width: 66.66667%;\n  }\n  .column.is-offset-8-fullhd {\n    margin-left: 66.66667%;\n  }\n  .column.is-9-fullhd {\n    flex: none;\n    width: 75%;\n  }\n  .column.is-offset-9-fullhd {\n    margin-left: 75%;\n  }\n  .column.is-10-fullhd {\n    flex: none;\n    width: 83.33333%;\n  }\n  .column.is-offset-10-fullhd {\n    margin-left: 83.33333%;\n  }\n  .column.is-11-fullhd {\n    flex: none;\n    width: 91.66667%;\n  }\n  .column.is-offset-11-fullhd {\n    margin-left: 91.66667%;\n  }\n  .column.is-12-fullhd {\n    flex: none;\n    width: 100%;\n  }\n  .column.is-offset-12-fullhd {\n    margin-left: 100%;\n  }\n}\n\n.columns {\n  margin-left: -0.75rem;\n  margin-right: -0.75rem;\n  margin-top: -0.75rem;\n}\n\n.columns:last-child {\n  margin-bottom: -0.75rem;\n}\n\n.columns:not(:last-child) {\n  margin-bottom: calc(1.5rem - 0.75rem);\n}\n\n.columns.is-centered {\n  justify-content: center;\n}\n\n.columns.is-gapless {\n  margin-left: 0;\n  margin-right: 0;\n  margin-top: 0;\n}\n\n.columns.is-gapless > .column {\n  margin: 0;\n  padding: 0 !important;\n}\n\n.columns.is-gapless:not(:last-child) {\n  margin-bottom: 1.5rem;\n}\n\n.columns.is-gapless:last-child {\n  margin-bottom: 0;\n}\n\n.columns.is-mobile {\n  display: flex;\n}\n\n.columns.is-multiline {\n  flex-wrap: wrap;\n}\n\n.columns.is-vcentered {\n  align-items: center;\n}\n\n@media screen and (min-width: 769px), print {\n  .columns:not(.is-desktop) {\n    display: flex;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-desktop {\n    display: flex;\n  }\n}\n\n.columns.is-variable {\n  --columnGap: 0.75rem;\n  margin-left: calc(-1 * var(--columnGap));\n  margin-right: calc(-1 * var(--columnGap));\n}\n\n.columns.is-variable .column {\n  padding-left: var(--columnGap);\n  padding-right: var(--columnGap);\n}\n\n.columns.is-variable.is-0 {\n  --columnGap: 0rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-0-mobile {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-0-tablet {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-0-tablet-only {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-0-touch {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-0-desktop {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-0-desktop-only {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-0-widescreen {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-0-widescreen-only {\n    --columnGap: 0rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-0-fullhd {\n    --columnGap: 0rem;\n  }\n}\n\n.columns.is-variable.is-1 {\n  --columnGap: 0.25rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-1-mobile {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-1-tablet {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-1-tablet-only {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-1-touch {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-1-desktop {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-1-desktop-only {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-1-widescreen {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-1-widescreen-only {\n    --columnGap: 0.25rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-1-fullhd {\n    --columnGap: 0.25rem;\n  }\n}\n\n.columns.is-variable.is-2 {\n  --columnGap: 0.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-2-mobile {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-2-tablet {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-2-tablet-only {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-2-touch {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-2-desktop {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-2-desktop-only {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-2-widescreen {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-2-widescreen-only {\n    --columnGap: 0.5rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-2-fullhd {\n    --columnGap: 0.5rem;\n  }\n}\n\n.columns.is-variable.is-3 {\n  --columnGap: 0.75rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-3-mobile {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-3-tablet {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-3-tablet-only {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-3-touch {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-3-desktop {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-3-desktop-only {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-3-widescreen {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-3-widescreen-only {\n    --columnGap: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-3-fullhd {\n    --columnGap: 0.75rem;\n  }\n}\n\n.columns.is-variable.is-4 {\n  --columnGap: 1rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-4-mobile {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-4-tablet {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-4-tablet-only {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-4-touch {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-4-desktop {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-4-desktop-only {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-4-widescreen {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-4-widescreen-only {\n    --columnGap: 1rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-4-fullhd {\n    --columnGap: 1rem;\n  }\n}\n\n.columns.is-variable.is-5 {\n  --columnGap: 1.25rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-5-mobile {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-5-tablet {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-5-tablet-only {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-5-touch {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-5-desktop {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-5-desktop-only {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-5-widescreen {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-5-widescreen-only {\n    --columnGap: 1.25rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-5-fullhd {\n    --columnGap: 1.25rem;\n  }\n}\n\n.columns.is-variable.is-6 {\n  --columnGap: 1.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-6-mobile {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-6-tablet {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-6-tablet-only {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-6-touch {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-6-desktop {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-6-desktop-only {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-6-widescreen {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-6-widescreen-only {\n    --columnGap: 1.5rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-6-fullhd {\n    --columnGap: 1.5rem;\n  }\n}\n\n.columns.is-variable.is-7 {\n  --columnGap: 1.75rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-7-mobile {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-7-tablet {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-7-tablet-only {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-7-touch {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-7-desktop {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-7-desktop-only {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-7-widescreen {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-7-widescreen-only {\n    --columnGap: 1.75rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-7-fullhd {\n    --columnGap: 1.75rem;\n  }\n}\n\n.columns.is-variable.is-8 {\n  --columnGap: 2rem;\n}\n\n@media screen and (max-width: 768px) {\n  .columns.is-variable.is-8-mobile {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .columns.is-variable.is-8-tablet {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 769px) and (max-width: 1023px) {\n  .columns.is-variable.is-8-tablet-only {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (max-width: 1023px) {\n  .columns.is-variable.is-8-touch {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1024px) {\n  .columns.is-variable.is-8-desktop {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1024px) and (max-width: 1215px) {\n  .columns.is-variable.is-8-desktop-only {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1216px) {\n  .columns.is-variable.is-8-widescreen {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1216px) and (max-width: 1407px) {\n  .columns.is-variable.is-8-widescreen-only {\n    --columnGap: 2rem;\n  }\n}\n\n@media screen and (min-width: 1408px) {\n  .columns.is-variable.is-8-fullhd {\n    --columnGap: 2rem;\n  }\n}\n\n.tile {\n  align-items: stretch;\n  display: block;\n  flex-basis: 0;\n  flex-grow: 1;\n  flex-shrink: 1;\n  min-height: -webkit-min-content;\n  min-height: -moz-min-content;\n  min-height: min-content;\n}\n\n.tile.is-ancestor {\n  margin-left: -0.75rem;\n  margin-right: -0.75rem;\n  margin-top: -0.75rem;\n}\n\n.tile.is-ancestor:last-child {\n  margin-bottom: -0.75rem;\n}\n\n.tile.is-ancestor:not(:last-child) {\n  margin-bottom: 0.75rem;\n}\n\n.tile.is-child {\n  margin: 0 !important;\n}\n\n.tile.is-parent {\n  padding: 0.75rem;\n}\n\n.tile.is-vertical {\n  flex-direction: column;\n}\n\n.tile.is-vertical > .tile.is-child:not(:last-child) {\n  margin-bottom: 1.5rem !important;\n}\n\n@media screen and (min-width: 769px), print {\n  .tile:not(.is-child) {\n    display: flex;\n  }\n  .tile.is-1 {\n    flex: none;\n    width: 8.33333%;\n  }\n  .tile.is-2 {\n    flex: none;\n    width: 16.66667%;\n  }\n  .tile.is-3 {\n    flex: none;\n    width: 25%;\n  }\n  .tile.is-4 {\n    flex: none;\n    width: 33.33333%;\n  }\n  .tile.is-5 {\n    flex: none;\n    width: 41.66667%;\n  }\n  .tile.is-6 {\n    flex: none;\n    width: 50%;\n  }\n  .tile.is-7 {\n    flex: none;\n    width: 58.33333%;\n  }\n  .tile.is-8 {\n    flex: none;\n    width: 66.66667%;\n  }\n  .tile.is-9 {\n    flex: none;\n    width: 75%;\n  }\n  .tile.is-10 {\n    flex: none;\n    width: 83.33333%;\n  }\n  .tile.is-11 {\n    flex: none;\n    width: 91.66667%;\n  }\n  .tile.is-12 {\n    flex: none;\n    width: 100%;\n  }\n}\n\n.hero {\n  align-items: stretch;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n}\n\n.hero .navbar {\n  background: none;\n}\n\n.hero .tabs ul {\n  border-bottom: none;\n}\n\n.hero.is-white {\n  background-color: white;\n  color: #0a0a0a;\n}\n\n.hero.is-white a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-white strong {\n  color: inherit;\n}\n\n.hero.is-white .title {\n  color: #0a0a0a;\n}\n\n.hero.is-white .subtitle {\n  color: rgba(10, 10, 10, 0.9);\n}\n\n.hero.is-white .subtitle a:not(.button),\n.hero.is-white .subtitle strong {\n  color: #0a0a0a;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-white .navbar-menu {\n    background-color: white;\n  }\n}\n\n.hero.is-white .navbar-item,\n.hero.is-white .navbar-link {\n  color: rgba(10, 10, 10, 0.7);\n}\n\n.hero.is-white a.navbar-item:hover, .hero.is-white a.navbar-item.is-active,\n.hero.is-white .navbar-link:hover,\n.hero.is-white .navbar-link.is-active {\n  background-color: #f2f2f2;\n  color: #0a0a0a;\n}\n\n.hero.is-white .tabs a {\n  color: #0a0a0a;\n  opacity: 0.9;\n}\n\n.hero.is-white .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-white .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-white .tabs.is-boxed a, .hero.is-white .tabs.is-toggle a {\n  color: #0a0a0a;\n}\n\n.hero.is-white .tabs.is-boxed a:hover, .hero.is-white .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-white .tabs.is-boxed li.is-active a, .hero.is-white .tabs.is-boxed li.is-active a:hover, .hero.is-white .tabs.is-toggle li.is-active a, .hero.is-white .tabs.is-toggle li.is-active a:hover {\n  background-color: #0a0a0a;\n  border-color: #0a0a0a;\n  color: white;\n}\n\n.hero.is-white.is-bold {\n  background-image: linear-gradient(141deg, #e6e6e6 0%, white 71%, white 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-white.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #e6e6e6 0%, white 71%, white 100%);\n  }\n}\n\n.hero.is-black {\n  background-color: #0a0a0a;\n  color: white;\n}\n\n.hero.is-black a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-black strong {\n  color: inherit;\n}\n\n.hero.is-black .title {\n  color: white;\n}\n\n.hero.is-black .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-black .subtitle a:not(.button),\n.hero.is-black .subtitle strong {\n  color: white;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-black .navbar-menu {\n    background-color: #0a0a0a;\n  }\n}\n\n.hero.is-black .navbar-item,\n.hero.is-black .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-black a.navbar-item:hover, .hero.is-black a.navbar-item.is-active,\n.hero.is-black .navbar-link:hover,\n.hero.is-black .navbar-link.is-active {\n  background-color: black;\n  color: white;\n}\n\n.hero.is-black .tabs a {\n  color: white;\n  opacity: 0.9;\n}\n\n.hero.is-black .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-black .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-black .tabs.is-boxed a, .hero.is-black .tabs.is-toggle a {\n  color: white;\n}\n\n.hero.is-black .tabs.is-boxed a:hover, .hero.is-black .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-black .tabs.is-boxed li.is-active a, .hero.is-black .tabs.is-boxed li.is-active a:hover, .hero.is-black .tabs.is-toggle li.is-active a, .hero.is-black .tabs.is-toggle li.is-active a:hover {\n  background-color: white;\n  border-color: white;\n  color: #0a0a0a;\n}\n\n.hero.is-black.is-bold {\n  background-image: linear-gradient(141deg, black 0%, #0a0a0a 71%, #181616 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-black.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, black 0%, #0a0a0a 71%, #181616 100%);\n  }\n}\n\n.hero.is-light {\n  background-color: whitesmoke;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-light a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-light strong {\n  color: inherit;\n}\n\n.hero.is-light .title {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-light .subtitle {\n  color: rgba(0, 0, 0, 0.9);\n}\n\n.hero.is-light .subtitle a:not(.button),\n.hero.is-light .subtitle strong {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-light .navbar-menu {\n    background-color: whitesmoke;\n  }\n}\n\n.hero.is-light .navbar-item,\n.hero.is-light .navbar-link {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-light a.navbar-item:hover, .hero.is-light a.navbar-item.is-active,\n.hero.is-light .navbar-link:hover,\n.hero.is-light .navbar-link.is-active {\n  background-color: #e8e8e8;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-light .tabs a {\n  color: rgba(0, 0, 0, 0.7);\n  opacity: 0.9;\n}\n\n.hero.is-light .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-light .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-light .tabs.is-boxed a, .hero.is-light .tabs.is-toggle a {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-light .tabs.is-boxed a:hover, .hero.is-light .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-light .tabs.is-boxed li.is-active a, .hero.is-light .tabs.is-boxed li.is-active a:hover, .hero.is-light .tabs.is-toggle li.is-active a, .hero.is-light .tabs.is-toggle li.is-active a:hover {\n  background-color: rgba(0, 0, 0, 0.7);\n  border-color: rgba(0, 0, 0, 0.7);\n  color: whitesmoke;\n}\n\n.hero.is-light.is-bold {\n  background-image: linear-gradient(141deg, #dfd8d9 0%, whitesmoke 71%, white 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-light.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #dfd8d9 0%, whitesmoke 71%, white 100%);\n  }\n}\n\n.hero.is-dark {\n  background-color: #363636;\n  color: #fff;\n}\n\n.hero.is-dark a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-dark strong {\n  color: inherit;\n}\n\n.hero.is-dark .title {\n  color: #fff;\n}\n\n.hero.is-dark .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-dark .subtitle a:not(.button),\n.hero.is-dark .subtitle strong {\n  color: #fff;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-dark .navbar-menu {\n    background-color: #363636;\n  }\n}\n\n.hero.is-dark .navbar-item,\n.hero.is-dark .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-dark a.navbar-item:hover, .hero.is-dark a.navbar-item.is-active,\n.hero.is-dark .navbar-link:hover,\n.hero.is-dark .navbar-link.is-active {\n  background-color: #292929;\n  color: #fff;\n}\n\n.hero.is-dark .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-dark .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-dark .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-dark .tabs.is-boxed a, .hero.is-dark .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-dark .tabs.is-boxed a:hover, .hero.is-dark .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-dark .tabs.is-boxed li.is-active a, .hero.is-dark .tabs.is-boxed li.is-active a:hover, .hero.is-dark .tabs.is-toggle li.is-active a, .hero.is-dark .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #363636;\n}\n\n.hero.is-dark.is-bold {\n  background-image: linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-dark.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%);\n  }\n}\n\n.hero.is-primary {\n  background-color: #00d1b2;\n  color: #fff;\n}\n\n.hero.is-primary a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-primary strong {\n  color: inherit;\n}\n\n.hero.is-primary .title {\n  color: #fff;\n}\n\n.hero.is-primary .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-primary .subtitle a:not(.button),\n.hero.is-primary .subtitle strong {\n  color: #fff;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-primary .navbar-menu {\n    background-color: #00d1b2;\n  }\n}\n\n.hero.is-primary .navbar-item,\n.hero.is-primary .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-primary a.navbar-item:hover, .hero.is-primary a.navbar-item.is-active,\n.hero.is-primary .navbar-link:hover,\n.hero.is-primary .navbar-link.is-active {\n  background-color: #00b89c;\n  color: #fff;\n}\n\n.hero.is-primary .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-primary .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-primary .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-primary .tabs.is-boxed a, .hero.is-primary .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-primary .tabs.is-boxed a:hover, .hero.is-primary .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-primary .tabs.is-boxed li.is-active a, .hero.is-primary .tabs.is-boxed li.is-active a:hover, .hero.is-primary .tabs.is-toggle li.is-active a, .hero.is-primary .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #00d1b2;\n}\n\n.hero.is-primary.is-bold {\n  background-image: linear-gradient(141deg, #009e6c 0%, #00d1b2 71%, #00e7eb 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-primary.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #009e6c 0%, #00d1b2 71%, #00e7eb 100%);\n  }\n}\n\n.hero.is-link {\n  background-color: #3273dc;\n  color: #fff;\n}\n\n.hero.is-link a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-link strong {\n  color: inherit;\n}\n\n.hero.is-link .title {\n  color: #fff;\n}\n\n.hero.is-link .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-link .subtitle a:not(.button),\n.hero.is-link .subtitle strong {\n  color: #fff;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-link .navbar-menu {\n    background-color: #3273dc;\n  }\n}\n\n.hero.is-link .navbar-item,\n.hero.is-link .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-link a.navbar-item:hover, .hero.is-link a.navbar-item.is-active,\n.hero.is-link .navbar-link:hover,\n.hero.is-link .navbar-link.is-active {\n  background-color: #2366d1;\n  color: #fff;\n}\n\n.hero.is-link .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-link .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-link .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-link .tabs.is-boxed a, .hero.is-link .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-link .tabs.is-boxed a:hover, .hero.is-link .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-link .tabs.is-boxed li.is-active a, .hero.is-link .tabs.is-boxed li.is-active a:hover, .hero.is-link .tabs.is-toggle li.is-active a, .hero.is-link .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #3273dc;\n}\n\n.hero.is-link.is-bold {\n  background-image: linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-link.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%);\n  }\n}\n\n.hero.is-info {\n  background-color: #3298dc;\n  color: #fff;\n}\n\n.hero.is-info a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-info strong {\n  color: inherit;\n}\n\n.hero.is-info .title {\n  color: #fff;\n}\n\n.hero.is-info .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-info .subtitle a:not(.button),\n.hero.is-info .subtitle strong {\n  color: #fff;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-info .navbar-menu {\n    background-color: #3298dc;\n  }\n}\n\n.hero.is-info .navbar-item,\n.hero.is-info .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-info a.navbar-item:hover, .hero.is-info a.navbar-item.is-active,\n.hero.is-info .navbar-link:hover,\n.hero.is-info .navbar-link.is-active {\n  background-color: #238cd1;\n  color: #fff;\n}\n\n.hero.is-info .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-info .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-info .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-info .tabs.is-boxed a, .hero.is-info .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-info .tabs.is-boxed a:hover, .hero.is-info .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-info .tabs.is-boxed li.is-active a, .hero.is-info .tabs.is-boxed li.is-active a:hover, .hero.is-info .tabs.is-toggle li.is-active a, .hero.is-info .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #3298dc;\n}\n\n.hero.is-info.is-bold {\n  background-image: linear-gradient(141deg, #159dc6 0%, #3298dc 71%, #4389e5 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-info.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #159dc6 0%, #3298dc 71%, #4389e5 100%);\n  }\n}\n\n.hero.is-success {\n  background-color: #48c774;\n  color: #fff;\n}\n\n.hero.is-success a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-success strong {\n  color: inherit;\n}\n\n.hero.is-success .title {\n  color: #fff;\n}\n\n.hero.is-success .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-success .subtitle a:not(.button),\n.hero.is-success .subtitle strong {\n  color: #fff;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-success .navbar-menu {\n    background-color: #48c774;\n  }\n}\n\n.hero.is-success .navbar-item,\n.hero.is-success .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-success a.navbar-item:hover, .hero.is-success a.navbar-item.is-active,\n.hero.is-success .navbar-link:hover,\n.hero.is-success .navbar-link.is-active {\n  background-color: #3abb67;\n  color: #fff;\n}\n\n.hero.is-success .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-success .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-success .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-success .tabs.is-boxed a, .hero.is-success .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-success .tabs.is-boxed a:hover, .hero.is-success .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-success .tabs.is-boxed li.is-active a, .hero.is-success .tabs.is-boxed li.is-active a:hover, .hero.is-success .tabs.is-toggle li.is-active a, .hero.is-success .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #48c774;\n}\n\n.hero.is-success.is-bold {\n  background-image: linear-gradient(141deg, #29b342 0%, #48c774 71%, #56d296 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-success.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #29b342 0%, #48c774 71%, #56d296 100%);\n  }\n}\n\n.hero.is-warning {\n  background-color: #ffdd57;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-warning strong {\n  color: inherit;\n}\n\n.hero.is-warning .title {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .subtitle {\n  color: rgba(0, 0, 0, 0.9);\n}\n\n.hero.is-warning .subtitle a:not(.button),\n.hero.is-warning .subtitle strong {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-warning .navbar-menu {\n    background-color: #ffdd57;\n  }\n}\n\n.hero.is-warning .navbar-item,\n.hero.is-warning .navbar-link {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning a.navbar-item:hover, .hero.is-warning a.navbar-item.is-active,\n.hero.is-warning .navbar-link:hover,\n.hero.is-warning .navbar-link.is-active {\n  background-color: #ffd83d;\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .tabs a {\n  color: rgba(0, 0, 0, 0.7);\n  opacity: 0.9;\n}\n\n.hero.is-warning .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-warning .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-warning .tabs.is-boxed a, .hero.is-warning .tabs.is-toggle a {\n  color: rgba(0, 0, 0, 0.7);\n}\n\n.hero.is-warning .tabs.is-boxed a:hover, .hero.is-warning .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-warning .tabs.is-boxed li.is-active a, .hero.is-warning .tabs.is-boxed li.is-active a:hover, .hero.is-warning .tabs.is-toggle li.is-active a, .hero.is-warning .tabs.is-toggle li.is-active a:hover {\n  background-color: rgba(0, 0, 0, 0.7);\n  border-color: rgba(0, 0, 0, 0.7);\n  color: #ffdd57;\n}\n\n.hero.is-warning.is-bold {\n  background-image: linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-warning.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%);\n  }\n}\n\n.hero.is-danger {\n  background-color: #f14668;\n  color: #fff;\n}\n\n.hero.is-danger a:not(.button):not(.dropdown-item):not(.tag):not(.pagination-link.is-current),\n.hero.is-danger strong {\n  color: inherit;\n}\n\n.hero.is-danger .title {\n  color: #fff;\n}\n\n.hero.is-danger .subtitle {\n  color: rgba(255, 255, 255, 0.9);\n}\n\n.hero.is-danger .subtitle a:not(.button),\n.hero.is-danger .subtitle strong {\n  color: #fff;\n}\n\n@media screen and (max-width: 1023px) {\n  .hero.is-danger .navbar-menu {\n    background-color: #f14668;\n  }\n}\n\n.hero.is-danger .navbar-item,\n.hero.is-danger .navbar-link {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n.hero.is-danger a.navbar-item:hover, .hero.is-danger a.navbar-item.is-active,\n.hero.is-danger .navbar-link:hover,\n.hero.is-danger .navbar-link.is-active {\n  background-color: #ef2e55;\n  color: #fff;\n}\n\n.hero.is-danger .tabs a {\n  color: #fff;\n  opacity: 0.9;\n}\n\n.hero.is-danger .tabs a:hover {\n  opacity: 1;\n}\n\n.hero.is-danger .tabs li.is-active a {\n  opacity: 1;\n}\n\n.hero.is-danger .tabs.is-boxed a, .hero.is-danger .tabs.is-toggle a {\n  color: #fff;\n}\n\n.hero.is-danger .tabs.is-boxed a:hover, .hero.is-danger .tabs.is-toggle a:hover {\n  background-color: rgba(10, 10, 10, 0.1);\n}\n\n.hero.is-danger .tabs.is-boxed li.is-active a, .hero.is-danger .tabs.is-boxed li.is-active a:hover, .hero.is-danger .tabs.is-toggle li.is-active a, .hero.is-danger .tabs.is-toggle li.is-active a:hover {\n  background-color: #fff;\n  border-color: #fff;\n  color: #f14668;\n}\n\n.hero.is-danger.is-bold {\n  background-image: linear-gradient(141deg, #fa0a62 0%, #f14668 71%, #f7595f 100%);\n}\n\n@media screen and (max-width: 768px) {\n  .hero.is-danger.is-bold .navbar-menu {\n    background-image: linear-gradient(141deg, #fa0a62 0%, #f14668 71%, #f7595f 100%);\n  }\n}\n\n.hero.is-small .hero-body {\n  padding-bottom: 1.5rem;\n  padding-top: 1.5rem;\n}\n\n@media screen and (min-width: 769px), print {\n  .hero.is-medium .hero-body {\n    padding-bottom: 9rem;\n    padding-top: 9rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero.is-large .hero-body {\n    padding-bottom: 18rem;\n    padding-top: 18rem;\n  }\n}\n\n.hero.is-halfheight .hero-body, .hero.is-fullheight .hero-body, .hero.is-fullheight-with-navbar .hero-body {\n  align-items: center;\n  display: flex;\n}\n\n.hero.is-halfheight .hero-body > .container, .hero.is-fullheight .hero-body > .container, .hero.is-fullheight-with-navbar .hero-body > .container {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.hero.is-halfheight {\n  min-height: 50vh;\n}\n\n.hero.is-fullheight {\n  min-height: 100vh;\n}\n\n.hero-video {\n  overflow: hidden;\n}\n\n.hero-video video {\n  left: 50%;\n  min-height: 100%;\n  min-width: 100%;\n  position: absolute;\n  top: 50%;\n  transform: translate3d(-50%, -50%, 0);\n}\n\n.hero-video.is-transparent {\n  opacity: 0.3;\n}\n\n@media screen and (max-width: 768px) {\n  .hero-video {\n    display: none;\n  }\n}\n\n.hero-buttons {\n  margin-top: 1.5rem;\n}\n\n@media screen and (max-width: 768px) {\n  .hero-buttons .button {\n    display: flex;\n  }\n  .hero-buttons .button:not(:last-child) {\n    margin-bottom: 0.75rem;\n  }\n}\n\n@media screen and (min-width: 769px), print {\n  .hero-buttons {\n    display: flex;\n    justify-content: center;\n  }\n  .hero-buttons .button:not(:last-child) {\n    margin-right: 1.5rem;\n  }\n}\n\n.hero-head,\n.hero-foot {\n  flex-grow: 0;\n  flex-shrink: 0;\n}\n\n.hero-body {\n  flex-grow: 1;\n  flex-shrink: 0;\n  padding: 3rem 1.5rem;\n}\n\n.section {\n  padding: 3rem 1.5rem;\n}\n\n@media screen and (min-width: 1024px) {\n  .section.is-medium {\n    padding: 9rem 1.5rem;\n  }\n  .section.is-large {\n    padding: 18rem 1.5rem;\n  }\n}\n\n.footer {\n  background-color: #fafafa;\n  padding: 3rem 1.5rem 6rem;\n}";
    styleInject(css);

    function n(e,t){for(const n in t)e[n]=t[n];return e}function a(e){return "function"==typeof e}function Ee(e){return e<.5?4*e*e*e:.5*Math.pow(2*e-2,3)+1}function Ie(e){const t=e-1;return t*t*t+1}function je(e,{delay:t=0,duration:n=400}){const s=+getComputedStyle(e).opacity;return {delay:t,duration:n,css:e=>`opacity: ${e*s}`}}function Le(e,{delay:t=0,duration:n=400,easing:s=Ie,x:i=0,y:o=0,opacity:a=0}){const c=getComputedStyle(e),l=+c.opacity,r="none"===c.transform?"":c.transform,u=l*(1-a);return {delay:t,duration:n,easing:s,css:(e,t)=>`\n\t\t\ttransform: ${r} translate(${(1-e)*i}px, ${(1-e)*o}px);\n\t\t\topacity: ${l-u*t}`}}var Be=Object.freeze({crossfade:function(e){var{fallback:t}=e,s=function(e,t){var n={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(n[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(s=Object.getOwnPropertySymbols(e);i<s.length;i++)t.indexOf(s[i])<0&&Object.prototype.propertyIsEnumerable.call(e,s[i])&&(n[s[i]]=e[s[i]]);}return n}(e,["fallback"]);const i=new Map,o=new Map;function c(e,i,o){return (c,l)=>(e.set(l.key,{rect:c.getBoundingClientRect()}),()=>{if(i.has(l.key)){const{rect:e}=i.get(l.key);return i.delete(l.key),function(e,t,i){const{delay:o=0,duration:c=(e=>30*Math.sqrt(e)),easing:l=Ie}=n(n({},s),i),r=t.getBoundingClientRect(),u=e.left-r.left,d=e.top-r.top,p=e.width/r.width,f=e.height/r.height,m=Math.sqrt(u*u+d*d),h=getComputedStyle(t),g="none"===h.transform?"":h.transform,v=+h.opacity;return {delay:o,duration:a(c)?c(m):c,easing:l,css:(e,t)=>`\n\t\t\t\topacity: ${e*v};\n\t\t\t\ttransform-origin: top left;\n\t\t\t\ttransform: ${g} translate(${t*u}px,${t*d}px) scale(${e+(1-e)*p}, ${e+(1-e)*f});\n\t\t\t`}}(e,c,l)}return e.delete(l.key),t&&t(c,l,o)})}return [c(o,i,!1),c(i,o,!0)]},draw:function(e,{delay:t=0,speed:n,duration:s,easing:i=Ee}){const o=e.getTotalLength();return void 0===s?s=void 0===n?800:o/n:"function"==typeof s&&(s=s(o)),{delay:t,duration:s,easing:i,css:(e,t)=>`stroke-dasharray: ${e*o} ${t*o}`}},fade:je,fly:Le,scale:function(e,{delay:t=0,duration:n=400,easing:s=Ie,start:i=0,opacity:o=0}){const a=getComputedStyle(e),c=+a.opacity,l="none"===a.transform?"":a.transform,r=1-i,u=c*(1-o);return {delay:t,duration:n,easing:s,css:(e,t)=>`\n\t\t\ttransform: ${l} scale(${1-r*t});\n\t\t\topacity: ${c-u*t}\n\t\t`}},slide:function(e,{delay:t=0,duration:n=400,easing:s=Ie}){const i=getComputedStyle(e),o=+i.opacity,a=parseFloat(i.height),c=parseFloat(i.paddingTop),l=parseFloat(i.paddingBottom),r=parseFloat(i.marginTop),u=parseFloat(i.marginBottom),d=parseFloat(i.borderTopWidth),p=parseFloat(i.borderBottomWidth);return {delay:t,duration:n,easing:s,css:e=>"overflow: hidden;"+`opacity: ${Math.min(20*e,1)*o};`+`height: ${e*a}px;`+`padding-top: ${e*c}px;`+`padding-bottom: ${e*l}px;`+`margin-top: ${e*r}px;`+`margin-bottom: ${e*u}px;`+`border-top-width: ${e*d}px;`+`border-bottom-width: ${e*p}px;`}}});

    var moment = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
         module.exports = factory() ;
    }(commonjsGlobal, (function () {
        var hookCallback;

        function hooks () {
            return hookCallback.apply(null, arguments);
        }

        // This is done to register the method called with moment()
        // without creating circular dependencies.
        function setHookCallback (callback) {
            hookCallback = callback;
        }

        function isArray(input) {
            return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
        }

        function isObject(input) {
            // IE8 will treat undefined and null as object if it wasn't for
            // input != null
            return input != null && Object.prototype.toString.call(input) === '[object Object]';
        }

        function isObjectEmpty(obj) {
            if (Object.getOwnPropertyNames) {
                return (Object.getOwnPropertyNames(obj).length === 0);
            } else {
                var k;
                for (k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        return false;
                    }
                }
                return true;
            }
        }

        function isUndefined(input) {
            return input === void 0;
        }

        function isNumber(input) {
            return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
        }

        function isDate(input) {
            return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
        }

        function map(arr, fn) {
            var res = [], i;
            for (i = 0; i < arr.length; ++i) {
                res.push(fn(arr[i], i));
            }
            return res;
        }

        function hasOwnProp(a, b) {
            return Object.prototype.hasOwnProperty.call(a, b);
        }

        function extend(a, b) {
            for (var i in b) {
                if (hasOwnProp(b, i)) {
                    a[i] = b[i];
                }
            }

            if (hasOwnProp(b, 'toString')) {
                a.toString = b.toString;
            }

            if (hasOwnProp(b, 'valueOf')) {
                a.valueOf = b.valueOf;
            }

            return a;
        }

        function createUTC (input, format, locale, strict) {
            return createLocalOrUTC(input, format, locale, strict, true).utc();
        }

        function defaultParsingFlags() {
            // We need to deep clone this object.
            return {
                empty           : false,
                unusedTokens    : [],
                unusedInput     : [],
                overflow        : -2,
                charsLeftOver   : 0,
                nullInput       : false,
                invalidMonth    : null,
                invalidFormat   : false,
                userInvalidated : false,
                iso             : false,
                parsedDateParts : [],
                meridiem        : null,
                rfc2822         : false,
                weekdayMismatch : false
            };
        }

        function getParsingFlags(m) {
            if (m._pf == null) {
                m._pf = defaultParsingFlags();
            }
            return m._pf;
        }

        var some;
        if (Array.prototype.some) {
            some = Array.prototype.some;
        } else {
            some = function (fun) {
                var t = Object(this);
                var len = t.length >>> 0;

                for (var i = 0; i < len; i++) {
                    if (i in t && fun.call(this, t[i], i, t)) {
                        return true;
                    }
                }

                return false;
            };
        }

        function isValid(m) {
            if (m._isValid == null) {
                var flags = getParsingFlags(m);
                var parsedParts = some.call(flags.parsedDateParts, function (i) {
                    return i != null;
                });
                var isNowValid = !isNaN(m._d.getTime()) &&
                    flags.overflow < 0 &&
                    !flags.empty &&
                    !flags.invalidMonth &&
                    !flags.invalidWeekday &&
                    !flags.weekdayMismatch &&
                    !flags.nullInput &&
                    !flags.invalidFormat &&
                    !flags.userInvalidated &&
                    (!flags.meridiem || (flags.meridiem && parsedParts));

                if (m._strict) {
                    isNowValid = isNowValid &&
                        flags.charsLeftOver === 0 &&
                        flags.unusedTokens.length === 0 &&
                        flags.bigHour === undefined;
                }

                if (Object.isFrozen == null || !Object.isFrozen(m)) {
                    m._isValid = isNowValid;
                }
                else {
                    return isNowValid;
                }
            }
            return m._isValid;
        }

        function createInvalid (flags) {
            var m = createUTC(NaN);
            if (flags != null) {
                extend(getParsingFlags(m), flags);
            }
            else {
                getParsingFlags(m).userInvalidated = true;
            }

            return m;
        }

        // Plugins that add properties should also add the key here (null value),
        // so we can properly clone ourselves.
        var momentProperties = hooks.momentProperties = [];

        function copyConfig(to, from) {
            var i, prop, val;

            if (!isUndefined(from._isAMomentObject)) {
                to._isAMomentObject = from._isAMomentObject;
            }
            if (!isUndefined(from._i)) {
                to._i = from._i;
            }
            if (!isUndefined(from._f)) {
                to._f = from._f;
            }
            if (!isUndefined(from._l)) {
                to._l = from._l;
            }
            if (!isUndefined(from._strict)) {
                to._strict = from._strict;
            }
            if (!isUndefined(from._tzm)) {
                to._tzm = from._tzm;
            }
            if (!isUndefined(from._isUTC)) {
                to._isUTC = from._isUTC;
            }
            if (!isUndefined(from._offset)) {
                to._offset = from._offset;
            }
            if (!isUndefined(from._pf)) {
                to._pf = getParsingFlags(from);
            }
            if (!isUndefined(from._locale)) {
                to._locale = from._locale;
            }

            if (momentProperties.length > 0) {
                for (i = 0; i < momentProperties.length; i++) {
                    prop = momentProperties[i];
                    val = from[prop];
                    if (!isUndefined(val)) {
                        to[prop] = val;
                    }
                }
            }

            return to;
        }

        var updateInProgress = false;

        // Moment prototype object
        function Moment(config) {
            copyConfig(this, config);
            this._d = new Date(config._d != null ? config._d.getTime() : NaN);
            if (!this.isValid()) {
                this._d = new Date(NaN);
            }
            // Prevent infinite loop in case updateOffset creates new moment
            // objects.
            if (updateInProgress === false) {
                updateInProgress = true;
                hooks.updateOffset(this);
                updateInProgress = false;
            }
        }

        function isMoment (obj) {
            return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
        }

        function absFloor (number) {
            if (number < 0) {
                // -0 -> 0
                return Math.ceil(number) || 0;
            } else {
                return Math.floor(number);
            }
        }

        function toInt(argumentForCoercion) {
            var coercedNumber = +argumentForCoercion,
                value = 0;

            if (coercedNumber !== 0 && isFinite(coercedNumber)) {
                value = absFloor(coercedNumber);
            }

            return value;
        }

        // compare two arrays, return the number of differences
        function compareArrays(array1, array2, dontConvert) {
            var len = Math.min(array1.length, array2.length),
                lengthDiff = Math.abs(array1.length - array2.length),
                diffs = 0,
                i;
            for (i = 0; i < len; i++) {
                if ((dontConvert && array1[i] !== array2[i]) ||
                    (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                    diffs++;
                }
            }
            return diffs + lengthDiff;
        }

        function warn(msg) {
            if (hooks.suppressDeprecationWarnings === false &&
                    (typeof console !==  'undefined') && console.warn) {
                console.warn('Deprecation warning: ' + msg);
            }
        }

        function deprecate(msg, fn) {
            var firstTime = true;

            return extend(function () {
                if (hooks.deprecationHandler != null) {
                    hooks.deprecationHandler(null, msg);
                }
                if (firstTime) {
                    var args = [];
                    var arg;
                    for (var i = 0; i < arguments.length; i++) {
                        arg = '';
                        if (typeof arguments[i] === 'object') {
                            arg += '\n[' + i + '] ';
                            for (var key in arguments[0]) {
                                arg += key + ': ' + arguments[0][key] + ', ';
                            }
                            arg = arg.slice(0, -2); // Remove trailing comma and space
                        } else {
                            arg = arguments[i];
                        }
                        args.push(arg);
                    }
                    warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                    firstTime = false;
                }
                return fn.apply(this, arguments);
            }, fn);
        }

        var deprecations = {};

        function deprecateSimple(name, msg) {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(name, msg);
            }
            if (!deprecations[name]) {
                warn(msg);
                deprecations[name] = true;
            }
        }

        hooks.suppressDeprecationWarnings = false;
        hooks.deprecationHandler = null;

        function isFunction(input) {
            return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
        }

        function set (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (isFunction(prop)) {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            this._config = config;
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
            // TODO: Remove "ordinalParse" fallback in next major release.
            this._dayOfMonthOrdinalParseLenient = new RegExp(
                (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                    '|' + (/\d{1,2}/).source);
        }

        function mergeConfigs(parentConfig, childConfig) {
            var res = extend({}, parentConfig), prop;
            for (prop in childConfig) {
                if (hasOwnProp(childConfig, prop)) {
                    if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                        res[prop] = {};
                        extend(res[prop], parentConfig[prop]);
                        extend(res[prop], childConfig[prop]);
                    } else if (childConfig[prop] != null) {
                        res[prop] = childConfig[prop];
                    } else {
                        delete res[prop];
                    }
                }
            }
            for (prop in parentConfig) {
                if (hasOwnProp(parentConfig, prop) &&
                        !hasOwnProp(childConfig, prop) &&
                        isObject(parentConfig[prop])) {
                    // make sure changes to properties don't modify parent config
                    res[prop] = extend({}, res[prop]);
                }
            }
            return res;
        }

        function Locale(config) {
            if (config != null) {
                this.set(config);
            }
        }

        var keys;

        if (Object.keys) {
            keys = Object.keys;
        } else {
            keys = function (obj) {
                var i, res = [];
                for (i in obj) {
                    if (hasOwnProp(obj, i)) {
                        res.push(i);
                    }
                }
                return res;
            };
        }

        var defaultCalendar = {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        };

        function calendar (key, mom, now) {
            var output = this._calendar[key] || this._calendar['sameElse'];
            return isFunction(output) ? output.call(mom, now) : output;
        }

        var defaultLongDateFormat = {
            LTS  : 'h:mm:ss A',
            LT   : 'h:mm A',
            L    : 'MM/DD/YYYY',
            LL   : 'MMMM D, YYYY',
            LLL  : 'MMMM D, YYYY h:mm A',
            LLLL : 'dddd, MMMM D, YYYY h:mm A'
        };

        function longDateFormat (key) {
            var format = this._longDateFormat[key],
                formatUpper = this._longDateFormat[key.toUpperCase()];

            if (format || !formatUpper) {
                return format;
            }

            this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
                return val.slice(1);
            });

            return this._longDateFormat[key];
        }

        var defaultInvalidDate = 'Invalid date';

        function invalidDate () {
            return this._invalidDate;
        }

        var defaultOrdinal = '%d';
        var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

        function ordinal (number) {
            return this._ordinal.replace('%d', number);
        }

        var defaultRelativeTime = {
            future : 'in %s',
            past   : '%s ago',
            s  : 'a few seconds',
            ss : '%d seconds',
            m  : 'a minute',
            mm : '%d minutes',
            h  : 'an hour',
            hh : '%d hours',
            d  : 'a day',
            dd : '%d days',
            M  : 'a month',
            MM : '%d months',
            y  : 'a year',
            yy : '%d years'
        };

        function relativeTime (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (isFunction(output)) ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        }

        function pastFuture (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return isFunction(format) ? format(output) : format.replace(/%s/i, output);
        }

        var aliases = {};

        function addUnitAlias (unit, shorthand) {
            var lowerCase = unit.toLowerCase();
            aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
        }

        function normalizeUnits(units) {
            return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
        }

        function normalizeObjectUnits(inputObject) {
            var normalizedInput = {},
                normalizedProp,
                prop;

            for (prop in inputObject) {
                if (hasOwnProp(inputObject, prop)) {
                    normalizedProp = normalizeUnits(prop);
                    if (normalizedProp) {
                        normalizedInput[normalizedProp] = inputObject[prop];
                    }
                }
            }

            return normalizedInput;
        }

        var priorities = {};

        function addUnitPriority(unit, priority) {
            priorities[unit] = priority;
        }

        function getPrioritizedUnits(unitsObj) {
            var units = [];
            for (var u in unitsObj) {
                units.push({unit: u, priority: priorities[u]});
            }
            units.sort(function (a, b) {
                return a.priority - b.priority;
            });
            return units;
        }

        function zeroFill(number, targetLength, forceSign) {
            var absNumber = '' + Math.abs(number),
                zerosToFill = targetLength - absNumber.length,
                sign = number >= 0;
            return (sign ? (forceSign ? '+' : '') : '-') +
                Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
        }

        var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

        var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

        var formatFunctions = {};

        var formatTokenFunctions = {};

        // token:    'M'
        // padded:   ['MM', 2]
        // ordinal:  'Mo'
        // callback: function () { this.month() + 1 }
        function addFormatToken (token, padded, ordinal, callback) {
            var func = callback;
            if (typeof callback === 'string') {
                func = function () {
                    return this[callback]();
                };
            }
            if (token) {
                formatTokenFunctions[token] = func;
            }
            if (padded) {
                formatTokenFunctions[padded[0]] = function () {
                    return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
                };
            }
            if (ordinal) {
                formatTokenFunctions[ordinal] = function () {
                    return this.localeData().ordinal(func.apply(this, arguments), token);
                };
            }
        }

        function removeFormattingTokens(input) {
            if (input.match(/\[[\s\S]/)) {
                return input.replace(/^\[|\]$/g, '');
            }
            return input.replace(/\\/g, '');
        }

        function makeFormatFunction(format) {
            var array = format.match(formattingTokens), i, length;

            for (i = 0, length = array.length; i < length; i++) {
                if (formatTokenFunctions[array[i]]) {
                    array[i] = formatTokenFunctions[array[i]];
                } else {
                    array[i] = removeFormattingTokens(array[i]);
                }
            }

            return function (mom) {
                var output = '', i;
                for (i = 0; i < length; i++) {
                    output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
                }
                return output;
            };
        }

        // format date using native date object
        function formatMoment(m, format) {
            if (!m.isValid()) {
                return m.localeData().invalidDate();
            }

            format = expandFormat(format, m.localeData());
            formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

            return formatFunctions[format](m);
        }

        function expandFormat(format, locale) {
            var i = 5;

            function replaceLongDateFormatTokens(input) {
                return locale.longDateFormat(input) || input;
            }

            localFormattingTokens.lastIndex = 0;
            while (i >= 0 && localFormattingTokens.test(format)) {
                format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
                localFormattingTokens.lastIndex = 0;
                i -= 1;
            }

            return format;
        }

        var match1         = /\d/;            //       0 - 9
        var match2         = /\d\d/;          //      00 - 99
        var match3         = /\d{3}/;         //     000 - 999
        var match4         = /\d{4}/;         //    0000 - 9999
        var match6         = /[+-]?\d{6}/;    // -999999 - 999999
        var match1to2      = /\d\d?/;         //       0 - 99
        var match3to4      = /\d\d\d\d?/;     //     999 - 9999
        var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
        var match1to3      = /\d{1,3}/;       //       0 - 999
        var match1to4      = /\d{1,4}/;       //       0 - 9999
        var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

        var matchUnsigned  = /\d+/;           //       0 - inf
        var matchSigned    = /[+-]?\d+/;      //    -inf - inf

        var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
        var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

        var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

        // any word (or two) characters or numbers including two/three word month in arabic.
        // includes scottish gaelic two word and hyphenated months
        var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;

        var regexes = {};

        function addRegexToken (token, regex, strictRegex) {
            regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
                return (isStrict && strictRegex) ? strictRegex : regex;
            };
        }

        function getParseRegexForToken (token, config) {
            if (!hasOwnProp(regexes, token)) {
                return new RegExp(unescapeFormat(token));
            }

            return regexes[token](config._strict, config._locale);
        }

        // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
        function unescapeFormat(s) {
            return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
                return p1 || p2 || p3 || p4;
            }));
        }

        function regexEscape(s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }

        var tokens = {};

        function addParseToken (token, callback) {
            var i, func = callback;
            if (typeof token === 'string') {
                token = [token];
            }
            if (isNumber(callback)) {
                func = function (input, array) {
                    array[callback] = toInt(input);
                };
            }
            for (i = 0; i < token.length; i++) {
                tokens[token[i]] = func;
            }
        }

        function addWeekParseToken (token, callback) {
            addParseToken(token, function (input, array, config, token) {
                config._w = config._w || {};
                callback(input, config._w, config, token);
            });
        }

        function addTimeToArrayFromToken(token, input, config) {
            if (input != null && hasOwnProp(tokens, token)) {
                tokens[token](input, config._a, config, token);
            }
        }

        var YEAR = 0;
        var MONTH = 1;
        var DATE = 2;
        var HOUR = 3;
        var MINUTE = 4;
        var SECOND = 5;
        var MILLISECOND = 6;
        var WEEK = 7;
        var WEEKDAY = 8;

        // FORMATTING

        addFormatToken('Y', 0, 0, function () {
            var y = this.year();
            return y <= 9999 ? '' + y : '+' + y;
        });

        addFormatToken(0, ['YY', 2], 0, function () {
            return this.year() % 100;
        });

        addFormatToken(0, ['YYYY',   4],       0, 'year');
        addFormatToken(0, ['YYYYY',  5],       0, 'year');
        addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

        // ALIASES

        addUnitAlias('year', 'y');

        // PRIORITIES

        addUnitPriority('year', 1);

        // PARSING

        addRegexToken('Y',      matchSigned);
        addRegexToken('YY',     match1to2, match2);
        addRegexToken('YYYY',   match1to4, match4);
        addRegexToken('YYYYY',  match1to6, match6);
        addRegexToken('YYYYYY', match1to6, match6);

        addParseToken(['YYYYY', 'YYYYYY'], YEAR);
        addParseToken('YYYY', function (input, array) {
            array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
        });
        addParseToken('YY', function (input, array) {
            array[YEAR] = hooks.parseTwoDigitYear(input);
        });
        addParseToken('Y', function (input, array) {
            array[YEAR] = parseInt(input, 10);
        });

        // HELPERS

        function daysInYear(year) {
            return isLeapYear(year) ? 366 : 365;
        }

        function isLeapYear(year) {
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        }

        // HOOKS

        hooks.parseTwoDigitYear = function (input) {
            return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
        };

        // MOMENTS

        var getSetYear = makeGetSet('FullYear', true);

        function getIsLeapYear () {
            return isLeapYear(this.year());
        }

        function makeGetSet (unit, keepTime) {
            return function (value) {
                if (value != null) {
                    set$1(this, unit, value);
                    hooks.updateOffset(this, keepTime);
                    return this;
                } else {
                    return get(this, unit);
                }
            };
        }

        function get (mom, unit) {
            return mom.isValid() ?
                mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
        }

        function set$1 (mom, unit, value) {
            if (mom.isValid() && !isNaN(value)) {
                if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
                    mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
                }
                else {
                    mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
                }
            }
        }

        // MOMENTS

        function stringGet (units) {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units]();
            }
            return this;
        }


        function stringSet (units, value) {
            if (typeof units === 'object') {
                units = normalizeObjectUnits(units);
                var prioritized = getPrioritizedUnits(units);
                for (var i = 0; i < prioritized.length; i++) {
                    this[prioritized[i].unit](units[prioritized[i].unit]);
                }
            } else {
                units = normalizeUnits(units);
                if (isFunction(this[units])) {
                    return this[units](value);
                }
            }
            return this;
        }

        function mod(n, x) {
            return ((n % x) + x) % x;
        }

        var indexOf;

        if (Array.prototype.indexOf) {
            indexOf = Array.prototype.indexOf;
        } else {
            indexOf = function (o) {
                // I know
                var i;
                for (i = 0; i < this.length; ++i) {
                    if (this[i] === o) {
                        return i;
                    }
                }
                return -1;
            };
        }

        function daysInMonth(year, month) {
            if (isNaN(year) || isNaN(month)) {
                return NaN;
            }
            var modMonth = mod(month, 12);
            year += (month - modMonth) / 12;
            return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
        }

        // FORMATTING

        addFormatToken('M', ['MM', 2], 'Mo', function () {
            return this.month() + 1;
        });

        addFormatToken('MMM', 0, 0, function (format) {
            return this.localeData().monthsShort(this, format);
        });

        addFormatToken('MMMM', 0, 0, function (format) {
            return this.localeData().months(this, format);
        });

        // ALIASES

        addUnitAlias('month', 'M');

        // PRIORITY

        addUnitPriority('month', 8);

        // PARSING

        addRegexToken('M',    match1to2);
        addRegexToken('MM',   match1to2, match2);
        addRegexToken('MMM',  function (isStrict, locale) {
            return locale.monthsShortRegex(isStrict);
        });
        addRegexToken('MMMM', function (isStrict, locale) {
            return locale.monthsRegex(isStrict);
        });

        addParseToken(['M', 'MM'], function (input, array) {
            array[MONTH] = toInt(input) - 1;
        });

        addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
            var month = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (month != null) {
                array[MONTH] = month;
            } else {
                getParsingFlags(config).invalidMonth = input;
            }
        });

        // LOCALES

        var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
        var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
        function localeMonths (m, format) {
            if (!m) {
                return isArray(this._months) ? this._months :
                    this._months['standalone'];
            }
            return isArray(this._months) ? this._months[m.month()] :
                this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
        }

        var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
        function localeMonthsShort (m, format) {
            if (!m) {
                return isArray(this._monthsShort) ? this._monthsShort :
                    this._monthsShort['standalone'];
            }
            return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
                this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
        }

        function handleStrictParse(monthName, format, strict) {
            var i, ii, mom, llc = monthName.toLocaleLowerCase();
            if (!this._monthsParse) {
                // this is not used
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
                for (i = 0; i < 12; ++i) {
                    mom = createUTC([2000, i]);
                    this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                    this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
                }
            }

            if (strict) {
                if (format === 'MMM') {
                    ii = indexOf.call(this._shortMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._longMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                }
            } else {
                if (format === 'MMM') {
                    ii = indexOf.call(this._shortMonthsParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._longMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._longMonthsParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._shortMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                }
            }
        }

        function localeMonthsParse (monthName, format, strict) {
            var i, mom, regex;

            if (this._monthsParseExact) {
                return handleStrictParse.call(this, monthName, format, strict);
            }

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            // TODO: add sorting
            // Sorting makes sure if one month (or abbr) is a prefix of another
            // see sorting in computeMonthsParse
            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = createUTC([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        }

        // MOMENTS

        function setMonth (mom, value) {
            var dayOfMonth;

            if (!mom.isValid()) {
                // No op
                return mom;
            }

            if (typeof value === 'string') {
                if (/^\d+$/.test(value)) {
                    value = toInt(value);
                } else {
                    value = mom.localeData().monthsParse(value);
                    // TODO: Another silent failure?
                    if (!isNumber(value)) {
                        return mom;
                    }
                }
            }

            dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
            return mom;
        }

        function getSetMonth (value) {
            if (value != null) {
                setMonth(this, value);
                hooks.updateOffset(this, true);
                return this;
            } else {
                return get(this, 'Month');
            }
        }

        function getDaysInMonth () {
            return daysInMonth(this.year(), this.month());
        }

        var defaultMonthsShortRegex = matchWord;
        function monthsShortRegex (isStrict) {
            if (this._monthsParseExact) {
                if (!hasOwnProp(this, '_monthsRegex')) {
                    computeMonthsParse.call(this);
                }
                if (isStrict) {
                    return this._monthsShortStrictRegex;
                } else {
                    return this._monthsShortRegex;
                }
            } else {
                if (!hasOwnProp(this, '_monthsShortRegex')) {
                    this._monthsShortRegex = defaultMonthsShortRegex;
                }
                return this._monthsShortStrictRegex && isStrict ?
                    this._monthsShortStrictRegex : this._monthsShortRegex;
            }
        }

        var defaultMonthsRegex = matchWord;
        function monthsRegex (isStrict) {
            if (this._monthsParseExact) {
                if (!hasOwnProp(this, '_monthsRegex')) {
                    computeMonthsParse.call(this);
                }
                if (isStrict) {
                    return this._monthsStrictRegex;
                } else {
                    return this._monthsRegex;
                }
            } else {
                if (!hasOwnProp(this, '_monthsRegex')) {
                    this._monthsRegex = defaultMonthsRegex;
                }
                return this._monthsStrictRegex && isStrict ?
                    this._monthsStrictRegex : this._monthsRegex;
            }
        }

        function computeMonthsParse () {
            function cmpLenRev(a, b) {
                return b.length - a.length;
            }

            var shortPieces = [], longPieces = [], mixedPieces = [],
                i, mom;
            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = createUTC([2000, i]);
                shortPieces.push(this.monthsShort(mom, ''));
                longPieces.push(this.months(mom, ''));
                mixedPieces.push(this.months(mom, ''));
                mixedPieces.push(this.monthsShort(mom, ''));
            }
            // Sorting makes sure if one month (or abbr) is a prefix of another it
            // will match the longer piece.
            shortPieces.sort(cmpLenRev);
            longPieces.sort(cmpLenRev);
            mixedPieces.sort(cmpLenRev);
            for (i = 0; i < 12; i++) {
                shortPieces[i] = regexEscape(shortPieces[i]);
                longPieces[i] = regexEscape(longPieces[i]);
            }
            for (i = 0; i < 24; i++) {
                mixedPieces[i] = regexEscape(mixedPieces[i]);
            }

            this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
            this._monthsShortRegex = this._monthsRegex;
            this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
            this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        }

        function createDate (y, m, d, h, M, s, ms) {
            // can't just apply() to create a date:
            // https://stackoverflow.com/q/181348
            var date;
            // the date constructor remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                // preserve leap years using a full 400 year cycle, then reset
                date = new Date(y + 400, m, d, h, M, s, ms);
                if (isFinite(date.getFullYear())) {
                    date.setFullYear(y);
                }
            } else {
                date = new Date(y, m, d, h, M, s, ms);
            }

            return date;
        }

        function createUTCDate (y) {
            var date;
            // the Date.UTC function remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                var args = Array.prototype.slice.call(arguments);
                // preserve leap years using a full 400 year cycle, then reset
                args[0] = y + 400;
                date = new Date(Date.UTC.apply(null, args));
                if (isFinite(date.getUTCFullYear())) {
                    date.setUTCFullYear(y);
                }
            } else {
                date = new Date(Date.UTC.apply(null, arguments));
            }

            return date;
        }

        // start-of-first-week - start-of-year
        function firstWeekOffset(year, dow, doy) {
            var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
                fwd = 7 + dow - doy,
                // first-week day local weekday -- which local weekday is fwd
                fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

            return -fwdlw + fwd - 1;
        }

        // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
        function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
            var localWeekday = (7 + weekday - dow) % 7,
                weekOffset = firstWeekOffset(year, dow, doy),
                dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
                resYear, resDayOfYear;

            if (dayOfYear <= 0) {
                resYear = year - 1;
                resDayOfYear = daysInYear(resYear) + dayOfYear;
            } else if (dayOfYear > daysInYear(year)) {
                resYear = year + 1;
                resDayOfYear = dayOfYear - daysInYear(year);
            } else {
                resYear = year;
                resDayOfYear = dayOfYear;
            }

            return {
                year: resYear,
                dayOfYear: resDayOfYear
            };
        }

        function weekOfYear(mom, dow, doy) {
            var weekOffset = firstWeekOffset(mom.year(), dow, doy),
                week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
                resWeek, resYear;

            if (week < 1) {
                resYear = mom.year() - 1;
                resWeek = week + weeksInYear(resYear, dow, doy);
            } else if (week > weeksInYear(mom.year(), dow, doy)) {
                resWeek = week - weeksInYear(mom.year(), dow, doy);
                resYear = mom.year() + 1;
            } else {
                resYear = mom.year();
                resWeek = week;
            }

            return {
                week: resWeek,
                year: resYear
            };
        }

        function weeksInYear(year, dow, doy) {
            var weekOffset = firstWeekOffset(year, dow, doy),
                weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
            return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
        }

        // FORMATTING

        addFormatToken('w', ['ww', 2], 'wo', 'week');
        addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

        // ALIASES

        addUnitAlias('week', 'w');
        addUnitAlias('isoWeek', 'W');

        // PRIORITIES

        addUnitPriority('week', 5);
        addUnitPriority('isoWeek', 5);

        // PARSING

        addRegexToken('w',  match1to2);
        addRegexToken('ww', match1to2, match2);
        addRegexToken('W',  match1to2);
        addRegexToken('WW', match1to2, match2);

        addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
            week[token.substr(0, 1)] = toInt(input);
        });

        // HELPERS

        // LOCALES

        function localeWeek (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        }

        var defaultLocaleWeek = {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 6th is the first week of the year.
        };

        function localeFirstDayOfWeek () {
            return this._week.dow;
        }

        function localeFirstDayOfYear () {
            return this._week.doy;
        }

        // MOMENTS

        function getSetWeek (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        }

        function getSetISOWeek (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        }

        // FORMATTING

        addFormatToken('d', 0, 'do', 'day');

        addFormatToken('dd', 0, 0, function (format) {
            return this.localeData().weekdaysMin(this, format);
        });

        addFormatToken('ddd', 0, 0, function (format) {
            return this.localeData().weekdaysShort(this, format);
        });

        addFormatToken('dddd', 0, 0, function (format) {
            return this.localeData().weekdays(this, format);
        });

        addFormatToken('e', 0, 0, 'weekday');
        addFormatToken('E', 0, 0, 'isoWeekday');

        // ALIASES

        addUnitAlias('day', 'd');
        addUnitAlias('weekday', 'e');
        addUnitAlias('isoWeekday', 'E');

        // PRIORITY
        addUnitPriority('day', 11);
        addUnitPriority('weekday', 11);
        addUnitPriority('isoWeekday', 11);

        // PARSING

        addRegexToken('d',    match1to2);
        addRegexToken('e',    match1to2);
        addRegexToken('E',    match1to2);
        addRegexToken('dd',   function (isStrict, locale) {
            return locale.weekdaysMinRegex(isStrict);
        });
        addRegexToken('ddd',   function (isStrict, locale) {
            return locale.weekdaysShortRegex(isStrict);
        });
        addRegexToken('dddd',   function (isStrict, locale) {
            return locale.weekdaysRegex(isStrict);
        });

        addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
            var weekday = config._locale.weekdaysParse(input, token, config._strict);
            // if we didn't get a weekday name, mark the date as invalid
            if (weekday != null) {
                week.d = weekday;
            } else {
                getParsingFlags(config).invalidWeekday = input;
            }
        });

        addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
            week[token] = toInt(input);
        });

        // HELPERS

        function parseWeekday(input, locale) {
            if (typeof input !== 'string') {
                return input;
            }

            if (!isNaN(input)) {
                return parseInt(input, 10);
            }

            input = locale.weekdaysParse(input);
            if (typeof input === 'number') {
                return input;
            }

            return null;
        }

        function parseIsoWeekday(input, locale) {
            if (typeof input === 'string') {
                return locale.weekdaysParse(input) % 7 || 7;
            }
            return isNaN(input) ? null : input;
        }

        // LOCALES
        function shiftWeekdays (ws, n) {
            return ws.slice(n, 7).concat(ws.slice(0, n));
        }

        var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
        function localeWeekdays (m, format) {
            var weekdays = isArray(this._weekdays) ? this._weekdays :
                this._weekdays[(m && m !== true && this._weekdays.isFormat.test(format)) ? 'format' : 'standalone'];
            return (m === true) ? shiftWeekdays(weekdays, this._week.dow)
                : (m) ? weekdays[m.day()] : weekdays;
        }

        var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
        function localeWeekdaysShort (m) {
            return (m === true) ? shiftWeekdays(this._weekdaysShort, this._week.dow)
                : (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
        }

        var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
        function localeWeekdaysMin (m) {
            return (m === true) ? shiftWeekdays(this._weekdaysMin, this._week.dow)
                : (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
        }

        function handleStrictParse$1(weekdayName, format, strict) {
            var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
                this._shortWeekdaysParse = [];
                this._minWeekdaysParse = [];

                for (i = 0; i < 7; ++i) {
                    mom = createUTC([2000, 1]).day(i);
                    this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                    this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                    this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
                }
            }

            if (strict) {
                if (format === 'dddd') {
                    ii = indexOf.call(this._weekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else if (format === 'ddd') {
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                }
            } else {
                if (format === 'dddd') {
                    ii = indexOf.call(this._weekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else if (format === 'ddd') {
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._weekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._weekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                }
            }
        }

        function localeWeekdaysParse (weekdayName, format, strict) {
            var i, mom, regex;

            if (this._weekdaysParseExact) {
                return handleStrictParse$1.call(this, weekdayName, format, strict);
            }

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
                this._minWeekdaysParse = [];
                this._shortWeekdaysParse = [];
                this._fullWeekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already

                mom = createUTC([2000, 1]).day(i);
                if (strict && !this._fullWeekdaysParse[i]) {
                    this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
                    this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
                    this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
                }
                if (!this._weekdaysParse[i]) {
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                    return i;
                } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                    return i;
                } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                    return i;
                } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        }

        // MOMENTS

        function getSetDayOfWeek (input) {
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        }

        function getSetLocaleDayOfWeek (input) {
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        }

        function getSetISODayOfWeek (input) {
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }

            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.

            if (input != null) {
                var weekday = parseIsoWeekday(input, this.localeData());
                return this.day(this.day() % 7 ? weekday : weekday - 7);
            } else {
                return this.day() || 7;
            }
        }

        var defaultWeekdaysRegex = matchWord;
        function weekdaysRegex (isStrict) {
            if (this._weekdaysParseExact) {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    computeWeekdaysParse.call(this);
                }
                if (isStrict) {
                    return this._weekdaysStrictRegex;
                } else {
                    return this._weekdaysRegex;
                }
            } else {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    this._weekdaysRegex = defaultWeekdaysRegex;
                }
                return this._weekdaysStrictRegex && isStrict ?
                    this._weekdaysStrictRegex : this._weekdaysRegex;
            }
        }

        var defaultWeekdaysShortRegex = matchWord;
        function weekdaysShortRegex (isStrict) {
            if (this._weekdaysParseExact) {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    computeWeekdaysParse.call(this);
                }
                if (isStrict) {
                    return this._weekdaysShortStrictRegex;
                } else {
                    return this._weekdaysShortRegex;
                }
            } else {
                if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                    this._weekdaysShortRegex = defaultWeekdaysShortRegex;
                }
                return this._weekdaysShortStrictRegex && isStrict ?
                    this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
            }
        }

        var defaultWeekdaysMinRegex = matchWord;
        function weekdaysMinRegex (isStrict) {
            if (this._weekdaysParseExact) {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    computeWeekdaysParse.call(this);
                }
                if (isStrict) {
                    return this._weekdaysMinStrictRegex;
                } else {
                    return this._weekdaysMinRegex;
                }
            } else {
                if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                    this._weekdaysMinRegex = defaultWeekdaysMinRegex;
                }
                return this._weekdaysMinStrictRegex && isStrict ?
                    this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
            }
        }


        function computeWeekdaysParse () {
            function cmpLenRev(a, b) {
                return b.length - a.length;
            }

            var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
                i, mom, minp, shortp, longp;
            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                mom = createUTC([2000, 1]).day(i);
                minp = this.weekdaysMin(mom, '');
                shortp = this.weekdaysShort(mom, '');
                longp = this.weekdays(mom, '');
                minPieces.push(minp);
                shortPieces.push(shortp);
                longPieces.push(longp);
                mixedPieces.push(minp);
                mixedPieces.push(shortp);
                mixedPieces.push(longp);
            }
            // Sorting makes sure if one weekday (or abbr) is a prefix of another it
            // will match the longer piece.
            minPieces.sort(cmpLenRev);
            shortPieces.sort(cmpLenRev);
            longPieces.sort(cmpLenRev);
            mixedPieces.sort(cmpLenRev);
            for (i = 0; i < 7; i++) {
                shortPieces[i] = regexEscape(shortPieces[i]);
                longPieces[i] = regexEscape(longPieces[i]);
                mixedPieces[i] = regexEscape(mixedPieces[i]);
            }

            this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
            this._weekdaysShortRegex = this._weekdaysRegex;
            this._weekdaysMinRegex = this._weekdaysRegex;

            this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
            this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
            this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
        }

        // FORMATTING

        function hFormat() {
            return this.hours() % 12 || 12;
        }

        function kFormat() {
            return this.hours() || 24;
        }

        addFormatToken('H', ['HH', 2], 0, 'hour');
        addFormatToken('h', ['hh', 2], 0, hFormat);
        addFormatToken('k', ['kk', 2], 0, kFormat);

        addFormatToken('hmm', 0, 0, function () {
            return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
        });

        addFormatToken('hmmss', 0, 0, function () {
            return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
                zeroFill(this.seconds(), 2);
        });

        addFormatToken('Hmm', 0, 0, function () {
            return '' + this.hours() + zeroFill(this.minutes(), 2);
        });

        addFormatToken('Hmmss', 0, 0, function () {
            return '' + this.hours() + zeroFill(this.minutes(), 2) +
                zeroFill(this.seconds(), 2);
        });

        function meridiem (token, lowercase) {
            addFormatToken(token, 0, 0, function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
            });
        }

        meridiem('a', true);
        meridiem('A', false);

        // ALIASES

        addUnitAlias('hour', 'h');

        // PRIORITY
        addUnitPriority('hour', 13);

        // PARSING

        function matchMeridiem (isStrict, locale) {
            return locale._meridiemParse;
        }

        addRegexToken('a',  matchMeridiem);
        addRegexToken('A',  matchMeridiem);
        addRegexToken('H',  match1to2);
        addRegexToken('h',  match1to2);
        addRegexToken('k',  match1to2);
        addRegexToken('HH', match1to2, match2);
        addRegexToken('hh', match1to2, match2);
        addRegexToken('kk', match1to2, match2);

        addRegexToken('hmm', match3to4);
        addRegexToken('hmmss', match5to6);
        addRegexToken('Hmm', match3to4);
        addRegexToken('Hmmss', match5to6);

        addParseToken(['H', 'HH'], HOUR);
        addParseToken(['k', 'kk'], function (input, array, config) {
            var kInput = toInt(input);
            array[HOUR] = kInput === 24 ? 0 : kInput;
        });
        addParseToken(['a', 'A'], function (input, array, config) {
            config._isPm = config._locale.isPM(input);
            config._meridiem = input;
        });
        addParseToken(['h', 'hh'], function (input, array, config) {
            array[HOUR] = toInt(input);
            getParsingFlags(config).bigHour = true;
        });
        addParseToken('hmm', function (input, array, config) {
            var pos = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos));
            array[MINUTE] = toInt(input.substr(pos));
            getParsingFlags(config).bigHour = true;
        });
        addParseToken('hmmss', function (input, array, config) {
            var pos1 = input.length - 4;
            var pos2 = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos1));
            array[MINUTE] = toInt(input.substr(pos1, 2));
            array[SECOND] = toInt(input.substr(pos2));
            getParsingFlags(config).bigHour = true;
        });
        addParseToken('Hmm', function (input, array, config) {
            var pos = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos));
            array[MINUTE] = toInt(input.substr(pos));
        });
        addParseToken('Hmmss', function (input, array, config) {
            var pos1 = input.length - 4;
            var pos2 = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos1));
            array[MINUTE] = toInt(input.substr(pos1, 2));
            array[SECOND] = toInt(input.substr(pos2));
        });

        // LOCALES

        function localeIsPM (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        }

        var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
        function localeMeridiem (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        }


        // MOMENTS

        // Setting the hour should keep the time, because the user explicitly
        // specified which hour they want. So trying to maintain the same hour (in
        // a new timezone) makes sense. Adding/subtracting hours does not follow
        // this rule.
        var getSetHour = makeGetSet('Hours', true);

        var baseConfig = {
            calendar: defaultCalendar,
            longDateFormat: defaultLongDateFormat,
            invalidDate: defaultInvalidDate,
            ordinal: defaultOrdinal,
            dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
            relativeTime: defaultRelativeTime,

            months: defaultLocaleMonths,
            monthsShort: defaultLocaleMonthsShort,

            week: defaultLocaleWeek,

            weekdays: defaultLocaleWeekdays,
            weekdaysMin: defaultLocaleWeekdaysMin,
            weekdaysShort: defaultLocaleWeekdaysShort,

            meridiemParse: defaultLocaleMeridiemParse
        };

        // internal storage for locale config files
        var locales = {};
        var localeFamilies = {};
        var globalLocale;

        function normalizeLocale(key) {
            return key ? key.toLowerCase().replace('_', '-') : key;
        }

        // pick the locale from the array
        // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        function chooseLocale(names) {
            var i = 0, j, next, locale, split;

            while (i < names.length) {
                split = normalizeLocale(names[i]).split('-');
                j = split.length;
                next = normalizeLocale(names[i + 1]);
                next = next ? next.split('-') : null;
                while (j > 0) {
                    locale = loadLocale(split.slice(0, j).join('-'));
                    if (locale) {
                        return locale;
                    }
                    if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                        //the next array item is better than a shallower substring of this one
                        break;
                    }
                    j--;
                }
                i++;
            }
            return globalLocale;
        }

        function loadLocale(name) {
            var oldLocale = null;
            // TODO: Find a better way to register and load all the locales in Node
            if (!locales[name] && ('object' !== 'undefined') &&
                    module && module.exports) {
                try {
                    oldLocale = globalLocale._abbr;
                    var aliasedRequire = commonjsRequire;
                    aliasedRequire('./locale/' + name);
                    getSetGlobalLocale(oldLocale);
                } catch (e) {}
            }
            return locales[name];
        }

        // This function will load locale and then set the global locale.  If
        // no arguments are passed in, it will simply return the current global
        // locale key.
        function getSetGlobalLocale (key, values) {
            var data;
            if (key) {
                if (isUndefined(values)) {
                    data = getLocale(key);
                }
                else {
                    data = defineLocale(key, values);
                }

                if (data) {
                    // moment.duration._locale = moment._locale = data;
                    globalLocale = data;
                }
                else {
                    if ((typeof console !==  'undefined') && console.warn) {
                        //warn user if arguments are passed but the locale could not be set
                        console.warn('Locale ' + key +  ' not found. Did you forget to load it?');
                    }
                }
            }

            return globalLocale._abbr;
        }

        function defineLocale (name, config) {
            if (config !== null) {
                var locale, parentConfig = baseConfig;
                config.abbr = name;
                if (locales[name] != null) {
                    deprecateSimple('defineLocaleOverride',
                            'use moment.updateLocale(localeName, config) to change ' +
                            'an existing locale. moment.defineLocale(localeName, ' +
                            'config) should only be used for creating a new locale ' +
                            'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                    parentConfig = locales[name]._config;
                } else if (config.parentLocale != null) {
                    if (locales[config.parentLocale] != null) {
                        parentConfig = locales[config.parentLocale]._config;
                    } else {
                        locale = loadLocale(config.parentLocale);
                        if (locale != null) {
                            parentConfig = locale._config;
                        } else {
                            if (!localeFamilies[config.parentLocale]) {
                                localeFamilies[config.parentLocale] = [];
                            }
                            localeFamilies[config.parentLocale].push({
                                name: name,
                                config: config
                            });
                            return null;
                        }
                    }
                }
                locales[name] = new Locale(mergeConfigs(parentConfig, config));

                if (localeFamilies[name]) {
                    localeFamilies[name].forEach(function (x) {
                        defineLocale(x.name, x.config);
                    });
                }

                // backwards compat for now: also set the locale
                // make sure we set the locale AFTER all child locales have been
                // created, so we won't end up with the child locale set.
                getSetGlobalLocale(name);


                return locales[name];
            } else {
                // useful for testing
                delete locales[name];
                return null;
            }
        }

        function updateLocale(name, config) {
            if (config != null) {
                var locale, tmpLocale, parentConfig = baseConfig;
                // MERGE
                tmpLocale = loadLocale(name);
                if (tmpLocale != null) {
                    parentConfig = tmpLocale._config;
                }
                config = mergeConfigs(parentConfig, config);
                locale = new Locale(config);
                locale.parentLocale = locales[name];
                locales[name] = locale;

                // backwards compat for now: also set the locale
                getSetGlobalLocale(name);
            } else {
                // pass null for config to unupdate, useful for tests
                if (locales[name] != null) {
                    if (locales[name].parentLocale != null) {
                        locales[name] = locales[name].parentLocale;
                    } else if (locales[name] != null) {
                        delete locales[name];
                    }
                }
            }
            return locales[name];
        }

        // returns locale data
        function getLocale (key) {
            var locale;

            if (key && key._locale && key._locale._abbr) {
                key = key._locale._abbr;
            }

            if (!key) {
                return globalLocale;
            }

            if (!isArray(key)) {
                //short-circuit everything else
                locale = loadLocale(key);
                if (locale) {
                    return locale;
                }
                key = [key];
            }

            return chooseLocale(key);
        }

        function listLocales() {
            return keys(locales);
        }

        function checkOverflow (m) {
            var overflow;
            var a = m._a;

            if (a && getParsingFlags(m).overflow === -2) {
                overflow =
                    a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                    a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                    a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                    a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                    a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                    a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                    -1;

                if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                    overflow = DATE;
                }
                if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                    overflow = WEEK;
                }
                if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                    overflow = WEEKDAY;
                }

                getParsingFlags(m).overflow = overflow;
            }

            return m;
        }

        // Pick the first defined of two or three arguments.
        function defaults(a, b, c) {
            if (a != null) {
                return a;
            }
            if (b != null) {
                return b;
            }
            return c;
        }

        function currentDateArray(config) {
            // hooks is actually the exported moment object
            var nowValue = new Date(hooks.now());
            if (config._useUTC) {
                return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
            }
            return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
        }

        // convert an array to a date.
        // the array should mirror the parameters below
        // note: all values past the year are optional and will default to the lowest possible value.
        // [year, month, day , hour, minute, second, millisecond]
        function configFromArray (config) {
            var i, date, input = [], currentDate, expectedWeekday, yearToUse;

            if (config._d) {
                return;
            }

            currentDate = currentDateArray(config);

            //compute day of the year from weeks and weekdays
            if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
                dayOfYearFromWeekInfo(config);
            }

            //if the day of the year is set, figure out what it is
            if (config._dayOfYear != null) {
                yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

                if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
                    getParsingFlags(config)._overflowDayOfYear = true;
                }

                date = createUTCDate(yearToUse, 0, config._dayOfYear);
                config._a[MONTH] = date.getUTCMonth();
                config._a[DATE] = date.getUTCDate();
            }

            // Default to current date.
            // * if no year, month, day of month are given, default to today
            // * if day of month is given, default month and year
            // * if month is given, default only year
            // * if year is given, don't default anything
            for (i = 0; i < 3 && config._a[i] == null; ++i) {
                config._a[i] = input[i] = currentDate[i];
            }

            // Zero out whatever was not defaulted, including time
            for (; i < 7; i++) {
                config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
            }

            // Check for 24:00:00.000
            if (config._a[HOUR] === 24 &&
                    config._a[MINUTE] === 0 &&
                    config._a[SECOND] === 0 &&
                    config._a[MILLISECOND] === 0) {
                config._nextDay = true;
                config._a[HOUR] = 0;
            }

            config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
            expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

            // Apply timezone offset from input. The actual utcOffset can be changed
            // with parseZone.
            if (config._tzm != null) {
                config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
            }

            if (config._nextDay) {
                config._a[HOUR] = 24;
            }

            // check for mismatching day of week
            if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
                getParsingFlags(config).weekdayMismatch = true;
            }
        }

        function dayOfYearFromWeekInfo(config) {
            var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                dow = 1;
                doy = 4;

                // TODO: We need to take the current isoWeekYear, but that depends on
                // how we interpret now (local, utc, fixed offset). So create
                // a now version of current config (take local/utc/offset flags, and
                // create now).
                weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
                week = defaults(w.W, 1);
                weekday = defaults(w.E, 1);
                if (weekday < 1 || weekday > 7) {
                    weekdayOverflow = true;
                }
            } else {
                dow = config._locale._week.dow;
                doy = config._locale._week.doy;

                var curWeek = weekOfYear(createLocal(), dow, doy);

                weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

                // Default to current week.
                week = defaults(w.w, curWeek.week);

                if (w.d != null) {
                    // weekday -- low day numbers are considered next week
                    weekday = w.d;
                    if (weekday < 0 || weekday > 6) {
                        weekdayOverflow = true;
                    }
                } else if (w.e != null) {
                    // local weekday -- counting starts from beginning of week
                    weekday = w.e + dow;
                    if (w.e < 0 || w.e > 6) {
                        weekdayOverflow = true;
                    }
                } else {
                    // default to beginning of week
                    weekday = dow;
                }
            }
            if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
                getParsingFlags(config)._overflowWeeks = true;
            } else if (weekdayOverflow != null) {
                getParsingFlags(config)._overflowWeekday = true;
            } else {
                temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
                config._a[YEAR] = temp.year;
                config._dayOfYear = temp.dayOfYear;
            }
        }

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
        var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

        var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

        var isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
            ['YYYY-DDD', /\d{4}-\d{3}/],
            ['YYYY-MM', /\d{4}-\d\d/, false],
            ['YYYYYYMMDD', /[+-]\d{10}/],
            ['YYYYMMDD', /\d{8}/],
            // YYYYMM is NOT allowed by the standard
            ['GGGG[W]WWE', /\d{4}W\d{3}/],
            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
            ['YYYYDDD', /\d{7}/]
        ];

        // iso time formats and regexes
        var isoTimes = [
            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
            ['HH:mm', /\d\d:\d\d/],
            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
            ['HHmmss', /\d\d\d\d\d\d/],
            ['HHmm', /\d\d\d\d/],
            ['HH', /\d\d/]
        ];

        var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

        // date from iso format
        function configFromISO(config) {
            var i, l,
                string = config._i,
                match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
                allowTime, dateFormat, timeFormat, tzFormat;

            if (match) {
                getParsingFlags(config).iso = true;

                for (i = 0, l = isoDates.length; i < l; i++) {
                    if (isoDates[i][1].exec(match[1])) {
                        dateFormat = isoDates[i][0];
                        allowTime = isoDates[i][2] !== false;
                        break;
                    }
                }
                if (dateFormat == null) {
                    config._isValid = false;
                    return;
                }
                if (match[3]) {
                    for (i = 0, l = isoTimes.length; i < l; i++) {
                        if (isoTimes[i][1].exec(match[3])) {
                            // match[2] should be 'T' or space
                            timeFormat = (match[2] || ' ') + isoTimes[i][0];
                            break;
                        }
                    }
                    if (timeFormat == null) {
                        config._isValid = false;
                        return;
                    }
                }
                if (!allowTime && timeFormat != null) {
                    config._isValid = false;
                    return;
                }
                if (match[4]) {
                    if (tzRegex.exec(match[4])) {
                        tzFormat = 'Z';
                    } else {
                        config._isValid = false;
                        return;
                    }
                }
                config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
                configFromStringAndFormat(config);
            } else {
                config._isValid = false;
            }
        }

        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
        var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

        function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
            var result = [
                untruncateYear(yearStr),
                defaultLocaleMonthsShort.indexOf(monthStr),
                parseInt(dayStr, 10),
                parseInt(hourStr, 10),
                parseInt(minuteStr, 10)
            ];

            if (secondStr) {
                result.push(parseInt(secondStr, 10));
            }

            return result;
        }

        function untruncateYear(yearStr) {
            var year = parseInt(yearStr, 10);
            if (year <= 49) {
                return 2000 + year;
            } else if (year <= 999) {
                return 1900 + year;
            }
            return year;
        }

        function preprocessRFC2822(s) {
            // Remove comments and folding whitespace and replace multiple-spaces with a single space
            return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }

        function checkWeekday(weekdayStr, parsedInput, config) {
            if (weekdayStr) {
                // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
                var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                    weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
                if (weekdayProvided !== weekdayActual) {
                    getParsingFlags(config).weekdayMismatch = true;
                    config._isValid = false;
                    return false;
                }
            }
            return true;
        }

        var obsOffsets = {
            UT: 0,
            GMT: 0,
            EDT: -4 * 60,
            EST: -5 * 60,
            CDT: -5 * 60,
            CST: -6 * 60,
            MDT: -6 * 60,
            MST: -7 * 60,
            PDT: -7 * 60,
            PST: -8 * 60
        };

        function calculateOffset(obsOffset, militaryOffset, numOffset) {
            if (obsOffset) {
                return obsOffsets[obsOffset];
            } else if (militaryOffset) {
                // the only allowed military tz is Z
                return 0;
            } else {
                var hm = parseInt(numOffset, 10);
                var m = hm % 100, h = (hm - m) / 100;
                return h * 60 + m;
            }
        }

        // date and time from ref 2822 format
        function configFromRFC2822(config) {
            var match = rfc2822.exec(preprocessRFC2822(config._i));
            if (match) {
                var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
                if (!checkWeekday(match[1], parsedArray, config)) {
                    return;
                }

                config._a = parsedArray;
                config._tzm = calculateOffset(match[8], match[9], match[10]);

                config._d = createUTCDate.apply(null, config._a);
                config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

                getParsingFlags(config).rfc2822 = true;
            } else {
                config._isValid = false;
            }
        }

        // date from iso format or fallback
        function configFromString(config) {
            var matched = aspNetJsonRegex.exec(config._i);

            if (matched !== null) {
                config._d = new Date(+matched[1]);
                return;
            }

            configFromISO(config);
            if (config._isValid === false) {
                delete config._isValid;
            } else {
                return;
            }

            configFromRFC2822(config);
            if (config._isValid === false) {
                delete config._isValid;
            } else {
                return;
            }

            // Final attempt, use Input Fallback
            hooks.createFromInputFallback(config);
        }

        hooks.createFromInputFallback = deprecate(
            'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
            'discouraged and will be removed in an upcoming major release. Please refer to ' +
            'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
            function (config) {
                config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
            }
        );

        // constant that refers to the ISO standard
        hooks.ISO_8601 = function () {};

        // constant that refers to the RFC 2822 form
        hooks.RFC_2822 = function () {};

        // date from string and format string
        function configFromStringAndFormat(config) {
            // TODO: Move this to another part of the creation flow to prevent circular deps
            if (config._f === hooks.ISO_8601) {
                configFromISO(config);
                return;
            }
            if (config._f === hooks.RFC_2822) {
                configFromRFC2822(config);
                return;
            }
            config._a = [];
            getParsingFlags(config).empty = true;

            // This array is used to make a Date, either with `new Date` or `Date.UTC`
            var string = '' + config._i,
                i, parsedInput, tokens, token, skipped,
                stringLength = string.length,
                totalParsedInputLength = 0;

            tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

            for (i = 0; i < tokens.length; i++) {
                token = tokens[i];
                parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
                // console.log('token', token, 'parsedInput', parsedInput,
                //         'regex', getParseRegexForToken(token, config));
                if (parsedInput) {
                    skipped = string.substr(0, string.indexOf(parsedInput));
                    if (skipped.length > 0) {
                        getParsingFlags(config).unusedInput.push(skipped);
                    }
                    string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                    totalParsedInputLength += parsedInput.length;
                }
                // don't parse if it's not a known token
                if (formatTokenFunctions[token]) {
                    if (parsedInput) {
                        getParsingFlags(config).empty = false;
                    }
                    else {
                        getParsingFlags(config).unusedTokens.push(token);
                    }
                    addTimeToArrayFromToken(token, parsedInput, config);
                }
                else if (config._strict && !parsedInput) {
                    getParsingFlags(config).unusedTokens.push(token);
                }
            }

            // add remaining unparsed input length to the string
            getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
            if (string.length > 0) {
                getParsingFlags(config).unusedInput.push(string);
            }

            // clear _12h flag if hour is <= 12
            if (config._a[HOUR] <= 12 &&
                getParsingFlags(config).bigHour === true &&
                config._a[HOUR] > 0) {
                getParsingFlags(config).bigHour = undefined;
            }

            getParsingFlags(config).parsedDateParts = config._a.slice(0);
            getParsingFlags(config).meridiem = config._meridiem;
            // handle meridiem
            config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

            configFromArray(config);
            checkOverflow(config);
        }


        function meridiemFixWrap (locale, hour, meridiem) {
            var isPm;

            if (meridiem == null) {
                // nothing to do
                return hour;
            }
            if (locale.meridiemHour != null) {
                return locale.meridiemHour(hour, meridiem);
            } else if (locale.isPM != null) {
                // Fallback
                isPm = locale.isPM(meridiem);
                if (isPm && hour < 12) {
                    hour += 12;
                }
                if (!isPm && hour === 12) {
                    hour = 0;
                }
                return hour;
            } else {
                // this is not supposed to happen
                return hour;
            }
        }

        // date from string and array of format strings
        function configFromStringAndArray(config) {
            var tempConfig,
                bestMoment,

                scoreToBeat,
                i,
                currentScore;

            if (config._f.length === 0) {
                getParsingFlags(config).invalidFormat = true;
                config._d = new Date(NaN);
                return;
            }

            for (i = 0; i < config._f.length; i++) {
                currentScore = 0;
                tempConfig = copyConfig({}, config);
                if (config._useUTC != null) {
                    tempConfig._useUTC = config._useUTC;
                }
                tempConfig._f = config._f[i];
                configFromStringAndFormat(tempConfig);

                if (!isValid(tempConfig)) {
                    continue;
                }

                // if there is any input that was not parsed add a penalty for that format
                currentScore += getParsingFlags(tempConfig).charsLeftOver;

                //or tokens
                currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

                getParsingFlags(tempConfig).score = currentScore;

                if (scoreToBeat == null || currentScore < scoreToBeat) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                }
            }

            extend(config, bestMoment || tempConfig);
        }

        function configFromObject(config) {
            if (config._d) {
                return;
            }

            var i = normalizeObjectUnits(config._i);
            config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
                return obj && parseInt(obj, 10);
            });

            configFromArray(config);
        }

        function createFromConfig (config) {
            var res = new Moment(checkOverflow(prepareConfig(config)));
            if (res._nextDay) {
                // Adding is smart enough around DST
                res.add(1, 'd');
                res._nextDay = undefined;
            }

            return res;
        }

        function prepareConfig (config) {
            var input = config._i,
                format = config._f;

            config._locale = config._locale || getLocale(config._l);

            if (input === null || (format === undefined && input === '')) {
                return createInvalid({nullInput: true});
            }

            if (typeof input === 'string') {
                config._i = input = config._locale.preparse(input);
            }

            if (isMoment(input)) {
                return new Moment(checkOverflow(input));
            } else if (isDate(input)) {
                config._d = input;
            } else if (isArray(format)) {
                configFromStringAndArray(config);
            } else if (format) {
                configFromStringAndFormat(config);
            }  else {
                configFromInput(config);
            }

            if (!isValid(config)) {
                config._d = null;
            }

            return config;
        }

        function configFromInput(config) {
            var input = config._i;
            if (isUndefined(input)) {
                config._d = new Date(hooks.now());
            } else if (isDate(input)) {
                config._d = new Date(input.valueOf());
            } else if (typeof input === 'string') {
                configFromString(config);
            } else if (isArray(input)) {
                config._a = map(input.slice(0), function (obj) {
                    return parseInt(obj, 10);
                });
                configFromArray(config);
            } else if (isObject(input)) {
                configFromObject(config);
            } else if (isNumber(input)) {
                // from milliseconds
                config._d = new Date(input);
            } else {
                hooks.createFromInputFallback(config);
            }
        }

        function createLocalOrUTC (input, format, locale, strict, isUTC) {
            var c = {};

            if (locale === true || locale === false) {
                strict = locale;
                locale = undefined;
            }

            if ((isObject(input) && isObjectEmpty(input)) ||
                    (isArray(input) && input.length === 0)) {
                input = undefined;
            }
            // object construction must be done this way.
            // https://github.com/moment/moment/issues/1423
            c._isAMomentObject = true;
            c._useUTC = c._isUTC = isUTC;
            c._l = locale;
            c._i = input;
            c._f = format;
            c._strict = strict;

            return createFromConfig(c);
        }

        function createLocal (input, format, locale, strict) {
            return createLocalOrUTC(input, format, locale, strict, false);
        }

        var prototypeMin = deprecate(
            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other < this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        );

        var prototypeMax = deprecate(
            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other > this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        );

        // Pick a moment m from moments so that m[fn](other) is true for all
        // other. This relies on the function fn to be transitive.
        //
        // moments should either be an array of moment objects or an array, whose
        // first element is an array of moment objects.
        function pickBy(fn, moments) {
            var res, i;
            if (moments.length === 1 && isArray(moments[0])) {
                moments = moments[0];
            }
            if (!moments.length) {
                return createLocal();
            }
            res = moments[0];
            for (i = 1; i < moments.length; ++i) {
                if (!moments[i].isValid() || moments[i][fn](res)) {
                    res = moments[i];
                }
            }
            return res;
        }

        // TODO: Use [].sort instead?
        function min () {
            var args = [].slice.call(arguments, 0);

            return pickBy('isBefore', args);
        }

        function max () {
            var args = [].slice.call(arguments, 0);

            return pickBy('isAfter', args);
        }

        var now = function () {
            return Date.now ? Date.now() : +(new Date());
        };

        var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

        function isDurationValid(m) {
            for (var key in m) {
                if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
                    return false;
                }
            }

            var unitHasDecimal = false;
            for (var i = 0; i < ordering.length; ++i) {
                if (m[ordering[i]]) {
                    if (unitHasDecimal) {
                        return false; // only allow non-integers for smallest unit
                    }
                    if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                        unitHasDecimal = true;
                    }
                }
            }

            return true;
        }

        function isValid$1() {
            return this._isValid;
        }

        function createInvalid$1() {
            return createDuration(NaN);
        }

        function Duration (duration) {
            var normalizedInput = normalizeObjectUnits(duration),
                years = normalizedInput.year || 0,
                quarters = normalizedInput.quarter || 0,
                months = normalizedInput.month || 0,
                weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
                days = normalizedInput.day || 0,
                hours = normalizedInput.hour || 0,
                minutes = normalizedInput.minute || 0,
                seconds = normalizedInput.second || 0,
                milliseconds = normalizedInput.millisecond || 0;

            this._isValid = isDurationValid(normalizedInput);

            // representation for dateAddRemove
            this._milliseconds = +milliseconds +
                seconds * 1e3 + // 1000
                minutes * 6e4 + // 1000 * 60
                hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
            // Because of dateAddRemove treats 24 hours as different from a
            // day when working around DST, we need to store them separately
            this._days = +days +
                weeks * 7;
            // It is impossible to translate months into days without knowing
            // which months you are are talking about, so we have to store
            // it separately.
            this._months = +months +
                quarters * 3 +
                years * 12;

            this._data = {};

            this._locale = getLocale();

            this._bubble();
        }

        function isDuration (obj) {
            return obj instanceof Duration;
        }

        function absRound (number) {
            if (number < 0) {
                return Math.round(-1 * number) * -1;
            } else {
                return Math.round(number);
            }
        }

        // FORMATTING

        function offset (token, separator) {
            addFormatToken(token, 0, 0, function () {
                var offset = this.utcOffset();
                var sign = '+';
                if (offset < 0) {
                    offset = -offset;
                    sign = '-';
                }
                return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
            });
        }

        offset('Z', ':');
        offset('ZZ', '');

        // PARSING

        addRegexToken('Z',  matchShortOffset);
        addRegexToken('ZZ', matchShortOffset);
        addParseToken(['Z', 'ZZ'], function (input, array, config) {
            config._useUTC = true;
            config._tzm = offsetFromString(matchShortOffset, input);
        });

        // HELPERS

        // timezone chunker
        // '+10:00' > ['10',  '00']
        // '-1530'  > ['-15', '30']
        var chunkOffset = /([\+\-]|\d\d)/gi;

        function offsetFromString(matcher, string) {
            var matches = (string || '').match(matcher);

            if (matches === null) {
                return null;
            }

            var chunk   = matches[matches.length - 1] || [];
            var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
            var minutes = +(parts[1] * 60) + toInt(parts[2]);

            return minutes === 0 ?
              0 :
              parts[0] === '+' ? minutes : -minutes;
        }

        // Return a moment from input, that is local/utc/zone equivalent to model.
        function cloneWithOffset(input, model) {
            var res, diff;
            if (model._isUTC) {
                res = model.clone();
                diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
                // Use low-level api, because this fn is low-level api.
                res._d.setTime(res._d.valueOf() + diff);
                hooks.updateOffset(res, false);
                return res;
            } else {
                return createLocal(input).local();
            }
        }

        function getDateOffset (m) {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
        }

        // HOOKS

        // This function will be called whenever a moment is mutated.
        // It is intended to keep the offset in sync with the timezone.
        hooks.updateOffset = function () {};

        // MOMENTS

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        function getSetOffset (input, keepLocalTime, keepMinutes) {
            var offset = this._offset || 0,
                localAdjust;
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }
            if (input != null) {
                if (typeof input === 'string') {
                    input = offsetFromString(matchShortOffset, input);
                    if (input === null) {
                        return this;
                    }
                } else if (Math.abs(input) < 16 && !keepMinutes) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = getDateOffset(this);
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addSubtract(this, createDuration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        hooks.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
                return this;
            } else {
                return this._isUTC ? offset : getDateOffset(this);
            }
        }

        function getSetZone (input, keepLocalTime) {
            if (input != null) {
                if (typeof input !== 'string') {
                    input = -input;
                }

                this.utcOffset(input, keepLocalTime);

                return this;
            } else {
                return -this.utcOffset();
            }
        }

        function setOffsetToUTC (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        }

        function setOffsetToLocal (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(getDateOffset(this), 'm');
                }
            }
            return this;
        }

        function setOffsetToParsedOffset () {
            if (this._tzm != null) {
                this.utcOffset(this._tzm, false, true);
            } else if (typeof this._i === 'string') {
                var tZone = offsetFromString(matchOffset, this._i);
                if (tZone != null) {
                    this.utcOffset(tZone);
                }
                else {
                    this.utcOffset(0, true);
                }
            }
            return this;
        }

        function hasAlignedHourOffset (input) {
            if (!this.isValid()) {
                return false;
            }
            input = input ? createLocal(input).utcOffset() : 0;

            return (this.utcOffset() - input) % 60 === 0;
        }

        function isDaylightSavingTime () {
            return (
                this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset()
            );
        }

        function isDaylightSavingTimeShifted () {
            if (!isUndefined(this._isDSTShifted)) {
                return this._isDSTShifted;
            }

            var c = {};

            copyConfig(c, this);
            c = prepareConfig(c);

            if (c._a) {
                var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
                this._isDSTShifted = this.isValid() &&
                    compareArrays(c._a, other.toArray()) > 0;
            } else {
                this._isDSTShifted = false;
            }

            return this._isDSTShifted;
        }

        function isLocal () {
            return this.isValid() ? !this._isUTC : false;
        }

        function isUtcOffset () {
            return this.isValid() ? this._isUTC : false;
        }

        function isUtc () {
            return this.isValid() ? this._isUTC && this._offset === 0 : false;
        }

        // ASP.NET json date format regex
        var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        // and further modified to allow for strings containing both week and day
        var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

        function createDuration (input, key) {
            var duration = input,
                // matching against regexp is expensive, do it on demand
                match = null,
                sign,
                ret,
                diffRes;

            if (isDuration(input)) {
                duration = {
                    ms : input._milliseconds,
                    d  : input._days,
                    M  : input._months
                };
            } else if (isNumber(input)) {
                duration = {};
                if (key) {
                    duration[key] = input;
                } else {
                    duration.milliseconds = input;
                }
            } else if (!!(match = aspNetRegex.exec(input))) {
                sign = (match[1] === '-') ? -1 : 1;
                duration = {
                    y  : 0,
                    d  : toInt(match[DATE])                         * sign,
                    h  : toInt(match[HOUR])                         * sign,
                    m  : toInt(match[MINUTE])                       * sign,
                    s  : toInt(match[SECOND])                       * sign,
                    ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
                };
            } else if (!!(match = isoRegex.exec(input))) {
                sign = (match[1] === '-') ? -1 : 1;
                duration = {
                    y : parseIso(match[2], sign),
                    M : parseIso(match[3], sign),
                    w : parseIso(match[4], sign),
                    d : parseIso(match[5], sign),
                    h : parseIso(match[6], sign),
                    m : parseIso(match[7], sign),
                    s : parseIso(match[8], sign)
                };
            } else if (duration == null) {// checks for null or undefined
                duration = {};
            } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
                diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

                duration = {};
                duration.ms = diffRes.milliseconds;
                duration.M = diffRes.months;
            }

            ret = new Duration(duration);

            if (isDuration(input) && hasOwnProp(input, '_locale')) {
                ret._locale = input._locale;
            }

            return ret;
        }

        createDuration.fn = Duration.prototype;
        createDuration.invalid = createInvalid$1;

        function parseIso (inp, sign) {
            // We'd normally use ~~inp for this, but unfortunately it also
            // converts floats to ints.
            // inp may be undefined, so careful calling replace on it.
            var res = inp && parseFloat(inp.replace(',', '.'));
            // apply sign while we're at it
            return (isNaN(res) ? 0 : res) * sign;
        }

        function positiveMomentsDifference(base, other) {
            var res = {};

            res.months = other.month() - base.month() +
                (other.year() - base.year()) * 12;
            if (base.clone().add(res.months, 'M').isAfter(other)) {
                --res.months;
            }

            res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

            return res;
        }

        function momentsDifference(base, other) {
            var res;
            if (!(base.isValid() && other.isValid())) {
                return {milliseconds: 0, months: 0};
            }

            other = cloneWithOffset(other, base);
            if (base.isBefore(other)) {
                res = positiveMomentsDifference(base, other);
            } else {
                res = positiveMomentsDifference(other, base);
                res.milliseconds = -res.milliseconds;
                res.months = -res.months;
            }

            return res;
        }

        // TODO: remove 'name' arg after deprecation is removed
        function createAdder(direction, name) {
            return function (val, period) {
                var dur, tmp;
                //invert the arguments, but complain about it
                if (period !== null && !isNaN(+period)) {
                    deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                    'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                    tmp = val; val = period; period = tmp;
                }

                val = typeof val === 'string' ? +val : val;
                dur = createDuration(val, period);
                addSubtract(this, dur, direction);
                return this;
            };
        }

        function addSubtract (mom, duration, isAdding, updateOffset) {
            var milliseconds = duration._milliseconds,
                days = absRound(duration._days),
                months = absRound(duration._months);

            if (!mom.isValid()) {
                // No op
                return;
            }

            updateOffset = updateOffset == null ? true : updateOffset;

            if (months) {
                setMonth(mom, get(mom, 'Month') + months * isAdding);
            }
            if (days) {
                set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
            }
            if (milliseconds) {
                mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
            }
            if (updateOffset) {
                hooks.updateOffset(mom, days || months);
            }
        }

        var add      = createAdder(1, 'add');
        var subtract = createAdder(-1, 'subtract');

        function getCalendarFormat(myMoment, now) {
            var diff = myMoment.diff(now, 'days', true);
            return diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
        }

        function calendar$1 (time, formats) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're local/utc/offset or not.
            var now = time || createLocal(),
                sod = cloneWithOffset(now, this).startOf('day'),
                format = hooks.calendarFormat(this, sod) || 'sameElse';

            var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

            return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
        }

        function clone () {
            return new Moment(this);
        }

        function isAfter (input, units) {
            var localInput = isMoment(input) ? input : createLocal(input);
            if (!(this.isValid() && localInput.isValid())) {
                return false;
            }
            units = normalizeUnits(units) || 'millisecond';
            if (units === 'millisecond') {
                return this.valueOf() > localInput.valueOf();
            } else {
                return localInput.valueOf() < this.clone().startOf(units).valueOf();
            }
        }

        function isBefore (input, units) {
            var localInput = isMoment(input) ? input : createLocal(input);
            if (!(this.isValid() && localInput.isValid())) {
                return false;
            }
            units = normalizeUnits(units) || 'millisecond';
            if (units === 'millisecond') {
                return this.valueOf() < localInput.valueOf();
            } else {
                return this.clone().endOf(units).valueOf() < localInput.valueOf();
            }
        }

        function isBetween (from, to, units, inclusivity) {
            var localFrom = isMoment(from) ? from : createLocal(from),
                localTo = isMoment(to) ? to : createLocal(to);
            if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
                return false;
            }
            inclusivity = inclusivity || '()';
            return (inclusivity[0] === '(' ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) &&
                (inclusivity[1] === ')' ? this.isBefore(localTo, units) : !this.isAfter(localTo, units));
        }

        function isSame (input, units) {
            var localInput = isMoment(input) ? input : createLocal(input),
                inputMs;
            if (!(this.isValid() && localInput.isValid())) {
                return false;
            }
            units = normalizeUnits(units) || 'millisecond';
            if (units === 'millisecond') {
                return this.valueOf() === localInput.valueOf();
            } else {
                inputMs = localInput.valueOf();
                return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
            }
        }

        function isSameOrAfter (input, units) {
            return this.isSame(input, units) || this.isAfter(input, units);
        }

        function isSameOrBefore (input, units) {
            return this.isSame(input, units) || this.isBefore(input, units);
        }

        function diff (input, units, asFloat) {
            var that,
                zoneDelta,
                output;

            if (!this.isValid()) {
                return NaN;
            }

            that = cloneWithOffset(input, this);

            if (!that.isValid()) {
                return NaN;
            }

            zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

            units = normalizeUnits(units);

            switch (units) {
                case 'year': output = monthDiff(this, that) / 12; break;
                case 'month': output = monthDiff(this, that); break;
                case 'quarter': output = monthDiff(this, that) / 3; break;
                case 'second': output = (this - that) / 1e3; break; // 1000
                case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
                case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
                case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
                case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
                default: output = this - that;
            }

            return asFloat ? output : absFloor(output);
        }

        function monthDiff (a, b) {
            // difference in months
            var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
                // b is in (anchor - 1 month, anchor + 1 month)
                anchor = a.clone().add(wholeMonthDiff, 'months'),
                anchor2, adjust;

            if (b - anchor < 0) {
                anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
                // linear across the month
                adjust = (b - anchor) / (anchor - anchor2);
            } else {
                anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
                // linear across the month
                adjust = (b - anchor) / (anchor2 - anchor);
            }

            //check for negative zero, return zero if negative zero
            return -(wholeMonthDiff + adjust) || 0;
        }

        hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
        hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

        function toString () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        }

        function toISOString(keepOffset) {
            if (!this.isValid()) {
                return null;
            }
            var utc = keepOffset !== true;
            var m = utc ? this.clone().utc() : this;
            if (m.year() < 0 || m.year() > 9999) {
                return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
            }
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                if (utc) {
                    return this.toDate().toISOString();
                } else {
                    return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
                }
            }
            return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
        }

        /**
         * Return a human readable representation of a moment that can
         * also be evaluated to get a new moment which is the same
         *
         * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
         */
        function inspect () {
            if (!this.isValid()) {
                return 'moment.invalid(/* ' + this._i + ' */)';
            }
            var func = 'moment';
            var zone = '';
            if (!this.isLocal()) {
                func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
                zone = 'Z';
            }
            var prefix = '[' + func + '("]';
            var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
            var datetime = '-MM-DD[T]HH:mm:ss.SSS';
            var suffix = zone + '[")]';

            return this.format(prefix + year + datetime + suffix);
        }

        function format (inputString) {
            if (!inputString) {
                inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
            }
            var output = formatMoment(this, inputString);
            return this.localeData().postformat(output);
        }

        function from (time, withoutSuffix) {
            if (this.isValid() &&
                    ((isMoment(time) && time.isValid()) ||
                     createLocal(time).isValid())) {
                return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
            } else {
                return this.localeData().invalidDate();
            }
        }

        function fromNow (withoutSuffix) {
            return this.from(createLocal(), withoutSuffix);
        }

        function to (time, withoutSuffix) {
            if (this.isValid() &&
                    ((isMoment(time) && time.isValid()) ||
                     createLocal(time).isValid())) {
                return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
            } else {
                return this.localeData().invalidDate();
            }
        }

        function toNow (withoutSuffix) {
            return this.to(createLocal(), withoutSuffix);
        }

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        function locale (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = getLocale(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        }

        var lang = deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        );

        function localeData () {
            return this._locale;
        }

        var MS_PER_SECOND = 1000;
        var MS_PER_MINUTE = 60 * MS_PER_SECOND;
        var MS_PER_HOUR = 60 * MS_PER_MINUTE;
        var MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

        // actual modulo - handles negative numbers (for dates before 1970):
        function mod$1(dividend, divisor) {
            return (dividend % divisor + divisor) % divisor;
        }

        function localStartOfDate(y, m, d) {
            // the date constructor remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                // preserve leap years using a full 400 year cycle, then reset
                return new Date(y + 400, m, d) - MS_PER_400_YEARS;
            } else {
                return new Date(y, m, d).valueOf();
            }
        }

        function utcStartOfDate(y, m, d) {
            // Date.UTC remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                // preserve leap years using a full 400 year cycle, then reset
                return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
            } else {
                return Date.UTC(y, m, d);
            }
        }

        function startOf (units) {
            var time;
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond' || !this.isValid()) {
                return this;
            }

            var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

            switch (units) {
                case 'year':
                    time = startOfDate(this.year(), 0, 1);
                    break;
                case 'quarter':
                    time = startOfDate(this.year(), this.month() - this.month() % 3, 1);
                    break;
                case 'month':
                    time = startOfDate(this.year(), this.month(), 1);
                    break;
                case 'week':
                    time = startOfDate(this.year(), this.month(), this.date() - this.weekday());
                    break;
                case 'isoWeek':
                    time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1));
                    break;
                case 'day':
                case 'date':
                    time = startOfDate(this.year(), this.month(), this.date());
                    break;
                case 'hour':
                    time = this._d.valueOf();
                    time -= mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR);
                    break;
                case 'minute':
                    time = this._d.valueOf();
                    time -= mod$1(time, MS_PER_MINUTE);
                    break;
                case 'second':
                    time = this._d.valueOf();
                    time -= mod$1(time, MS_PER_SECOND);
                    break;
            }

            this._d.setTime(time);
            hooks.updateOffset(this, true);
            return this;
        }

        function endOf (units) {
            var time;
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond' || !this.isValid()) {
                return this;
            }

            var startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

            switch (units) {
                case 'year':
                    time = startOfDate(this.year() + 1, 0, 1) - 1;
                    break;
                case 'quarter':
                    time = startOfDate(this.year(), this.month() - this.month() % 3 + 3, 1) - 1;
                    break;
                case 'month':
                    time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                    break;
                case 'week':
                    time = startOfDate(this.year(), this.month(), this.date() - this.weekday() + 7) - 1;
                    break;
                case 'isoWeek':
                    time = startOfDate(this.year(), this.month(), this.date() - (this.isoWeekday() - 1) + 7) - 1;
                    break;
                case 'day':
                case 'date':
                    time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                    break;
                case 'hour':
                    time = this._d.valueOf();
                    time += MS_PER_HOUR - mod$1(time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE), MS_PER_HOUR) - 1;
                    break;
                case 'minute':
                    time = this._d.valueOf();
                    time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                    break;
                case 'second':
                    time = this._d.valueOf();
                    time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                    break;
            }

            this._d.setTime(time);
            hooks.updateOffset(this, true);
            return this;
        }

        function valueOf () {
            return this._d.valueOf() - ((this._offset || 0) * 60000);
        }

        function unix () {
            return Math.floor(this.valueOf() / 1000);
        }

        function toDate () {
            return new Date(this.valueOf());
        }

        function toArray () {
            var m = this;
            return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
        }

        function toObject () {
            var m = this;
            return {
                years: m.year(),
                months: m.month(),
                date: m.date(),
                hours: m.hours(),
                minutes: m.minutes(),
                seconds: m.seconds(),
                milliseconds: m.milliseconds()
            };
        }

        function toJSON () {
            // new Date(NaN).toJSON() === null
            return this.isValid() ? this.toISOString() : null;
        }

        function isValid$2 () {
            return isValid(this);
        }

        function parsingFlags () {
            return extend({}, getParsingFlags(this));
        }

        function invalidAt () {
            return getParsingFlags(this).overflow;
        }

        function creationData() {
            return {
                input: this._i,
                format: this._f,
                locale: this._locale,
                isUTC: this._isUTC,
                strict: this._strict
            };
        }

        // FORMATTING

        addFormatToken(0, ['gg', 2], 0, function () {
            return this.weekYear() % 100;
        });

        addFormatToken(0, ['GG', 2], 0, function () {
            return this.isoWeekYear() % 100;
        });

        function addWeekYearFormatToken (token, getter) {
            addFormatToken(0, [token, token.length], 0, getter);
        }

        addWeekYearFormatToken('gggg',     'weekYear');
        addWeekYearFormatToken('ggggg',    'weekYear');
        addWeekYearFormatToken('GGGG',  'isoWeekYear');
        addWeekYearFormatToken('GGGGG', 'isoWeekYear');

        // ALIASES

        addUnitAlias('weekYear', 'gg');
        addUnitAlias('isoWeekYear', 'GG');

        // PRIORITY

        addUnitPriority('weekYear', 1);
        addUnitPriority('isoWeekYear', 1);


        // PARSING

        addRegexToken('G',      matchSigned);
        addRegexToken('g',      matchSigned);
        addRegexToken('GG',     match1to2, match2);
        addRegexToken('gg',     match1to2, match2);
        addRegexToken('GGGG',   match1to4, match4);
        addRegexToken('gggg',   match1to4, match4);
        addRegexToken('GGGGG',  match1to6, match6);
        addRegexToken('ggggg',  match1to6, match6);

        addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
            week[token.substr(0, 2)] = toInt(input);
        });

        addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
            week[token] = hooks.parseTwoDigitYear(input);
        });

        // MOMENTS

        function getSetWeekYear (input) {
            return getSetWeekYearHelper.call(this,
                    input,
                    this.week(),
                    this.weekday(),
                    this.localeData()._week.dow,
                    this.localeData()._week.doy);
        }

        function getSetISOWeekYear (input) {
            return getSetWeekYearHelper.call(this,
                    input, this.isoWeek(), this.isoWeekday(), 1, 4);
        }

        function getISOWeeksInYear () {
            return weeksInYear(this.year(), 1, 4);
        }

        function getWeeksInYear () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        }

        function getSetWeekYearHelper(input, week, weekday, dow, doy) {
            var weeksTarget;
            if (input == null) {
                return weekOfYear(this, dow, doy).year;
            } else {
                weeksTarget = weeksInYear(input, dow, doy);
                if (week > weeksTarget) {
                    week = weeksTarget;
                }
                return setWeekAll.call(this, input, week, weekday, dow, doy);
            }
        }

        function setWeekAll(weekYear, week, weekday, dow, doy) {
            var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
                date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

            this.year(date.getUTCFullYear());
            this.month(date.getUTCMonth());
            this.date(date.getUTCDate());
            return this;
        }

        // FORMATTING

        addFormatToken('Q', 0, 'Qo', 'quarter');

        // ALIASES

        addUnitAlias('quarter', 'Q');

        // PRIORITY

        addUnitPriority('quarter', 7);

        // PARSING

        addRegexToken('Q', match1);
        addParseToken('Q', function (input, array) {
            array[MONTH] = (toInt(input) - 1) * 3;
        });

        // MOMENTS

        function getSetQuarter (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        }

        // FORMATTING

        addFormatToken('D', ['DD', 2], 'Do', 'date');

        // ALIASES

        addUnitAlias('date', 'D');

        // PRIORITY
        addUnitPriority('date', 9);

        // PARSING

        addRegexToken('D',  match1to2);
        addRegexToken('DD', match1to2, match2);
        addRegexToken('Do', function (isStrict, locale) {
            // TODO: Remove "ordinalParse" fallback in next major release.
            return isStrict ?
              (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
              locale._dayOfMonthOrdinalParseLenient;
        });

        addParseToken(['D', 'DD'], DATE);
        addParseToken('Do', function (input, array) {
            array[DATE] = toInt(input.match(match1to2)[0]);
        });

        // MOMENTS

        var getSetDayOfMonth = makeGetSet('Date', true);

        // FORMATTING

        addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

        // ALIASES

        addUnitAlias('dayOfYear', 'DDD');

        // PRIORITY
        addUnitPriority('dayOfYear', 4);

        // PARSING

        addRegexToken('DDD',  match1to3);
        addRegexToken('DDDD', match3);
        addParseToken(['DDD', 'DDDD'], function (input, array, config) {
            config._dayOfYear = toInt(input);
        });

        // HELPERS

        // MOMENTS

        function getSetDayOfYear (input) {
            var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        }

        // FORMATTING

        addFormatToken('m', ['mm', 2], 0, 'minute');

        // ALIASES

        addUnitAlias('minute', 'm');

        // PRIORITY

        addUnitPriority('minute', 14);

        // PARSING

        addRegexToken('m',  match1to2);
        addRegexToken('mm', match1to2, match2);
        addParseToken(['m', 'mm'], MINUTE);

        // MOMENTS

        var getSetMinute = makeGetSet('Minutes', false);

        // FORMATTING

        addFormatToken('s', ['ss', 2], 0, 'second');

        // ALIASES

        addUnitAlias('second', 's');

        // PRIORITY

        addUnitPriority('second', 15);

        // PARSING

        addRegexToken('s',  match1to2);
        addRegexToken('ss', match1to2, match2);
        addParseToken(['s', 'ss'], SECOND);

        // MOMENTS

        var getSetSecond = makeGetSet('Seconds', false);

        // FORMATTING

        addFormatToken('S', 0, 0, function () {
            return ~~(this.millisecond() / 100);
        });

        addFormatToken(0, ['SS', 2], 0, function () {
            return ~~(this.millisecond() / 10);
        });

        addFormatToken(0, ['SSS', 3], 0, 'millisecond');
        addFormatToken(0, ['SSSS', 4], 0, function () {
            return this.millisecond() * 10;
        });
        addFormatToken(0, ['SSSSS', 5], 0, function () {
            return this.millisecond() * 100;
        });
        addFormatToken(0, ['SSSSSS', 6], 0, function () {
            return this.millisecond() * 1000;
        });
        addFormatToken(0, ['SSSSSSS', 7], 0, function () {
            return this.millisecond() * 10000;
        });
        addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
            return this.millisecond() * 100000;
        });
        addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
            return this.millisecond() * 1000000;
        });


        // ALIASES

        addUnitAlias('millisecond', 'ms');

        // PRIORITY

        addUnitPriority('millisecond', 16);

        // PARSING

        addRegexToken('S',    match1to3, match1);
        addRegexToken('SS',   match1to3, match2);
        addRegexToken('SSS',  match1to3, match3);

        var token;
        for (token = 'SSSS'; token.length <= 9; token += 'S') {
            addRegexToken(token, matchUnsigned);
        }

        function parseMs(input, array) {
            array[MILLISECOND] = toInt(('0.' + input) * 1000);
        }

        for (token = 'S'; token.length <= 9; token += 'S') {
            addParseToken(token, parseMs);
        }
        // MOMENTS

        var getSetMillisecond = makeGetSet('Milliseconds', false);

        // FORMATTING

        addFormatToken('z',  0, 0, 'zoneAbbr');
        addFormatToken('zz', 0, 0, 'zoneName');

        // MOMENTS

        function getZoneAbbr () {
            return this._isUTC ? 'UTC' : '';
        }

        function getZoneName () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        }

        var proto = Moment.prototype;

        proto.add               = add;
        proto.calendar          = calendar$1;
        proto.clone             = clone;
        proto.diff              = diff;
        proto.endOf             = endOf;
        proto.format            = format;
        proto.from              = from;
        proto.fromNow           = fromNow;
        proto.to                = to;
        proto.toNow             = toNow;
        proto.get               = stringGet;
        proto.invalidAt         = invalidAt;
        proto.isAfter           = isAfter;
        proto.isBefore          = isBefore;
        proto.isBetween         = isBetween;
        proto.isSame            = isSame;
        proto.isSameOrAfter     = isSameOrAfter;
        proto.isSameOrBefore    = isSameOrBefore;
        proto.isValid           = isValid$2;
        proto.lang              = lang;
        proto.locale            = locale;
        proto.localeData        = localeData;
        proto.max               = prototypeMax;
        proto.min               = prototypeMin;
        proto.parsingFlags      = parsingFlags;
        proto.set               = stringSet;
        proto.startOf           = startOf;
        proto.subtract          = subtract;
        proto.toArray           = toArray;
        proto.toObject          = toObject;
        proto.toDate            = toDate;
        proto.toISOString       = toISOString;
        proto.inspect           = inspect;
        proto.toJSON            = toJSON;
        proto.toString          = toString;
        proto.unix              = unix;
        proto.valueOf           = valueOf;
        proto.creationData      = creationData;
        proto.year       = getSetYear;
        proto.isLeapYear = getIsLeapYear;
        proto.weekYear    = getSetWeekYear;
        proto.isoWeekYear = getSetISOWeekYear;
        proto.quarter = proto.quarters = getSetQuarter;
        proto.month       = getSetMonth;
        proto.daysInMonth = getDaysInMonth;
        proto.week           = proto.weeks        = getSetWeek;
        proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
        proto.weeksInYear    = getWeeksInYear;
        proto.isoWeeksInYear = getISOWeeksInYear;
        proto.date       = getSetDayOfMonth;
        proto.day        = proto.days             = getSetDayOfWeek;
        proto.weekday    = getSetLocaleDayOfWeek;
        proto.isoWeekday = getSetISODayOfWeek;
        proto.dayOfYear  = getSetDayOfYear;
        proto.hour = proto.hours = getSetHour;
        proto.minute = proto.minutes = getSetMinute;
        proto.second = proto.seconds = getSetSecond;
        proto.millisecond = proto.milliseconds = getSetMillisecond;
        proto.utcOffset            = getSetOffset;
        proto.utc                  = setOffsetToUTC;
        proto.local                = setOffsetToLocal;
        proto.parseZone            = setOffsetToParsedOffset;
        proto.hasAlignedHourOffset = hasAlignedHourOffset;
        proto.isDST                = isDaylightSavingTime;
        proto.isLocal              = isLocal;
        proto.isUtcOffset          = isUtcOffset;
        proto.isUtc                = isUtc;
        proto.isUTC                = isUtc;
        proto.zoneAbbr = getZoneAbbr;
        proto.zoneName = getZoneName;
        proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
        proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
        proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
        proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
        proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

        function createUnix (input) {
            return createLocal(input * 1000);
        }

        function createInZone () {
            return createLocal.apply(null, arguments).parseZone();
        }

        function preParsePostFormat (string) {
            return string;
        }

        var proto$1 = Locale.prototype;

        proto$1.calendar        = calendar;
        proto$1.longDateFormat  = longDateFormat;
        proto$1.invalidDate     = invalidDate;
        proto$1.ordinal         = ordinal;
        proto$1.preparse        = preParsePostFormat;
        proto$1.postformat      = preParsePostFormat;
        proto$1.relativeTime    = relativeTime;
        proto$1.pastFuture      = pastFuture;
        proto$1.set             = set;

        proto$1.months            =        localeMonths;
        proto$1.monthsShort       =        localeMonthsShort;
        proto$1.monthsParse       =        localeMonthsParse;
        proto$1.monthsRegex       = monthsRegex;
        proto$1.monthsShortRegex  = monthsShortRegex;
        proto$1.week = localeWeek;
        proto$1.firstDayOfYear = localeFirstDayOfYear;
        proto$1.firstDayOfWeek = localeFirstDayOfWeek;

        proto$1.weekdays       =        localeWeekdays;
        proto$1.weekdaysMin    =        localeWeekdaysMin;
        proto$1.weekdaysShort  =        localeWeekdaysShort;
        proto$1.weekdaysParse  =        localeWeekdaysParse;

        proto$1.weekdaysRegex       =        weekdaysRegex;
        proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
        proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

        proto$1.isPM = localeIsPM;
        proto$1.meridiem = localeMeridiem;

        function get$1 (format, index, field, setter) {
            var locale = getLocale();
            var utc = createUTC().set(setter, index);
            return locale[field](utc, format);
        }

        function listMonthsImpl (format, index, field) {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';

            if (index != null) {
                return get$1(format, index, field, 'month');
            }

            var i;
            var out = [];
            for (i = 0; i < 12; i++) {
                out[i] = get$1(format, i, field, 'month');
            }
            return out;
        }

        // ()
        // (5)
        // (fmt, 5)
        // (fmt)
        // (true)
        // (true, 5)
        // (true, fmt, 5)
        // (true, fmt)
        function listWeekdaysImpl (localeSorted, format, index, field) {
            if (typeof localeSorted === 'boolean') {
                if (isNumber(format)) {
                    index = format;
                    format = undefined;
                }

                format = format || '';
            } else {
                format = localeSorted;
                index = format;
                localeSorted = false;

                if (isNumber(format)) {
                    index = format;
                    format = undefined;
                }

                format = format || '';
            }

            var locale = getLocale(),
                shift = localeSorted ? locale._week.dow : 0;

            if (index != null) {
                return get$1(format, (index + shift) % 7, field, 'day');
            }

            var i;
            var out = [];
            for (i = 0; i < 7; i++) {
                out[i] = get$1(format, (i + shift) % 7, field, 'day');
            }
            return out;
        }

        function listMonths (format, index) {
            return listMonthsImpl(format, index, 'months');
        }

        function listMonthsShort (format, index) {
            return listMonthsImpl(format, index, 'monthsShort');
        }

        function listWeekdays (localeSorted, format, index) {
            return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
        }

        function listWeekdaysShort (localeSorted, format, index) {
            return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
        }

        function listWeekdaysMin (localeSorted, format, index) {
            return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
        }

        getSetGlobalLocale('en', {
            dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
            ordinal : function (number) {
                var b = number % 10,
                    output = (toInt(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                    (b === 2) ? 'nd' :
                    (b === 3) ? 'rd' : 'th';
                return number + output;
            }
        });

        // Side effect imports

        hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
        hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

        var mathAbs = Math.abs;

        function abs () {
            var data           = this._data;

            this._milliseconds = mathAbs(this._milliseconds);
            this._days         = mathAbs(this._days);
            this._months       = mathAbs(this._months);

            data.milliseconds  = mathAbs(data.milliseconds);
            data.seconds       = mathAbs(data.seconds);
            data.minutes       = mathAbs(data.minutes);
            data.hours         = mathAbs(data.hours);
            data.months        = mathAbs(data.months);
            data.years         = mathAbs(data.years);

            return this;
        }

        function addSubtract$1 (duration, input, value, direction) {
            var other = createDuration(input, value);

            duration._milliseconds += direction * other._milliseconds;
            duration._days         += direction * other._days;
            duration._months       += direction * other._months;

            return duration._bubble();
        }

        // supports only 2.0-style add(1, 's') or add(duration)
        function add$1 (input, value) {
            return addSubtract$1(this, input, value, 1);
        }

        // supports only 2.0-style subtract(1, 's') or subtract(duration)
        function subtract$1 (input, value) {
            return addSubtract$1(this, input, value, -1);
        }

        function absCeil (number) {
            if (number < 0) {
                return Math.floor(number);
            } else {
                return Math.ceil(number);
            }
        }

        function bubble () {
            var milliseconds = this._milliseconds;
            var days         = this._days;
            var months       = this._months;
            var data         = this._data;
            var seconds, minutes, hours, years, monthsFromDays;

            // if we have a mix of positive and negative values, bubble down first
            // check: https://github.com/moment/moment/issues/2166
            if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                    (milliseconds <= 0 && days <= 0 && months <= 0))) {
                milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
                days = 0;
                months = 0;
            }

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds           = absFloor(milliseconds / 1000);
            data.seconds      = seconds % 60;

            minutes           = absFloor(seconds / 60);
            data.minutes      = minutes % 60;

            hours             = absFloor(minutes / 60);
            data.hours        = hours % 24;

            days += absFloor(hours / 24);

            // convert days to months
            monthsFromDays = absFloor(daysToMonths(days));
            months += monthsFromDays;
            days -= absCeil(monthsToDays(monthsFromDays));

            // 12 months -> 1 year
            years = absFloor(months / 12);
            months %= 12;

            data.days   = days;
            data.months = months;
            data.years  = years;

            return this;
        }

        function daysToMonths (days) {
            // 400 years have 146097 days (taking into account leap year rules)
            // 400 years have 12 months === 4800
            return days * 4800 / 146097;
        }

        function monthsToDays (months) {
            // the reverse of daysToMonths
            return months * 146097 / 4800;
        }

        function as (units) {
            if (!this.isValid()) {
                return NaN;
            }
            var days;
            var months;
            var milliseconds = this._milliseconds;

            units = normalizeUnits(units);

            if (units === 'month' || units === 'quarter' || units === 'year') {
                days = this._days + milliseconds / 864e5;
                months = this._months + daysToMonths(days);
                switch (units) {
                    case 'month':   return months;
                    case 'quarter': return months / 3;
                    case 'year':    return months / 12;
                }
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(monthsToDays(this._months));
                switch (units) {
                    case 'week'   : return days / 7     + milliseconds / 6048e5;
                    case 'day'    : return days         + milliseconds / 864e5;
                    case 'hour'   : return days * 24    + milliseconds / 36e5;
                    case 'minute' : return days * 1440  + milliseconds / 6e4;
                    case 'second' : return days * 86400 + milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        }

        // TODO: Use this.as('ms')?
        function valueOf$1 () {
            if (!this.isValid()) {
                return NaN;
            }
            return (
                this._milliseconds +
                this._days * 864e5 +
                (this._months % 12) * 2592e6 +
                toInt(this._months / 12) * 31536e6
            );
        }

        function makeAs (alias) {
            return function () {
                return this.as(alias);
            };
        }

        var asMilliseconds = makeAs('ms');
        var asSeconds      = makeAs('s');
        var asMinutes      = makeAs('m');
        var asHours        = makeAs('h');
        var asDays         = makeAs('d');
        var asWeeks        = makeAs('w');
        var asMonths       = makeAs('M');
        var asQuarters     = makeAs('Q');
        var asYears        = makeAs('y');

        function clone$1 () {
            return createDuration(this);
        }

        function get$2 (units) {
            units = normalizeUnits(units);
            return this.isValid() ? this[units + 's']() : NaN;
        }

        function makeGetter(name) {
            return function () {
                return this.isValid() ? this._data[name] : NaN;
            };
        }

        var milliseconds = makeGetter('milliseconds');
        var seconds      = makeGetter('seconds');
        var minutes      = makeGetter('minutes');
        var hours        = makeGetter('hours');
        var days         = makeGetter('days');
        var months       = makeGetter('months');
        var years        = makeGetter('years');

        function weeks () {
            return absFloor(this.days() / 7);
        }

        var round = Math.round;
        var thresholds = {
            ss: 44,         // a few seconds to seconds
            s : 45,         // seconds to minute
            m : 45,         // minutes to hour
            h : 22,         // hours to day
            d : 26,         // days to month
            M : 11          // months to year
        };

        // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
        function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
            return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
        }

        function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
            var duration = createDuration(posNegDuration).abs();
            var seconds  = round(duration.as('s'));
            var minutes  = round(duration.as('m'));
            var hours    = round(duration.as('h'));
            var days     = round(duration.as('d'));
            var months   = round(duration.as('M'));
            var years    = round(duration.as('y'));

            var a = seconds <= thresholds.ss && ['s', seconds]  ||
                    seconds < thresholds.s   && ['ss', seconds] ||
                    minutes <= 1             && ['m']           ||
                    minutes < thresholds.m   && ['mm', minutes] ||
                    hours   <= 1             && ['h']           ||
                    hours   < thresholds.h   && ['hh', hours]   ||
                    days    <= 1             && ['d']           ||
                    days    < thresholds.d   && ['dd', days]    ||
                    months  <= 1             && ['M']           ||
                    months  < thresholds.M   && ['MM', months]  ||
                    years   <= 1             && ['y']           || ['yy', years];

            a[2] = withoutSuffix;
            a[3] = +posNegDuration > 0;
            a[4] = locale;
            return substituteTimeAgo.apply(null, a);
        }

        // This function allows you to set the rounding function for relative time strings
        function getSetRelativeTimeRounding (roundingFunction) {
            if (roundingFunction === undefined) {
                return round;
            }
            if (typeof(roundingFunction) === 'function') {
                round = roundingFunction;
                return true;
            }
            return false;
        }

        // This function allows you to set a threshold for relative time strings
        function getSetRelativeTimeThreshold (threshold, limit) {
            if (thresholds[threshold] === undefined) {
                return false;
            }
            if (limit === undefined) {
                return thresholds[threshold];
            }
            thresholds[threshold] = limit;
            if (threshold === 's') {
                thresholds.ss = limit - 1;
            }
            return true;
        }

        function humanize (withSuffix) {
            if (!this.isValid()) {
                return this.localeData().invalidDate();
            }

            var locale = this.localeData();
            var output = relativeTime$1(this, !withSuffix, locale);

            if (withSuffix) {
                output = locale.pastFuture(+this, output);
            }

            return locale.postformat(output);
        }

        var abs$1 = Math.abs;

        function sign(x) {
            return ((x > 0) - (x < 0)) || +x;
        }

        function toISOString$1() {
            // for ISO strings we do not use the normal bubbling rules:
            //  * milliseconds bubble up until they become hours
            //  * days do not bubble at all
            //  * months bubble up until they become years
            // This is because there is no context-free conversion between hours and days
            // (think of clock changes)
            // and also not between days and months (28-31 days per month)
            if (!this.isValid()) {
                return this.localeData().invalidDate();
            }

            var seconds = abs$1(this._milliseconds) / 1000;
            var days         = abs$1(this._days);
            var months       = abs$1(this._months);
            var minutes, hours, years;

            // 3600 seconds -> 60 minutes -> 1 hour
            minutes           = absFloor(seconds / 60);
            hours             = absFloor(minutes / 60);
            seconds %= 60;
            minutes %= 60;

            // 12 months -> 1 year
            years  = absFloor(months / 12);
            months %= 12;


            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var Y = years;
            var M = months;
            var D = days;
            var h = hours;
            var m = minutes;
            var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
            var total = this.asSeconds();

            if (!total) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            var totalSign = total < 0 ? '-' : '';
            var ymSign = sign(this._months) !== sign(total) ? '-' : '';
            var daysSign = sign(this._days) !== sign(total) ? '-' : '';
            var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

            return totalSign + 'P' +
                (Y ? ymSign + Y + 'Y' : '') +
                (M ? ymSign + M + 'M' : '') +
                (D ? daysSign + D + 'D' : '') +
                ((h || m || s) ? 'T' : '') +
                (h ? hmsSign + h + 'H' : '') +
                (m ? hmsSign + m + 'M' : '') +
                (s ? hmsSign + s + 'S' : '');
        }

        var proto$2 = Duration.prototype;

        proto$2.isValid        = isValid$1;
        proto$2.abs            = abs;
        proto$2.add            = add$1;
        proto$2.subtract       = subtract$1;
        proto$2.as             = as;
        proto$2.asMilliseconds = asMilliseconds;
        proto$2.asSeconds      = asSeconds;
        proto$2.asMinutes      = asMinutes;
        proto$2.asHours        = asHours;
        proto$2.asDays         = asDays;
        proto$2.asWeeks        = asWeeks;
        proto$2.asMonths       = asMonths;
        proto$2.asQuarters     = asQuarters;
        proto$2.asYears        = asYears;
        proto$2.valueOf        = valueOf$1;
        proto$2._bubble        = bubble;
        proto$2.clone          = clone$1;
        proto$2.get            = get$2;
        proto$2.milliseconds   = milliseconds;
        proto$2.seconds        = seconds;
        proto$2.minutes        = minutes;
        proto$2.hours          = hours;
        proto$2.days           = days;
        proto$2.weeks          = weeks;
        proto$2.months         = months;
        proto$2.years          = years;
        proto$2.humanize       = humanize;
        proto$2.toISOString    = toISOString$1;
        proto$2.toString       = toISOString$1;
        proto$2.toJSON         = toISOString$1;
        proto$2.locale         = locale;
        proto$2.localeData     = localeData;

        proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
        proto$2.lang = lang;

        // Side effect imports

        // FORMATTING

        addFormatToken('X', 0, 0, 'unix');
        addFormatToken('x', 0, 0, 'valueOf');

        // PARSING

        addRegexToken('x', matchSigned);
        addRegexToken('X', matchTimestamp);
        addParseToken('X', function (input, array, config) {
            config._d = new Date(parseFloat(input, 10) * 1000);
        });
        addParseToken('x', function (input, array, config) {
            config._d = new Date(toInt(input));
        });

        // Side effect imports


        hooks.version = '2.24.0';

        setHookCallback(createLocal);

        hooks.fn                    = proto;
        hooks.min                   = min;
        hooks.max                   = max;
        hooks.now                   = now;
        hooks.utc                   = createUTC;
        hooks.unix                  = createUnix;
        hooks.months                = listMonths;
        hooks.isDate                = isDate;
        hooks.locale                = getSetGlobalLocale;
        hooks.invalid               = createInvalid;
        hooks.duration              = createDuration;
        hooks.isMoment              = isMoment;
        hooks.weekdays              = listWeekdays;
        hooks.parseZone             = createInZone;
        hooks.localeData            = getLocale;
        hooks.isDuration            = isDuration;
        hooks.monthsShort           = listMonthsShort;
        hooks.weekdaysMin           = listWeekdaysMin;
        hooks.defineLocale          = defineLocale;
        hooks.updateLocale          = updateLocale;
        hooks.locales               = listLocales;
        hooks.weekdaysShort         = listWeekdaysShort;
        hooks.normalizeUnits        = normalizeUnits;
        hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
        hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
        hooks.calendarFormat        = getCalendarFormat;
        hooks.prototype             = proto;

        // currently HTML5 input type only supports 24-hour formats
        hooks.HTML5_FMT = {
            DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',             // <input type="datetime-local" />
            DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',  // <input type="datetime-local" step="1" />
            DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',   // <input type="datetime-local" step="0.001" />
            DATE: 'YYYY-MM-DD',                             // <input type="date" />
            TIME: 'HH:mm',                                  // <input type="time" />
            TIME_SECONDS: 'HH:mm:ss',                       // <input type="time" step="1" />
            TIME_MS: 'HH:mm:ss.SSS',                        // <input type="time" step="0.001" />
            WEEK: 'GGGG-[W]WW',                             // <input type="week" />
            MONTH: 'YYYY-MM'                                // <input type="month" />
        };

        return hooks;

    })));
    });

    /* src/App.svelte generated by Svelte v3.16.0 */
    const file$2 = "src/App.svelte";

    // (212:1) {:catch error}
    function create_catch_block$2(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[7] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error preloading articles: ");
    			t1 = text(t1_value);
    			add_location(p, file$2, 212, 2, 5692);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(212:1) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (210:1) {:then preloaded}
    function create_then_block$2(ctx) {
    	let current;
    	const scans_spread_levels = [/*preloaded*/ ctx[6]];
    	let scans_props = {};

    	for (let i = 0; i < scans_spread_levels.length; i += 1) {
    		scans_props = assign(scans_props, scans_spread_levels[i]);
    	}

    	const scans = new Scans({ props: scans_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(scans.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scans, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scans_changes = dirty & /*scannedPreloading*/ 1
    			? get_spread_update(scans_spread_levels, [get_spread_object(/*preloaded*/ ctx[6])])
    			: {};

    			scans.$set(scans_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scans.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scans.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scans, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(210:1) {:then preloaded}",
    		ctx
    	});

    	return block;
    }

    // (208:27)    <p>Preloading articles....</p>  {:then preloaded}
    function create_pending_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Preloading articles....";
    			add_location(p, file$2, 208, 2, 5597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(208:27)    <p>Preloading articles....</p>  {:then preloaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let div20;
    	let div19;
    	let div3;
    	let div2;
    	let div0;
    	let figure0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t2;
    	let div18;
    	let div8;
    	let div7;
    	let div5;
    	let div4;
    	let figure1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div6;
    	let p1;
    	let t5;
    	let div17;
    	let div9;
    	let p2;
    	let t7;
    	let div13;
    	let div12;
    	let div10;
    	let p3;
    	let t9;
    	let div11;
    	let p4;
    	let t10;
    	let div16;
    	let div14;
    	let p5;
    	let t12;
    	let div15;
    	let p6;
    	let t14;
    	let t15;
    	let h2;
    	let t17;
    	let await_block_anchor;
    	let promise;
    	let current;
    	const scanssub = new ScansSub({ $$inline: true });

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 6,
    		error: 7,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*scannedPreloading*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div20 = element("div");
    			div19 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			figure0 = element("figure");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "TITLE";
    			t2 = space();
    			div18 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			figure1 = element("figure");
    			img1 = element("img");
    			t3 = space();
    			div6 = element("div");
    			p1 = element("p");
    			p1.textContent = "10-00234";
    			t5 = space();
    			div17 = element("div");
    			div9 = element("div");
    			p2 = element("p");
    			p2.textContent = "Arturo Jose T. Magnoaaaa";
    			t7 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div10 = element("div");
    			p3 = element("p");
    			p3.textContent = "_";
    			t9 = space();
    			div11 = element("div");
    			p4 = element("p");
    			t10 = space();
    			div16 = element("div");
    			div14 = element("div");
    			p5 = element("p");
    			p5.textContent = "IN";
    			t12 = space();
    			div15 = element("div");
    			p6 = element("p");
    			p6.textContent = "OUT";
    			t14 = space();
    			create_component(scanssub.$$.fragment);
    			t15 = space();
    			h2 = element("h2");
    			h2.textContent = "Scans";
    			t17 = space();
    			await_block_anchor = empty();
    			info.block.c();
    			if (img0.src !== (img0_src_value = "https://i.pinimg.com/474x/a3/4e/ef/a34eef6b581ad41202b0abdeacddfb84--school-logo-random-thoughts.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "svelte-kmn29t");
    			add_location(img0, file$2, 129, 18, 2947);
    			attr_dev(figure0, "class", "image is-64x64 svelte-kmn29t");
    			add_location(figure0, file$2, 128, 16, 2897);
    			attr_dev(div0, "class", "column is-narrow is-paddingless svelte-kmn29t");
    			add_location(div0, file$2, 127, 14, 2835);
    			attr_dev(p0, "class", "title notification svelte-kmn29t");
    			set_style(p0, "font-size", "1rem");
    			set_style(p0, "background", "none");
    			add_location(p0, file$2, 135, 16, 3217);
    			attr_dev(div1, "class", "column is-narrow svelte-kmn29t");
    			add_location(div1, file$2, 134, 14, 3170);
    			attr_dev(div2, "class", "columns is-mobile is-multiline is-gapless svelte-kmn29t");
    			add_location(div2, file$2, 126, 12, 2765);
    			attr_dev(div3, "id", "header");
    			attr_dev(div3, "class", "column svelte-kmn29t");
    			set_style(div3, "background-color", "coral");
    			set_style(div3, "align-items", "center");
    			add_location(div3, file$2, 121, 10, 2629);
    			if (img1.src !== (img1_src_value = "https://randomuser.me/api/portraits/" + /*gender*/ ctx[1] + "/" + /*randomNumber*/ ctx[2] + ".jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "rat");
    			attr_dev(img1, "class", "svelte-kmn29t");
    			add_location(img1, file$2, 154, 22, 3899);
    			attr_dev(figure1, "class", "image is-1by1 svelte-kmn29t");
    			add_location(figure1, file$2, 153, 20, 3846);
    			attr_dev(div4, "class", "notification  svelte-kmn29t");
    			attr_dev(div4, "id", "picture");
    			add_location(div4, file$2, 152, 18, 3785);
    			attr_dev(div5, "class", "column is-hard-right is-hard-bottom svelte-kmn29t");
    			add_location(div5, file$2, 151, 16, 3717);
    			attr_dev(p1, "class", "center-box subtitle is-3 svelte-kmn29t");
    			attr_dev(p1, "id", "id-number");
    			add_location(p1, file$2, 162, 18, 4206);
    			attr_dev(div6, "class", "column is-hard-bottom is-hard-top-landscape svelte-kmn29t");
    			add_location(div6, file$2, 161, 16, 4130);
    			attr_dev(div7, "class", "columns is-mutliline is-mobile is-gapless svelte-kmn29t");
    			attr_dev(div7, "id", "picture-id");
    			add_location(div7, file$2, 148, 14, 3597);
    			attr_dev(div8, "class", "column is-4 svelte-kmn29t");
    			add_location(div8, file$2, 147, 12, 3557);
    			attr_dev(p2, "class", "center-box title is-3 is-marginless svelte-kmn29t");
    			add_location(p2, file$2, 173, 16, 4487);
    			attr_dev(div9, "class", "column is-paddingless svelte-kmn29t");
    			add_location(div9, file$2, 172, 14, 4435);
    			attr_dev(p3, "id", "now");
    			attr_dev(p3, "class", "title svelte-kmn29t");
    			set_style(p3, "font-size", "5rem");
    			add_location(p3, file$2, 180, 20, 4805);
    			attr_dev(div10, "class", "column is-narrow svelte-kmn29t");
    			add_location(div10, file$2, 179, 18, 4754);
    			attr_dev(p4, "id", "period");
    			attr_dev(p4, "class", "title is-1 svelte-kmn29t");
    			add_location(p4, file$2, 183, 20, 4956);
    			attr_dev(div11, "class", "column is-narrow svelte-kmn29t");
    			add_location(div11, file$2, 182, 18, 4905);
    			attr_dev(div12, "class", "columns is-multiline is-mobile svelte-kmn29t");
    			add_location(div12, file$2, 178, 16, 4691);
    			attr_dev(div13, "class", "notification is-marginless svelte-kmn29t");
    			add_location(div13, file$2, 177, 14, 4634);
    			attr_dev(p5, "class", "center-box is-primary has-text-centered svelte-kmn29t");
    			add_location(p5, file$2, 189, 18, 5201);
    			attr_dev(div14, "class", "column is-hard-right svelte-kmn29t");
    			add_location(div14, file$2, 188, 16, 5148);
    			attr_dev(p6, "class", "center-box is-primary has-text-centered svelte-kmn29t");
    			add_location(p6, file$2, 192, 18, 5350);
    			attr_dev(div15, "class", "column is-hard-left svelte-kmn29t");
    			add_location(div15, file$2, 191, 16, 5298);
    			attr_dev(div16, "class", "columns is-multiline is-mobile is-gapless svelte-kmn29t");
    			add_location(div16, file$2, 187, 14, 5076);
    			attr_dev(div17, "class", "column space-group svelte-kmn29t");
    			add_location(div17, file$2, 171, 12, 4388);
    			attr_dev(div18, "class", "columns is-mutliline is-mobile is-marginless is-gapless svelte-kmn29t");
    			attr_dev(div18, "id", "layout");
    			add_location(div18, file$2, 144, 10, 3439);
    			attr_dev(div19, "class", "column svelte-kmn29t");
    			add_location(div19, file$2, 120, 8, 2598);
    			attr_dev(div20, "class", " grid svelte-kmn29t");
    			add_location(div20, file$2, 118, 4, 2569);
    			attr_dev(section, "class", "hero is-fullheight svelte-kmn29t");
    			add_location(section, file$2, 117, 2, 2528);
    			add_location(h2, file$2, 205, 1, 5551);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, figure0);
    			append_dev(figure0, img0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div19, t2);
    			append_dev(div19, div18);
    			append_dev(div18, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, div4);
    			append_dev(div4, figure1);
    			append_dev(figure1, img1);
    			append_dev(div7, t3);
    			append_dev(div7, div6);
    			append_dev(div6, p1);
    			append_dev(div18, t5);
    			append_dev(div18, div17);
    			append_dev(div17, div9);
    			append_dev(div9, p2);
    			append_dev(div17, t7);
    			append_dev(div17, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, p3);
    			append_dev(div12, t9);
    			append_dev(div12, div11);
    			append_dev(div11, p4);
    			append_dev(div17, t10);
    			append_dev(div17, div16);
    			append_dev(div16, div14);
    			append_dev(div14, p5);
    			append_dev(div16, t12);
    			append_dev(div16, div15);
    			append_dev(div15, p6);
    			insert_dev(target, t14, anchor);
    			mount_component(scanssub, target, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[6] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scanssub.$$.fragment, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scanssub.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t14);
    			destroy_component(scanssub, detaching);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self) {
    	const scannedPreloading = preload();
    	setClient(client$1);
    	console.log("rat");
    	let src = "tutorial/image.gif";

    	var update = () => {
    		document.getElementById("now").innerHTML = moment().format("h:mm:ss");
    		document.getElementById("period").innerHTML = moment().format("A");
    	};

    	setInterval(update, 1000);
    	let genders = ["women", "men"];
    	let gender = genders[Math.floor(Math.random() * 2)];
    	let randomNumber = Math.floor(Math.random() * 80);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) src = $$props.src;
    		if ("update" in $$props) update = $$props.update;
    		if ("genders" in $$props) genders = $$props.genders;
    		if ("gender" in $$props) $$invalidate(1, gender = $$props.gender);
    		if ("randomNumber" in $$props) $$invalidate(2, randomNumber = $$props.randomNumber);
    	};

    	return [scannedPreloading, gender, randomNumber];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
