
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
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
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Tailwind.svelte generated by Svelte v3.29.0 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tailwind", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tailwind> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tailwind extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwind",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var grpcWebClient_umd = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(commonjsGlobal,function(){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n});},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=10)}([function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(3);t.Metadata=n.BrowserHeaders;},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0}),t.debug=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];console.debug?console.debug.apply(null,e):console.log.apply(null,e);};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(0),o=r(8),s=r(9),i=r(1),a=r(4),u=r(14);t.client=function(e,t){return new d(e,t)};var d=function(){function e(e,t){this.started=!1,this.sentFirstMessage=!1,this.completed=!1,this.closed=!1,this.finishedSending=!1,this.onHeadersCallbacks=[],this.onMessageCallbacks=[],this.onEndCallbacks=[],this.parser=new o.ChunkParser,this.methodDefinition=e,this.props=t,this.createTransport();}return e.prototype.createTransport=function(){var e=this.props.host+"/"+this.methodDefinition.service.serviceName+"/"+this.methodDefinition.methodName,t={methodDefinition:this.methodDefinition,debug:this.props.debug||!1,url:e,onHeaders:this.onTransportHeaders.bind(this),onChunk:this.onTransportChunk.bind(this),onEnd:this.onTransportEnd.bind(this)};this.props.transport?this.transport=this.props.transport(t):this.transport=a.makeDefaultTransport(t);},e.prototype.onTransportHeaders=function(e,t){if(this.props.debug&&i.debug("onHeaders",e,t),this.closed)this.props.debug&&i.debug("grpc.onHeaders received after request was closed - ignoring");else if(0===t);else {this.responseHeaders=e,this.props.debug&&i.debug("onHeaders.responseHeaders",JSON.stringify(this.responseHeaders,null,2));var r=c(e);this.props.debug&&i.debug("onHeaders.gRPCStatus",r);var n=r&&r>=0?r:s.httpStatusToCode(t);this.props.debug&&i.debug("onHeaders.code",n);var o=e.get("grpc-message")||[];if(this.props.debug&&i.debug("onHeaders.gRPCMessage",o),this.rawOnHeaders(e),n!==s.Code.OK){var a=this.decodeGRPCStatus(o[0]);this.rawOnError(n,a,e);}}},e.prototype.onTransportChunk=function(e){var t=this;if(this.closed)this.props.debug&&i.debug("grpc.onChunk received after request was closed - ignoring");else {var r=[];try{r=this.parser.parse(e);}catch(e){return this.props.debug&&i.debug("onChunk.parsing error",e,e.message),void this.rawOnError(s.Code.Internal,"parsing error: "+e.message)}r.forEach(function(e){if(e.chunkType===o.ChunkType.MESSAGE){var r=t.methodDefinition.responseType.deserializeBinary(e.data);t.rawOnMessage(r);}else e.chunkType===o.ChunkType.TRAILERS&&(t.responseHeaders?(t.responseTrailers=new n.Metadata(e.trailers),t.props.debug&&i.debug("onChunk.trailers",t.responseTrailers)):(t.responseHeaders=new n.Metadata(e.trailers),t.rawOnHeaders(t.responseHeaders)));});}},e.prototype.onTransportEnd=function(){if(this.props.debug&&i.debug("grpc.onEnd"),this.closed)this.props.debug&&i.debug("grpc.onEnd received after request was closed - ignoring");else if(void 0!==this.responseTrailers){var e=c(this.responseTrailers);if(null!==e){var t=this.responseTrailers.get("grpc-message"),r=this.decodeGRPCStatus(t[0]);this.rawOnEnd(e,r,this.responseTrailers);}else this.rawOnError(s.Code.Internal,"Response closed without grpc-status (Trailers provided)");}else {if(void 0===this.responseHeaders)return void this.rawOnError(s.Code.Unknown,"Response closed without headers");var n=c(this.responseHeaders),o=this.responseHeaders.get("grpc-message");if(this.props.debug&&i.debug("grpc.headers only response ",n,o),null===n)return void this.rawOnEnd(s.Code.Unknown,"Response closed without grpc-status (Headers only)",this.responseHeaders);var a=this.decodeGRPCStatus(o[0]);this.rawOnEnd(n,a,this.responseHeaders);}},e.prototype.decodeGRPCStatus=function(e){if(!e)return "";try{return decodeURIComponent(e)}catch(t){return e}},e.prototype.rawOnEnd=function(e,t,r){var n=this;this.props.debug&&i.debug("rawOnEnd",e,t,r),this.completed||(this.completed=!0,this.onEndCallbacks.forEach(function(o){if(!n.closed)try{o(e,t,r);}catch(e){setTimeout(function(){throw e});}}));},e.prototype.rawOnHeaders=function(e){this.props.debug&&i.debug("rawOnHeaders",e),this.completed||this.onHeadersCallbacks.forEach(function(t){try{t(e);}catch(e){setTimeout(function(){throw e});}});},e.prototype.rawOnError=function(e,t,r){var o=this;void 0===r&&(r=new n.Metadata),this.props.debug&&i.debug("rawOnError",e,t),this.completed||(this.completed=!0,this.onEndCallbacks.forEach(function(n){if(!o.closed)try{n(e,t,r);}catch(e){setTimeout(function(){throw e});}}));},e.prototype.rawOnMessage=function(e){var t=this;this.props.debug&&i.debug("rawOnMessage",e.toObject()),this.completed||this.closed||this.onMessageCallbacks.forEach(function(r){if(!t.closed)try{r(e);}catch(e){setTimeout(function(){throw e});}});},e.prototype.onHeaders=function(e){this.onHeadersCallbacks.push(e);},e.prototype.onMessage=function(e){this.onMessageCallbacks.push(e);},e.prototype.onEnd=function(e){this.onEndCallbacks.push(e);},e.prototype.start=function(e){if(this.started)throw new Error("Client already started - cannot .start()");this.started=!0;var t=new n.Metadata(e||{});t.set("content-type","application/grpc-web+proto"),t.set("x-grpc-web","1"),this.transport.start(t);},e.prototype.send=function(e){if(!this.started)throw new Error("Client not started - .start() must be called before .send()");if(this.closed)throw new Error("Client already closed - cannot .send()");if(this.finishedSending)throw new Error("Client already finished sending - cannot .send()");if(!this.methodDefinition.requestStream&&this.sentFirstMessage)throw new Error("Message already sent for non-client-streaming method - cannot .send()");this.sentFirstMessage=!0;var t=u.frameRequest(e);this.transport.sendMessage(t);},e.prototype.finishSend=function(){if(!this.started)throw new Error("Client not started - .finishSend() must be called before .close()");if(this.closed)throw new Error("Client already closed - cannot .send()");if(this.finishedSending)throw new Error("Client already finished sending - cannot .finishSend()");this.finishedSending=!0,this.transport.finishSend();},e.prototype.close=function(){if(!this.started)throw new Error("Client not started - .start() must be called before .close()");if(this.closed)throw new Error("Client already closed - cannot .close()");this.closed=!0,this.props.debug&&i.debug("request.abort aborting request"),this.transport.cancel();},e}();function c(e){var t=e.get("grpc-status")||[];if(t.length>0)try{var r=t[0];return parseInt(r,10)}catch(e){return null}return null}},function(e,t,r){var n;n=function(){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.i=function(e){return e},r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n});},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=1)}([function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(3);var o=function(){function e(e,t){void 0===e&&(e={}),void 0===t&&(t={splitValues:!1});var r,o=this;if(this.headersMap={},e)if("undefined"!=typeof Headers&&e instanceof Headers)n.getHeaderKeys(e).forEach(function(r){n.getHeaderValues(e,r).forEach(function(e){t.splitValues?o.append(r,n.splitHeaderValue(e)):o.append(r,e);});});else if("object"==typeof(r=e)&&"object"==typeof r.headersMap&&"function"==typeof r.forEach)e.forEach(function(e,t){o.append(e,t);});else if("undefined"!=typeof Map&&e instanceof Map){e.forEach(function(e,t){o.append(t,e);});}else "string"==typeof e?this.appendFromString(e):"object"==typeof e&&Object.getOwnPropertyNames(e).forEach(function(t){var r=e[t];Array.isArray(r)?r.forEach(function(e){o.append(t,e);}):o.append(t,r);});}return e.prototype.appendFromString=function(e){for(var t=e.split("\r\n"),r=0;r<t.length;r++){var n=t[r],o=n.indexOf(":");if(o>0){var s=n.substring(0,o).trim(),i=n.substring(o+1).trim();this.append(s,i);}}},e.prototype.delete=function(e,t){var r=n.normalizeName(e);if(void 0===t)delete this.headersMap[r];else {var o=this.headersMap[r];if(o){var s=o.indexOf(t);s>=0&&o.splice(s,1),0===o.length&&delete this.headersMap[r];}}},e.prototype.append=function(e,t){var r=this,o=n.normalizeName(e);Array.isArray(this.headersMap[o])||(this.headersMap[o]=[]),Array.isArray(t)?t.forEach(function(e){r.headersMap[o].push(n.normalizeValue(e));}):this.headersMap[o].push(n.normalizeValue(t));},e.prototype.set=function(e,t){var r=n.normalizeName(e);if(Array.isArray(t)){var o=[];t.forEach(function(e){o.push(n.normalizeValue(e));}),this.headersMap[r]=o;}else this.headersMap[r]=[n.normalizeValue(t)];},e.prototype.has=function(e,t){var r=this.headersMap[n.normalizeName(e)];if(!Array.isArray(r))return !1;if(void 0!==t){var o=n.normalizeValue(t);return r.indexOf(o)>=0}return !0},e.prototype.get=function(e){var t=this.headersMap[n.normalizeName(e)];return void 0!==t?t.concat():[]},e.prototype.forEach=function(e){var t=this;Object.getOwnPropertyNames(this.headersMap).forEach(function(r){e(r,t.headersMap[r]);},this);},e.prototype.toHeaders=function(){if("undefined"!=typeof Headers){var e=new Headers;return this.forEach(function(t,r){r.forEach(function(r){e.append(t,r);});}),e}throw new Error("Headers class is not defined")},e}();t.BrowserHeaders=o;},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(0);t.BrowserHeaders=n.BrowserHeaders;},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0}),t.iterateHeaders=function(e,t){for(var r=e[Symbol.iterator](),n=r.next();!n.done;)t(n.value[0]),n=r.next();},t.iterateHeadersKeys=function(e,t){for(var r=e.keys(),n=r.next();!n.done;)t(n.value),n=r.next();};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(2);function o(e){return e}t.normalizeName=function(e){if("string"!=typeof e&&(e=String(e)),/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(e))throw new TypeError("Invalid character in header field name");return e.toLowerCase()},t.normalizeValue=function(e){return "string"!=typeof e&&(e=String(e)),e},t.getHeaderValues=function(e,t){var r=o(e);if(r instanceof Headers&&r.getAll)return r.getAll(t);var n=r.get(t);return n&&"string"==typeof n?[n]:n},t.getHeaderKeys=function(e){var t=o(e),r={},s=[];return t.keys?n.iterateHeadersKeys(t,function(e){r[e]||(r[e]=!0,s.push(e));}):t.forEach?t.forEach(function(e,t){r[t]||(r[t]=!0,s.push(t));}):n.iterateHeaders(t,function(e){var t=e[0];r[t]||(r[t]=!0,s.push(t));}),s},t.splitHeaderValue=function(e){var t=[];return e.split(", ").forEach(function(e){e.split(",").forEach(function(e){t.push(e);});}),t};}])},e.exports=n();},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(5),o=function(e){return n.CrossBrowserHttpTransport({withCredentials:!1})(e)};t.setDefaultTransportFactory=function(e){o=e;},t.makeDefaultTransport=function(e){return o(e)};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(6),o=r(7);t.CrossBrowserHttpTransport=function(e){if(n.detectFetchSupport()){var t={credentials:e.withCredentials?"include":"same-origin"};return n.FetchReadableStreamTransport(t)}return o.XhrTransport({withCredentials:e.withCredentials})};},function(e,t,r){var n=this&&this.__assign||function(){return (n=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};Object.defineProperty(t,"__esModule",{value:!0});var o=r(0),s=r(1);t.FetchReadableStreamTransport=function(e){return function(t){return function(e,t){return e.debug&&s.debug("fetchRequest",e),new i(e,t)}(t,e)}};var i=function(){function e(e,t){this.cancelled=!1,this.controller=self.AbortController&&new AbortController,this.options=e,this.init=t;}return e.prototype.pump=function(e,t){var r=this;if(this.reader=e,this.cancelled)return this.options.debug&&s.debug("Fetch.pump.cancel at first pump"),void this.reader.cancel();this.reader.read().then(function(e){if(e.done)return r.options.onEnd(),t;r.options.onChunk(e.value),r.pump(r.reader,t);}).catch(function(e){r.cancelled?r.options.debug&&s.debug("Fetch.catch - request cancelled"):(r.cancelled=!0,r.options.debug&&s.debug("Fetch.catch",e.message),r.options.onEnd(e));});},e.prototype.send=function(e){var t=this;fetch(this.options.url,n({},this.init,{headers:this.metadata.toHeaders(),method:"POST",body:e,signal:this.controller&&this.controller.signal})).then(function(e){if(t.options.debug&&s.debug("Fetch.response",e),t.options.onHeaders(new o.Metadata(e.headers),e.status),!e.body)return e;t.pump(e.body.getReader(),e);}).catch(function(e){t.cancelled?t.options.debug&&s.debug("Fetch.catch - request cancelled"):(t.cancelled=!0,t.options.debug&&s.debug("Fetch.catch",e.message),t.options.onEnd(e));});},e.prototype.sendMessage=function(e){this.send(e);},e.prototype.finishSend=function(){},e.prototype.start=function(e){this.metadata=e;},e.prototype.cancel=function(){this.cancelled?this.options.debug&&s.debug("Fetch.abort.cancel already cancelled"):(this.cancelled=!0,this.reader?(this.options.debug&&s.debug("Fetch.abort.cancel"),this.reader.cancel()):this.options.debug&&s.debug("Fetch.abort.cancel before reader"),this.controller&&this.controller.abort());},e}();t.detectFetchSupport=function(){return "undefined"!=typeof Response&&Response.prototype.hasOwnProperty("body")&&"function"==typeof Headers};},function(e,t,r){var n,o=this&&this.__extends||(n=function(e,t){return (n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t;}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);})(e,t)},function(e,t){function r(){this.constructor=e;}n(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r);});Object.defineProperty(t,"__esModule",{value:!0});var s=r(0),i=r(1),a=r(11);t.XhrTransport=function(e){return function(t){if(a.detectMozXHRSupport())return new d(t,e);if(a.detectXHROverrideMimeTypeSupport())return new u(t,e);throw new Error("This environment's XHR implementation cannot support binary transfer.")}};var u=function(){function e(e,t){this.options=e,this.init=t;}return e.prototype.onProgressEvent=function(){this.options.debug&&i.debug("XHR.onProgressEvent.length: ",this.xhr.response.length);var e=this.xhr.response.substr(this.index);this.index=this.xhr.response.length;var t=p(e);this.options.onChunk(t);},e.prototype.onLoadEvent=function(){this.options.debug&&i.debug("XHR.onLoadEvent"),this.options.onEnd();},e.prototype.onStateChange=function(){this.options.debug&&i.debug("XHR.onStateChange",this.xhr.readyState),this.xhr.readyState===XMLHttpRequest.HEADERS_RECEIVED&&this.options.onHeaders(new s.Metadata(this.xhr.getAllResponseHeaders()),this.xhr.status);},e.prototype.sendMessage=function(e){this.xhr.send(e);},e.prototype.finishSend=function(){},e.prototype.start=function(e){var t=this;this.metadata=e;var r=new XMLHttpRequest;this.xhr=r,r.open("POST",this.options.url),this.configureXhr(),this.metadata.forEach(function(e,t){r.setRequestHeader(e,t.join(", "));}),r.withCredentials=Boolean(this.init.withCredentials),r.addEventListener("readystatechange",this.onStateChange.bind(this)),r.addEventListener("progress",this.onProgressEvent.bind(this)),r.addEventListener("loadend",this.onLoadEvent.bind(this)),r.addEventListener("error",function(e){t.options.debug&&i.debug("XHR.error",e),t.options.onEnd(e.error);});},e.prototype.configureXhr=function(){this.xhr.responseType="text",this.xhr.overrideMimeType("text/plain; charset=x-user-defined");},e.prototype.cancel=function(){this.options.debug&&i.debug("XHR.abort"),this.xhr.abort();},e}();t.XHR=u;var d=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return o(t,e),t.prototype.configureXhr=function(){this.options.debug&&i.debug("MozXHR.configureXhr: setting responseType to 'moz-chunked-arraybuffer'"),this.xhr.responseType="moz-chunked-arraybuffer";},t.prototype.onProgressEvent=function(){var e=this.xhr.response;this.options.debug&&i.debug("MozXHR.onProgressEvent: ",new Uint8Array(e)),this.options.onChunk(new Uint8Array(e));},t}(u);function c(e,t){var r=e.charCodeAt(t);if(r>=55296&&r<=56319){var n=e.charCodeAt(t+1);n>=56320&&n<=57343&&(r=65536+(r-55296<<10)+(n-56320));}return r}function p(e){for(var t=new Uint8Array(e.length),r=0,n=0;n<e.length;n++){var o=String.prototype.codePointAt?e.codePointAt(n):c(e,n);t[r++]=255&o;}return t}t.MozChunkedArrayBufferXHR=d,t.stringToArrayBuffer=p;},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n,o=r(0),s=function(e){return 9===e||10===e||13===e};function i(e){return s(e)||e>=32&&e<=126}function a(e){for(var t=0;t!==e.length;++t)if(!i(e[t]))throw new Error("Metadata is not valid (printable) ASCII");return String.fromCharCode.apply(String,Array.prototype.slice.call(e))}function u(e){return 128==(128&e.getUint8(0))}function d(e){return e.getUint32(1,!1)}function c(e,t,r){return e.byteLength-t>=r}function p(e,t,r){if(e.slice)return e.slice(t,r);var n=e.length;void 0!==r&&(n=r);for(var o=new Uint8Array(n-t),s=0,i=t;i<n;i++)o[s++]=e[i];return o}t.decodeASCII=a,t.encodeASCII=function(e){for(var t=new Uint8Array(e.length),r=0;r!==e.length;++r){var n=e.charCodeAt(r);if(!i(n))throw new Error("Metadata contains invalid ASCII");t[r]=n;}return t},function(e){e[e.MESSAGE=1]="MESSAGE",e[e.TRAILERS=2]="TRAILERS";}(n=t.ChunkType||(t.ChunkType={}));var h=function(){function e(){this.buffer=null,this.position=0;}return e.prototype.parse=function(e,t){if(0===e.length&&t)return [];var r,s=[];if(null==this.buffer)this.buffer=e,this.position=0;else if(this.position===this.buffer.byteLength)this.buffer=e,this.position=0;else {var i=this.buffer.byteLength-this.position,h=new Uint8Array(i+e.byteLength),f=p(this.buffer,this.position);h.set(f,0);var l=new Uint8Array(e);h.set(l,i),this.buffer=h,this.position=0;}for(;;){if(!c(this.buffer,this.position,5))return s;var g=p(this.buffer,this.position,this.position+5),b=new DataView(g.buffer,g.byteOffset,g.byteLength),y=d(b);if(!c(this.buffer,this.position,5+y))return s;var v=p(this.buffer,this.position+5,this.position+5+y);if(this.position+=5+y,u(b))return s.push({chunkType:n.TRAILERS,trailers:(r=v,new o.Metadata(a(r)))}),s;s.push({chunkType:n.MESSAGE,data:v});}},e}();t.ChunkParser=h;},function(e,t,r){var n;Object.defineProperty(t,"__esModule",{value:!0}),function(e){e[e.OK=0]="OK",e[e.Canceled=1]="Canceled",e[e.Unknown=2]="Unknown",e[e.InvalidArgument=3]="InvalidArgument",e[e.DeadlineExceeded=4]="DeadlineExceeded",e[e.NotFound=5]="NotFound",e[e.AlreadyExists=6]="AlreadyExists",e[e.PermissionDenied=7]="PermissionDenied",e[e.ResourceExhausted=8]="ResourceExhausted",e[e.FailedPrecondition=9]="FailedPrecondition",e[e.Aborted=10]="Aborted",e[e.OutOfRange=11]="OutOfRange",e[e.Unimplemented=12]="Unimplemented",e[e.Internal=13]="Internal",e[e.Unavailable=14]="Unavailable",e[e.DataLoss=15]="DataLoss",e[e.Unauthenticated=16]="Unauthenticated";}(n=t.Code||(t.Code={})),t.httpStatusToCode=function(e){switch(e){case 0:return n.Internal;case 200:return n.OK;case 400:return n.InvalidArgument;case 401:return n.Unauthenticated;case 403:return n.PermissionDenied;case 404:return n.NotFound;case 409:return n.Aborted;case 412:return n.FailedPrecondition;case 429:return n.ResourceExhausted;case 499:return n.Canceled;case 500:return n.Unknown;case 501:return n.Unimplemented;case 503:return n.Unavailable;case 504:return n.DeadlineExceeded;default:return n.Unknown}};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(3),o=r(4),s=r(6),i=r(12),a=r(7),u=r(5),d=r(9),c=r(13),p=r(15),h=r(2);!function(e){e.setDefaultTransport=o.setDefaultTransportFactory,e.CrossBrowserHttpTransport=u.CrossBrowserHttpTransport,e.FetchReadableStreamTransport=s.FetchReadableStreamTransport,e.XhrTransport=a.XhrTransport,e.WebsocketTransport=i.WebsocketTransport,e.Code=d.Code,e.Metadata=n.BrowserHeaders,e.client=function(e,t){return h.client(e,t)},e.invoke=c.invoke,e.unary=p.unary;}(t.grpc||(t.grpc={}));},function(e,t,r){var n;function o(){if(void 0!==n)return n;if(XMLHttpRequest){n=new XMLHttpRequest;try{n.open("GET","https://localhost");}catch(e){}}return n}function s(e){var t=o();if(!t)return !1;try{return t.responseType=e,t.responseType===e}catch(e){}return !1}Object.defineProperty(t,"__esModule",{value:!0}),t.xhrSupportsResponseType=s,t.detectMozXHRSupport=function(){return "undefined"!=typeof XMLHttpRequest&&s("moz-chunked-arraybuffer")},t.detectXHROverrideMimeTypeSupport=function(){return "undefined"!=typeof XMLHttpRequest&&XMLHttpRequest.prototype.hasOwnProperty("overrideMimeType")};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n,o=r(1),s=r(8);!function(e){e[e.FINISH_SEND=1]="FINISH_SEND";}(n||(n={}));var i=new Uint8Array([1]);t.WebsocketTransport=function(){return function(e){return function(e){e.debug&&o.debug("websocketRequest",e);var t,r=function(e){if("https://"===e.substr(0,8))return "wss://"+e.substr(8);if("http://"===e.substr(0,7))return "ws://"+e.substr(7);throw new Error("Websocket transport constructed with non-https:// or http:// host.")}(e.url),a=[];function u(e){if(e===n.FINISH_SEND)t.send(i);else {var r=e,o=new Int8Array(r.byteLength+1);o.set(new Uint8Array([0])),o.set(r,1),t.send(o);}}return {sendMessage:function(e){t&&t.readyState!==t.CONNECTING?u(e):a.push(e);},finishSend:function(){t&&t.readyState!==t.CONNECTING?u(n.FINISH_SEND):a.push(n.FINISH_SEND);},start:function(n){(t=new WebSocket(r,["grpc-websockets"])).binaryType="arraybuffer",t.onopen=function(){var r;e.debug&&o.debug("websocketRequest.onopen"),t.send((r="",n.forEach(function(e,t){r+=e+": "+t.join(", ")+"\r\n";}),s.encodeASCII(r))),a.forEach(function(e){u(e);});},t.onclose=function(t){e.debug&&o.debug("websocketRequest.onclose",t),e.onEnd();},t.onerror=function(t){e.debug&&o.debug("websocketRequest.onerror",t);},t.onmessage=function(t){e.onChunk(new Uint8Array(t.data));};},cancel:function(){e.debug&&o.debug("websocket.abort"),t.close();}}}(e)}};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(2);t.invoke=function(e,t){if(e.requestStream)throw new Error(".invoke cannot be used with client-streaming methods. Use .client instead.");var r=n.client(e,{host:t.host,transport:t.transport,debug:t.debug});return t.onHeaders&&r.onHeaders(t.onHeaders),t.onMessage&&r.onMessage(t.onMessage),t.onEnd&&r.onEnd(t.onEnd),r.start(t.metadata),r.send(t.request),r.finishSend(),{close:function(){r.close();}}};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0}),t.frameRequest=function(e){var t=e.serializeBinary(),r=new ArrayBuffer(t.byteLength+5);return new DataView(r,1,4).setUint32(0,t.length,!1),new Uint8Array(r,5).set(t),new Uint8Array(r)};},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n=r(0),o=r(2);t.unary=function(e,t){if(e.responseStream)throw new Error(".unary cannot be used with server-streaming methods. Use .invoke or .client instead.");if(e.requestStream)throw new Error(".unary cannot be used with client-streaming methods. Use .client instead.");var r=null,s=null,i=o.client(e,{host:t.host,transport:t.transport,debug:t.debug});return i.onHeaders(function(e){r=e;}),i.onMessage(function(e){s=e;}),i.onEnd(function(e,o,i){t.onEnd({status:e,statusMessage:o,headers:r||new n.Metadata,message:s,trailers:i});}),i.start(t.metadata),i.send(t.request),i.finishSend(),{close:function(){i.close();}}};}])});
    });

    var global$1 = (typeof global !== "undefined" ? global :
                typeof self !== "undefined" ? self :
                typeof window !== "undefined" ? window : {});

    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
    var inited = false;
    function init$1 () {
      inited = true;
      var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      for (var i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }

      revLookup['-'.charCodeAt(0)] = 62;
      revLookup['_'.charCodeAt(0)] = 63;
    }

    function toByteArray (b64) {
      if (!inited) {
        init$1();
      }
      var i, j, l, tmp, placeHolders, arr;
      var len = b64.length;

      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // the number of equal signs (place holders)
      // if there are two placeholders, than the two characters before it
      // represent one byte
      // if there is only one, then the three characters before it represent 2 bytes
      // this is just a cheap hack to not do indexOf twice
      placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

      // base64 is 4/3 + up to two characters of the original data
      arr = new Arr(len * 3 / 4 - placeHolders);

      // if there are placeholders, only get up to the last complete 4 chars
      l = placeHolders > 0 ? len - 4 : len;

      var L = 0;

      for (i = 0, j = 0; i < l; i += 4, j += 3) {
        tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
        arr[L++] = (tmp >> 16) & 0xFF;
        arr[L++] = (tmp >> 8) & 0xFF;
        arr[L++] = tmp & 0xFF;
      }

      if (placeHolders === 2) {
        tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
        arr[L++] = tmp & 0xFF;
      } else if (placeHolders === 1) {
        tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
        arr[L++] = (tmp >> 8) & 0xFF;
        arr[L++] = tmp & 0xFF;
      }

      return arr
    }

    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
    }

    function encodeChunk (uint8, start, end) {
      var tmp;
      var output = [];
      for (var i = start; i < end; i += 3) {
        tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
        output.push(tripletToBase64(tmp));
      }
      return output.join('')
    }

    function fromByteArray (uint8) {
      if (!inited) {
        init$1();
      }
      var tmp;
      var len = uint8.length;
      var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
      var output = '';
      var parts = [];
      var maxChunkLength = 16383; // must be multiple of 3

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1];
        output += lookup[tmp >> 2];
        output += lookup[(tmp << 4) & 0x3F];
        output += '==';
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
        output += lookup[tmp >> 10];
        output += lookup[(tmp >> 4) & 0x3F];
        output += lookup[(tmp << 2) & 0x3F];
        output += '=';
      }

      parts.push(output);

      return parts.join('')
    }

    function read (buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? (nBytes - 1) : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];

      i += d;

      e = s & ((1 << (-nBits)) - 1);
      s >>= (-nBits);
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

      m = e & ((1 << (-nBits)) - 1);
      e >>= (-nBits);
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }

    function write (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
      var i = isLE ? 0 : (nBytes - 1);
      var d = isLE ? 1 : -1;
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

      value = Math.abs(value);

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }

        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

      e = (e << mLen) | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

      buffer[offset + i - d] |= s * 128;
    }

    var toString = {}.toString;

    var isArray = Array.isArray || function (arr) {
      return toString.call(arr) == '[object Array]';
    };

    var INSPECT_MAX_BYTES = 50;

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Use Object implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * Due to various browser bugs, sometimes the Object implementation will be used even
     * when the browser supports typed arrays.
     *
     * Note:
     *
     *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
     *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
     *
     *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
     *
     *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
     *     incorrect length in some situations.

     * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
     * get the Object implementation, which is slower but behaves correctly.
     */
    Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
      ? global$1.TYPED_ARRAY_SUPPORT
      : true;

    /*
     * Export kMaxLength after typed array support is determined.
     */
    var _kMaxLength = kMaxLength();

    function kMaxLength () {
      return Buffer.TYPED_ARRAY_SUPPORT
        ? 0x7fffffff
        : 0x3fffffff
    }

    function createBuffer (that, length) {
      if (kMaxLength() < length) {
        throw new RangeError('Invalid typed array length')
      }
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = new Uint8Array(length);
        that.__proto__ = Buffer.prototype;
      } else {
        // Fallback: Return an object instance of the Buffer class
        if (that === null) {
          that = new Buffer(length);
        }
        that.length = length;
      }

      return that
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer (arg, encodingOrOffset, length) {
      if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
        return new Buffer(arg, encodingOrOffset, length)
      }

      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new Error(
            'If encoding is specified then the first argument must be a string'
          )
        }
        return allocUnsafe(this, arg)
      }
      return from(this, arg, encodingOrOffset, length)
    }

    Buffer.poolSize = 8192; // not used by this implementation

    // TODO: Legacy, not needed anymore. Remove in next major version.
    Buffer._augment = function (arr) {
      arr.__proto__ = Buffer.prototype;
      return arr
    };

    function from (that, value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }

      if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
        return fromArrayBuffer(that, value, encodingOrOffset, length)
      }

      if (typeof value === 'string') {
        return fromString(that, value, encodingOrOffset)
      }

      return fromObject(that, value)
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(null, value, encodingOrOffset, length)
    };

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      Buffer.prototype.__proto__ = Uint8Array.prototype;
      Buffer.__proto__ = Uint8Array;
    }

    function assertSize (size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be a number')
      } else if (size < 0) {
        throw new RangeError('"size" argument must not be negative')
      }
    }

    function alloc (that, size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(that, size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(that, size).fill(fill, encoding)
          : createBuffer(that, size).fill(fill)
      }
      return createBuffer(that, size)
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(null, size, fill, encoding)
    };

    function allocUnsafe (that, size) {
      assertSize(size);
      that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
      if (!Buffer.TYPED_ARRAY_SUPPORT) {
        for (var i = 0; i < size; ++i) {
          that[i] = 0;
        }
      }
      return that
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(null, size)
    };
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(null, size)
    };

    function fromString (that, string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
      }

      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('"encoding" must be a valid string encoding')
      }

      var length = byteLength(string, encoding) | 0;
      that = createBuffer(that, length);

      var actual = that.write(string, encoding);

      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        that = that.slice(0, actual);
      }

      return that
    }

    function fromArrayLike (that, array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0;
      that = createBuffer(that, length);
      for (var i = 0; i < length; i += 1) {
        that[i] = array[i] & 255;
      }
      return that
    }

    function fromArrayBuffer (that, array, byteOffset, length) {
      array.byteLength; // this throws if `array` is not a valid ArrayBuffer

      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('\'offset\' is out of bounds')
      }

      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('\'length\' is out of bounds')
      }

      if (byteOffset === undefined && length === undefined) {
        array = new Uint8Array(array);
      } else if (length === undefined) {
        array = new Uint8Array(array, byteOffset);
      } else {
        array = new Uint8Array(array, byteOffset, length);
      }

      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = array;
        that.__proto__ = Buffer.prototype;
      } else {
        // Fallback: Return an object instance of the Buffer class
        that = fromArrayLike(that, array);
      }
      return that
    }

    function fromObject (that, obj) {
      if (internalIsBuffer(obj)) {
        var len = checked(obj.length) | 0;
        that = createBuffer(that, len);

        if (that.length === 0) {
          return that
        }

        obj.copy(that, 0, 0, len);
        return that
      }

      if (obj) {
        if ((typeof ArrayBuffer !== 'undefined' &&
            obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
          if (typeof obj.length !== 'number' || isnan(obj.length)) {
            return createBuffer(that, 0)
          }
          return fromArrayLike(that, obj)
        }

        if (obj.type === 'Buffer' && isArray(obj.data)) {
          return fromArrayLike(that, obj.data)
        }
      }

      throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
    }

    function checked (length) {
      // Note: cannot use `length < kMaxLength()` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= kMaxLength()) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                             'size: 0x' + kMaxLength().toString(16) + ' bytes')
      }
      return length | 0
    }

    function SlowBuffer (length) {
      if (+length != length) { // eslint-disable-line eqeqeq
        length = 0;
      }
      return Buffer.alloc(+length)
    }
    Buffer.isBuffer = isBuffer;
    function internalIsBuffer (b) {
      return !!(b != null && b._isBuffer)
    }

    Buffer.compare = function compare (a, b) {
      if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
        throw new TypeError('Arguments must be Buffers')
      }

      if (a === b) return 0

      var x = a.length;
      var y = b.length;

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    };

    Buffer.isEncoding = function isEncoding (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    };

    Buffer.concat = function concat (list, length) {
      if (!isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }

      if (list.length === 0) {
        return Buffer.alloc(0)
      }

      var i;
      if (length === undefined) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }

      var buffer = Buffer.allocUnsafe(length);
      var pos = 0;
      for (i = 0; i < list.length; ++i) {
        var buf = list[i];
        if (!internalIsBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos);
        pos += buf.length;
      }
      return buffer
    };

    function byteLength (string, encoding) {
      if (internalIsBuffer(string)) {
        return string.length
      }
      if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
          (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        string = '' + string;
      }

      var len = string.length;
      if (len === 0) return 0

      // Use a for loop to avoid recursion
      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
          case undefined:
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) return utf8ToBytes(string).length // assume utf8
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer.byteLength = byteLength;

    function slowToString (encoding, start, end) {
      var loweredCase = false;

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0;
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }

      if (end === undefined || end > this.length) {
        end = this.length;
      }

      if (end <= 0) {
        return ''
      }

      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0;
      start >>>= 0;

      if (end <= start) {
        return ''
      }

      if (!encoding) encoding = 'utf8';

      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)

          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)

          case 'ascii':
            return asciiSlice(this, start, end)

          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)

          case 'base64':
            return base64Slice(this, start, end)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase();
            loweredCase = true;
        }
      }
    }

    // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
    // Buffer instances.
    Buffer.prototype._isBuffer = true;

    function swap (b, n, m) {
      var i = b[n];
      b[n] = b[m];
      b[m] = i;
    }

    Buffer.prototype.swap16 = function swap16 () {
      var len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this
    };

    Buffer.prototype.swap32 = function swap32 () {
      var len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this
    };

    Buffer.prototype.swap64 = function swap64 () {
      var len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this
    };

    Buffer.prototype.toString = function toString () {
      var length = this.length | 0;
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    };

    Buffer.prototype.equals = function equals (b) {
      if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer.compare(this, b) === 0
    };

    Buffer.prototype.inspect = function inspect () {
      var str = '';
      var max = INSPECT_MAX_BYTES;
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
        if (this.length > max) str += ' ... ';
      }
      return '<Buffer ' + str + '>'
    };

    Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
      if (!internalIsBuffer(target)) {
        throw new TypeError('Argument must be a Buffer')
      }

      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = target ? target.length : 0;
      }
      if (thisStart === undefined) {
        thisStart = 0;
      }
      if (thisEnd === undefined) {
        thisEnd = this.length;
      }

      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }

      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }

      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;

      if (this === target) return 0

      var x = thisEnd - thisStart;
      var y = end - start;
      var len = Math.min(x, y);

      var thisCopy = this.slice(thisStart, thisEnd);
      var targetCopy = target.slice(start, end);

      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    };

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
      }
      byteOffset = +byteOffset;  // Coerce to Number.
      if (isNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1);
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding);
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (internalIsBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF; // Search for a byte value [0-255]
        if (Buffer.TYPED_ARRAY_SUPPORT &&
            typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
      }

      throw new TypeError('val must be string, number or Buffer')
    }

    function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
      var indexSize = 1;
      var arrLength = arr.length;
      var valLength = val.length;

      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }

      function read (buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }

      var i;
      if (dir) {
        var foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          var found = true;
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break
            }
          }
          if (found) return i
        }
      }

      return -1
    }

    Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    };

    Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    };

    Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    };

    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0;
      var remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }

      // must be an even number of digits
      var strLen = string.length;
      if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

      if (length > strLen / 2) {
        length = strLen / 2;
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16);
        if (isNaN(parsed)) return i
        buf[offset + i] = parsed;
      }
      return i
    }

    function utf8Write (buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }

    function asciiWrite (buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }

    function latin1Write (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }

    function base64Write (buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }

    function ucs2Write (buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }

    Buffer.prototype.write = function write (string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
      // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
      // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset | 0;
        if (isFinite(length)) {
          length = length | 0;
          if (encoding === undefined) encoding = 'utf8';
        } else {
          encoding = length;
          length = undefined;
        }
      // legacy write(string, encoding, offset, length) - remove in v0.13
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }

      var remaining = this.length - offset;
      if (length === undefined || length > remaining) length = remaining;

      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }

      if (!encoding) encoding = 'utf8';

      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)

          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)

          case 'ascii':
            return asciiWrite(this, string, offset, length)

          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)

          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };

    Buffer.prototype.toJSON = function toJSON () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    };

    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return fromByteArray(buf)
      } else {
        return fromByteArray(buf.slice(start, end))
      }
    }

    function utf8Slice (buf, start, end) {
      end = Math.min(buf.length, end);
      var res = [];

      var i = start;
      while (i < end) {
        var firstByte = buf[i];
        var codePoint = null;
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
          : (firstByte > 0xBF) ? 2
          : 1;

        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint;

          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte;
              }
              break
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint;
                }
              }
              break
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint;
                }
              }
              break
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }

        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD;
          bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000;
          res.push(codePoint >>> 10 & 0x3FF | 0xD800);
          codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        res.push(codePoint);
        i += bytesPerSequence;
      }

      return decodeCodePointsArray(res)
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000;

    function decodeCodePointsArray (codePoints) {
      var len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      var res = '';
      var i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res
    }

    function asciiSlice (buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F);
      }
      return ret
    }

    function latin1Slice (buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret
    }

    function hexSlice (buf, start, end) {
      var len = buf.length;

      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;

      var out = '';
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i]);
      }
      return out
    }

    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end);
      var res = '';
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res
    }

    Buffer.prototype.slice = function slice (start, end) {
      var len = this.length;
      start = ~~start;
      end = end === undefined ? len : ~~end;

      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }

      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }

      if (end < start) end = start;

      var newBuf;
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        newBuf = this.subarray(start, end);
        newBuf.__proto__ = Buffer.prototype;
      } else {
        var sliceLen = end - start;
        newBuf = new Buffer(sliceLen, undefined);
        for (var i = 0; i < sliceLen; ++i) {
          newBuf[i] = this[i + start];
        }
      }

      return newBuf
    };

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }

    Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }

      return val
    };

    Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length);
      }

      var val = this[offset + --byteLength];
      var mul = 1;
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul;
      }

      return val
    };

    Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset]
    };

    Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | (this[offset + 1] << 8)
    };

    Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      return (this[offset] << 8) | this[offset + 1]
    };

    Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return ((this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
    };

    Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3])
    };

    Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val
    };

    Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var i = byteLength;
      var mul = 1;
      var val = this[offset + --i];
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val
    };

    Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    };

    Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset] | (this[offset + 1] << 8);
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    };

    Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset + 1] | (this[offset] << 8);
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    };

    Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    };

    Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    };

    Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);
      return read(this, offset, true, 23, 4)
    };

    Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);
      return read(this, offset, false, 23, 4)
    };

    Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length);
      return read(this, offset, true, 52, 8)
    };

    Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length);
      return read(this, offset, false, 52, 8)
    };

    function checkInt (buf, value, offset, ext, max, min) {
      if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }

    Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      var mul = 1;
      var i = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      var i = byteLength - 1;
      var mul = 1;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
      this[offset] = (value & 0xff);
      return offset + 1
    };

    function objectWriteUInt16 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffff + value + 1;
      for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
        buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
          (littleEndian ? i : 1 - i) * 8;
      }
    }

    Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
      } else {
        objectWriteUInt16(this, value, offset, true);
      }
      return offset + 2
    };

    Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
      } else {
        objectWriteUInt16(this, value, offset, false);
      }
      return offset + 2
    };

    function objectWriteUInt32 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffffffff + value + 1;
      for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
        buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
      }
    }

    Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset + 3] = (value >>> 24);
        this[offset + 2] = (value >>> 16);
        this[offset + 1] = (value >>> 8);
        this[offset] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, true);
      }
      return offset + 4
    };

    Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, false);
      }
      return offset + 4
    };

    Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      var i = 0;
      var mul = 1;
      var sub = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      var i = byteLength - 1;
      var mul = 1;
      var sub = 0;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
      if (value < 0) value = 0xff + value + 1;
      this[offset] = (value & 0xff);
      return offset + 1
    };

    Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
      } else {
        objectWriteUInt16(this, value, offset, true);
      }
      return offset + 2
    };

    Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
      } else {
        objectWriteUInt16(this, value, offset, false);
      }
      return offset + 2
    };

    Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        this[offset + 2] = (value >>> 16);
        this[offset + 3] = (value >>> 24);
      } else {
        objectWriteUInt32(this, value, offset, true);
      }
      return offset + 4
    };

    Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (value < 0) value = 0xffffffff + value + 1;
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, false);
      }
      return offset + 4
    };

    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }

    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4);
      }
      write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4
    }

    Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    };

    Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    };

    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8);
      }
      write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8
    }

    Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    };

    Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    };

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy (target, targetStart, start, end) {
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;

      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')

      // Are we oob?
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }

      var len = end - start;
      var i;

      if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start];
        }
      } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
        // ascending copy from start
        for (i = 0; i < len; ++i) {
          target[i + targetStart] = this[i + start];
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, start + len),
          targetStart
        );
      }

      return len
    };

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill (val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === 'string') {
          encoding = end;
          end = this.length;
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0);
          if (code < 256) {
            val = code;
          }
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
      } else if (typeof val === 'number') {
        val = val & 255;
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }

      if (end <= start) {
        return this
      }

      start = start >>> 0;
      end = end === undefined ? this.length : end >>> 0;

      if (!val) val = 0;

      var i;
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        var bytes = internalIsBuffer(val)
          ? val
          : utf8ToBytes(new Buffer(val, encoding).toString());
        var len = bytes.length;
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }

      return this
    };

    // HELPER FUNCTIONS
    // ================

    var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

    function base64clean (str) {
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = stringtrim(str).replace(INVALID_BASE64_RE, '');
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '=';
      }
      return str
    }

    function stringtrim (str) {
      if (str.trim) return str.trim()
      return str.replace(/^\s+|\s+$/g, '')
    }

    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }

    function utf8ToBytes (string, units) {
      units = units || Infinity;
      var codePoint;
      var length = string.length;
      var leadSurrogate = null;
      var bytes = [];

      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue
            }

            // valid lead
            leadSurrogate = codePoint;

            continue
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            leadSurrogate = codePoint;
            continue
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        }

        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          );
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          );
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          );
        } else {
          throw new Error('Invalid code point')
        }
      }

      return bytes
    }

    function asciiToBytes (str) {
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF);
      }
      return byteArray
    }

    function utf16leToBytes (str, units) {
      var c, hi, lo;
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break

        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }

      return byteArray
    }


    function base64ToBytes (str) {
      return toByteArray(base64clean(str))
    }

    function blitBuffer (src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i];
      }
      return i
    }

    function isnan (val) {
      return val !== val // eslint-disable-line no-self-compare
    }


    // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
    // The _isBuffer check is for Safari 5-7 support, because it's missing
    // Object.prototype.constructor. Remove this eventually
    function isBuffer(obj) {
      return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
    }

    function isFastBuffer (obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    // For Node v0.10 support. Remove this eventually.
    function isSlowBuffer (obj) {
      return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
    }

    var bufferEs6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
        kMaxLength: _kMaxLength,
        Buffer: Buffer,
        SlowBuffer: SlowBuffer,
        isBuffer: isBuffer
    });

    var sha256 = createCommonjsModule(function (module) {
    (function (root, factory) {
        // Hack to make all exports of this module sha256 function object properties.
        var exports = {};
        factory(exports);
        var sha256 = exports["default"];
        for (var k in exports) {
            sha256[k] = exports[k];
        }
            
        {
            module.exports = sha256;
        }
    })(commonjsGlobal, function(exports) {
    exports.__esModule = true;
    // SHA-256 (+ HMAC and PBKDF2) for JavaScript.
    //
    // Written in 2014-2016 by Dmitry Chestnykh.
    // Public domain, no warranty.
    //
    // Functions (accept and return Uint8Arrays):
    //
    //   sha256(message) -> hash
    //   sha256.hmac(key, message) -> mac
    //   sha256.pbkdf2(password, salt, rounds, dkLen) -> dk
    //
    //  Classes:
    //
    //   new sha256.Hash()
    //   new sha256.HMAC(key)
    //
    exports.digestLength = 32;
    exports.blockSize = 64;
    // SHA-256 constants
    var K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
        0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
        0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
        0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
        0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
        0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
        0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
        0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
        0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    function hashBlocks(w, v, p, pos, len) {
        var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
        while (len >= 64) {
            a = v[0];
            b = v[1];
            c = v[2];
            d = v[3];
            e = v[4];
            f = v[5];
            g = v[6];
            h = v[7];
            for (i = 0; i < 16; i++) {
                j = pos + i * 4;
                w[i] = (((p[j] & 0xff) << 24) | ((p[j + 1] & 0xff) << 16) |
                    ((p[j + 2] & 0xff) << 8) | (p[j + 3] & 0xff));
            }
            for (i = 16; i < 64; i++) {
                u = w[i - 2];
                t1 = (u >>> 17 | u << (32 - 17)) ^ (u >>> 19 | u << (32 - 19)) ^ (u >>> 10);
                u = w[i - 15];
                t2 = (u >>> 7 | u << (32 - 7)) ^ (u >>> 18 | u << (32 - 18)) ^ (u >>> 3);
                w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
            }
            for (i = 0; i < 64; i++) {
                t1 = (((((e >>> 6 | e << (32 - 6)) ^ (e >>> 11 | e << (32 - 11)) ^
                    (e >>> 25 | e << (32 - 25))) + ((e & f) ^ (~e & g))) | 0) +
                    ((h + ((K[i] + w[i]) | 0)) | 0)) | 0;
                t2 = (((a >>> 2 | a << (32 - 2)) ^ (a >>> 13 | a << (32 - 13)) ^
                    (a >>> 22 | a << (32 - 22))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
                h = g;
                g = f;
                f = e;
                e = (d + t1) | 0;
                d = c;
                c = b;
                b = a;
                a = (t1 + t2) | 0;
            }
            v[0] += a;
            v[1] += b;
            v[2] += c;
            v[3] += d;
            v[4] += e;
            v[5] += f;
            v[6] += g;
            v[7] += h;
            pos += 64;
            len -= 64;
        }
        return pos;
    }
    // Hash implements SHA256 hash algorithm.
    var Hash = /** @class */ (function () {
        function Hash() {
            this.digestLength = exports.digestLength;
            this.blockSize = exports.blockSize;
            // Note: Int32Array is used instead of Uint32Array for performance reasons.
            this.state = new Int32Array(8); // hash state
            this.temp = new Int32Array(64); // temporary state
            this.buffer = new Uint8Array(128); // buffer for data to hash
            this.bufferLength = 0; // number of bytes in buffer
            this.bytesHashed = 0; // number of total bytes hashed
            this.finished = false; // indicates whether the hash was finalized
            this.reset();
        }
        // Resets hash state making it possible
        // to re-use this instance to hash other data.
        Hash.prototype.reset = function () {
            this.state[0] = 0x6a09e667;
            this.state[1] = 0xbb67ae85;
            this.state[2] = 0x3c6ef372;
            this.state[3] = 0xa54ff53a;
            this.state[4] = 0x510e527f;
            this.state[5] = 0x9b05688c;
            this.state[6] = 0x1f83d9ab;
            this.state[7] = 0x5be0cd19;
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            return this;
        };
        // Cleans internal buffers and re-initializes hash state.
        Hash.prototype.clean = function () {
            for (var i = 0; i < this.buffer.length; i++) {
                this.buffer[i] = 0;
            }
            for (var i = 0; i < this.temp.length; i++) {
                this.temp[i] = 0;
            }
            this.reset();
        };
        // Updates hash state with the given data.
        //
        // Optionally, length of the data can be specified to hash
        // fewer bytes than data.length.
        //
        // Throws error when trying to update already finalized hash:
        // instance must be reset to use it again.
        Hash.prototype.update = function (data, dataLength) {
            if (dataLength === void 0) { dataLength = data.length; }
            if (this.finished) {
                throw new Error("SHA256: can't update because hash was finished.");
            }
            var dataPos = 0;
            this.bytesHashed += dataLength;
            if (this.bufferLength > 0) {
                while (this.bufferLength < 64 && dataLength > 0) {
                    this.buffer[this.bufferLength++] = data[dataPos++];
                    dataLength--;
                }
                if (this.bufferLength === 64) {
                    hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                    this.bufferLength = 0;
                }
            }
            if (dataLength >= 64) {
                dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
                dataLength %= 64;
            }
            while (dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
            }
            return this;
        };
        // Finalizes hash state and puts hash into out.
        //
        // If hash was already finalized, puts the same value.
        Hash.prototype.finish = function (out) {
            if (!this.finished) {
                var bytesHashed = this.bytesHashed;
                var left = this.bufferLength;
                var bitLenHi = (bytesHashed / 0x20000000) | 0;
                var bitLenLo = bytesHashed << 3;
                var padLength = (bytesHashed % 64 < 56) ? 64 : 128;
                this.buffer[left] = 0x80;
                for (var i = left + 1; i < padLength - 8; i++) {
                    this.buffer[i] = 0;
                }
                this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff;
                this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff;
                this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff;
                this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff;
                this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff;
                this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff;
                this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff;
                this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff;
                hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
                this.finished = true;
            }
            for (var i = 0; i < 8; i++) {
                out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff;
                out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff;
                out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff;
                out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff;
            }
            return this;
        };
        // Returns the final hash digest.
        Hash.prototype.digest = function () {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
        };
        // Internal function for use in HMAC for optimization.
        Hash.prototype._saveState = function (out) {
            for (var i = 0; i < this.state.length; i++) {
                out[i] = this.state[i];
            }
        };
        // Internal function for use in HMAC for optimization.
        Hash.prototype._restoreState = function (from, bytesHashed) {
            for (var i = 0; i < this.state.length; i++) {
                this.state[i] = from[i];
            }
            this.bytesHashed = bytesHashed;
            this.finished = false;
            this.bufferLength = 0;
        };
        return Hash;
    }());
    exports.Hash = Hash;
    // HMAC implements HMAC-SHA256 message authentication algorithm.
    var HMAC = /** @class */ (function () {
        function HMAC(key) {
            this.inner = new Hash();
            this.outer = new Hash();
            this.blockSize = this.inner.blockSize;
            this.digestLength = this.inner.digestLength;
            var pad = new Uint8Array(this.blockSize);
            if (key.length > this.blockSize) {
                (new Hash()).update(key).finish(pad).clean();
            }
            else {
                for (var i = 0; i < key.length; i++) {
                    pad[i] = key[i];
                }
            }
            for (var i = 0; i < pad.length; i++) {
                pad[i] ^= 0x36;
            }
            this.inner.update(pad);
            for (var i = 0; i < pad.length; i++) {
                pad[i] ^= 0x36 ^ 0x5c;
            }
            this.outer.update(pad);
            this.istate = new Uint32Array(8);
            this.ostate = new Uint32Array(8);
            this.inner._saveState(this.istate);
            this.outer._saveState(this.ostate);
            for (var i = 0; i < pad.length; i++) {
                pad[i] = 0;
            }
        }
        // Returns HMAC state to the state initialized with key
        // to make it possible to run HMAC over the other data with the same
        // key without creating a new instance.
        HMAC.prototype.reset = function () {
            this.inner._restoreState(this.istate, this.inner.blockSize);
            this.outer._restoreState(this.ostate, this.outer.blockSize);
            return this;
        };
        // Cleans HMAC state.
        HMAC.prototype.clean = function () {
            for (var i = 0; i < this.istate.length; i++) {
                this.ostate[i] = this.istate[i] = 0;
            }
            this.inner.clean();
            this.outer.clean();
        };
        // Updates state with provided data.
        HMAC.prototype.update = function (data) {
            this.inner.update(data);
            return this;
        };
        // Finalizes HMAC and puts the result in out.
        HMAC.prototype.finish = function (out) {
            if (this.outer.finished) {
                this.outer.finish(out);
            }
            else {
                this.inner.finish(out);
                this.outer.update(out, this.digestLength).finish(out);
            }
            return this;
        };
        // Returns message authentication code.
        HMAC.prototype.digest = function () {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
        };
        return HMAC;
    }());
    exports.HMAC = HMAC;
    // Returns SHA256 hash of data.
    function hash(data) {
        var h = (new Hash()).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
    }
    exports.hash = hash;
    // Function hash is both available as module.hash and as default export.
    exports["default"] = hash;
    // Returns HMAC-SHA256 of data under the key.
    function hmac(key, data) {
        var h = (new HMAC(key)).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
    }
    exports.hmac = hmac;
    // Fills hkdf buffer like this:
    // T(1) = HMAC-Hash(PRK, T(0) | info | 0x01)
    function fillBuffer(buffer, hmac, info, counter) {
        // Counter is a byte value: check if it overflowed.
        var num = counter[0];
        if (num === 0) {
            throw new Error("hkdf: cannot expand more");
        }
        // Prepare HMAC instance for new data with old key.
        hmac.reset();
        // Hash in previous output if it was generated
        // (i.e. counter is greater than 1).
        if (num > 1) {
            hmac.update(buffer);
        }
        // Hash in info if it exists.
        if (info) {
            hmac.update(info);
        }
        // Hash in the counter.
        hmac.update(counter);
        // Output result to buffer and clean HMAC instance.
        hmac.finish(buffer);
        // Increment counter inside typed array, this works properly.
        counter[0]++;
    }
    var hkdfSalt = new Uint8Array(exports.digestLength); // Filled with zeroes.
    function hkdf(key, salt, info, length) {
        if (salt === void 0) { salt = hkdfSalt; }
        if (length === void 0) { length = 32; }
        var counter = new Uint8Array([1]);
        // HKDF-Extract uses salt as HMAC key, and key as data.
        var okm = hmac(salt, key);
        // Initialize HMAC for expanding with extracted key.
        // Ensure no collisions with `hmac` function.
        var hmac_ = new HMAC(okm);
        // Allocate buffer.
        var buffer = new Uint8Array(hmac_.digestLength);
        var bufpos = buffer.length;
        var out = new Uint8Array(length);
        for (var i = 0; i < length; i++) {
            if (bufpos === buffer.length) {
                fillBuffer(buffer, hmac_, info, counter);
                bufpos = 0;
            }
            out[i] = buffer[bufpos++];
        }
        hmac_.clean();
        buffer.fill(0);
        counter.fill(0);
        return out;
    }
    exports.hkdf = hkdf;
    // Derives a key from password and salt using PBKDF2-HMAC-SHA256
    // with the given number of iterations.
    //
    // The number of bytes returned is equal to dkLen.
    //
    // (For better security, avoid dkLen greater than hash length - 32 bytes).
    function pbkdf2(password, salt, iterations, dkLen) {
        var prf = new HMAC(password);
        var len = prf.digestLength;
        var ctr = new Uint8Array(4);
        var t = new Uint8Array(len);
        var u = new Uint8Array(len);
        var dk = new Uint8Array(dkLen);
        for (var i = 0; i * len < dkLen; i++) {
            var c = i + 1;
            ctr[0] = (c >>> 24) & 0xff;
            ctr[1] = (c >>> 16) & 0xff;
            ctr[2] = (c >>> 8) & 0xff;
            ctr[3] = (c >>> 0) & 0xff;
            prf.reset();
            prf.update(salt);
            prf.update(ctr);
            prf.finish(u);
            for (var j = 0; j < len; j++) {
                t[j] = u[j];
            }
            for (var j = 2; j <= iterations; j++) {
                prf.reset();
                prf.update(u).finish(u);
                for (var k = 0; k < len; k++) {
                    t[k] ^= u[k];
                }
            }
            for (var j = 0; j < len && i * len + j < dkLen; j++) {
                dk[i * len + j] = t[j];
            }
        }
        for (var i = 0; i < len; i++) {
            t[i] = u[i] = 0;
        }
        for (var i = 0; i < 4; i++) {
            ctr[i] = 0;
        }
        prf.clean();
        return dk;
    }
    exports.pbkdf2 = pbkdf2;
    });
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(bufferEs6);

    var safeBuffer = createCommonjsModule(function (module, exports) {
    /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
    /* eslint-disable node/no-deprecated-api */

    var Buffer = require$$0.Buffer;

    // alternative to using Object.keys for old browsers
    function copyProps (src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
      module.exports = require$$0;
    } else {
      // Copy properties from require('buffer')
      copyProps(require$$0, exports);
      exports.Buffer = SafeBuffer;
    }

    function SafeBuffer (arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length)
    }

    SafeBuffer.prototype = Object.create(Buffer.prototype);

    // Copy static methods from Buffer
    copyProps(Buffer, SafeBuffer);

    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number')
      }
      return Buffer(arg, encodingOrOffset, length)
    };

    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      var buf = Buffer(size);
      if (fill !== undefined) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf
    };

    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return Buffer(size)
    };

    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return require$$0.SlowBuffer(size)
    };
    });

    // base-x encoding / decoding
    // Copyright (c) 2018 base-x contributors
    // Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
    // Distributed under the MIT software license, see the accompanying
    // file LICENSE or http://www.opensource.org/licenses/mit-license.php.
    // @ts-ignore
    var _Buffer = safeBuffer.Buffer;
    function base (ALPHABET) {
      if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
      var BASE_MAP = new Uint8Array(256);
      for (var j = 0; j < BASE_MAP.length; j++) {
        BASE_MAP[j] = 255;
      }
      for (var i = 0; i < ALPHABET.length; i++) {
        var x = ALPHABET.charAt(i);
        var xc = x.charCodeAt(0);
        if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
        BASE_MAP[xc] = i;
      }
      var BASE = ALPHABET.length;
      var LEADER = ALPHABET.charAt(0);
      var FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up
      var iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up
      function encode (source) {
        if (Array.isArray(source) || source instanceof Uint8Array) { source = _Buffer.from(source); }
        if (!_Buffer.isBuffer(source)) { throw new TypeError('Expected Buffer') }
        if (source.length === 0) { return '' }
            // Skip & count leading zeroes.
        var zeroes = 0;
        var length = 0;
        var pbegin = 0;
        var pend = source.length;
        while (pbegin !== pend && source[pbegin] === 0) {
          pbegin++;
          zeroes++;
        }
            // Allocate enough space in big-endian base58 representation.
        var size = ((pend - pbegin) * iFACTOR + 1) >>> 0;
        var b58 = new Uint8Array(size);
            // Process the bytes.
        while (pbegin !== pend) {
          var carry = source[pbegin];
                // Apply "b58 = b58 * 256 + ch".
          var i = 0;
          for (var it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
            carry += (256 * b58[it1]) >>> 0;
            b58[it1] = (carry % BASE) >>> 0;
            carry = (carry / BASE) >>> 0;
          }
          if (carry !== 0) { throw new Error('Non-zero carry') }
          length = i;
          pbegin++;
        }
            // Skip leading zeroes in base58 result.
        var it2 = size - length;
        while (it2 !== size && b58[it2] === 0) {
          it2++;
        }
            // Translate the result into a string.
        var str = LEADER.repeat(zeroes);
        for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]); }
        return str
      }
      function decodeUnsafe (source) {
        if (typeof source !== 'string') { throw new TypeError('Expected String') }
        if (source.length === 0) { return _Buffer.alloc(0) }
        var psz = 0;
            // Skip leading spaces.
        if (source[psz] === ' ') { return }
            // Skip and count leading '1's.
        var zeroes = 0;
        var length = 0;
        while (source[psz] === LEADER) {
          zeroes++;
          psz++;
        }
            // Allocate enough space in big-endian base256 representation.
        var size = (((source.length - psz) * FACTOR) + 1) >>> 0; // log(58) / log(256), rounded up.
        var b256 = new Uint8Array(size);
            // Process the characters.
        while (source[psz]) {
                // Decode character
          var carry = BASE_MAP[source.charCodeAt(psz)];
                // Invalid character
          if (carry === 255) { return }
          var i = 0;
          for (var it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
            carry += (BASE * b256[it3]) >>> 0;
            b256[it3] = (carry % 256) >>> 0;
            carry = (carry / 256) >>> 0;
          }
          if (carry !== 0) { throw new Error('Non-zero carry') }
          length = i;
          psz++;
        }
            // Skip trailing spaces.
        if (source[psz] === ' ') { return }
            // Skip leading zeroes in b256.
        var it4 = size - length;
        while (it4 !== size && b256[it4] === 0) {
          it4++;
        }
        var vch = _Buffer.allocUnsafe(zeroes + (size - it4));
        vch.fill(0x00, 0, zeroes);
        var j = zeroes;
        while (it4 !== size) {
          vch[j++] = b256[it4++];
        }
        return vch
      }
      function decode (string) {
        var buffer = decodeUnsafe(string);
        if (buffer) { return buffer }
        throw new Error('Non-base' + BASE + ' character')
      }
      return {
        encode: encode,
        decodeUnsafe: decodeUnsafe,
        decode: decode
      }
    }
    var src = base;

    const { Buffer: Buffer$1 } = require$$0;

    class Base {
      constructor (name, code, implementation, alphabet) {
        this.name = name;
        this.code = code;
        this.codeBuf = Buffer$1.from(this.code);
        this.alphabet = alphabet;
        this.engine = implementation(alphabet);
      }

      encode (buf) {
        return this.engine.encode(buf)
      }

      decode (string) {
        for (const char of string) {
          if (this.alphabet && this.alphabet.indexOf(char) < 0) {
            throw new Error(`invalid character '${char}' in '${string}'`)
          }
        }
        return this.engine.decode(string)
      }
    }

    var base$1 = Base;

    const decode = (string, alphabet, bitsPerChar) => {
      // Build the character lookup table:
      const codes = {};
      for (let i = 0; i < alphabet.length; ++i) {
        codes[alphabet[i]] = i;
      }

      // Count the padding bytes:
      let end = string.length;
      while (string[end - 1] === '=') {
        --end;
      }

      // Allocate the output:
      const out = new Uint8Array((end * bitsPerChar / 8) | 0);

      // Parse the data:
      let bits = 0; // Number of bits currently in the buffer
      let buffer = 0; // Bits waiting to be written out, MSB first
      let written = 0; // Next byte to write
      for (let i = 0; i < end; ++i) {
        // Read one character from the string:
        const value = codes[string[i]];
        if (value === undefined) {
          throw new SyntaxError('Invalid character ' + string[i])
        }

        // Append the bits to the buffer:
        buffer = (buffer << bitsPerChar) | value;
        bits += bitsPerChar;

        // Write out some bits if the buffer has a byte's worth:
        if (bits >= 8) {
          bits -= 8;
          out[written++] = 0xff & (buffer >> bits);
        }
      }

      // Verify that we have received just enough bits:
      if (bits >= bitsPerChar || 0xff & (buffer << (8 - bits))) {
        throw new SyntaxError('Unexpected end of data')
      }

      return out
    };

    const encode = (data, alphabet, bitsPerChar) => {
      const pad = alphabet[alphabet.length - 1] === '=';
      const mask = (1 << bitsPerChar) - 1;
      let out = '';

      let bits = 0; // Number of bits currently in the buffer
      let buffer = 0; // Bits waiting to be written out, MSB first
      for (let i = 0; i < data.length; ++i) {
        // Slurp data into the buffer:
        buffer = (buffer << 8) | data[i];
        bits += 8;

        // Write out as much as we can:
        while (bits > bitsPerChar) {
          bits -= bitsPerChar;
          out += alphabet[mask & (buffer >> bits)];
        }
      }

      // Partial character:
      if (bits) {
        out += alphabet[mask & (buffer << (bitsPerChar - bits))];
      }

      // Add padding characters until we hit a byte boundary:
      if (pad) {
        while ((out.length * bitsPerChar) & 7) {
          out += '=';
        }
      }

      return out
    };

    var rfc4648 = (bitsPerChar) => (alphabet) => {
      return {
        encode (input) {
          return encode(input, alphabet, bitsPerChar)
        },
        decode (input) {
          return decode(input, alphabet, bitsPerChar)
        }
      }
    };

    const { Buffer: Buffer$2 } = require$$0;



    const identity = () => {
      return {
        encode: (data) => Buffer$2.from(data).toString(),
        decode: (string) => Buffer$2.from(string)
      }
    };

    // name, code, implementation, alphabet
    const constants = [
      ['identity', '\x00', identity, ''],
      ['base2', '0', rfc4648(1), '01'],
      ['base8', '7', rfc4648(3), '01234567'],
      ['base10', '9', src, '0123456789'],
      ['base16', 'f', rfc4648(4), '0123456789abcdef'],
      ['base16upper', 'F', rfc4648(4), '0123456789ABCDEF'],
      ['base32hex', 'v', rfc4648(5), '0123456789abcdefghijklmnopqrstuv'],
      ['base32hexupper', 'V', rfc4648(5), '0123456789ABCDEFGHIJKLMNOPQRSTUV'],
      ['base32hexpad', 't', rfc4648(5), '0123456789abcdefghijklmnopqrstuv='],
      ['base32hexpadupper', 'T', rfc4648(5), '0123456789ABCDEFGHIJKLMNOPQRSTUV='],
      ['base32', 'b', rfc4648(5), 'abcdefghijklmnopqrstuvwxyz234567'],
      ['base32upper', 'B', rfc4648(5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'],
      ['base32pad', 'c', rfc4648(5), 'abcdefghijklmnopqrstuvwxyz234567='],
      ['base32padupper', 'C', rfc4648(5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567='],
      ['base32z', 'h', rfc4648(5), 'ybndrfg8ejkmcpqxot1uwisza345h769'],
      ['base36', 'k', src, '0123456789abcdefghijklmnopqrstuvwxyz'],
      ['base36upper', 'K', src, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
      ['base58btc', 'z', src, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'],
      ['base58flickr', 'Z', src, '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'],
      ['base64', 'm', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'],
      ['base64pad', 'M', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='],
      ['base64url', 'u', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'],
      ['base64urlpad', 'U', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=']
    ];

    const names = constants.reduce((prev, tupple) => {
      prev[tupple[0]] = new base$1(tupple[0], tupple[1], tupple[2], tupple[3]);
      return prev
    }, {});

    const codes = constants.reduce((prev, tupple) => {
      prev[tupple[1]] = names[tupple[0]];
      return prev
    }, {});

    var constants_1 = {
      names,
      codes
    };

    var src$1 = createCommonjsModule(function (module, exports) {

    const { Buffer } = require$$0;


    /** @typedef {import("./base")} Base */

    /**
     * Create a new buffer with the multibase varint+code.
     *
     * @param {string|number} nameOrCode - The multibase name or code number.
     * @param {Buffer} buf - The data to be prefixed with multibase.
     * @returns {Buffer}
     * @throws {Error} Will throw if the encoding is not supported
     */
    function multibase (nameOrCode, buf) {
      if (!buf) {
        throw new Error('requires an encoded buffer')
      }
      const enc = encoding(nameOrCode);
      validEncode(enc.name, buf);
      return Buffer.concat([enc.codeBuf, buf])
    }

    /**
     * Encode data with the specified base and add the multibase prefix.
     *
     * @param {string|number} nameOrCode - The multibase name or code number.
     * @param {Buffer} buf - The data to be encoded.
     * @returns {Buffer}
     * @throws {Error} Will throw if the encoding is not supported
     *
     */
    function encode (nameOrCode, buf) {
      const enc = encoding(nameOrCode);

      return Buffer.concat([enc.codeBuf, Buffer.from(enc.encode(buf))])
    }

    /**
     * Takes a buffer or string encoded with multibase header, decodes it and
     * returns the decoded buffer
     *
     * @param {Buffer|string} data
     * @returns {Buffer}
     * @throws {Error} Will throw if the encoding is not supported
     *
     */
    function decode (data) {
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }
      const prefix = data[0];

      // Make all encodings case-insensitive except the ones that include upper and lower chars in the alphabet
      if (['f', 'F', 'v', 'V', 't', 'T', 'b', 'B', 'c', 'C', 'h', 'k', 'K'].includes(prefix)) {
        data = data.toLowerCase();
      }
      const enc = encoding(data[0]);
      return Buffer.from(enc.decode(data.substring(1)))
    }

    /**
     * Is the given data multibase encoded?
     *
     * @param {Buffer|string} data
     * @returns {boolean}
     */
    function isEncoded (data) {
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      // Ensure bufOrString is a string
      if (Object.prototype.toString.call(data) !== '[object String]') {
        return false
      }

      try {
        const enc = encoding(data[0]);
        return enc.name
      } catch (err) {
        return false
      }
    }

    /**
     * Validate encoded data
     *
     * @param {string} name
     * @param {Buffer} buf
     * @returns {undefined}
     * @throws {Error} Will throw if the encoding is not supported
     */
    function validEncode (name, buf) {
      const enc = encoding(name);
      enc.decode(buf.toString());
    }

    /**
     * Get the encoding by name or code
     *
     * @param {string} nameOrCode
     * @returns {Base}
     * @throws {Error} Will throw if the encoding is not supported
     */
    function encoding (nameOrCode) {
      if (constants_1.names[nameOrCode]) {
        return constants_1.names[nameOrCode]
      } else if (constants_1.codes[nameOrCode]) {
        return constants_1.codes[nameOrCode]
      } else {
        throw new Error(`Unsupported encoding: ${nameOrCode}`)
      }
    }

    /**
     * Get encoding from data
     *
     * @param {string|Buffer} data
     * @returns {Base}
     * @throws {Error} Will throw if the encoding is not supported
     */
    function encodingFromData (data) {
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      return encoding(data[0])
    }

    exports = module.exports = multibase;
    exports.encode = encode;
    exports.decode = decode;
    exports.isEncoded = isEncoded;
    exports.encoding = encoding;
    exports.encodingFromData = encodingFromData;
    exports.names = Object.freeze(constants_1.names);
    exports.codes = Object.freeze(constants_1.codes);
    });

    let node8 = false;

    if ('process' in commonjsGlobal) {
      node8 = /^v8\./.test(commonjsGlobal.process.version);
    }

    var indexCrypto = function init (window) {
      function execGlobal (name, value) {
        return window[name](value)
      }
      const crypto = execGlobal('require', 'crypto');

      function randomFillUint32 (input, bytes) {
        const len = input.length;
        for (let i = 0, o = 0; i < len; i++) {
          input[i] = (
            (bytes[o++] << 24) |
            (bytes[o++] << 16) |
            (bytes[o++] << 8) |
            bytes[o++]
          );
        }
        return input
      }

      function randomFillInt32 (input, bytes) {
        const len = input.length;
        for (let i = 0, o = 0; i < len; i++) {
          input[i] = (
            (bytes[o++] << 24) |
            (bytes[o++] << 16) |
            (bytes[o++] << 8) |
            bytes[o++]
          ) - 0x80000000;
        }
        return input
      }

      function randomFillUint16 (input, bytes) {
        const len = input.length;
        for (let i = 0, o = 0; i < len; i++) {
          input[i] = (bytes[o++] << 8) | bytes[o++];
        }
        return input
      }

      function randomFillInt16 (input, bytes) {
        const len = input.length;
        for (let i = 0, o = 0; i < len; i++) {
          input[i] = ((bytes[o++] << 8) | bytes[o++]) - 0x8000;
        }
        return input
      }

      function randomFillUint8 (input, bytes) {
        const len = input.length;
        for (let i = 0; i < len; i++) {
          input[i] = bytes[i];
        }
        return input
      }

      function randomFillInt8 (input, bytes) {
        const len = input.length;
        for (let i = 0; i < len; i++) {
          input[i] = bytes[i] - 0x80;
        }
        return input
      }

      if (node8) {
        return function randomFillNode8 (input) {
          if (input instanceof Uint8Array) {
            return crypto.randomFillSync(input)
          }
          const bytes = crypto.randomBytes(input.byteLength);
          if (input instanceof Uint32Array) {
            return randomFillUint32(input, bytes)
          }
          if (input instanceof Uint16Array) {
            return randomFillUint16(input, bytes)
          }
          if (input instanceof Int32Array) {
            return randomFillInt32(input, bytes)
          }
          if (input instanceof Int16Array) {
            return randomFillInt16(input, bytes)
          }
          if (input instanceof Int8Array) {
            return randomFillInt8(input, bytes)
          }
          if (input instanceof Uint8ClampedArray) {
            return randomFillUint8(input, bytes)
          }
          throw new Error('invalid type')
        }
      }

      return crypto.randomFillSync || function randomFillClassic (input) {
        const bytes = crypto.randomBytes(input.byteLength);
        if (input instanceof Uint8Array) {
          return randomFillUint8(input, bytes)
        }
        if (input instanceof Uint32Array) {
          return randomFillUint32(input, bytes)
        }
        if (input instanceof Uint16Array) {
          return randomFillUint16(input, bytes)
        }
        if (input instanceof Int32Array) {
          return randomFillInt32(input, bytes)
        }
        if (input instanceof Int16Array) {
          return randomFillInt16(input, bytes)
        }
        if (input instanceof Int8Array) {
          return randomFillInt8(input, bytes)
        }
        if (input instanceof Uint8ClampedArray) {
          return randomFillUint8(input, bytes)
        }
        throw new Error('invalid type')
      }
    };

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var require$$0$1 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    var seedrandom = createCommonjsModule(function (module) {
    /*
    Copyright 2019 David Bau.

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    */

    (function (global, pool, math) {
    //
    // The following constants are related to IEEE 754 limits.
    //

    var width = 256,        // each RC4 output is 0 <= x < 256
        chunks = 6,         // at least six RC4 outputs for each double
        digits = 52,        // there are 52 significant digits in a double
        rngname = 'random', // rngname: name for Math.random and Math.seedrandom
        startdenom = math.pow(width, chunks),
        significance = math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1,
        nodecrypto;         // node.js crypto module, initialized at the bottom.

    //
    // seedrandom()
    // This is the seedrandom function described above.
    //
    function seedrandom(seed, options, callback) {
      var key = [];
      options = (options == true) ? { entropy: true } : (options || {});

      // Flatten the seed string or build one from local entropy if needed.
      var shortseed = mixkey(flatten(
        options.entropy ? [seed, tostring(pool)] :
        (seed == null) ? autoseed() : seed, 3), key);

      // Use the seed to initialize an ARC4 generator.
      var arc4 = new ARC4(key);

      // This function returns a random double in [0, 1) that contains
      // randomness in every bit of the mantissa of the IEEE 754 value.
      var prng = function() {
        var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
            d = startdenom,                 //   and denominator d = 2 ^ 48.
            x = 0;                          //   and no 'extra last byte'.
        while (n < significance) {          // Fill up all significant digits by
          n = (n + x) * width;              //   shifting numerator and
          d *= width;                       //   denominator and generating a
          x = arc4.g(1);                    //   new least-significant-byte.
        }
        while (n >= overflow) {             // To avoid rounding up, before adding
          n /= 2;                           //   last byte, shift everything
          d /= 2;                           //   right using integer math until
          x >>>= 1;                         //   we have exactly the desired bits.
        }
        return (n + x) / d;                 // Form the number within [0, 1).
      };

      prng.int32 = function() { return arc4.g(4) | 0; };
      prng.quick = function() { return arc4.g(4) / 0x100000000; };
      prng.double = prng;

      // Mix the randomness into accumulated entropy.
      mixkey(tostring(arc4.S), pool);

      // Calling convention: what to return as a function of prng, seed, is_math.
      return (options.pass || callback ||
          function(prng, seed, is_math_call, state) {
            if (state) {
              // Load the arc4 state from the given state if it has an S array.
              if (state.S) { copy(state, arc4); }
              // Only provide the .state method if requested via options.state.
              prng.state = function() { return copy(arc4, {}); };
            }

            // If called as a method of Math (Math.seedrandom()), mutate
            // Math.random because that is how seedrandom.js has worked since v1.0.
            if (is_math_call) { math[rngname] = prng; return seed; }

            // Otherwise, it is a newer calling convention, so return the
            // prng directly.
            else return prng;
          })(
      prng,
      shortseed,
      'global' in options ? options.global : (this == math),
      options.state);
    }

    //
    // ARC4
    //
    // An ARC4 implementation.  The constructor takes a key in the form of
    // an array of at most (width) integers that should be 0 <= x < (width).
    //
    // The g(count) method returns a pseudorandom integer that concatenates
    // the next (count) outputs from ARC4.  Its return value is a number x
    // that is in the range 0 <= x < (width ^ count).
    //
    function ARC4(key) {
      var t, keylen = key.length,
          me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

      // The empty key [] is treated as [0].
      if (!keylen) { key = [keylen++]; }

      // Set up S using the standard key scheduling algorithm.
      while (i < width) {
        s[i] = i++;
      }
      for (i = 0; i < width; i++) {
        s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
        s[j] = t;
      }

      // The "g" method returns the next (count) outputs as one number.
      (me.g = function(count) {
        // Using instance members instead of closure state nearly doubles speed.
        var t, r = 0,
            i = me.i, j = me.j, s = me.S;
        while (count--) {
          t = s[i = mask & (i + 1)];
          r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
        }
        me.i = i; me.j = j;
        return r;
        // For robust unpredictability, the function call below automatically
        // discards an initial batch of values.  This is called RC4-drop[256].
        // See http://google.com/search?q=rsa+fluhrer+response&btnI
      })(width);
    }

    //
    // copy()
    // Copies internal state of ARC4 to or from a plain object.
    //
    function copy(f, t) {
      t.i = f.i;
      t.j = f.j;
      t.S = f.S.slice();
      return t;
    }
    //
    // flatten()
    // Converts an object tree to nested arrays of strings.
    //
    function flatten(obj, depth) {
      var result = [], typ = (typeof obj), prop;
      if (depth && typ == 'object') {
        for (prop in obj) {
          try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
        }
      }
      return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

    //
    // mixkey()
    // Mixes a string seed into a key that is an array of integers, and
    // returns a shortened string seed that is equivalent to the result key.
    //
    function mixkey(seed, key) {
      var stringseed = seed + '', smear, j = 0;
      while (j < stringseed.length) {
        key[mask & j] =
          mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
      }
      return tostring(key);
    }

    //
    // autoseed()
    // Returns an object for autoseeding, using window.crypto and Node crypto
    // module if available.
    //
    function autoseed() {
      try {
        var out;
        if (nodecrypto && (out = nodecrypto.randomBytes)) {
          // The use of 'out' to remember randomBytes makes tight minified code.
          out = out(width);
        } else {
          out = new Uint8Array(width);
          (global.crypto || global.msCrypto).getRandomValues(out);
        }
        return tostring(out);
      } catch (e) {
        var browser = global.navigator,
            plugins = browser && browser.plugins;
        return [+new Date, global, plugins, global.screen, tostring(pool)];
      }
    }

    //
    // tostring()
    // Converts an array of charcodes to a string
    //
    function tostring(a) {
      return String.fromCharCode.apply(0, a);
    }

    //
    // When seedrandom.js is loaded, we immediately mix a few bits
    // from the built-in RNG into the entropy pool.  Because we do
    // not want to interfere with deterministic PRNG state later,
    // seedrandom will not call math.random on its own again after
    // initialization.
    //
    mixkey(math.random(), pool);

    //
    // Nodejs and AMD support: export the implementation as a module using
    // either convention.
    //
    if ( module.exports) {
      module.exports = seedrandom;
      // When in node.js, try using crypto package for autoseeding.
      try {
        nodecrypto = require$$0$1;
      } catch (ex) {}
    } else {
      // When included as a plain script, set up Math.seedrandom global.
      math['seed' + rngname] = seedrandom;
    }


    // End anonymous scope, and pass initial values.
    })(
      // global: `self` in browsers (including strict mode and web workers),
      // otherwise `this` in Node and other environments
      (typeof self !== 'undefined') ? self : commonjsGlobal,
      [],     // pool: entropy pool starts empty
      Math    // math: package containing random, pow, and seedrandom
    );
    });

    function strs2ab (strs) {
      // Adapted from https://stackoverflow.com/posts/11058858
      const len = strs.reduce(function (total, str) {
        return total + (str.length * 2)
      }, 0);
      const buf = new ArrayBuffer(len); // 2 bytes for each char
      const bufView = new Uint16Array(buf);
      let offset = 0;
      strs.forEach(function (str) {
        for (var i = 0, strLen = str.length; i < strLen; i++) {
          bufView[offset + i] = str.charCodeAt(i);
        }
        offset += str.length;
      });
      return bufView
    }

    var indexSeedrandom = function init (window) {
      const seedrandom$1 = seedrandom;
      function execGlobal (name, value) {
        return window[name](value)
      }

      let SyncRandomBytes;
      let seed;
      try {
        SyncRandomBytes = execGlobal('require', 'react-native').NativeModules.SyncRandomBytes;
        if (SyncRandomBytes) {
          seed = SyncRandomBytes.seed;
        }
      } catch (_) {}

      if (!seed && window && 'Expo' in window) {
        seed = strs2ab([
          window.Expo.Constants.installationId,
          window.Expo.Constants.sessionId,
          'performance' in window ? window.performance.now().toString(32) : (new Date()).toISOString(),
          Math.random().toString(32)
        ]);
      }

      let prng = seedrandom$1(seed);
      let early = false;

      if (!seed && SyncRandomBytes) {
        early = true;
        SyncRandomBytes.randomBytes()
          .then(seed => {
            early = false;
            prng = seedrandom$1(seed);
          })
          .catch(function (err) {
            early = false;
            console.log(`WARNING: can not collect seed data: ${err.message}`);
          });
      }

      function randomFillUint32 (input) {
        const len = input.length;
        if (len > 16384) { // 65536 by 4
          throw new Error('QuotaExceeded')
        }
        for (let i = len - 1; i >= 0; i--) {
          input[i] = prng.int32();
        }
        return input
      }

      function randomFillInt32 (input) {
        const len = input.length;
        if (len > 16384) { // 65536 by 4
          throw new Error('QuotaExceeded')
        }
        for (let i = len - 1; i >= 0; i--) {
          input[i] = prng.int32() - 0x80000000;
        }
        return input
      }

      function randomFillUint8 (input) {
        if (input.length > 65536) {
          throw new Error('QuotaExceeded')
        }
        const count = (input.length * 0.25 + 1) | 0;
        for (let i = count - 1, n = 0; i >= 0; i--) {
          const value = prng.int32();
          input[n++] = value & 0xff;
          input[n++] = (value >> 8) & 0xff;
          input[n++] = (value >> 16) & 0xff;
          input[n++] = (value >> 24) & 0xff;
        }
        return input
      }

      function randomFillInt8 (input) {
        if (input.length > 65536) {
          throw new Error('QuotaExceeded')
        }
        const count = (input.length * 0.25 + 1) | 0;
        for (let i = count - 1, n = 0; i >= 0; i--) {
          const value = prng.int32();
          input[n++] = (value & 0xff) - 0x80;
          input[n++] = ((value >> 8) & 0xff) - 0x80;
          input[n++] = ((value >> 16) & 0xff) - 0x80;
          input[n++] = ((value >> 24) & 0xff) - 0x80;
        }
        return input
      }

      function randomFillUint16 (input) {
        if (input.length > 32767) {
          throw new Error('QuotaExceeded')
        }
        const count = (input.length * 0.5 + 1) | 0;
        for (let i = count - 1, n = 0; i >= 0; i--) {
          const value = prng.int32();
          input[n++] = value & 0xffff;
          input[n++] = (value >> 16) & 0xffff;
        }
        return input
      }

      function randomFillInt16 (input) {
        if (input.length > 32767) {
          throw new Error('QuotaExceeded')
        }
        const count = (input.length * 0.5 + 1) | 0;
        for (let i = count - 1, n = 0; i >= 0; i--) {
          const value = prng.int32();
          input[n++] = (value & 0xffff) - 0x8000;
          input[n++] = ((value >> 16) & 0xffff) - 0x8000;
        }
        return input
      }

      return function getSeedRandomValues (input) {
        if (early) {
          early = false;
          console.log('WARNING: random data is requested before the seed is done');
        }
        if (input === null || input === undefined) {
          throw new Error('invalid type')
        }
        if (input instanceof Uint8Array) {
          return randomFillUint8(input)
        }
        if (input instanceof Uint32Array) {
          return randomFillUint32(input)
        }
        if (input instanceof Uint16Array) {
          return randomFillUint16(input)
        }
        if (input instanceof Int32Array) {
          return randomFillInt32(input)
        }
        if (input instanceof Int16Array) {
          return randomFillInt16(input)
        }
        if (input instanceof Int8Array) {
          return randomFillInt8(input)
        }
        if (input instanceof Uint8ClampedArray) {
          return randomFillUint8(input)
        }
        throw new Error('invalid type')
      }
    };

    var syncRandombytes = createCommonjsModule(function (module) {
    module.exports = (function (window) {
      if (window && window.crypto && window.crypto.getRandomValues) {
        return window.crypto.getRandomValues.bind(window.crypto)
      }
      try {
        return indexCrypto(window)
      } catch (_) {
        return indexSeedrandom(window)
      }
    })(typeof window === 'object' ? window : module);
    });

    var key = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThreadKey = exports.keyToString = exports.keyFromString = exports.randomBytes = exports.invalidKeyError = void 0;
    const sync_randombytes_1 = __importDefault(syncRandombytes);
    const multibase_1 = __importDefault(src$1);
    exports.invalidKeyError = new Error("Invalid key");
    exports.randomBytes = (byteLength) => {
        return sync_randombytes_1.default(new Uint8Array(byteLength));
    };
    // KeyBytes is the length of GCM key.
    const keyBytes = 32;
    /**
     * keyFromString returns a key by decoding a base32-encoded string.
     * @param k Input base32-encoded string.
     */
    exports.keyFromString = (k) => {
        return multibase_1.default.decode(k);
    };
    /**
     * String returns the base32-encoded string representation of raw key bytes.
     * @param k Input key buffer.
     */
    exports.keyToString = (k) => {
        return multibase_1.default.encode("base32", k).toString();
    };
    /**
     * Key is a thread encryption key with two components.
     * @param sk Network key is used to encrypt outer log record linkages.
     * @param rk Read key is used to encrypt inner record events.
     */
    class ThreadKey {
        constructor(service, read) {
            this.service = service;
            this.read = read;
        }
        /**
         * Create a new set of keys.
         * @param withRead Whether to also include a random read key.
         */
        static fromRandom(withRead = true) {
            return new ThreadKey(exports.randomBytes(keyBytes), withRead ? exports.randomBytes(keyBytes) : undefined);
        }
        /**
         * Create Key from bytes.
         * @param bytes Input bytes of (possibly both) key(s).
         */
        static fromBytes(bytes) {
            if (bytes.byteLength !== keyBytes && bytes.byteLength !== keyBytes * 2) {
                throw exports.invalidKeyError;
            }
            const sk = bytes.slice(0, keyBytes);
            let rk;
            if (bytes.byteLength === keyBytes * 2) {
                rk = bytes.slice(keyBytes);
            }
            return new ThreadKey(sk, rk);
        }
        /**
         * Create Key by decoding a base32-encoded string.
         * @param s The base32-encoded string.
         */
        static fromString(s) {
            const data = multibase_1.default.decode(s);
            return this.fromBytes(data);
        }
        isDefined() {
            return this.service !== undefined;
        }
        canRead() {
            return this.read !== undefined;
        }
        toBytes() {
            var _a;
            if (this.read !== undefined) {
                const full = new Uint8Array(this.service.byteLength + ((_a = this.read.byteLength) !== null && _a !== void 0 ? _a : 0));
                full.set(this.service);
                this.read && full.set(this.read, this.service.byteLength);
                return full;
            }
            return this.service;
        }
        /**
         * Return the base32-encoded string representation of raw key bytes.
         * For example:
         * Full: "brv7t5l2h55uklz5qwpntcat26csaasfchzof3emmdy6povabcd3a2to2qdkqdkto2prfhizerqqudqsdvwherbiy4nazqxjejgdr4oy"
         * Network: "bp2vvqody5zm6yqycsnazb4kpqvycbdosos352zvpsorxce5koh7q"
         */
        toString() {
            return multibase_1.default.encode("base32", this.toBytes()).toString();
        }
    }
    exports.ThreadKey = ThreadKey;

    });

    var dist = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
    };
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.expirationError = exports.createUserAuth = exports.createAPISig = void 0;
    /**
     * Common types/methods for Textile security including authentication and authorization.
     *
     * All methods here should be imported directly from the @textile/hub library.
     *
     * @packageDocumentation
     */

    const multibase_1 = __importDefault(src$1);
    /**
     * createAPISig generates an authorization signature and message only.
     *
     * This function should NOT be used client-side, as it requires a key secret.
     * @public
     * @example
     * Basic usage
     * ```typescript
     * import {createAPISig, APISig} from '@textile/threads'
     *
     * async function sign (key: string) {
     *   const sig: APISig = await createAPISig(key)
     *   return sig
     * }
     * ```
     * @param {string} secret - The key secret to generate the signature. See KeyInfo for details.
     * @param {Date} date - An optional future Date to use as signature message. Once `date` has passed, this
     * authorization signature and message will expire. Defaults to one minute from `Date.now`.
     */
    function createAPISig(secret, date = new Date(Date.now() + 1000 * 60 * 30) // Default to 30 minutes
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const sec = multibase_1.default.decode(secret);
            const msg = date.toISOString();
            const hash = new sha256.HMAC(sec);
            const mac = hash.update(Buffer.from(msg)).digest();
            const sig = multibase_1.default.encode("base32", Buffer.from(mac)).toString();
            return { sig, msg };
        });
    }
    exports.createAPISig = createAPISig;
    /**
     * Generate a UserAuth containing API key, signature, and message.
     *
     * The gRPC APIs will throw (or return an authorization error) if the message date has passed.
     * This function should NOT be used client-side, as it requires a key secret. The result does
     * not contain the secret and therefor CAN be used client side.
     * @public
     * @example
     * Create a new UserAuth
     * ```typescript
     * import {createUserAuth, KeyInfo, UserAuth} from '@textile/threads';
     *
     * async function auth (keyInfo: KeyInfo) {
     *   // Create an expiration and create a signature. 60s or less is recommended.
     *   const expiration = new Date(Date.now() + 60 * 1000)
     *   // Generate a new UserAuth
     *   const userAuth: UserAuth = await createUserAuth(keyInfo.key, keyInfo.secret ?? '', expiration)
     *   return userAuth
     * }
     * ```
     *
     * @param {string} key - The API key secret to generate the signature. See KeyInfo for details.
     * @param {string} secret - The API key secret to generate the signature. See KeyInfo for details.
     * @param {Date} date - An optional future Date to use as signature message. Default 1 minute from now.
     * @param {string} token - An optional user API token.
     */
    function createUserAuth(key, secret, date, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const partial = yield createAPISig(secret, date);
            return Object.assign(Object.assign({}, partial), { key,
                token });
        });
    }
    exports.createUserAuth = createUserAuth;
    /**
     * expirationError is an error your app will receive anytime your credentials have expired.
     * @public
     */
    exports.expirationError = new Error("Auth expired. Consider calling withKeyInfo or withAPISig to refresh.");
    __exportStar(key, exports);

    });

    var dist$1 = createCommonjsModule(function (module, exports) {
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __rest = (commonjsGlobal && commonjsGlobal.__rest) || function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = exports.defaultHost = void 0;


    exports.defaultHost = "https://webapi.hub.textile.io";
    /**
     * Context provides context management for gRPC credentials and config settings.
     * It is the default implementation for the ContextInterface interface.
     */
    class Context {
        /**
         * Construct a new Context object.
         * @param host The remote gRPC host. This input exists to comply with the Config interface.
         */
        constructor(host = exports.defaultHost) {
            // Internal context variables
            this._context = {};
            this._context["host"] = host;
        }
        static fromUserAuth(auth, host = exports.defaultHost) {
            const ctx = new Context(host);
            const { key, token } = auth, sig = __rest(auth, ["key", "token"]);
            return ctx.withAPIKey(key).withAPISig(sig).withToken(token);
        }
        static fromUserAuthCallback(authCallback, host = exports.defaultHost) {
            const ctx = new Context(host);
            // @todo: Should we now callback right away?
            ctx.authCallback = authCallback;
            return ctx;
        }
        get host() {
            return this._context["host"];
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        set(key, value) {
            this._context[key] = value;
            return this;
        }
        get(key) {
            return this._context[key];
        }
        withSession(value) {
            if (value === undefined)
                return this;
            this._context["x-textile-session"] = value;
            return this;
        }
        withThread(value) {
            if (value === undefined)
                return this;
            this._context["x-textile-thread"] = value.toString();
            return this;
        }
        withThreadName(value) {
            if (value === undefined)
                return this;
            this._context["x-textile-thread-name"] = value;
            return this;
        }
        withOrg(value) {
            if (value === undefined)
                return this;
            this._context["x-textile-org"] = value;
            return this;
        }
        withToken(value) {
            if (value === undefined)
                return this;
            this._context["authorization"] = `bearer ${value}`;
            return this;
        }
        withAPIKey(value) {
            if (value === undefined)
                return this;
            this._context["x-textile-api-key"] = value;
            return this;
        }
        withAPISig(value) {
            if (value === undefined)
                return this;
            const { sig, msg } = value;
            this._context["x-textile-api-sig-msg"] = msg;
            this._context["x-textile-api-sig"] = sig;
            return this;
        }
        withKeyInfo(key, date) {
            return __awaiter(this, void 0, void 0, function* () {
                if (key === undefined)
                    return this;
                // Enables the use of insecure / non-signing keys
                if (!key.secret)
                    return this.withAPIKey(key.key);
                const sig = yield dist.createAPISig(key.secret, date);
                return this.withAPIKey(key.key).withAPISig(sig);
            });
        }
        withContext(value) {
            if (value === undefined)
                return this;
            // Spread to copy rather than reference
            this._context = value.toJSON();
            return this;
        }
        /**
         * Returns true if this Context contains an api sig msg, and that msg has expired, or if
         * it does _not_ have an api sig msg, but it _does_ have an auth callback.
         */
        get isExpired() {
            const msg = this.get("x-textile-api-sig-msg");
            const notAuthed = msg === undefined && this.authCallback !== undefined;
            const isExpired = msg !== undefined && new Date(msg) <= new Date();
            return isExpired || notAuthed;
        }
        /**
         * Refresh user auth with provided callback.
         * If callback is not specified, attempts to use existing callback specified at initialization.
         */
        refreshUserAuth(authCallback) {
            return __awaiter(this, void 0, void 0, function* () {
                // If we have a new one, use it...
                if (authCallback !== undefined) {
                    this.authCallback = authCallback;
                }
                // If we still don't have a callback, throw...
                if (this.authCallback === undefined) {
                    throw new Error("Missing authCallback. See Context.fromUserAuthCallback for details.");
                }
                // Now do the renewal and return self...
                const _a = yield this.authCallback(), { key, token } = _a, sig = __rest(_a, ["key", "token"]);
                return this.withAPIKey(key).withAPISig(sig).withToken(token);
            });
        }
        /**
         * Convert Context to plain JSON object.
         * @throws If this Context has expired.
         * @see toMetadata for an alternative for gRPC clients that supports auto-renewal.
         */
        toJSON() {
            const json = __rest(this._context
            // If we're expired, throw...
            , []);
            // If we're expired, throw...
            if (this.isExpired) {
                throw dist.expirationError;
            }
            return json;
        }
        /**
         * Convert Context to grpc Metadata object.
         * Will automatically call the auth callback if available.
         * @param ctx Additional context object that will be merged with this prior to conversion.
         * @see toJSON for an alternative that returns a plain object, and throws when expired.
         */
        toMetadata(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                const context = new Context();
                if (this.isExpired && this.authCallback !== undefined) {
                    const _a = yield this.authCallback(), { key, token } = _a, sig = __rest(_a, ["key", "token"]);
                    // We do want to mutate this here because we want to update our auth sig
                    this.withAPIKey(key).withAPISig(sig).withToken(token);
                }
                // We merge this context and ctx with the empty context so as to avoid mutating this with ctx
                return new grpcWebClient_umd.grpc.Metadata(context.withContext(this).withContext(ctx).toJSON());
            });
        }
        /**
         * Import various ContextInterface API properties from JSON.
         * @param json The JSON object.
         * @param host Optional host string.
         */
        static fromJSON(json, host = exports.defaultHost) {
            const newContext = Object.assign({}, json);
            newContext["host"] = host;
            const ctx = new Context();
            ctx._context = newContext;
            return ctx;
        }
    }
    exports.Context = Context;

    });

    var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.findInternal=function(a,b,c){a instanceof String&&(a=String(a));for(var d=a.length,e=0;e<d;e++){var f=a[e];if(b.call(c,f,e,a))return {i:e,v:f}}return {i:-1,v:void 0}};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.SIMPLE_FROUND_POLYFILL=!1;
    $jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value);};$jscomp.getGlobal=function(a){return "undefined"!=typeof window&&window===a?a:"undefined"!=typeof commonjsGlobal&&null!=commonjsGlobal?commonjsGlobal:a};$jscomp.global=$jscomp.getGlobal(commonjsGlobal);
    $jscomp.polyfill=function(a,b,c,d){if(b){c=$jscomp.global;a=a.split(".");for(d=0;d<a.length-1;d++){var e=a[d];e in c||(c[e]={});c=c[e];}a=a[a.length-1];d=c[a];b=b(d);b!=d&&null!=b&&$jscomp.defineProperty(c,a,{configurable:!0,writable:!0,value:b});}};$jscomp.polyfill("Array.prototype.findIndex",function(a){return a?a:function(a,c){return $jscomp.findInternal(this,a,c).i}},"es6","es3");
    $jscomp.checkStringArgs=function(a,b,c){if(null==a)throw new TypeError("The 'this' value for String.prototype."+c+" must not be null or undefined");if(b instanceof RegExp)throw new TypeError("First argument to String.prototype."+c+" must not be a regular expression");return a+""};
    $jscomp.polyfill("String.prototype.endsWith",function(a){return a?a:function(a,c){var b=$jscomp.checkStringArgs(this,a,"endsWith");a+="";void 0===c&&(c=b.length);c=Math.max(0,Math.min(c|0,b.length));for(var e=a.length;0<e&&0<c;)if(b[--c]!=a[--e])return !1;return 0>=e}},"es6","es3");$jscomp.polyfill("Array.prototype.find",function(a){return a?a:function(a,c){return $jscomp.findInternal(this,a,c).v}},"es6","es3");
    $jscomp.polyfill("String.prototype.startsWith",function(a){return a?a:function(a,c){var b=$jscomp.checkStringArgs(this,a,"startsWith");a+="";var e=b.length,f=a.length;c=Math.max(0,Math.min(c|0,b.length));for(var g=0;g<f&&c<e;)if(b[c++]!=a[g++])return !1;return g>=f}},"es6","es3");
    $jscomp.polyfill("String.prototype.repeat",function(a){return a?a:function(a){var b=$jscomp.checkStringArgs(this,null,"repeat");if(0>a||1342177279<a)throw new RangeError("Invalid count value");a|=0;for(var d="";a;)if(a&1&&(d+=b),a>>>=1)b+=b;return d}},"es6","es3");var COMPILED$1=!0,goog=goog||{};goog.global=commonjsGlobal||self;goog.isDef=function(a){return void 0!==a};goog.isString=function(a){return "string"==typeof a};goog.isBoolean=function(a){return "boolean"==typeof a};
    goog.isNumber=function(a){return "number"==typeof a};goog.exportPath_=function(a,b,c){a=a.split(".");c=c||goog.global;a[0]in c||"undefined"==typeof c.execScript||c.execScript("var "+a[0]);for(var d;a.length&&(d=a.shift());)!a.length&&goog.isDef(b)?c[d]=b:c=c[d]&&c[d]!==Object.prototype[d]?c[d]:c[d]={};};
    goog.define=function(a,b){return b};goog.FEATURESET_YEAR=2012;goog.DEBUG=!0;goog.LOCALE="en";goog.TRUSTED_SITE=!0;goog.STRICT_MODE_COMPATIBLE=!1;goog.DISALLOW_TEST_ONLY_CODE=!goog.DEBUG;goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING=!1;
    goog.provide=function(a){if(goog.isInModuleLoader_())throw Error("goog.provide cannot be used within a module.");goog.constructNamespace_(a);};goog.constructNamespace_=function(a,b){goog.exportPath_(a,b);};
    goog.getScriptNonce=function(a){if(a&&a!=goog.global)return goog.getScriptNonce_(a.document);null===goog.cspNonce_&&(goog.cspNonce_=goog.getScriptNonce_(goog.global.document));return goog.cspNonce_};goog.NONCE_PATTERN_=/^[\w+/_-]+[=]{0,2}$/;goog.cspNonce_=null;goog.getScriptNonce_=function(a){return (a=a.querySelector&&a.querySelector("script[nonce]"))&&(a=a.nonce||a.getAttribute("nonce"))&&goog.NONCE_PATTERN_.test(a)?a:""};goog.VALID_MODULE_RE_=/^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
    goog.module=function(a){if(!goog.isString(a)||!a||-1==a.search(goog.VALID_MODULE_RE_))throw Error("Invalid module identifier");if(!goog.isInGoogModuleLoader_())throw Error("Module "+a+" has been loaded incorrectly. Note, modules cannot be loaded as normal scripts. They require some kind of pre-processing step. You're likely trying to load a module via a script tag or as a part of a concatenated bundle without rewriting the module. For more info see: https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
    if(goog.moduleLoaderState_.moduleName)throw Error("goog.module may only be called once per module.");goog.moduleLoaderState_.moduleName=a;};goog.module.get=function(a){return goog.module.getInternal_(a)};
    goog.module.getInternal_=function(a){return null};goog.ModuleType={ES6:"es6",GOOG:"goog"};goog.moduleLoaderState_=null;goog.isInModuleLoader_=function(){return goog.isInGoogModuleLoader_()||goog.isInEs6ModuleLoader_()};goog.isInGoogModuleLoader_=function(){return !!goog.moduleLoaderState_&&goog.moduleLoaderState_.type==goog.ModuleType.GOOG};
    goog.isInEs6ModuleLoader_=function(){if(goog.moduleLoaderState_&&goog.moduleLoaderState_.type==goog.ModuleType.ES6)return !0;var a=goog.global.$jscomp;return a?"function"!=typeof a.getCurrentModulePath?!1:!!a.getCurrentModulePath():!1};
    goog.module.declareLegacyNamespace=function(){goog.moduleLoaderState_.declareLegacyNamespace=!0;};
    goog.declareModuleId=function(a){if(goog.moduleLoaderState_)goog.moduleLoaderState_.moduleName=a;else {var b=goog.global.$jscomp;if(!b||"function"!=typeof b.getCurrentModulePath)throw Error('Module with namespace "'+
    a+'" has been loaded incorrectly.');b=b.require(b.getCurrentModulePath());goog.loadedModules_[a]={exports:b,type:goog.ModuleType.ES6,moduleId:a};}};goog.setTestOnly=function(a){if(goog.DISALLOW_TEST_ONLY_CODE)throw a=a||"",Error("Importing test-only code into non-debug environment"+(a?": "+a:"."));};goog.forwardDeclare=function(a){};
    goog.getObjectByName=function(a,b){a=a.split(".");b=b||goog.global;for(var c=0;c<a.length;c++)if(b=b[a[c]],!goog.isDefAndNotNull(b))return null;return b};goog.globalize=function(a,b){b=b||goog.global;for(var c in a)b[c]=a[c];};
    goog.addDependency=function(a,b,c,d){};goog.ENABLE_DEBUG_LOADER=!0;goog.logToConsole_=function(a){goog.global.console&&goog.global.console.error(a);};
    goog.require=function(a){};goog.requireType=function(a){return {}};goog.basePath="";goog.nullFunction=function(){};
    goog.abstractMethod=function(){throw Error("unimplemented abstract method");};goog.addSingletonGetter=function(a){a.instance_=void 0;a.getInstance=function(){if(a.instance_)return a.instance_;goog.DEBUG&&(goog.instantiatedSingletons_[goog.instantiatedSingletons_.length]=a);return a.instance_=new a};};goog.instantiatedSingletons_=[];goog.LOAD_MODULE_USING_EVAL=!0;goog.SEAL_MODULE_EXPORTS=goog.DEBUG;goog.loadedModules_={};goog.DEPENDENCIES_ENABLED=!COMPILED$1;goog.TRANSPILE="detect";
    goog.ASSUME_ES_MODULES_TRANSPILED=!1;goog.TRANSPILE_TO_LANGUAGE="";goog.TRANSPILER="transpile.js";goog.hasBadLetScoping=null;goog.useSafari10Workaround=function(){if(null==goog.hasBadLetScoping){try{var a=!eval('"use strict";let x = 1; function f() { return typeof x; };f() == "number";');}catch(b){a=!1;}goog.hasBadLetScoping=a;}return goog.hasBadLetScoping};goog.workaroundSafari10EvalBug=function(a){return "(function(){"+a+"\n;})();\n"};
    goog.loadModule=function(a){var b=goog.moduleLoaderState_;try{goog.moduleLoaderState_={moduleName:"",declareLegacyNamespace:!1,type:goog.ModuleType.GOOG};if(goog.isFunction(a))var c=a.call(void 0,{});else if(goog.isString(a))goog.useSafari10Workaround()&&(a=goog.workaroundSafari10EvalBug(a)),c=goog.loadModuleFromSource_.call(void 0,a);else throw Error("Invalid module definition");var d=goog.moduleLoaderState_.moduleName;if(goog.isString(d)&&d)goog.moduleLoaderState_.declareLegacyNamespace?goog.constructNamespace_(d,
    c):goog.SEAL_MODULE_EXPORTS&&Object.seal&&"object"==typeof c&&null!=c&&Object.seal(c),goog.loadedModules_[d]={exports:c,type:goog.ModuleType.GOOG,moduleId:goog.moduleLoaderState_.moduleName};else throw Error('Invalid module name "'+d+'"');}finally{goog.moduleLoaderState_=b;}};goog.loadModuleFromSource_=function(a){eval(a);return {}};goog.normalizePath_=function(a){a=a.split("/");for(var b=0;b<a.length;)"."==a[b]?a.splice(b,1):b&&".."==a[b]&&a[b-1]&&".."!=a[b-1]?a.splice(--b,2):b++;return a.join("/")};
    goog.loadFileSync_=function(a){if(goog.global.CLOSURE_LOAD_FILE_SYNC)return goog.global.CLOSURE_LOAD_FILE_SYNC(a);try{var b=new goog.global.XMLHttpRequest;b.open("get",a,!1);b.send();return 0==b.status||200==b.status?b.responseText:null}catch(c){return null}};
    goog.transpile_=function(a,b,c){var d=goog.global.$jscomp;d||(goog.global.$jscomp=d={});var e=d.transpile;if(!e){var f=goog.basePath+goog.TRANSPILER,g=goog.loadFileSync_(f);if(g){(function(){(0, eval)(g+"\n//# sourceURL="+f);}).call(goog.global);if(goog.global.$gwtExport&&goog.global.$gwtExport.$jscomp&&!goog.global.$gwtExport.$jscomp.transpile)throw Error('The transpiler did not properly export the "transpile" method. $gwtExport: '+JSON.stringify(goog.global.$gwtExport));goog.global.$jscomp.transpile=
    goog.global.$gwtExport.$jscomp.transpile;d=goog.global.$jscomp;e=d.transpile;}}e||(e=d.transpile=function(a,b){goog.logToConsole_(b+" requires transpilation but no transpiler was found.");return a});return e(a,b,c)};
    goog.typeOf=function(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return "array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return "object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return "array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return "function"}else return "null";
    else if("function"==b&&"undefined"==typeof a.call)return "object";return b};goog.isNull=function(a){return null===a};goog.isDefAndNotNull=function(a){return null!=a};goog.isArray=function(a){return "array"==goog.typeOf(a)};goog.isArrayLike=function(a){var b=goog.typeOf(a);return "array"==b||"object"==b&&"number"==typeof a.length};goog.isDateLike=function(a){return goog.isObject(a)&&"function"==typeof a.getFullYear};goog.isFunction=function(a){return "function"==goog.typeOf(a)};
    goog.isObject=function(a){var b=typeof a;return "object"==b&&null!=a||"function"==b};goog.getUid=function(a){return a[goog.UID_PROPERTY_]||(a[goog.UID_PROPERTY_]=++goog.uidCounter_)};goog.hasUid=function(a){return !!a[goog.UID_PROPERTY_]};goog.removeUid=function(a){null!==a&&"removeAttribute"in a&&a.removeAttribute(goog.UID_PROPERTY_);try{delete a[goog.UID_PROPERTY_];}catch(b){}};goog.UID_PROPERTY_="closure_uid_"+(1E9*Math.random()>>>0);goog.uidCounter_=0;goog.getHashCode=goog.getUid;
    goog.removeHashCode=goog.removeUid;goog.cloneObject=function(a){var b=goog.typeOf(a);if("object"==b||"array"==b){if("function"===typeof a.clone)return a.clone();b="array"==b?[]:{};for(var c in a)b[c]=goog.cloneObject(a[c]);return b}return a};goog.bindNative_=function(a,b,c){return a.call.apply(a.bind,arguments)};
    goog.bindJs_=function(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}};goog.bind=function(a,b,c){Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?goog.bind=goog.bindNative_:goog.bind=goog.bindJs_;return goog.bind.apply(null,arguments)};
    goog.partial=function(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var b=c.slice();b.push.apply(b,arguments);return a.apply(this,b)}};goog.mixin=function(a,b){for(var c in b)a[c]=b[c];};goog.now=goog.TRUSTED_SITE&&Date.now||function(){return +new Date};
    goog.globalEval=function(a){if(goog.global.execScript)goog.global.execScript(a,"JavaScript");else if(goog.global.eval){if(null==goog.evalWorksForGlobals_){try{goog.global.eval("var _evalTest_ = 1;");}catch(d){}if("undefined"!=typeof goog.global._evalTest_){try{delete goog.global._evalTest_;}catch(d){}goog.evalWorksForGlobals_=!0;}else goog.evalWorksForGlobals_=!1;}if(goog.evalWorksForGlobals_)goog.global.eval(a);else {var b=goog.global.document,c=b.createElement("SCRIPT");c.type="text/javascript";c.defer=
    !1;c.appendChild(b.createTextNode(a));b.head.appendChild(c);b.head.removeChild(c);}}else throw Error("goog.globalEval not available");};goog.evalWorksForGlobals_=null;
    goog.getCssName=function(a,b){if("."==String(a).charAt(0))throw Error('className passed in goog.getCssName must not start with ".". You passed: '+a);var c=function(a){return goog.cssNameMapping_[a]||a},d=function(a){a=a.split("-");for(var b=[],d=0;d<a.length;d++)b.push(c(a[d]));return b.join("-")};d=goog.cssNameMapping_?"BY_WHOLE"==goog.cssNameMappingStyle_?c:d:function(a){return a};a=b?a+"-"+d(b):d(a);return goog.global.CLOSURE_CSS_NAME_MAP_FN?goog.global.CLOSURE_CSS_NAME_MAP_FN(a):a};
    goog.setCssNameMapping=function(a,b){goog.cssNameMapping_=a;goog.cssNameMappingStyle_=b;};goog.getMsg=function(a,b,c){c&&c.html&&(a=a.replace(/</g,"&lt;"));b&&(a=a.replace(/\{\$([^}]+)}/g,function(a,c){return null!=b&&c in b?b[c]:a}));return a};goog.getMsgWithFallback=function(a,b){return a};goog.exportSymbol=function(a,b,c){goog.exportPath_(a,b,c);};
    goog.exportProperty=function(a,b,c){a[b]=c;};goog.inherits=function(a,b){function c(){}c.prototype=b.prototype;a.superClass_=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.base=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)};};
    goog.base=function(a,b,c){var d=arguments.callee.caller;if(goog.STRICT_MODE_COMPATIBLE||goog.DEBUG&&!d)throw Error("arguments.caller not defined.  goog.base() cannot be used with strict mode code. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");if("undefined"!==typeof d.superClass_){for(var e=Array(arguments.length-1),f=1;f<arguments.length;f++)e[f-1]=arguments[f];return d.superClass_.constructor.apply(a,e)}if("string"!=typeof b&&"symbol"!=typeof b)throw Error("method names provided to goog.base must be a string or a symbol");
    e=Array(arguments.length-2);for(f=2;f<arguments.length;f++)e[f-2]=arguments[f];f=!1;for(var g=a.constructor.prototype;g;g=Object.getPrototypeOf(g))if(g[b]===d)f=!0;else if(f)return g[b].apply(a,e);if(a[b]===d)return a.constructor.prototype[b].apply(a,e);throw Error("goog.base called from a method of one name to a method of a different name");};goog.scope=function(a){if(goog.isInModuleLoader_())throw Error("goog.scope is not supported within a module.");a.call(goog.global);};
    goog.defineClass=function(a,b){var c=b.constructor,d=b.statics;c&&c!=Object.prototype.constructor||(c=function(){throw Error("cannot instantiate an interface (no constructor defined).");});c=goog.defineClass.createSealingConstructor_(c,a);a&&goog.inherits(c,a);delete b.constructor;delete b.statics;goog.defineClass.applyProperties_(c.prototype,b);null!=d&&(d instanceof Function?d(c):goog.defineClass.applyProperties_(c,d));return c};
    goog.defineClass.SEAL_CLASS_INSTANCES=goog.DEBUG;goog.defineClass.createSealingConstructor_=function(a,b){if(!goog.defineClass.SEAL_CLASS_INSTANCES)return a;var c=!goog.defineClass.isUnsealable_(b),d=function(){var b=a.apply(this,arguments)||this;b[goog.UID_PROPERTY_]=b[goog.UID_PROPERTY_];this.constructor===d&&c&&Object.seal instanceof Function&&Object.seal(b);return b};return d};goog.defineClass.isUnsealable_=function(a){return a&&a.prototype&&a.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]};
    goog.defineClass.OBJECT_PROTOTYPE_FIELDS_="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");goog.defineClass.applyProperties_=function(a,b){for(var c in b)Object.prototype.hasOwnProperty.call(b,c)&&(a[c]=b[c]);for(var d=0;d<goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length;d++)c=goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[d],Object.prototype.hasOwnProperty.call(b,c)&&(a[c]=b[c]);};
    goog.tagUnsealableClass=function(a){};goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_="goog_defineClass_legacy_unsealable";
    goog.TRUSTED_TYPES_POLICY_NAME="";goog.identity_=function(a){return a};goog.createTrustedTypesPolicy=function(a){var b=null;if("undefined"===typeof TrustedTypes||!TrustedTypes.createPolicy)return b;try{b=TrustedTypes.createPolicy(a,{createHTML:goog.identity_,createScript:goog.identity_,createScriptURL:goog.identity_,createURL:goog.identity_});}catch(c){goog.logToConsole_(c.message);}return b};
    goog.TRUSTED_TYPES_POLICY_=goog.TRUSTED_TYPES_POLICY_NAME?goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME+"#base"):null;var jspb={BinaryConstants:{},ConstBinaryMessage:function(){},BinaryMessage:function(){}};jspb.BinaryConstants.FieldType={INVALID:-1,DOUBLE:1,FLOAT:2,INT64:3,UINT64:4,INT32:5,FIXED64:6,FIXED32:7,BOOL:8,STRING:9,GROUP:10,MESSAGE:11,BYTES:12,UINT32:13,ENUM:14,SFIXED32:15,SFIXED64:16,SINT32:17,SINT64:18,FHASH64:30,VHASH64:31};jspb.BinaryConstants.WireType={INVALID:-1,VARINT:0,FIXED64:1,DELIMITED:2,START_GROUP:3,END_GROUP:4,FIXED32:5};
    jspb.BinaryConstants.FieldTypeToWireType=function(a){var b=jspb.BinaryConstants.FieldType,c=jspb.BinaryConstants.WireType;switch(a){case b.INT32:case b.INT64:case b.UINT32:case b.UINT64:case b.SINT32:case b.SINT64:case b.BOOL:case b.ENUM:case b.VHASH64:return c.VARINT;case b.DOUBLE:case b.FIXED64:case b.SFIXED64:case b.FHASH64:return c.FIXED64;case b.STRING:case b.MESSAGE:case b.BYTES:return c.DELIMITED;case b.FLOAT:case b.FIXED32:case b.SFIXED32:return c.FIXED32;default:return c.INVALID}};
    jspb.BinaryConstants.INVALID_FIELD_NUMBER=-1;jspb.BinaryConstants.FLOAT32_EPS=1.401298464324817E-45;jspb.BinaryConstants.FLOAT32_MIN=1.1754943508222875E-38;jspb.BinaryConstants.FLOAT32_MAX=3.4028234663852886E38;jspb.BinaryConstants.FLOAT64_EPS=4.9E-324;jspb.BinaryConstants.FLOAT64_MIN=2.2250738585072014E-308;jspb.BinaryConstants.FLOAT64_MAX=1.7976931348623157E308;jspb.BinaryConstants.TWO_TO_20=1048576;jspb.BinaryConstants.TWO_TO_23=8388608;jspb.BinaryConstants.TWO_TO_31=2147483648;
    jspb.BinaryConstants.TWO_TO_32=4294967296;jspb.BinaryConstants.TWO_TO_52=4503599627370496;jspb.BinaryConstants.TWO_TO_63=0x7fffffffffffffff;jspb.BinaryConstants.TWO_TO_64=1.8446744073709552E19;jspb.BinaryConstants.ZERO_HASH="\x00\x00\x00\x00\x00\x00\x00\x00";goog.dom={};goog.dom.NodeType={ELEMENT:1,ATTRIBUTE:2,TEXT:3,CDATA_SECTION:4,ENTITY_REFERENCE:5,ENTITY:6,PROCESSING_INSTRUCTION:7,COMMENT:8,DOCUMENT:9,DOCUMENT_TYPE:10,DOCUMENT_FRAGMENT:11,NOTATION:12};goog.debug={};goog.debug.Error=function(a){if(Error.captureStackTrace)Error.captureStackTrace(this,goog.debug.Error);else {var b=Error().stack;b&&(this.stack=b);}a&&(this.message=String(a));this.reportErrorToServer=!0;};goog.inherits(goog.debug.Error,Error);goog.debug.Error.prototype.name="CustomError";goog.asserts={};goog.asserts.ENABLE_ASSERTS=goog.DEBUG;goog.asserts.AssertionError=function(a,b){goog.debug.Error.call(this,goog.asserts.subs_(a,b));this.messagePattern=a;};goog.inherits(goog.asserts.AssertionError,goog.debug.Error);goog.asserts.AssertionError.prototype.name="AssertionError";goog.asserts.DEFAULT_ERROR_HANDLER=function(a){throw a;};goog.asserts.errorHandler_=goog.asserts.DEFAULT_ERROR_HANDLER;
    goog.asserts.subs_=function(a,b){a=a.split("%s");for(var c="",d=a.length-1,e=0;e<d;e++)c+=a[e]+(e<b.length?b[e]:"%s");return c+a[d]};goog.asserts.doAssertFailure_=function(a,b,c,d){var e="Assertion failed";if(c){e+=": "+c;var f=d;}else a&&(e+=": "+a,f=b);a=new goog.asserts.AssertionError(""+e,f||[]);goog.asserts.errorHandler_(a);};goog.asserts.setErrorHandler=function(a){goog.asserts.ENABLE_ASSERTS&&(goog.asserts.errorHandler_=a);};
    goog.asserts.assert=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!a&&goog.asserts.doAssertFailure_("",null,b,Array.prototype.slice.call(arguments,2));return a};goog.asserts.assertExists=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&null==a&&goog.asserts.doAssertFailure_("Expected to exist: %s.",[a],b,Array.prototype.slice.call(arguments,2));return a};
    goog.asserts.fail=function(a,b){goog.asserts.ENABLE_ASSERTS&&goog.asserts.errorHandler_(new goog.asserts.AssertionError("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1)));};goog.asserts.assertNumber=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!goog.isNumber(a)&&goog.asserts.doAssertFailure_("Expected number but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};
    goog.asserts.assertString=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!goog.isString(a)&&goog.asserts.doAssertFailure_("Expected string but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};goog.asserts.assertFunction=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!goog.isFunction(a)&&goog.asserts.doAssertFailure_("Expected function but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};
    goog.asserts.assertObject=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!goog.isObject(a)&&goog.asserts.doAssertFailure_("Expected object but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};goog.asserts.assertArray=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!goog.isArray(a)&&goog.asserts.doAssertFailure_("Expected array but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};
    goog.asserts.assertBoolean=function(a,b,c){goog.asserts.ENABLE_ASSERTS&&!goog.isBoolean(a)&&goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};goog.asserts.assertElement=function(a,b,c){!goog.asserts.ENABLE_ASSERTS||goog.isObject(a)&&a.nodeType==goog.dom.NodeType.ELEMENT||goog.asserts.doAssertFailure_("Expected Element but got %s: %s.",[goog.typeOf(a),a],b,Array.prototype.slice.call(arguments,2));return a};
    goog.asserts.assertInstanceof=function(a,b,c,d){!goog.asserts.ENABLE_ASSERTS||a instanceof b||goog.asserts.doAssertFailure_("Expected instanceof %s but got %s.",[goog.asserts.getType_(b),goog.asserts.getType_(a)],c,Array.prototype.slice.call(arguments,3));return a};goog.asserts.assertFinite=function(a,b,c){!goog.asserts.ENABLE_ASSERTS||"number"==typeof a&&isFinite(a)||goog.asserts.doAssertFailure_("Expected %s to be a finite number but it is not.",[a],b,Array.prototype.slice.call(arguments,2));return a};
    goog.asserts.assertObjectPrototypeIsIntact=function(){for(var a in Object.prototype)goog.asserts.fail(a+" should not be enumerable in Object.prototype.");};goog.asserts.getType_=function(a){return a instanceof Function?a.displayName||a.name||"unknown type name":a instanceof Object?a.constructor.displayName||a.constructor.name||Object.prototype.toString.call(a):null===a?"null":typeof a};goog.array={};goog.NATIVE_ARRAY_PROTOTYPES=goog.TRUSTED_SITE;goog.array.ASSUME_NATIVE_FUNCTIONS=2012<goog.FEATURESET_YEAR;goog.array.peek=function(a){return a[a.length-1]};goog.array.last=goog.array.peek;
    goog.array.indexOf=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.indexOf)?function(a,b,c){goog.asserts.assert(null!=a.length);return Array.prototype.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;if(goog.isString(a))return goog.isString(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return -1};
    goog.array.lastIndexOf=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.lastIndexOf)?function(a,b,c){goog.asserts.assert(null!=a.length);return Array.prototype.lastIndexOf.call(a,b,null==c?a.length-1:c)}:function(a,b,c){c=null==c?a.length-1:c;0>c&&(c=Math.max(0,a.length+c));if(goog.isString(a))return goog.isString(b)&&1==b.length?a.lastIndexOf(b,c):-1;for(;0<=c;c--)if(c in a&&a[c]===b)return c;return -1};
    goog.array.forEach=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.forEach)?function(a,b,c){goog.asserts.assert(null!=a.length);Array.prototype.forEach.call(a,b,c);}:function(a,b,c){for(var d=a.length,e=goog.isString(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a);};goog.array.forEachRight=function(a,b,c){var d=a.length,e=goog.isString(a)?a.split(""):a;for(--d;0<=d;--d)d in e&&b.call(c,e[d],d,a);};
    goog.array.filter=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.filter)?function(a,b,c){goog.asserts.assert(null!=a.length);return Array.prototype.filter.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=[],f=0,g=goog.isString(a)?a.split(""):a,h=0;h<d;h++)if(h in g){var k=g[h];b.call(c,k,h,a)&&(e[f++]=k);}return e};
    goog.array.map=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.map)?function(a,b,c){goog.asserts.assert(null!=a.length);return Array.prototype.map.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=Array(d),f=goog.isString(a)?a.split(""):a,g=0;g<d;g++)g in f&&(e[g]=b.call(c,f[g],g,a));return e};
    goog.array.reduce=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.reduce)?function(a,b,c,d){goog.asserts.assert(null!=a.length);d&&(b=goog.bind(b,d));return Array.prototype.reduce.call(a,b,c)}:function(a,b,c,d){var e=c;goog.array.forEach(a,function(c,g){e=b.call(d,e,c,g,a);});return e};
    goog.array.reduceRight=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.reduceRight)?function(a,b,c,d){goog.asserts.assert(null!=a.length);goog.asserts.assert(null!=b);d&&(b=goog.bind(b,d));return Array.prototype.reduceRight.call(a,b,c)}:function(a,b,c,d){var e=c;goog.array.forEachRight(a,function(c,g){e=b.call(d,e,c,g,a);});return e};
    goog.array.some=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.some)?function(a,b,c){goog.asserts.assert(null!=a.length);return Array.prototype.some.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=goog.isString(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return !0;return !1};
    goog.array.every=goog.NATIVE_ARRAY_PROTOTYPES&&(goog.array.ASSUME_NATIVE_FUNCTIONS||Array.prototype.every)?function(a,b,c){goog.asserts.assert(null!=a.length);return Array.prototype.every.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=goog.isString(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&!b.call(c,e[f],f,a))return !1;return !0};goog.array.count=function(a,b,c){var d=0;goog.array.forEach(a,function(a,f,g){b.call(c,a,f,g)&&++d;},c);return d};
    goog.array.find=function(a,b,c){b=goog.array.findIndex(a,b,c);return 0>b?null:goog.isString(a)?a.charAt(b):a[b]};goog.array.findIndex=function(a,b,c){for(var d=a.length,e=goog.isString(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return f;return -1};goog.array.findRight=function(a,b,c){b=goog.array.findIndexRight(a,b,c);return 0>b?null:goog.isString(a)?a.charAt(b):a[b]};
    goog.array.findIndexRight=function(a,b,c){var d=a.length,e=goog.isString(a)?a.split(""):a;for(--d;0<=d;d--)if(d in e&&b.call(c,e[d],d,a))return d;return -1};goog.array.contains=function(a,b){return 0<=goog.array.indexOf(a,b)};goog.array.isEmpty=function(a){return 0==a.length};goog.array.clear=function(a){if(!goog.isArray(a))for(var b=a.length-1;0<=b;b--)delete a[b];a.length=0;};goog.array.insert=function(a,b){goog.array.contains(a,b)||a.push(b);};
    goog.array.insertAt=function(a,b,c){goog.array.splice(a,c,0,b);};goog.array.insertArrayAt=function(a,b,c){goog.partial(goog.array.splice,a,c,0).apply(null,b);};goog.array.insertBefore=function(a,b,c){var d;2==arguments.length||0>(d=goog.array.indexOf(a,c))?a.push(b):goog.array.insertAt(a,b,d);};goog.array.remove=function(a,b){b=goog.array.indexOf(a,b);var c;(c=0<=b)&&goog.array.removeAt(a,b);return c};
    goog.array.removeLast=function(a,b){b=goog.array.lastIndexOf(a,b);return 0<=b?(goog.array.removeAt(a,b),!0):!1};goog.array.removeAt=function(a,b){goog.asserts.assert(null!=a.length);return 1==Array.prototype.splice.call(a,b,1).length};goog.array.removeIf=function(a,b,c){b=goog.array.findIndex(a,b,c);return 0<=b?(goog.array.removeAt(a,b),!0):!1};goog.array.removeAllIf=function(a,b,c){var d=0;goog.array.forEachRight(a,function(e,f){b.call(c,e,f,a)&&goog.array.removeAt(a,f)&&d++;});return d};
    goog.array.concat=function(a){return Array.prototype.concat.apply([],arguments)};goog.array.join=function(a){return Array.prototype.concat.apply([],arguments)};goog.array.toArray=function(a){var b=a.length;if(0<b){for(var c=Array(b),d=0;d<b;d++)c[d]=a[d];return c}return []};goog.array.clone=goog.array.toArray;goog.array.extend=function(a,b){for(var c=1;c<arguments.length;c++){var d=arguments[c];if(goog.isArrayLike(d)){var e=a.length||0,f=d.length||0;a.length=e+f;for(var g=0;g<f;g++)a[e+g]=d[g];}else a.push(d);}};
    goog.array.splice=function(a,b,c,d){goog.asserts.assert(null!=a.length);return Array.prototype.splice.apply(a,goog.array.slice(arguments,1))};goog.array.slice=function(a,b,c){goog.asserts.assert(null!=a.length);return 2>=arguments.length?Array.prototype.slice.call(a,b):Array.prototype.slice.call(a,b,c)};
    goog.array.removeDuplicates=function(a,b,c){b=b||a;var d=function(a){return goog.isObject(a)?"o"+goog.getUid(a):(typeof a).charAt(0)+a};c=c||d;d={};for(var e=0,f=0;f<a.length;){var g=a[f++],h=c(g);Object.prototype.hasOwnProperty.call(d,h)||(d[h]=!0,b[e++]=g);}b.length=e;};goog.array.binarySearch=function(a,b,c){return goog.array.binarySearch_(a,c||goog.array.defaultCompare,!1,b)};goog.array.binarySelect=function(a,b,c){return goog.array.binarySearch_(a,b,!0,void 0,c)};
    goog.array.binarySearch_=function(a,b,c,d,e){for(var f=0,g=a.length,h;f<g;){var k=f+g>>1;var l=c?b.call(e,a[k],k,a):b(d,a[k]);0<l?f=k+1:(g=k,h=!l);}return h?f:~f};goog.array.sort=function(a,b){a.sort(b||goog.array.defaultCompare);};goog.array.stableSort=function(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]={index:d,value:a[d]};var e=b||goog.array.defaultCompare;goog.array.sort(c,function(a,b){return e(a.value,b.value)||a.index-b.index});for(d=0;d<a.length;d++)a[d]=c[d].value;};
    goog.array.sortByKey=function(a,b,c){var d=c||goog.array.defaultCompare;goog.array.sort(a,function(a,c){return d(b(a),b(c))});};goog.array.sortObjectsByKey=function(a,b,c){goog.array.sortByKey(a,function(a){return a[b]},c);};goog.array.isSorted=function(a,b,c){b=b||goog.array.defaultCompare;for(var d=1;d<a.length;d++){var e=b(a[d-1],a[d]);if(0<e||0==e&&c)return !1}return !0};
    goog.array.equals=function(a,b,c){if(!goog.isArrayLike(a)||!goog.isArrayLike(b)||a.length!=b.length)return !1;var d=a.length;c=c||goog.array.defaultCompareEquality;for(var e=0;e<d;e++)if(!c(a[e],b[e]))return !1;return !0};goog.array.compare3=function(a,b,c){c=c||goog.array.defaultCompare;for(var d=Math.min(a.length,b.length),e=0;e<d;e++){var f=c(a[e],b[e]);if(0!=f)return f}return goog.array.defaultCompare(a.length,b.length)};goog.array.defaultCompare=function(a,b){return a>b?1:a<b?-1:0};
    goog.array.inverseDefaultCompare=function(a,b){return -goog.array.defaultCompare(a,b)};goog.array.defaultCompareEquality=function(a,b){return a===b};goog.array.binaryInsert=function(a,b,c){c=goog.array.binarySearch(a,b,c);return 0>c?(goog.array.insertAt(a,b,-(c+1)),!0):!1};goog.array.binaryRemove=function(a,b,c){b=goog.array.binarySearch(a,b,c);return 0<=b?goog.array.removeAt(a,b):!1};
    goog.array.bucket=function(a,b,c){for(var d={},e=0;e<a.length;e++){var f=a[e],g=b.call(c,f,e,a);goog.isDef(g)&&(d[g]||(d[g]=[])).push(f);}return d};goog.array.toObject=function(a,b,c){var d={};goog.array.forEach(a,function(e,f){d[b.call(c,e,f,a)]=e;});return d};goog.array.range=function(a,b,c){var d=[],e=0,f=a;c=c||1;void 0!==b&&(e=a,f=b);if(0>c*(f-e))return [];if(0<c)for(a=e;a<f;a+=c)d.push(a);else for(a=e;a>f;a+=c)d.push(a);return d};
    goog.array.repeat=function(a,b){for(var c=[],d=0;d<b;d++)c[d]=a;return c};goog.array.flatten=function(a){for(var b=[],c=0;c<arguments.length;c++){var d=arguments[c];if(goog.isArray(d))for(var e=0;e<d.length;e+=8192){var f=goog.array.slice(d,e,e+8192);f=goog.array.flatten.apply(null,f);for(var g=0;g<f.length;g++)b.push(f[g]);}else b.push(d);}return b};
    goog.array.rotate=function(a,b){goog.asserts.assert(null!=a.length);a.length&&(b%=a.length,0<b?Array.prototype.unshift.apply(a,a.splice(-b,b)):0>b&&Array.prototype.push.apply(a,a.splice(0,-b)));return a};goog.array.moveItem=function(a,b,c){goog.asserts.assert(0<=b&&b<a.length);goog.asserts.assert(0<=c&&c<a.length);b=Array.prototype.splice.call(a,b,1);Array.prototype.splice.call(a,c,0,b[0]);};
    goog.array.zip=function(a){if(!arguments.length)return [];for(var b=[],c=arguments[0].length,d=1;d<arguments.length;d++)arguments[d].length<c&&(c=arguments[d].length);for(d=0;d<c;d++){for(var e=[],f=0;f<arguments.length;f++)e.push(arguments[f][d]);b.push(e);}return b};goog.array.shuffle=function(a,b){b=b||Math.random;for(var c=a.length-1;0<c;c--){var d=Math.floor(b()*(c+1)),e=a[c];a[c]=a[d];a[d]=e;}};goog.array.copyByIndex=function(a,b){var c=[];goog.array.forEach(b,function(b){c.push(a[b]);});return c};
    goog.array.concatMap=function(a,b,c){return goog.array.concat.apply([],goog.array.map(a,b,c))};goog.crypt={};goog.crypt.stringToByteArray=function(a){for(var b=[],c=0,d=0;d<a.length;d++){var e=a.charCodeAt(d);255<e&&(b[c++]=e&255,e>>=8);b[c++]=e;}return b};goog.crypt.byteArrayToString=function(a){if(8192>=a.length)return String.fromCharCode.apply(null,a);for(var b="",c=0;c<a.length;c+=8192){var d=goog.array.slice(a,c,c+8192);b+=String.fromCharCode.apply(null,d);}return b};
    goog.crypt.byteArrayToHex=function(a,b){return goog.array.map(a,function(a){a=a.toString(16);return 1<a.length?a:"0"+a}).join(b||"")};goog.crypt.hexToByteArray=function(a){goog.asserts.assert(0==a.length%2,"Key string length must be multiple of 2");for(var b=[],c=0;c<a.length;c+=2)b.push(parseInt(a.substring(c,c+2),16));return b};
    goog.crypt.stringToUtf8ByteArray=function(a){for(var b=[],c=0,d=0;d<a.length;d++){var e=a.charCodeAt(d);128>e?b[c++]=e:(2048>e?b[c++]=e>>6|192:(55296==(e&64512)&&d+1<a.length&&56320==(a.charCodeAt(d+1)&64512)?(e=65536+((e&1023)<<10)+(a.charCodeAt(++d)&1023),b[c++]=e>>18|240,b[c++]=e>>12&63|128):b[c++]=e>>12|224,b[c++]=e>>6&63|128),b[c++]=e&63|128);}return b};
    goog.crypt.utf8ByteArrayToString=function(a){for(var b=[],c=0,d=0;c<a.length;){var e=a[c++];if(128>e)b[d++]=String.fromCharCode(e);else if(191<e&&224>e){var f=a[c++];b[d++]=String.fromCharCode((e&31)<<6|f&63);}else if(239<e&&365>e){f=a[c++];var g=a[c++],h=a[c++];e=((e&7)<<18|(f&63)<<12|(g&63)<<6|h&63)-65536;b[d++]=String.fromCharCode(55296+(e>>10));b[d++]=String.fromCharCode(56320+(e&1023));}else f=a[c++],g=a[c++],b[d++]=String.fromCharCode((e&15)<<12|(f&63)<<6|g&63);}return b.join("")};
    goog.crypt.xorByteArray=function(a,b){goog.asserts.assert(a.length==b.length,"XOR array lengths must match");for(var c=[],d=0;d<a.length;d++)c.push(a[d]^b[d]);return c};goog.string={};goog.string.internal={};goog.string.internal.startsWith=function(a,b){return 0==a.lastIndexOf(b,0)};goog.string.internal.endsWith=function(a,b){var c=a.length-b.length;return 0<=c&&a.indexOf(b,c)==c};goog.string.internal.caseInsensitiveStartsWith=function(a,b){return 0==goog.string.internal.caseInsensitiveCompare(b,a.substr(0,b.length))};goog.string.internal.caseInsensitiveEndsWith=function(a,b){return 0==goog.string.internal.caseInsensitiveCompare(b,a.substr(a.length-b.length,b.length))};
    goog.string.internal.caseInsensitiveEquals=function(a,b){return a.toLowerCase()==b.toLowerCase()};goog.string.internal.isEmptyOrWhitespace=function(a){return /^[\s\xa0]*$/.test(a)};goog.string.internal.trim=goog.TRUSTED_SITE&&String.prototype.trim?function(a){return a.trim()}:function(a){return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(a)[1]};goog.string.internal.caseInsensitiveCompare=function(a,b){a=String(a).toLowerCase();b=String(b).toLowerCase();return a<b?-1:a==b?0:1};
    goog.string.internal.newLineToBr=function(a,b){return a.replace(/(\r\n|\r|\n)/g,b?"<br />":"<br>")};
    goog.string.internal.htmlEscape=function(a,b){if(b)a=a.replace(goog.string.internal.AMP_RE_,"&amp;").replace(goog.string.internal.LT_RE_,"&lt;").replace(goog.string.internal.GT_RE_,"&gt;").replace(goog.string.internal.QUOT_RE_,"&quot;").replace(goog.string.internal.SINGLE_QUOTE_RE_,"&#39;").replace(goog.string.internal.NULL_RE_,"&#0;");else {if(!goog.string.internal.ALL_RE_.test(a))return a;-1!=a.indexOf("&")&&(a=a.replace(goog.string.internal.AMP_RE_,"&amp;"));-1!=a.indexOf("<")&&(a=a.replace(goog.string.internal.LT_RE_,
    "&lt;"));-1!=a.indexOf(">")&&(a=a.replace(goog.string.internal.GT_RE_,"&gt;"));-1!=a.indexOf('"')&&(a=a.replace(goog.string.internal.QUOT_RE_,"&quot;"));-1!=a.indexOf("'")&&(a=a.replace(goog.string.internal.SINGLE_QUOTE_RE_,"&#39;"));-1!=a.indexOf("\x00")&&(a=a.replace(goog.string.internal.NULL_RE_,"&#0;"));}return a};goog.string.internal.AMP_RE_=/&/g;goog.string.internal.LT_RE_=/</g;goog.string.internal.GT_RE_=/>/g;goog.string.internal.QUOT_RE_=/"/g;goog.string.internal.SINGLE_QUOTE_RE_=/'/g;
    goog.string.internal.NULL_RE_=/\x00/g;goog.string.internal.ALL_RE_=/[\x00&<>"']/;goog.string.internal.whitespaceEscape=function(a,b){return goog.string.internal.newLineToBr(a.replace(/  /g," &#160;"),b)};goog.string.internal.contains=function(a,b){return -1!=a.indexOf(b)};goog.string.internal.caseInsensitiveContains=function(a,b){return goog.string.internal.contains(a.toLowerCase(),b.toLowerCase())};
    goog.string.internal.compareVersions=function(a,b){var c=0;a=goog.string.internal.trim(String(a)).split(".");b=goog.string.internal.trim(String(b)).split(".");for(var d=Math.max(a.length,b.length),e=0;0==c&&e<d;e++){var f=a[e]||"",g=b[e]||"";do{f=/(\d*)(\D*)(.*)/.exec(f)||["","","",""];g=/(\d*)(\D*)(.*)/.exec(g)||["","","",""];if(0==f[0].length&&0==g[0].length)break;c=0==f[1].length?0:parseInt(f[1],10);var h=0==g[1].length?0:parseInt(g[1],10);c=goog.string.internal.compareElements_(c,h)||goog.string.internal.compareElements_(0==
    f[2].length,0==g[2].length)||goog.string.internal.compareElements_(f[2],g[2]);f=f[3];g=g[3];}while(0==c)}return c};goog.string.internal.compareElements_=function(a,b){return a<b?-1:a>b?1:0};goog.string.TypedString=function(){};goog.string.Const=function(a,b){this.stringConstValueWithSecurityContract__googStringSecurityPrivate_=a===goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_&&b||"";this.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_=goog.string.Const.TYPE_MARKER_;};goog.string.Const.prototype.implementsGoogStringTypedString=!0;goog.string.Const.prototype.getTypedStringValue=function(){return this.stringConstValueWithSecurityContract__googStringSecurityPrivate_};
    goog.string.Const.prototype.toString=function(){return "Const{"+this.stringConstValueWithSecurityContract__googStringSecurityPrivate_+"}"};goog.string.Const.unwrap=function(a){if(a instanceof goog.string.Const&&a.constructor===goog.string.Const&&a.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_===goog.string.Const.TYPE_MARKER_)return a.stringConstValueWithSecurityContract__googStringSecurityPrivate_;goog.asserts.fail("expected object of type Const, got '"+a+"'");return "type_error:Const"};
    goog.string.Const.from=function(a){return new goog.string.Const(goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_,a)};goog.string.Const.TYPE_MARKER_={};goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_={};goog.string.Const.EMPTY=goog.string.Const.from("");goog.fs={};goog.fs.url={};goog.fs.url.createObjectUrl=function(a){return goog.fs.url.getUrlObject_().createObjectURL(a)};goog.fs.url.revokeObjectUrl=function(a){goog.fs.url.getUrlObject_().revokeObjectURL(a);};goog.fs.url.getUrlObject_=function(){var a=goog.fs.url.findUrlObject_();if(null!=a)return a;throw Error("This browser doesn't seem to support blob URLs");};
    goog.fs.url.findUrlObject_=function(){return goog.isDef(goog.global.URL)&&goog.isDef(goog.global.URL.createObjectURL)?goog.global.URL:goog.isDef(goog.global.webkitURL)&&goog.isDef(goog.global.webkitURL.createObjectURL)?goog.global.webkitURL:goog.isDef(goog.global.createObjectURL)?goog.global:null};goog.fs.url.browserSupportsObjectUrls=function(){return null!=goog.fs.url.findUrlObject_()};goog.html={};goog.html.trustedtypes={};goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY=goog.TRUSTED_TYPES_POLICY_NAME?goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME+"#html"):null;goog.i18n={};goog.i18n.bidi={};goog.i18n.bidi.FORCE_RTL=!1;
    goog.i18n.bidi.IS_RTL=goog.i18n.bidi.FORCE_RTL||("ar"==goog.LOCALE.substring(0,2).toLowerCase()||"fa"==goog.LOCALE.substring(0,2).toLowerCase()||"he"==goog.LOCALE.substring(0,2).toLowerCase()||"iw"==goog.LOCALE.substring(0,2).toLowerCase()||"ps"==goog.LOCALE.substring(0,2).toLowerCase()||"sd"==goog.LOCALE.substring(0,2).toLowerCase()||"ug"==goog.LOCALE.substring(0,2).toLowerCase()||"ur"==goog.LOCALE.substring(0,2).toLowerCase()||"yi"==goog.LOCALE.substring(0,2).toLowerCase())&&(2==goog.LOCALE.length||
    "-"==goog.LOCALE.substring(2,3)||"_"==goog.LOCALE.substring(2,3))||3<=goog.LOCALE.length&&"ckb"==goog.LOCALE.substring(0,3).toLowerCase()&&(3==goog.LOCALE.length||"-"==goog.LOCALE.substring(3,4)||"_"==goog.LOCALE.substring(3,4))||7<=goog.LOCALE.length&&("-"==goog.LOCALE.substring(2,3)||"_"==goog.LOCALE.substring(2,3))&&("adlm"==goog.LOCALE.substring(3,7).toLowerCase()||"arab"==goog.LOCALE.substring(3,7).toLowerCase()||"hebr"==goog.LOCALE.substring(3,7).toLowerCase()||"nkoo"==goog.LOCALE.substring(3,
    7).toLowerCase()||"rohg"==goog.LOCALE.substring(3,7).toLowerCase()||"thaa"==goog.LOCALE.substring(3,7).toLowerCase())||8<=goog.LOCALE.length&&("-"==goog.LOCALE.substring(3,4)||"_"==goog.LOCALE.substring(3,4))&&("adlm"==goog.LOCALE.substring(4,8).toLowerCase()||"arab"==goog.LOCALE.substring(4,8).toLowerCase()||"hebr"==goog.LOCALE.substring(4,8).toLowerCase()||"nkoo"==goog.LOCALE.substring(4,8).toLowerCase()||"rohg"==goog.LOCALE.substring(4,8).toLowerCase()||"thaa"==goog.LOCALE.substring(4,8).toLowerCase());
    goog.i18n.bidi.Format={LRE:"\u202a",RLE:"\u202b",PDF:"\u202c",LRM:"\u200e",RLM:"\u200f"};goog.i18n.bidi.Dir={LTR:1,RTL:-1,NEUTRAL:0};goog.i18n.bidi.RIGHT="right";goog.i18n.bidi.LEFT="left";goog.i18n.bidi.I18N_RIGHT=goog.i18n.bidi.IS_RTL?goog.i18n.bidi.LEFT:goog.i18n.bidi.RIGHT;goog.i18n.bidi.I18N_LEFT=goog.i18n.bidi.IS_RTL?goog.i18n.bidi.RIGHT:goog.i18n.bidi.LEFT;
    goog.i18n.bidi.toDir=function(a,b){return "number"==typeof a?0<a?goog.i18n.bidi.Dir.LTR:0>a?goog.i18n.bidi.Dir.RTL:b?null:goog.i18n.bidi.Dir.NEUTRAL:null==a?null:a?goog.i18n.bidi.Dir.RTL:goog.i18n.bidi.Dir.LTR};goog.i18n.bidi.ltrChars_="A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u0300-\u0590\u0900-\u1fff\u200e\u2c00-\ud801\ud804-\ud839\ud83c-\udbff\uf900-\ufb1c\ufe00-\ufe6f\ufefd-\uffff";goog.i18n.bidi.rtlChars_="\u0591-\u06ef\u06fa-\u08ff\u200f\ud802-\ud803\ud83a-\ud83b\ufb1d-\ufdff\ufe70-\ufefc";
    goog.i18n.bidi.htmlSkipReg_=/<[^>]*>|&[^;]+;/g;goog.i18n.bidi.stripHtmlIfNeeded_=function(a,b){return b?a.replace(goog.i18n.bidi.htmlSkipReg_,""):a};goog.i18n.bidi.rtlCharReg_=new RegExp("["+goog.i18n.bidi.rtlChars_+"]");goog.i18n.bidi.ltrCharReg_=new RegExp("["+goog.i18n.bidi.ltrChars_+"]");goog.i18n.bidi.hasAnyRtl=function(a,b){return goog.i18n.bidi.rtlCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(a,b))};goog.i18n.bidi.hasRtlChar=goog.i18n.bidi.hasAnyRtl;
    goog.i18n.bidi.hasAnyLtr=function(a,b){return goog.i18n.bidi.ltrCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(a,b))};goog.i18n.bidi.ltrRe_=new RegExp("^["+goog.i18n.bidi.ltrChars_+"]");goog.i18n.bidi.rtlRe_=new RegExp("^["+goog.i18n.bidi.rtlChars_+"]");goog.i18n.bidi.isRtlChar=function(a){return goog.i18n.bidi.rtlRe_.test(a)};goog.i18n.bidi.isLtrChar=function(a){return goog.i18n.bidi.ltrRe_.test(a)};goog.i18n.bidi.isNeutralChar=function(a){return !goog.i18n.bidi.isLtrChar(a)&&!goog.i18n.bidi.isRtlChar(a)};
    goog.i18n.bidi.ltrDirCheckRe_=new RegExp("^[^"+goog.i18n.bidi.rtlChars_+"]*["+goog.i18n.bidi.ltrChars_+"]");goog.i18n.bidi.rtlDirCheckRe_=new RegExp("^[^"+goog.i18n.bidi.ltrChars_+"]*["+goog.i18n.bidi.rtlChars_+"]");goog.i18n.bidi.startsWithRtl=function(a,b){return goog.i18n.bidi.rtlDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(a,b))};goog.i18n.bidi.isRtlText=goog.i18n.bidi.startsWithRtl;
    goog.i18n.bidi.startsWithLtr=function(a,b){return goog.i18n.bidi.ltrDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(a,b))};goog.i18n.bidi.isLtrText=goog.i18n.bidi.startsWithLtr;goog.i18n.bidi.isRequiredLtrRe_=/^http:\/\/.*/;goog.i18n.bidi.isNeutralText=function(a,b){a=goog.i18n.bidi.stripHtmlIfNeeded_(a,b);return goog.i18n.bidi.isRequiredLtrRe_.test(a)||!goog.i18n.bidi.hasAnyLtr(a)&&!goog.i18n.bidi.hasAnyRtl(a)};
    goog.i18n.bidi.ltrExitDirCheckRe_=new RegExp("["+goog.i18n.bidi.ltrChars_+"][^"+goog.i18n.bidi.rtlChars_+"]*$");goog.i18n.bidi.rtlExitDirCheckRe_=new RegExp("["+goog.i18n.bidi.rtlChars_+"][^"+goog.i18n.bidi.ltrChars_+"]*$");goog.i18n.bidi.endsWithLtr=function(a,b){return goog.i18n.bidi.ltrExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(a,b))};goog.i18n.bidi.isLtrExitText=goog.i18n.bidi.endsWithLtr;
    goog.i18n.bidi.endsWithRtl=function(a,b){return goog.i18n.bidi.rtlExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(a,b))};goog.i18n.bidi.isRtlExitText=goog.i18n.bidi.endsWithRtl;goog.i18n.bidi.rtlLocalesRe_=/^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;goog.i18n.bidi.isRtlLanguage=function(a){return goog.i18n.bidi.rtlLocalesRe_.test(a)};goog.i18n.bidi.bracketGuardTextRe_=/(\(.*?\)+)|(\[.*?\]+)|(\{.*?\}+)|(<.*?>+)/g;
    goog.i18n.bidi.guardBracketInText=function(a,b){b=(void 0===b?goog.i18n.bidi.hasAnyRtl(a):b)?goog.i18n.bidi.Format.RLM:goog.i18n.bidi.Format.LRM;return a.replace(goog.i18n.bidi.bracketGuardTextRe_,b+"$&"+b)};goog.i18n.bidi.enforceRtlInHtml=function(a){return "<"==a.charAt(0)?a.replace(/<\w+/,"$& dir=rtl"):"\n<span dir=rtl>"+a+"</span>"};goog.i18n.bidi.enforceRtlInText=function(a){return goog.i18n.bidi.Format.RLE+a+goog.i18n.bidi.Format.PDF};
    goog.i18n.bidi.enforceLtrInHtml=function(a){return "<"==a.charAt(0)?a.replace(/<\w+/,"$& dir=ltr"):"\n<span dir=ltr>"+a+"</span>"};goog.i18n.bidi.enforceLtrInText=function(a){return goog.i18n.bidi.Format.LRE+a+goog.i18n.bidi.Format.PDF};goog.i18n.bidi.dimensionsRe_=/:\s*([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)/g;goog.i18n.bidi.leftRe_=/left/gi;goog.i18n.bidi.rightRe_=/right/gi;goog.i18n.bidi.tempRe_=/%%%%/g;
    goog.i18n.bidi.mirrorCSS=function(a){return a.replace(goog.i18n.bidi.dimensionsRe_,":$1 $4 $3 $2").replace(goog.i18n.bidi.leftRe_,"%%%%").replace(goog.i18n.bidi.rightRe_,goog.i18n.bidi.LEFT).replace(goog.i18n.bidi.tempRe_,goog.i18n.bidi.RIGHT)};goog.i18n.bidi.doubleQuoteSubstituteRe_=/([\u0591-\u05f2])"/g;goog.i18n.bidi.singleQuoteSubstituteRe_=/([\u0591-\u05f2])'/g;
    goog.i18n.bidi.normalizeHebrewQuote=function(a){return a.replace(goog.i18n.bidi.doubleQuoteSubstituteRe_,"$1\u05f4").replace(goog.i18n.bidi.singleQuoteSubstituteRe_,"$1\u05f3")};goog.i18n.bidi.wordSeparatorRe_=/\s+/;goog.i18n.bidi.hasNumeralsRe_=/[\d\u06f0-\u06f9]/;goog.i18n.bidi.rtlDetectionThreshold_=.4;
    goog.i18n.bidi.estimateDirection=function(a,b){var c=0,d=0,e=!1;a=goog.i18n.bidi.stripHtmlIfNeeded_(a,b).split(goog.i18n.bidi.wordSeparatorRe_);for(b=0;b<a.length;b++){var f=a[b];goog.i18n.bidi.startsWithRtl(f)?(c++,d++):goog.i18n.bidi.isRequiredLtrRe_.test(f)?e=!0:goog.i18n.bidi.hasAnyLtr(f)?d++:goog.i18n.bidi.hasNumeralsRe_.test(f)&&(e=!0);}return 0==d?e?goog.i18n.bidi.Dir.LTR:goog.i18n.bidi.Dir.NEUTRAL:c/d>goog.i18n.bidi.rtlDetectionThreshold_?goog.i18n.bidi.Dir.RTL:goog.i18n.bidi.Dir.LTR};
    goog.i18n.bidi.detectRtlDirectionality=function(a,b){return goog.i18n.bidi.estimateDirection(a,b)==goog.i18n.bidi.Dir.RTL};goog.i18n.bidi.setElementDirAndAlign=function(a,b){a&&(b=goog.i18n.bidi.toDir(b))&&(a.style.textAlign=b==goog.i18n.bidi.Dir.RTL?goog.i18n.bidi.RIGHT:goog.i18n.bidi.LEFT,a.dir=b==goog.i18n.bidi.Dir.RTL?"rtl":"ltr");};
    goog.i18n.bidi.setElementDirByTextDirectionality=function(a,b){switch(goog.i18n.bidi.estimateDirection(b)){case goog.i18n.bidi.Dir.LTR:a.dir="ltr";break;case goog.i18n.bidi.Dir.RTL:a.dir="rtl";break;default:a.removeAttribute("dir");}};goog.i18n.bidi.DirectionalString=function(){};goog.html.TrustedResourceUrl=function(){this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_="";this.trustedURL_=null;this.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_=goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;};goog.html.TrustedResourceUrl.prototype.implementsGoogStringTypedString=!0;goog.html.TrustedResourceUrl.prototype.getTypedStringValue=function(){return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_.toString()};
    goog.html.TrustedResourceUrl.prototype.implementsGoogI18nBidiDirectionalString=!0;goog.html.TrustedResourceUrl.prototype.getDirection=function(){return goog.i18n.bidi.Dir.LTR};
    goog.html.TrustedResourceUrl.prototype.cloneWithParams=function(a,b){var c=goog.html.TrustedResourceUrl.unwrap(this);c=goog.html.TrustedResourceUrl.URL_PARAM_PARSER_.exec(c);var d=c[3]||"";return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(c[1]+goog.html.TrustedResourceUrl.stringifyParams_("?",c[2]||"",a)+goog.html.TrustedResourceUrl.stringifyParams_("#",d,b))};
    goog.DEBUG&&(goog.html.TrustedResourceUrl.prototype.toString=function(){return "TrustedResourceUrl{"+this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_+"}"});goog.html.TrustedResourceUrl.unwrap=function(a){return goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(a).toString()};
    goog.html.TrustedResourceUrl.unwrapTrustedScriptURL=function(a){if(a instanceof goog.html.TrustedResourceUrl&&a.constructor===goog.html.TrustedResourceUrl&&a.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_===goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_)return a.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_;goog.asserts.fail("expected object of type TrustedResourceUrl, got '"+a+"' of type "+goog.typeOf(a));return "type_error:TrustedResourceUrl"};
    goog.html.TrustedResourceUrl.unwrapTrustedURL=function(a){return a.trustedURL_?a.trustedURL_:goog.html.TrustedResourceUrl.unwrap(a)};
    goog.html.TrustedResourceUrl.format=function(a,b){var c=goog.string.Const.unwrap(a);if(!goog.html.TrustedResourceUrl.BASE_URL_.test(c))throw Error("Invalid TrustedResourceUrl format: "+c);a=c.replace(goog.html.TrustedResourceUrl.FORMAT_MARKER_,function(a,e){if(!Object.prototype.hasOwnProperty.call(b,e))throw Error('Found marker, "'+e+'", in format string, "'+c+'", but no valid label mapping found in args: '+JSON.stringify(b));a=b[e];return a instanceof goog.string.Const?goog.string.Const.unwrap(a):
    encodeURIComponent(String(a))});return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(a)};goog.html.TrustedResourceUrl.FORMAT_MARKER_=/%{(\w+)}/g;goog.html.TrustedResourceUrl.BASE_URL_=/^((https:)?\/\/[0-9a-z.:[\]-]+\/|\/[^/\\]|[^:/\\%]+\/|[^:/\\%]*[?#]|about:blank#)/i;goog.html.TrustedResourceUrl.URL_PARAM_PARSER_=/^([^?#]*)(\?[^#]*)?(#[\s\S]*)?/;
    goog.html.TrustedResourceUrl.formatWithParams=function(a,b,c,d){return goog.html.TrustedResourceUrl.format(a,b).cloneWithParams(c,d)};goog.html.TrustedResourceUrl.fromConstant=function(a){return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(a))};goog.html.TrustedResourceUrl.fromConstants=function(a){for(var b="",c=0;c<a.length;c++)b+=goog.string.Const.unwrap(a[c]);return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(b)};
    goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_={};
    goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse=function(a){var b=new goog.html.TrustedResourceUrl;b.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_=goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY?goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createScriptURL(a):a;goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY&&(b.trustedURL_=goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createURL(a));return b};
    goog.html.TrustedResourceUrl.stringifyParams_=function(a,b,c){if(null==c)return b;if(goog.isString(c))return c?a+encodeURIComponent(c):"";for(var d in c){var e=c[d];e=goog.isArray(e)?e:[e];for(var f=0;f<e.length;f++){var g=e[f];null!=g&&(b||(b=a),b+=(b.length>a.length?"&":"")+encodeURIComponent(d)+"="+encodeURIComponent(String(g)));}}return b};goog.html.SafeUrl=function(){this.privateDoNotAccessOrElseSafeUrlWrappedValue_="";this.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_=goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;};goog.html.SafeUrl.INNOCUOUS_STRING="about:invalid#zClosurez";goog.html.SafeUrl.prototype.implementsGoogStringTypedString=!0;goog.html.SafeUrl.prototype.getTypedStringValue=function(){return this.privateDoNotAccessOrElseSafeUrlWrappedValue_.toString()};
    goog.html.SafeUrl.prototype.implementsGoogI18nBidiDirectionalString=!0;goog.html.SafeUrl.prototype.getDirection=function(){return goog.i18n.bidi.Dir.LTR};goog.DEBUG&&(goog.html.SafeUrl.prototype.toString=function(){return "SafeUrl{"+this.privateDoNotAccessOrElseSafeUrlWrappedValue_+"}"});goog.html.SafeUrl.unwrap=function(a){return goog.html.SafeUrl.unwrapTrustedURL(a).toString()};
    goog.html.SafeUrl.unwrapTrustedURL=function(a){if(a instanceof goog.html.SafeUrl&&a.constructor===goog.html.SafeUrl&&a.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_===goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_)return a.privateDoNotAccessOrElseSafeUrlWrappedValue_;goog.asserts.fail("expected object of type SafeUrl, got '"+a+"' of type "+goog.typeOf(a));return "type_error:SafeUrl"};goog.html.SafeUrl.fromConstant=function(a){return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(a))};
    goog.html.SAFE_MIME_TYPE_PATTERN_=/^(?:audio\/(?:3gpp2|3gpp|aac|L16|midi|mp3|mp4|mpeg|oga|ogg|opus|x-m4a|x-wav|wav|webm)|image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp|x-icon)|text\/csv|video\/(?:mpeg|mp4|ogg|webm|quicktime))(?:;\w+=(?:\w+|"[\w;=]+"))*$/i;goog.html.SafeUrl.isSafeMimeType=function(a){return goog.html.SAFE_MIME_TYPE_PATTERN_.test(a)};goog.html.SafeUrl.fromBlob=function(a){a=goog.html.SAFE_MIME_TYPE_PATTERN_.test(a.type)?goog.fs.url.createObjectUrl(a):goog.html.SafeUrl.INNOCUOUS_STRING;return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.DATA_URL_PATTERN_=/^data:([^,]*);base64,[a-z0-9+\/]+=*$/i;goog.html.SafeUrl.fromDataUrl=function(a){a=a.replace(/(%0A|%0D)/g,"");var b=a.match(goog.html.DATA_URL_PATTERN_);b=b&&goog.html.SAFE_MIME_TYPE_PATTERN_.test(b[1]);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(b?a:goog.html.SafeUrl.INNOCUOUS_STRING)};goog.html.SafeUrl.fromTelUrl=function(a){goog.string.internal.caseInsensitiveStartsWith(a,"tel:")||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SIP_URL_PATTERN_=/^sip[s]?:[+a-z0-9_.!$%&'*\/=^`{|}~-]+@([a-z0-9-]+\.)+[a-z0-9]{2,63}$/i;goog.html.SafeUrl.fromSipUrl=function(a){goog.html.SIP_URL_PATTERN_.test(decodeURIComponent(a))||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};goog.html.SafeUrl.fromFacebookMessengerUrl=function(a){goog.string.internal.caseInsensitiveStartsWith(a,"fb-messenger://share")||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeUrl.fromWhatsAppUrl=function(a){goog.string.internal.caseInsensitiveStartsWith(a,"whatsapp://send")||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};goog.html.SafeUrl.fromSmsUrl=function(a){goog.string.internal.caseInsensitiveStartsWith(a,"sms:")&&goog.html.SafeUrl.isSmsUrlBodyValid_(a)||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeUrl.isSmsUrlBodyValid_=function(a){var b=a.indexOf("#");0<b&&(a=a.substring(0,b));b=a.match(/[?&]body=/gi);if(!b)return !0;if(1<b.length)return !1;a=a.match(/[?&]body=([^&]*)/)[1];if(!a)return !0;try{decodeURIComponent(a);}catch(c){return !1}return /^(?:[a-z0-9\-_.~]|%[0-9a-f]{2})+$/i.test(a)};goog.html.SafeUrl.fromSshUrl=function(a){goog.string.internal.caseInsensitiveStartsWith(a,"ssh://")||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeUrl.sanitizeChromeExtensionUrl=function(a,b){return goog.html.SafeUrl.sanitizeExtensionUrl_(/^chrome-extension:\/\/([^\/]+)\//,a,b)};goog.html.SafeUrl.sanitizeFirefoxExtensionUrl=function(a,b){return goog.html.SafeUrl.sanitizeExtensionUrl_(/^moz-extension:\/\/([^\/]+)\//,a,b)};goog.html.SafeUrl.sanitizeEdgeExtensionUrl=function(a,b){return goog.html.SafeUrl.sanitizeExtensionUrl_(/^ms-browser-extension:\/\/([^\/]+)\//,a,b)};
    goog.html.SafeUrl.sanitizeExtensionUrl_=function(a,b,c){(a=a.exec(b))?(a=a[1],-1==(c instanceof goog.string.Const?[goog.string.Const.unwrap(c)]:c.map(function(a){return goog.string.Const.unwrap(a)})).indexOf(a)&&(b=goog.html.SafeUrl.INNOCUOUS_STRING)):b=goog.html.SafeUrl.INNOCUOUS_STRING;return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(b)};goog.html.SafeUrl.fromTrustedResourceUrl=function(a){return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.html.TrustedResourceUrl.unwrap(a))};
    goog.html.SAFE_URL_PATTERN_=/^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;goog.html.SafeUrl.SAFE_URL_PATTERN=goog.html.SAFE_URL_PATTERN_;goog.html.SafeUrl.sanitize=function(a){if(a instanceof goog.html.SafeUrl)return a;a="object"==typeof a&&a.implementsGoogStringTypedString?a.getTypedStringValue():String(a);goog.html.SAFE_URL_PATTERN_.test(a)||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeUrl.sanitizeAssertUnchanged=function(a,b){if(a instanceof goog.html.SafeUrl)return a;a="object"==typeof a&&a.implementsGoogStringTypedString?a.getTypedStringValue():String(a);if(b&&/^data:/i.test(a)&&(b=goog.html.SafeUrl.fromDataUrl(a),b.getTypedStringValue()==a))return b;goog.asserts.assert(goog.html.SAFE_URL_PATTERN_.test(a),"%s does not match the safe URL pattern",a)||(a=goog.html.SafeUrl.INNOCUOUS_STRING);return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_={};goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse=function(a){var b=new goog.html.SafeUrl;b.privateDoNotAccessOrElseSafeUrlWrappedValue_=goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY?goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createURL(a):a;return b};goog.html.SafeUrl.ABOUT_BLANK=goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse("about:blank");goog.html.SafeStyle=function(){this.privateDoNotAccessOrElseSafeStyleWrappedValue_="";this.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_=goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;};goog.html.SafeStyle.prototype.implementsGoogStringTypedString=!0;goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_={};
    goog.html.SafeStyle.fromConstant=function(a){a=goog.string.Const.unwrap(a);if(0===a.length)return goog.html.SafeStyle.EMPTY;goog.asserts.assert(goog.string.internal.endsWith(a,";"),"Last character of style string is not ';': "+a);goog.asserts.assert(goog.string.internal.contains(a,":"),"Style string must contain at least one ':', to specify a \"name: value\" pair: "+a);return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeStyle.prototype.getTypedStringValue=function(){return this.privateDoNotAccessOrElseSafeStyleWrappedValue_};goog.DEBUG&&(goog.html.SafeStyle.prototype.toString=function(){return "SafeStyle{"+this.privateDoNotAccessOrElseSafeStyleWrappedValue_+"}"});
    goog.html.SafeStyle.unwrap=function(a){if(a instanceof goog.html.SafeStyle&&a.constructor===goog.html.SafeStyle&&a.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_===goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_)return a.privateDoNotAccessOrElseSafeStyleWrappedValue_;goog.asserts.fail("expected object of type SafeStyle, got '"+a+"' of type "+goog.typeOf(a));return "type_error:SafeStyle"};goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse=function(a){return (new goog.html.SafeStyle).initSecurityPrivateDoNotAccessOrElse_(a)};
    goog.html.SafeStyle.prototype.initSecurityPrivateDoNotAccessOrElse_=function(a){this.privateDoNotAccessOrElseSafeStyleWrappedValue_=a;return this};goog.html.SafeStyle.EMPTY=goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse("");goog.html.SafeStyle.INNOCUOUS_STRING="zClosurez";
    goog.html.SafeStyle.create=function(a){var b="",c;for(c in a){if(!/^[-_a-zA-Z0-9]+$/.test(c))throw Error("Name allows only [-_a-zA-Z0-9], got: "+c);var d=a[c];null!=d&&(d=goog.isArray(d)?goog.array.map(d,goog.html.SafeStyle.sanitizePropertyValue_).join(" "):goog.html.SafeStyle.sanitizePropertyValue_(d),b+=c+":"+d+";");}return b?goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(b):goog.html.SafeStyle.EMPTY};
    goog.html.SafeStyle.sanitizePropertyValue_=function(a){if(a instanceof goog.html.SafeUrl)return 'url("'+goog.html.SafeUrl.unwrap(a).replace(/</g,"%3c").replace(/[\\"]/g,"\\$&")+'")';a=a instanceof goog.string.Const?goog.string.Const.unwrap(a):goog.html.SafeStyle.sanitizePropertyValueString_(String(a));if(/[{;}]/.test(a))throw new goog.asserts.AssertionError("Value does not allow [{;}], got: %s.",[a]);return a};
    goog.html.SafeStyle.sanitizePropertyValueString_=function(a){var b=a.replace(goog.html.SafeStyle.FUNCTIONS_RE_,"$1").replace(goog.html.SafeStyle.FUNCTIONS_RE_,"$1").replace(goog.html.SafeStyle.URL_RE_,"url");if(goog.html.SafeStyle.VALUE_RE_.test(b)){if(goog.html.SafeStyle.COMMENT_RE_.test(a))return goog.asserts.fail("String value disallows comments, got: "+a),goog.html.SafeStyle.INNOCUOUS_STRING;if(!goog.html.SafeStyle.hasBalancedQuotes_(a))return goog.asserts.fail("String value requires balanced quotes, got: "+
    a),goog.html.SafeStyle.INNOCUOUS_STRING;if(!goog.html.SafeStyle.hasBalancedSquareBrackets_(a))return goog.asserts.fail("String value requires balanced square brackets and one identifier per pair of brackets, got: "+a),goog.html.SafeStyle.INNOCUOUS_STRING}else return goog.asserts.fail("String value allows only "+goog.html.SafeStyle.VALUE_ALLOWED_CHARS_+" and simple functions, got: "+a),goog.html.SafeStyle.INNOCUOUS_STRING;return goog.html.SafeStyle.sanitizeUrl_(a)};
    goog.html.SafeStyle.hasBalancedQuotes_=function(a){for(var b=!0,c=!0,d=0;d<a.length;d++){var e=a.charAt(d);"'"==e&&c?b=!b:'"'==e&&b&&(c=!c);}return b&&c};goog.html.SafeStyle.hasBalancedSquareBrackets_=function(a){for(var b=!0,c=/^[-_a-zA-Z0-9]$/,d=0;d<a.length;d++){var e=a.charAt(d);if("]"==e){if(b)return !1;b=!0;}else if("["==e){if(!b)return !1;b=!1;}else if(!b&&!c.test(e))return !1}return b};goog.html.SafeStyle.VALUE_ALLOWED_CHARS_="[-,.\"'%_!# a-zA-Z0-9\\[\\]]";
    goog.html.SafeStyle.VALUE_RE_=new RegExp("^"+goog.html.SafeStyle.VALUE_ALLOWED_CHARS_+"+$");goog.html.SafeStyle.URL_RE_=/\b(url\([ \t\n]*)('[ -&(-\[\]-~]*'|"[ !#-\[\]-~]*"|[!#-&*-\[\]-~]*)([ \t\n]*\))/g;goog.html.SafeStyle.FUNCTIONS_RE_=/\b(hsl|hsla|rgb|rgba|matrix|calc|minmax|fit-content|repeat|(rotate|scale|translate)(X|Y|Z|3d)?)\([-+*/0-9a-z.%\[\], ]+\)/g;goog.html.SafeStyle.COMMENT_RE_=/\/\*/;
    goog.html.SafeStyle.sanitizeUrl_=function(a){return a.replace(goog.html.SafeStyle.URL_RE_,function(a,c,d,e){var b="";d=d.replace(/^(['"])(.*)\1$/,function(a,c,d){b=c;return d});a=goog.html.SafeUrl.sanitize(d).getTypedStringValue();return c+b+a+b+e})};goog.html.SafeStyle.concat=function(a){var b="",c=function(a){goog.isArray(a)?goog.array.forEach(a,c):b+=goog.html.SafeStyle.unwrap(a);};goog.array.forEach(arguments,c);return b?goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(b):goog.html.SafeStyle.EMPTY};goog.html.SafeScript=function(){this.privateDoNotAccessOrElseSafeScriptWrappedValue_="";this.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_=goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;};goog.html.SafeScript.prototype.implementsGoogStringTypedString=!0;goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_={};goog.html.SafeScript.fromConstant=function(a){a=goog.string.Const.unwrap(a);return 0===a.length?goog.html.SafeScript.EMPTY:goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(a)};
    goog.html.SafeScript.fromConstantAndArgs=function(a,b){for(var c=[],d=1;d<arguments.length;d++)c.push(goog.html.SafeScript.stringify_(arguments[d]));return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse("("+goog.string.Const.unwrap(a)+")("+c.join(", ")+");")};goog.html.SafeScript.fromJson=function(a){return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(goog.html.SafeScript.stringify_(a))};goog.html.SafeScript.prototype.getTypedStringValue=function(){return this.privateDoNotAccessOrElseSafeScriptWrappedValue_.toString()};
    goog.DEBUG&&(goog.html.SafeScript.prototype.toString=function(){return "SafeScript{"+this.privateDoNotAccessOrElseSafeScriptWrappedValue_+"}"});goog.html.SafeScript.unwrap=function(a){return goog.html.SafeScript.unwrapTrustedScript(a).toString()};
    goog.html.SafeScript.unwrapTrustedScript=function(a){if(a instanceof goog.html.SafeScript&&a.constructor===goog.html.SafeScript&&a.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_===goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_)return a.privateDoNotAccessOrElseSafeScriptWrappedValue_;goog.asserts.fail("expected object of type SafeScript, got '"+a+"' of type "+goog.typeOf(a));return "type_error:SafeScript"};
    goog.html.SafeScript.stringify_=function(a){return JSON.stringify(a).replace(/</g,"\\x3c")};goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse=function(a){return (new goog.html.SafeScript).initSecurityPrivateDoNotAccessOrElse_(a)};
    goog.html.SafeScript.prototype.initSecurityPrivateDoNotAccessOrElse_=function(a){this.privateDoNotAccessOrElseSafeScriptWrappedValue_=goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY?goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createScript(a):a;return this};goog.html.SafeScript.EMPTY=goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse("");goog.object={};goog.object.is=function(a,b){return a===b?0!==a||1/a===1/b:a!==a&&b!==b};goog.object.forEach=function(a,b,c){for(var d in a)b.call(c,a[d],d,a);};goog.object.filter=function(a,b,c){var d={},e;for(e in a)b.call(c,a[e],e,a)&&(d[e]=a[e]);return d};goog.object.map=function(a,b,c){var d={},e;for(e in a)d[e]=b.call(c,a[e],e,a);return d};goog.object.some=function(a,b,c){for(var d in a)if(b.call(c,a[d],d,a))return !0;return !1};
    goog.object.every=function(a,b,c){for(var d in a)if(!b.call(c,a[d],d,a))return !1;return !0};goog.object.getCount=function(a){var b=0,c;for(c in a)b++;return b};goog.object.getAnyKey=function(a){for(var b in a)return b};goog.object.getAnyValue=function(a){for(var b in a)return a[b]};goog.object.contains=function(a,b){return goog.object.containsValue(a,b)};goog.object.getValues=function(a){var b=[],c=0,d;for(d in a)b[c++]=a[d];return b};
    goog.object.getKeys=function(a){var b=[],c=0,d;for(d in a)b[c++]=d;return b};goog.object.getValueByKeys=function(a,b){var c=goog.isArrayLike(b),d=c?b:arguments;for(c=c?0:1;c<d.length;c++){if(null==a)return;a=a[d[c]];}return a};goog.object.containsKey=function(a,b){return null!==a&&b in a};goog.object.containsValue=function(a,b){for(var c in a)if(a[c]==b)return !0;return !1};goog.object.findKey=function(a,b,c){for(var d in a)if(b.call(c,a[d],d,a))return d};
    goog.object.findValue=function(a,b,c){return (b=goog.object.findKey(a,b,c))&&a[b]};goog.object.isEmpty=function(a){for(var b in a)return !1;return !0};goog.object.clear=function(a){for(var b in a)delete a[b];};goog.object.remove=function(a,b){var c;(c=b in a)&&delete a[b];return c};goog.object.add=function(a,b,c){if(null!==a&&b in a)throw Error('The object already contains the key "'+b+'"');goog.object.set(a,b,c);};goog.object.get=function(a,b,c){return null!==a&&b in a?a[b]:c};
    goog.object.set=function(a,b,c){a[b]=c;};goog.object.setIfUndefined=function(a,b,c){return b in a?a[b]:a[b]=c};goog.object.setWithReturnValueIfNotSet=function(a,b,c){if(b in a)return a[b];c=c();return a[b]=c};goog.object.equals=function(a,b){for(var c in a)if(!(c in b)||a[c]!==b[c])return !1;for(var d in b)if(!(d in a))return !1;return !0};goog.object.clone=function(a){var b={},c;for(c in a)b[c]=a[c];return b};
    goog.object.unsafeClone=function(a){var b=goog.typeOf(a);if("object"==b||"array"==b){if(goog.isFunction(a.clone))return a.clone();b="array"==b?[]:{};for(var c in a)b[c]=goog.object.unsafeClone(a[c]);return b}return a};goog.object.transpose=function(a){var b={},c;for(c in a)b[a[c]]=c;return b};goog.object.PROTOTYPE_FIELDS_="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
    goog.object.extend=function(a,b){for(var c,d,e=1;e<arguments.length;e++){d=arguments[e];for(c in d)a[c]=d[c];for(var f=0;f<goog.object.PROTOTYPE_FIELDS_.length;f++)c=goog.object.PROTOTYPE_FIELDS_[f],Object.prototype.hasOwnProperty.call(d,c)&&(a[c]=d[c]);}};
    goog.object.create=function(a){var b=arguments.length;if(1==b&&goog.isArray(arguments[0]))return goog.object.create.apply(null,arguments[0]);if(b%2)throw Error("Uneven number of arguments");for(var c={},d=0;d<b;d+=2)c[arguments[d]]=arguments[d+1];return c};goog.object.createSet=function(a){var b=arguments.length;if(1==b&&goog.isArray(arguments[0]))return goog.object.createSet.apply(null,arguments[0]);for(var c={},d=0;d<b;d++)c[arguments[d]]=!0;return c};
    goog.object.createImmutableView=function(a){var b=a;Object.isFrozen&&!Object.isFrozen(a)&&(b=Object.create(a),Object.freeze(b));return b};goog.object.isImmutableView=function(a){return !!Object.isFrozen&&Object.isFrozen(a)};
    goog.object.getAllPropertyNames=function(a,b,c){if(!a)return [];if(!Object.getOwnPropertyNames||!Object.getPrototypeOf)return goog.object.getKeys(a);for(var d={};a&&(a!==Object.prototype||b)&&(a!==Function.prototype||c);){for(var e=Object.getOwnPropertyNames(a),f=0;f<e.length;f++)d[e[f]]=!0;a=Object.getPrototypeOf(a);}return goog.object.getKeys(d)};goog.object.getSuperClass=function(a){return (a=Object.getPrototypeOf(a.prototype))&&a.constructor};goog.html.SafeStyleSheet=function(){this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_="";this.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_=goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;};goog.html.SafeStyleSheet.prototype.implementsGoogStringTypedString=!0;goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_={};
    goog.html.SafeStyleSheet.createRule=function(a,b){if(goog.string.internal.contains(a,"<"))throw Error("Selector does not allow '<', got: "+a);var c=a.replace(/('|")((?!\1)[^\r\n\f\\]|\\[\s\S])*\1/g,"");if(!/^[-_a-zA-Z0-9#.:* ,>+~[\]()=^$|]+$/.test(c))throw Error("Selector allows only [-_a-zA-Z0-9#.:* ,>+~[\\]()=^$|] and strings, got: "+a);if(!goog.html.SafeStyleSheet.hasBalancedBrackets_(c))throw Error("() and [] in selector must be balanced, got: "+a);b instanceof goog.html.SafeStyle||(b=goog.html.SafeStyle.create(b));
    a=a+"{"+goog.html.SafeStyle.unwrap(b).replace(/</g,"\\3C ")+"}";return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(a)};goog.html.SafeStyleSheet.hasBalancedBrackets_=function(a){for(var b={"(":")","[":"]"},c=[],d=0;d<a.length;d++){var e=a[d];if(b[e])c.push(b[e]);else if(goog.object.contains(b,e)&&c.pop()!=e)return !1}return 0==c.length};
    goog.html.SafeStyleSheet.concat=function(a){var b="",c=function(a){goog.isArray(a)?goog.array.forEach(a,c):b+=goog.html.SafeStyleSheet.unwrap(a);};goog.array.forEach(arguments,c);return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(b)};
    goog.html.SafeStyleSheet.fromConstant=function(a){a=goog.string.Const.unwrap(a);if(0===a.length)return goog.html.SafeStyleSheet.EMPTY;goog.asserts.assert(!goog.string.internal.contains(a,"<"),"Forbidden '<' character in style sheet string: "+a);return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(a)};goog.html.SafeStyleSheet.prototype.getTypedStringValue=function(){return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_};
    goog.DEBUG&&(goog.html.SafeStyleSheet.prototype.toString=function(){return "SafeStyleSheet{"+this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_+"}"});
    goog.html.SafeStyleSheet.unwrap=function(a){if(a instanceof goog.html.SafeStyleSheet&&a.constructor===goog.html.SafeStyleSheet&&a.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_===goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_)return a.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;goog.asserts.fail("expected object of type SafeStyleSheet, got '"+a+"' of type "+goog.typeOf(a));return "type_error:SafeStyleSheet"};
    goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse=function(a){return (new goog.html.SafeStyleSheet).initSecurityPrivateDoNotAccessOrElse_(a)};goog.html.SafeStyleSheet.prototype.initSecurityPrivateDoNotAccessOrElse_=function(a){this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_=a;return this};goog.html.SafeStyleSheet.EMPTY=goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse("");goog.dom.tags={};goog.dom.tags.VOID_TAGS_={area:!0,base:!0,br:!0,col:!0,command:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0};goog.dom.tags.isVoidTag=function(a){return !0===goog.dom.tags.VOID_TAGS_[a]};goog.dom.HtmlElement=function(){};goog.dom.TagName=function(a){this.tagName_=a;};goog.dom.TagName.prototype.toString=function(){return this.tagName_};goog.dom.TagName.A=new goog.dom.TagName("A");goog.dom.TagName.ABBR=new goog.dom.TagName("ABBR");goog.dom.TagName.ACRONYM=new goog.dom.TagName("ACRONYM");goog.dom.TagName.ADDRESS=new goog.dom.TagName("ADDRESS");goog.dom.TagName.APPLET=new goog.dom.TagName("APPLET");goog.dom.TagName.AREA=new goog.dom.TagName("AREA");goog.dom.TagName.ARTICLE=new goog.dom.TagName("ARTICLE");
    goog.dom.TagName.ASIDE=new goog.dom.TagName("ASIDE");goog.dom.TagName.AUDIO=new goog.dom.TagName("AUDIO");goog.dom.TagName.B=new goog.dom.TagName("B");goog.dom.TagName.BASE=new goog.dom.TagName("BASE");goog.dom.TagName.BASEFONT=new goog.dom.TagName("BASEFONT");goog.dom.TagName.BDI=new goog.dom.TagName("BDI");goog.dom.TagName.BDO=new goog.dom.TagName("BDO");goog.dom.TagName.BIG=new goog.dom.TagName("BIG");goog.dom.TagName.BLOCKQUOTE=new goog.dom.TagName("BLOCKQUOTE");goog.dom.TagName.BODY=new goog.dom.TagName("BODY");
    goog.dom.TagName.BR=new goog.dom.TagName("BR");goog.dom.TagName.BUTTON=new goog.dom.TagName("BUTTON");goog.dom.TagName.CANVAS=new goog.dom.TagName("CANVAS");goog.dom.TagName.CAPTION=new goog.dom.TagName("CAPTION");goog.dom.TagName.CENTER=new goog.dom.TagName("CENTER");goog.dom.TagName.CITE=new goog.dom.TagName("CITE");goog.dom.TagName.CODE=new goog.dom.TagName("CODE");goog.dom.TagName.COL=new goog.dom.TagName("COL");goog.dom.TagName.COLGROUP=new goog.dom.TagName("COLGROUP");
    goog.dom.TagName.COMMAND=new goog.dom.TagName("COMMAND");goog.dom.TagName.DATA=new goog.dom.TagName("DATA");goog.dom.TagName.DATALIST=new goog.dom.TagName("DATALIST");goog.dom.TagName.DD=new goog.dom.TagName("DD");goog.dom.TagName.DEL=new goog.dom.TagName("DEL");goog.dom.TagName.DETAILS=new goog.dom.TagName("DETAILS");goog.dom.TagName.DFN=new goog.dom.TagName("DFN");goog.dom.TagName.DIALOG=new goog.dom.TagName("DIALOG");goog.dom.TagName.DIR=new goog.dom.TagName("DIR");goog.dom.TagName.DIV=new goog.dom.TagName("DIV");
    goog.dom.TagName.DL=new goog.dom.TagName("DL");goog.dom.TagName.DT=new goog.dom.TagName("DT");goog.dom.TagName.EM=new goog.dom.TagName("EM");goog.dom.TagName.EMBED=new goog.dom.TagName("EMBED");goog.dom.TagName.FIELDSET=new goog.dom.TagName("FIELDSET");goog.dom.TagName.FIGCAPTION=new goog.dom.TagName("FIGCAPTION");goog.dom.TagName.FIGURE=new goog.dom.TagName("FIGURE");goog.dom.TagName.FONT=new goog.dom.TagName("FONT");goog.dom.TagName.FOOTER=new goog.dom.TagName("FOOTER");goog.dom.TagName.FORM=new goog.dom.TagName("FORM");
    goog.dom.TagName.FRAME=new goog.dom.TagName("FRAME");goog.dom.TagName.FRAMESET=new goog.dom.TagName("FRAMESET");goog.dom.TagName.H1=new goog.dom.TagName("H1");goog.dom.TagName.H2=new goog.dom.TagName("H2");goog.dom.TagName.H3=new goog.dom.TagName("H3");goog.dom.TagName.H4=new goog.dom.TagName("H4");goog.dom.TagName.H5=new goog.dom.TagName("H5");goog.dom.TagName.H6=new goog.dom.TagName("H6");goog.dom.TagName.HEAD=new goog.dom.TagName("HEAD");goog.dom.TagName.HEADER=new goog.dom.TagName("HEADER");
    goog.dom.TagName.HGROUP=new goog.dom.TagName("HGROUP");goog.dom.TagName.HR=new goog.dom.TagName("HR");goog.dom.TagName.HTML=new goog.dom.TagName("HTML");goog.dom.TagName.I=new goog.dom.TagName("I");goog.dom.TagName.IFRAME=new goog.dom.TagName("IFRAME");goog.dom.TagName.IMG=new goog.dom.TagName("IMG");goog.dom.TagName.INPUT=new goog.dom.TagName("INPUT");goog.dom.TagName.INS=new goog.dom.TagName("INS");goog.dom.TagName.ISINDEX=new goog.dom.TagName("ISINDEX");goog.dom.TagName.KBD=new goog.dom.TagName("KBD");
    goog.dom.TagName.KEYGEN=new goog.dom.TagName("KEYGEN");goog.dom.TagName.LABEL=new goog.dom.TagName("LABEL");goog.dom.TagName.LEGEND=new goog.dom.TagName("LEGEND");goog.dom.TagName.LI=new goog.dom.TagName("LI");goog.dom.TagName.LINK=new goog.dom.TagName("LINK");goog.dom.TagName.MAIN=new goog.dom.TagName("MAIN");goog.dom.TagName.MAP=new goog.dom.TagName("MAP");goog.dom.TagName.MARK=new goog.dom.TagName("MARK");goog.dom.TagName.MATH=new goog.dom.TagName("MATH");goog.dom.TagName.MENU=new goog.dom.TagName("MENU");
    goog.dom.TagName.MENUITEM=new goog.dom.TagName("MENUITEM");goog.dom.TagName.META=new goog.dom.TagName("META");goog.dom.TagName.METER=new goog.dom.TagName("METER");goog.dom.TagName.NAV=new goog.dom.TagName("NAV");goog.dom.TagName.NOFRAMES=new goog.dom.TagName("NOFRAMES");goog.dom.TagName.NOSCRIPT=new goog.dom.TagName("NOSCRIPT");goog.dom.TagName.OBJECT=new goog.dom.TagName("OBJECT");goog.dom.TagName.OL=new goog.dom.TagName("OL");goog.dom.TagName.OPTGROUP=new goog.dom.TagName("OPTGROUP");
    goog.dom.TagName.OPTION=new goog.dom.TagName("OPTION");goog.dom.TagName.OUTPUT=new goog.dom.TagName("OUTPUT");goog.dom.TagName.P=new goog.dom.TagName("P");goog.dom.TagName.PARAM=new goog.dom.TagName("PARAM");goog.dom.TagName.PICTURE=new goog.dom.TagName("PICTURE");goog.dom.TagName.PRE=new goog.dom.TagName("PRE");goog.dom.TagName.PROGRESS=new goog.dom.TagName("PROGRESS");goog.dom.TagName.Q=new goog.dom.TagName("Q");goog.dom.TagName.RP=new goog.dom.TagName("RP");goog.dom.TagName.RT=new goog.dom.TagName("RT");
    goog.dom.TagName.RTC=new goog.dom.TagName("RTC");goog.dom.TagName.RUBY=new goog.dom.TagName("RUBY");goog.dom.TagName.S=new goog.dom.TagName("S");goog.dom.TagName.SAMP=new goog.dom.TagName("SAMP");goog.dom.TagName.SCRIPT=new goog.dom.TagName("SCRIPT");goog.dom.TagName.SECTION=new goog.dom.TagName("SECTION");goog.dom.TagName.SELECT=new goog.dom.TagName("SELECT");goog.dom.TagName.SMALL=new goog.dom.TagName("SMALL");goog.dom.TagName.SOURCE=new goog.dom.TagName("SOURCE");goog.dom.TagName.SPAN=new goog.dom.TagName("SPAN");
    goog.dom.TagName.STRIKE=new goog.dom.TagName("STRIKE");goog.dom.TagName.STRONG=new goog.dom.TagName("STRONG");goog.dom.TagName.STYLE=new goog.dom.TagName("STYLE");goog.dom.TagName.SUB=new goog.dom.TagName("SUB");goog.dom.TagName.SUMMARY=new goog.dom.TagName("SUMMARY");goog.dom.TagName.SUP=new goog.dom.TagName("SUP");goog.dom.TagName.SVG=new goog.dom.TagName("SVG");goog.dom.TagName.TABLE=new goog.dom.TagName("TABLE");goog.dom.TagName.TBODY=new goog.dom.TagName("TBODY");goog.dom.TagName.TD=new goog.dom.TagName("TD");
    goog.dom.TagName.TEMPLATE=new goog.dom.TagName("TEMPLATE");goog.dom.TagName.TEXTAREA=new goog.dom.TagName("TEXTAREA");goog.dom.TagName.TFOOT=new goog.dom.TagName("TFOOT");goog.dom.TagName.TH=new goog.dom.TagName("TH");goog.dom.TagName.THEAD=new goog.dom.TagName("THEAD");goog.dom.TagName.TIME=new goog.dom.TagName("TIME");goog.dom.TagName.TITLE=new goog.dom.TagName("TITLE");goog.dom.TagName.TR=new goog.dom.TagName("TR");goog.dom.TagName.TRACK=new goog.dom.TagName("TRACK");goog.dom.TagName.TT=new goog.dom.TagName("TT");
    goog.dom.TagName.U=new goog.dom.TagName("U");goog.dom.TagName.UL=new goog.dom.TagName("UL");goog.dom.TagName.VAR=new goog.dom.TagName("VAR");goog.dom.TagName.VIDEO=new goog.dom.TagName("VIDEO");goog.dom.TagName.WBR=new goog.dom.TagName("WBR");goog.labs={};goog.labs.userAgent={};goog.labs.userAgent.util={};goog.labs.userAgent.util.getNativeUserAgentString_=function(){var a=goog.labs.userAgent.util.getNavigator_();return a&&(a=a.userAgent)?a:""};goog.labs.userAgent.util.getNavigator_=function(){return goog.global.navigator};goog.labs.userAgent.util.userAgent_=goog.labs.userAgent.util.getNativeUserAgentString_();goog.labs.userAgent.util.setUserAgent=function(a){goog.labs.userAgent.util.userAgent_=a||goog.labs.userAgent.util.getNativeUserAgentString_();};
    goog.labs.userAgent.util.getUserAgent=function(){return goog.labs.userAgent.util.userAgent_};goog.labs.userAgent.util.matchUserAgent=function(a){var b=goog.labs.userAgent.util.getUserAgent();return goog.string.internal.contains(b,a)};goog.labs.userAgent.util.matchUserAgentIgnoreCase=function(a){var b=goog.labs.userAgent.util.getUserAgent();return goog.string.internal.caseInsensitiveContains(b,a)};
    goog.labs.userAgent.util.extractVersionTuples=function(a){for(var b=/(\w[\w ]+)\/([^\s]+)\s*(?:\((.*?)\))?/g,c=[],d;d=b.exec(a);)c.push([d[1],d[2],d[3]||void 0]);return c};goog.labs.userAgent.browser={};goog.labs.userAgent.browser.matchOpera_=function(){return goog.labs.userAgent.util.matchUserAgent("Opera")};goog.labs.userAgent.browser.matchIE_=function(){return goog.labs.userAgent.util.matchUserAgent("Trident")||goog.labs.userAgent.util.matchUserAgent("MSIE")};goog.labs.userAgent.browser.matchEdgeHtml_=function(){return goog.labs.userAgent.util.matchUserAgent("Edge")};goog.labs.userAgent.browser.matchEdgeChromium_=function(){return goog.labs.userAgent.util.matchUserAgent("Edg/")};
    goog.labs.userAgent.browser.matchOperaChromium_=function(){return goog.labs.userAgent.util.matchUserAgent("OPR")};goog.labs.userAgent.browser.matchFirefox_=function(){return goog.labs.userAgent.util.matchUserAgent("Firefox")||goog.labs.userAgent.util.matchUserAgent("FxiOS")};
    goog.labs.userAgent.browser.matchSafari_=function(){return goog.labs.userAgent.util.matchUserAgent("Safari")&&!(goog.labs.userAgent.browser.matchChrome_()||goog.labs.userAgent.browser.matchCoast_()||goog.labs.userAgent.browser.matchOpera_()||goog.labs.userAgent.browser.matchEdgeHtml_()||goog.labs.userAgent.browser.matchEdgeChromium_()||goog.labs.userAgent.browser.matchOperaChromium_()||goog.labs.userAgent.browser.matchFirefox_()||goog.labs.userAgent.browser.isSilk()||goog.labs.userAgent.util.matchUserAgent("Android"))};
    goog.labs.userAgent.browser.matchCoast_=function(){return goog.labs.userAgent.util.matchUserAgent("Coast")};goog.labs.userAgent.browser.matchIosWebview_=function(){return (goog.labs.userAgent.util.matchUserAgent("iPad")||goog.labs.userAgent.util.matchUserAgent("iPhone"))&&!goog.labs.userAgent.browser.matchSafari_()&&!goog.labs.userAgent.browser.matchChrome_()&&!goog.labs.userAgent.browser.matchCoast_()&&!goog.labs.userAgent.browser.matchFirefox_()&&goog.labs.userAgent.util.matchUserAgent("AppleWebKit")};
    goog.labs.userAgent.browser.matchChrome_=function(){return (goog.labs.userAgent.util.matchUserAgent("Chrome")||goog.labs.userAgent.util.matchUserAgent("CriOS"))&&!goog.labs.userAgent.browser.matchEdgeHtml_()};goog.labs.userAgent.browser.matchAndroidBrowser_=function(){return goog.labs.userAgent.util.matchUserAgent("Android")&&!(goog.labs.userAgent.browser.isChrome()||goog.labs.userAgent.browser.isFirefox()||goog.labs.userAgent.browser.isOpera()||goog.labs.userAgent.browser.isSilk())};
    goog.labs.userAgent.browser.isOpera=goog.labs.userAgent.browser.matchOpera_;goog.labs.userAgent.browser.isIE=goog.labs.userAgent.browser.matchIE_;goog.labs.userAgent.browser.isEdge=goog.labs.userAgent.browser.matchEdgeHtml_;goog.labs.userAgent.browser.isEdgeChromium=goog.labs.userAgent.browser.matchEdgeChromium_;goog.labs.userAgent.browser.isOperaChromium=goog.labs.userAgent.browser.matchOperaChromium_;goog.labs.userAgent.browser.isFirefox=goog.labs.userAgent.browser.matchFirefox_;
    goog.labs.userAgent.browser.isSafari=goog.labs.userAgent.browser.matchSafari_;goog.labs.userAgent.browser.isCoast=goog.labs.userAgent.browser.matchCoast_;goog.labs.userAgent.browser.isIosWebview=goog.labs.userAgent.browser.matchIosWebview_;goog.labs.userAgent.browser.isChrome=goog.labs.userAgent.browser.matchChrome_;goog.labs.userAgent.browser.isAndroidBrowser=goog.labs.userAgent.browser.matchAndroidBrowser_;goog.labs.userAgent.browser.isSilk=function(){return goog.labs.userAgent.util.matchUserAgent("Silk")};
    goog.labs.userAgent.browser.getVersion=function(){function a(a){a=goog.array.find(a,d);return c[a]||""}var b=goog.labs.userAgent.util.getUserAgent();if(goog.labs.userAgent.browser.isIE())return goog.labs.userAgent.browser.getIEVersion_(b);b=goog.labs.userAgent.util.extractVersionTuples(b);var c={};goog.array.forEach(b,function(a){c[a[0]]=a[1];});var d=goog.partial(goog.object.containsKey,c);return goog.labs.userAgent.browser.isOpera()?a(["Version","Opera"]):goog.labs.userAgent.browser.isEdge()?a(["Edge"]):
    goog.labs.userAgent.browser.isEdgeChromium()?a(["Edg"]):goog.labs.userAgent.browser.isChrome()?a(["Chrome","CriOS"]):(b=b[2])&&b[1]||""};goog.labs.userAgent.browser.isVersionOrHigher=function(a){return 0<=goog.string.internal.compareVersions(goog.labs.userAgent.browser.getVersion(),a)};
    goog.labs.userAgent.browser.getIEVersion_=function(a){var b=/rv: *([\d\.]*)/.exec(a);if(b&&b[1])return b[1];b="";var c=/MSIE +([\d\.]+)/.exec(a);if(c&&c[1])if(a=/Trident\/(\d.\d)/.exec(a),"7.0"==c[1])if(a&&a[1])switch(a[1]){case "4.0":b="8.0";break;case "5.0":b="9.0";break;case "6.0":b="10.0";break;case "7.0":b="11.0";}else b="7.0";else b=c[1];return b};goog.html.SafeHtml=function(){this.privateDoNotAccessOrElseSafeHtmlWrappedValue_="";this.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_=goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;this.dir_=null;};goog.html.SafeHtml.prototype.implementsGoogI18nBidiDirectionalString=!0;goog.html.SafeHtml.prototype.getDirection=function(){return this.dir_};goog.html.SafeHtml.prototype.implementsGoogStringTypedString=!0;goog.html.SafeHtml.prototype.getTypedStringValue=function(){return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_.toString()};
    goog.DEBUG&&(goog.html.SafeHtml.prototype.toString=function(){return "SafeHtml{"+this.privateDoNotAccessOrElseSafeHtmlWrappedValue_+"}"});goog.html.SafeHtml.unwrap=function(a){return goog.html.SafeHtml.unwrapTrustedHTML(a).toString()};
    goog.html.SafeHtml.unwrapTrustedHTML=function(a){if(a instanceof goog.html.SafeHtml&&a.constructor===goog.html.SafeHtml&&a.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_===goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_)return a.privateDoNotAccessOrElseSafeHtmlWrappedValue_;goog.asserts.fail("expected object of type SafeHtml, got '"+a+"' of type "+goog.typeOf(a));return "type_error:SafeHtml"};
    goog.html.SafeHtml.htmlEscape=function(a){if(a instanceof goog.html.SafeHtml)return a;var b="object"==typeof a,c=null;b&&a.implementsGoogI18nBidiDirectionalString&&(c=a.getDirection());a=b&&a.implementsGoogStringTypedString?a.getTypedStringValue():String(a);return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.htmlEscape(a),c)};
    goog.html.SafeHtml.htmlEscapePreservingNewlines=function(a){if(a instanceof goog.html.SafeHtml)return a;a=goog.html.SafeHtml.htmlEscape(a);return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.newLineToBr(goog.html.SafeHtml.unwrap(a)),a.getDirection())};
    goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces=function(a){if(a instanceof goog.html.SafeHtml)return a;a=goog.html.SafeHtml.htmlEscape(a);return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.whitespaceEscape(goog.html.SafeHtml.unwrap(a)),a.getDirection())};goog.html.SafeHtml.from=goog.html.SafeHtml.htmlEscape;goog.html.SafeHtml.VALID_NAMES_IN_TAG_=/^[a-zA-Z0-9-]+$/;
    goog.html.SafeHtml.URL_ATTRIBUTES_={action:!0,cite:!0,data:!0,formaction:!0,href:!0,manifest:!0,poster:!0,src:!0};goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_={APPLET:!0,BASE:!0,EMBED:!0,IFRAME:!0,LINK:!0,MATH:!0,META:!0,OBJECT:!0,SCRIPT:!0,STYLE:!0,SVG:!0,TEMPLATE:!0};goog.html.SafeHtml.create=function(a,b,c){goog.html.SafeHtml.verifyTagName(String(a));return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse(String(a),b,c)};
    goog.html.SafeHtml.verifyTagName=function(a){if(!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(a))throw Error("Invalid tag name <"+a+">.");if(a.toUpperCase()in goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_)throw Error("Tag name <"+a+"> is not allowed for SafeHtml.");};
    goog.html.SafeHtml.createIframe=function(a,b,c,d){a&&goog.html.TrustedResourceUrl.unwrap(a);var e={};e.src=a||null;e.srcdoc=b&&goog.html.SafeHtml.unwrap(b);a=goog.html.SafeHtml.combineAttributes(e,{sandbox:""},c);return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe",a,d)};
    goog.html.SafeHtml.createSandboxIframe=function(a,b,c,d){if(!goog.html.SafeHtml.canUseSandboxIframe())throw Error("The browser does not support sandboxed iframes.");var e={};e.src=a?goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(a)):null;e.srcdoc=b||null;e.sandbox="";a=goog.html.SafeHtml.combineAttributes(e,{},c);return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe",a,d)};
    goog.html.SafeHtml.canUseSandboxIframe=function(){return goog.global.HTMLIFrameElement&&"sandbox"in goog.global.HTMLIFrameElement.prototype};goog.html.SafeHtml.createScriptSrc=function(a,b){goog.html.TrustedResourceUrl.unwrap(a);a=goog.html.SafeHtml.combineAttributes({src:a},{},b);return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script",a)};
    goog.html.SafeHtml.createScript=function(a,b){for(var c in b){var d=c.toLowerCase();if("language"==d||"src"==d||"text"==d||"type"==d)throw Error('Cannot set "'+d+'" attribute');}c="";a=goog.array.concat(a);for(d=0;d<a.length;d++)c+=goog.html.SafeScript.unwrap(a[d]);a=goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(c,goog.i18n.bidi.Dir.NEUTRAL);return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script",b,a)};
    goog.html.SafeHtml.createStyle=function(a,b){b=goog.html.SafeHtml.combineAttributes({type:"text/css"},{},b);var c="";a=goog.array.concat(a);for(var d=0;d<a.length;d++)c+=goog.html.SafeStyleSheet.unwrap(a[d]);a=goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(c,goog.i18n.bidi.Dir.NEUTRAL);return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("style",b,a)};
    goog.html.SafeHtml.createMetaRefresh=function(a,b){a=goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(a));(goog.labs.userAgent.browser.isIE()||goog.labs.userAgent.browser.isEdge())&&goog.string.internal.contains(a,";")&&(a="'"+a.replace(/'/g,"%27")+"'");return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("meta",{"http-equiv":"refresh",content:(b||0)+"; url="+a})};
    goog.html.SafeHtml.getAttrNameAndValue_=function(a,b,c){if(c instanceof goog.string.Const)c=goog.string.Const.unwrap(c);else if("style"==b.toLowerCase())c=goog.html.SafeHtml.getStyleValue_(c);else {if(/^on/i.test(b))throw Error('Attribute "'+b+'" requires goog.string.Const value, "'+c+'" given.');if(b.toLowerCase()in goog.html.SafeHtml.URL_ATTRIBUTES_)if(c instanceof goog.html.TrustedResourceUrl)c=goog.html.TrustedResourceUrl.unwrap(c);else if(c instanceof goog.html.SafeUrl)c=goog.html.SafeUrl.unwrap(c);
    else if(goog.isString(c))c=goog.html.SafeUrl.sanitize(c).getTypedStringValue();else throw Error('Attribute "'+b+'" on tag "'+a+'" requires goog.html.SafeUrl, goog.string.Const, or string, value "'+c+'" given.');}c.implementsGoogStringTypedString&&(c=c.getTypedStringValue());goog.asserts.assert(goog.isString(c)||goog.isNumber(c),"String or number value expected, got "+typeof c+" with value: "+c);return b+'="'+goog.string.internal.htmlEscape(String(c))+'"'};
    goog.html.SafeHtml.getStyleValue_=function(a){if(!goog.isObject(a))throw Error('The "style" attribute requires goog.html.SafeStyle or map of style properties, '+typeof a+" given: "+a);a instanceof goog.html.SafeStyle||(a=goog.html.SafeStyle.create(a));return goog.html.SafeStyle.unwrap(a)};goog.html.SafeHtml.createWithDir=function(a,b,c,d){b=goog.html.SafeHtml.create(b,c,d);b.dir_=a;return b};
    goog.html.SafeHtml.join=function(a,b){a=goog.html.SafeHtml.htmlEscape(a);var c=a.getDirection(),d=[],e=function(a){goog.isArray(a)?goog.array.forEach(a,e):(a=goog.html.SafeHtml.htmlEscape(a),d.push(goog.html.SafeHtml.unwrap(a)),a=a.getDirection(),c==goog.i18n.bidi.Dir.NEUTRAL?c=a:a!=goog.i18n.bidi.Dir.NEUTRAL&&c!=a&&(c=null));};goog.array.forEach(b,e);return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(d.join(goog.html.SafeHtml.unwrap(a)),c)};
    goog.html.SafeHtml.concat=function(a){return goog.html.SafeHtml.join(goog.html.SafeHtml.EMPTY,Array.prototype.slice.call(arguments))};goog.html.SafeHtml.concatWithDir=function(a,b){var c=goog.html.SafeHtml.concat(goog.array.slice(arguments,1));c.dir_=a;return c};goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_={};goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse=function(a,b){return (new goog.html.SafeHtml).initSecurityPrivateDoNotAccessOrElse_(a,b)};
    goog.html.SafeHtml.prototype.initSecurityPrivateDoNotAccessOrElse_=function(a,b){this.privateDoNotAccessOrElseSafeHtmlWrappedValue_=goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY?goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createHTML(a):a;this.dir_=b;return this};
    goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse=function(a,b,c){var d=null;var e="<"+a+goog.html.SafeHtml.stringifyAttributes(a,b);goog.isDefAndNotNull(c)?goog.isArray(c)||(c=[c]):c=[];goog.dom.tags.isVoidTag(a.toLowerCase())?(goog.asserts.assert(!c.length,"Void tag <"+a+"> does not allow content."),e+=">"):(d=goog.html.SafeHtml.concat(c),e+=">"+goog.html.SafeHtml.unwrap(d)+"</"+a+">",d=d.getDirection());(a=b&&b.dir)&&(d=/^(ltr|rtl|auto)$/i.test(a)?goog.i18n.bidi.Dir.NEUTRAL:
    null);return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(e,d)};goog.html.SafeHtml.stringifyAttributes=function(a,b){var c="";if(b)for(var d in b){if(!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(d))throw Error('Invalid attribute name "'+d+'".');var e=b[d];goog.isDefAndNotNull(e)&&(c+=" "+goog.html.SafeHtml.getAttrNameAndValue_(a,d,e));}return c};
    goog.html.SafeHtml.combineAttributes=function(a,b,c){var d={},e;for(e in a)goog.asserts.assert(e.toLowerCase()==e,"Must be lower case"),d[e]=a[e];for(e in b)goog.asserts.assert(e.toLowerCase()==e,"Must be lower case"),d[e]=b[e];for(e in c){var f=e.toLowerCase();if(f in a)throw Error('Cannot override "'+f+'" attribute, got "'+e+'" with value "'+c[e]+'"');f in b&&delete d[f];d[e]=c[e];}return d};
    goog.html.SafeHtml.DOCTYPE_HTML=goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<!DOCTYPE html>",goog.i18n.bidi.Dir.NEUTRAL);goog.html.SafeHtml.EMPTY=goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("",goog.i18n.bidi.Dir.NEUTRAL);goog.html.SafeHtml.BR=goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<br>",goog.i18n.bidi.Dir.NEUTRAL);goog.html.uncheckedconversions={};goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract=function(a,b,c){goog.asserts.assertString(goog.string.Const.unwrap(a),"must provide justification");goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(a)),"must provide non-empty justification");return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(b,c||null)};
    goog.html.uncheckedconversions.safeScriptFromStringKnownToSatisfyTypeContract=function(a,b){goog.asserts.assertString(goog.string.Const.unwrap(a),"must provide justification");goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(a)),"must provide non-empty justification");return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(b)};
    goog.html.uncheckedconversions.safeStyleFromStringKnownToSatisfyTypeContract=function(a,b){goog.asserts.assertString(goog.string.Const.unwrap(a),"must provide justification");goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(a)),"must provide non-empty justification");return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(b)};
    goog.html.uncheckedconversions.safeStyleSheetFromStringKnownToSatisfyTypeContract=function(a,b){goog.asserts.assertString(goog.string.Const.unwrap(a),"must provide justification");goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(a)),"must provide non-empty justification");return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(b)};
    goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract=function(a,b){goog.asserts.assertString(goog.string.Const.unwrap(a),"must provide justification");goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(a)),"must provide non-empty justification");return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(b)};
    goog.html.uncheckedconversions.trustedResourceUrlFromStringKnownToSatisfyTypeContract=function(a,b){goog.asserts.assertString(goog.string.Const.unwrap(a),"must provide justification");goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(a)),"must provide non-empty justification");return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(b)};goog.dom.asserts={};goog.dom.asserts.assertIsLocation=function(a){if(goog.asserts.ENABLE_ASSERTS){var b=goog.dom.asserts.getWindow_(a);b&&(!a||!(a instanceof b.Location)&&a instanceof b.Element)&&goog.asserts.fail("Argument is not a Location (or a non-Element mock); got: %s",goog.dom.asserts.debugStringForType_(a));}return a};
    goog.dom.asserts.assertIsElementType_=function(a,b){if(goog.asserts.ENABLE_ASSERTS){var c=goog.dom.asserts.getWindow_(a);c&&"undefined"!=typeof c[b]&&(a&&(a instanceof c[b]||!(a instanceof c.Location||a instanceof c.Element))||goog.asserts.fail("Argument is not a %s (or a non-Element, non-Location mock); got: %s",b,goog.dom.asserts.debugStringForType_(a)));}return a};goog.dom.asserts.assertIsHTMLAnchorElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLAnchorElement")};
    goog.dom.asserts.assertIsHTMLButtonElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLButtonElement")};goog.dom.asserts.assertIsHTMLLinkElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLLinkElement")};goog.dom.asserts.assertIsHTMLImageElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLImageElement")};goog.dom.asserts.assertIsHTMLAudioElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLAudioElement")};
    goog.dom.asserts.assertIsHTMLVideoElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLVideoElement")};goog.dom.asserts.assertIsHTMLInputElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLInputElement")};goog.dom.asserts.assertIsHTMLTextAreaElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLTextAreaElement")};goog.dom.asserts.assertIsHTMLCanvasElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLCanvasElement")};
    goog.dom.asserts.assertIsHTMLEmbedElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLEmbedElement")};goog.dom.asserts.assertIsHTMLFormElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLFormElement")};goog.dom.asserts.assertIsHTMLFrameElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLFrameElement")};goog.dom.asserts.assertIsHTMLIFrameElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLIFrameElement")};
    goog.dom.asserts.assertIsHTMLObjectElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLObjectElement")};goog.dom.asserts.assertIsHTMLScriptElement=function(a){return goog.dom.asserts.assertIsElementType_(a,"HTMLScriptElement")};
    goog.dom.asserts.debugStringForType_=function(a){if(goog.isObject(a))try{return a.constructor.displayName||a.constructor.name||Object.prototype.toString.call(a)}catch(b){return "<object could not be stringified>"}else return void 0===a?"undefined":null===a?"null":typeof a};goog.dom.asserts.getWindow_=function(a){try{var b=a&&a.ownerDocument,c=b&&(b.defaultView||b.parentWindow);c=c||goog.global;if(c.Element&&c.Location)return c}catch(d){}return null};goog.functions={};goog.functions.constant=function(a){return function(){return a}};goog.functions.FALSE=function(){return !1};goog.functions.TRUE=function(){return !0};goog.functions.NULL=function(){return null};goog.functions.identity=function(a,b){return a};goog.functions.error=function(a){return function(){throw Error(a);}};goog.functions.fail=function(a){return function(){throw a;}};
    goog.functions.lock=function(a,b){b=b||0;return function(){return a.apply(this,Array.prototype.slice.call(arguments,0,b))}};goog.functions.nth=function(a){return function(){return arguments[a]}};goog.functions.partialRight=function(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var b=Array.prototype.slice.call(arguments);b.push.apply(b,c);return a.apply(this,b)}};goog.functions.withReturnValue=function(a,b){return goog.functions.sequence(a,goog.functions.constant(b))};
    goog.functions.equalTo=function(a,b){return function(c){return b?a==c:a===c}};goog.functions.compose=function(a,b){var c=arguments,d=c.length;return function(){var a;d&&(a=c[d-1].apply(this,arguments));for(var b=d-2;0<=b;b--)a=c[b].call(this,a);return a}};goog.functions.sequence=function(a){var b=arguments,c=b.length;return function(){for(var a,e=0;e<c;e++)a=b[e].apply(this,arguments);return a}};
    goog.functions.and=function(a){var b=arguments,c=b.length;return function(){for(var a=0;a<c;a++)if(!b[a].apply(this,arguments))return !1;return !0}};goog.functions.or=function(a){var b=arguments,c=b.length;return function(){for(var a=0;a<c;a++)if(b[a].apply(this,arguments))return !0;return !1}};goog.functions.not=function(a){return function(){return !a.apply(this,arguments)}};
    goog.functions.create=function(a,b){var c=function(){};c.prototype=a.prototype;c=new c;a.apply(c,Array.prototype.slice.call(arguments,1));return c};goog.functions.CACHE_RETURN_VALUE=!0;goog.functions.cacheReturnValue=function(a){var b=!1,c;return function(){if(!goog.functions.CACHE_RETURN_VALUE)return a();b||(c=a(),b=!0);return c}};goog.functions.once=function(a){var b=a;return function(){if(b){var a=b;b=null;a();}}};
    goog.functions.debounce=function(a,b,c){var d=0;return function(e){goog.global.clearTimeout(d);var f=arguments;d=goog.global.setTimeout(function(){a.apply(c,f);},b);}};goog.functions.throttle=function(a,b,c){var d=0,e=!1,f=[],g=function(){d=0;e&&(e=!1,h());},h=function(){d=goog.global.setTimeout(g,b);a.apply(c,f);};return function(a){f=arguments;d?e=!0:h();}};goog.functions.rateLimit=function(a,b,c){var d=0,e=function(){d=0;};return function(f){d||(d=goog.global.setTimeout(e,b),a.apply(c,arguments));}};goog.dom.safe={};goog.dom.safe.InsertAdjacentHtmlPosition={AFTERBEGIN:"afterbegin",AFTEREND:"afterend",BEFOREBEGIN:"beforebegin",BEFOREEND:"beforeend"};goog.dom.safe.insertAdjacentHtml=function(a,b,c){a.insertAdjacentHTML(b,goog.html.SafeHtml.unwrapTrustedHTML(c));};goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_={MATH:!0,SCRIPT:!0,STYLE:!0,SVG:!0,TEMPLATE:!0};
    goog.dom.safe.isInnerHtmlCleanupRecursive_=goog.functions.cacheReturnValue(function(){if(goog.DEBUG&&"undefined"===typeof document)return !1;var a=document.createElement("div"),b=document.createElement("div");b.appendChild(document.createElement("div"));a.appendChild(b);if(goog.DEBUG&&!a.firstChild)return !1;b=a.firstChild.firstChild;a.innerHTML=goog.html.SafeHtml.unwrapTrustedHTML(goog.html.SafeHtml.EMPTY);return !b.parentElement});
    goog.dom.safe.unsafeSetInnerHtmlDoNotUseOrElse=function(a,b){if(goog.dom.safe.isInnerHtmlCleanupRecursive_())for(;a.lastChild;)a.removeChild(a.lastChild);a.innerHTML=goog.html.SafeHtml.unwrapTrustedHTML(b);};
    goog.dom.safe.setInnerHtml=function(a,b){if(goog.asserts.ENABLE_ASSERTS){var c=a.tagName.toUpperCase();if(goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_[c])throw Error("goog.dom.safe.setInnerHtml cannot be used to set content of "+a.tagName+".");}goog.dom.safe.unsafeSetInnerHtmlDoNotUseOrElse(a,b);};goog.dom.safe.setOuterHtml=function(a,b){a.outerHTML=goog.html.SafeHtml.unwrapTrustedHTML(b);};
    goog.dom.safe.setFormElementAction=function(a,b){b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);goog.dom.asserts.assertIsHTMLFormElement(a).action=goog.html.SafeUrl.unwrapTrustedURL(b);};goog.dom.safe.setButtonFormAction=function(a,b){b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);goog.dom.asserts.assertIsHTMLButtonElement(a).formAction=goog.html.SafeUrl.unwrapTrustedURL(b);};
    goog.dom.safe.setInputFormAction=function(a,b){b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);goog.dom.asserts.assertIsHTMLInputElement(a).formAction=goog.html.SafeUrl.unwrapTrustedURL(b);};goog.dom.safe.setStyle=function(a,b){a.style.cssText=goog.html.SafeStyle.unwrap(b);};goog.dom.safe.documentWrite=function(a,b){a.write(goog.html.SafeHtml.unwrapTrustedHTML(b));};
    goog.dom.safe.setAnchorHref=function(a,b){goog.dom.asserts.assertIsHTMLAnchorElement(a);b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);a.href=goog.html.SafeUrl.unwrapTrustedURL(b);};goog.dom.safe.setImageSrc=function(a,b){goog.dom.asserts.assertIsHTMLImageElement(a);if(!(b instanceof goog.html.SafeUrl)){var c=/^data:image\//i.test(b);b=goog.html.SafeUrl.sanitizeAssertUnchanged(b,c);}a.src=goog.html.SafeUrl.unwrapTrustedURL(b);};
    goog.dom.safe.setAudioSrc=function(a,b){goog.dom.asserts.assertIsHTMLAudioElement(a);if(!(b instanceof goog.html.SafeUrl)){var c=/^data:audio\//i.test(b);b=goog.html.SafeUrl.sanitizeAssertUnchanged(b,c);}a.src=goog.html.SafeUrl.unwrapTrustedURL(b);};goog.dom.safe.setVideoSrc=function(a,b){goog.dom.asserts.assertIsHTMLVideoElement(a);if(!(b instanceof goog.html.SafeUrl)){var c=/^data:video\//i.test(b);b=goog.html.SafeUrl.sanitizeAssertUnchanged(b,c);}a.src=goog.html.SafeUrl.unwrapTrustedURL(b);};
    goog.dom.safe.setEmbedSrc=function(a,b){goog.dom.asserts.assertIsHTMLEmbedElement(a);a.src=goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(b);};goog.dom.safe.setFrameSrc=function(a,b){goog.dom.asserts.assertIsHTMLFrameElement(a);a.src=goog.html.TrustedResourceUrl.unwrapTrustedURL(b);};goog.dom.safe.setIframeSrc=function(a,b){goog.dom.asserts.assertIsHTMLIFrameElement(a);a.src=goog.html.TrustedResourceUrl.unwrapTrustedURL(b);};
    goog.dom.safe.setIframeSrcdoc=function(a,b){goog.dom.asserts.assertIsHTMLIFrameElement(a);a.srcdoc=goog.html.SafeHtml.unwrapTrustedHTML(b);};
    goog.dom.safe.setLinkHrefAndRel=function(a,b,c){goog.dom.asserts.assertIsHTMLLinkElement(a);a.rel=c;goog.string.internal.caseInsensitiveContains(c,"stylesheet")?(goog.asserts.assert(b instanceof goog.html.TrustedResourceUrl,'URL must be TrustedResourceUrl because "rel" contains "stylesheet"'),a.href=goog.html.TrustedResourceUrl.unwrapTrustedURL(b)):a.href=b instanceof goog.html.TrustedResourceUrl?goog.html.TrustedResourceUrl.unwrapTrustedURL(b):b instanceof goog.html.SafeUrl?goog.html.SafeUrl.unwrapTrustedURL(b):
    goog.html.SafeUrl.unwrapTrustedURL(goog.html.SafeUrl.sanitizeAssertUnchanged(b));};goog.dom.safe.setObjectData=function(a,b){goog.dom.asserts.assertIsHTMLObjectElement(a);a.data=goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(b);};goog.dom.safe.setScriptSrc=function(a,b){goog.dom.asserts.assertIsHTMLScriptElement(a);a.src=goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(b);(b=goog.getScriptNonce())&&a.setAttribute("nonce",b);};
    goog.dom.safe.setScriptContent=function(a,b){goog.dom.asserts.assertIsHTMLScriptElement(a);a.text=goog.html.SafeScript.unwrapTrustedScript(b);(b=goog.getScriptNonce())&&a.setAttribute("nonce",b);};goog.dom.safe.setLocationHref=function(a,b){goog.dom.asserts.assertIsLocation(a);b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);a.href=goog.html.SafeUrl.unwrapTrustedURL(b);};
    goog.dom.safe.assignLocation=function(a,b){goog.dom.asserts.assertIsLocation(a);b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);a.assign(goog.html.SafeUrl.unwrapTrustedURL(b));};goog.dom.safe.replaceLocation=function(a,b){goog.dom.asserts.assertIsLocation(a);b=b instanceof goog.html.SafeUrl?b:goog.html.SafeUrl.sanitizeAssertUnchanged(b);a.replace(goog.html.SafeUrl.unwrapTrustedURL(b));};
    goog.dom.safe.openInWindow=function(a,b,c,d,e){a=a instanceof goog.html.SafeUrl?a:goog.html.SafeUrl.sanitizeAssertUnchanged(a);return (b||goog.global).open(goog.html.SafeUrl.unwrapTrustedURL(a),c?goog.string.Const.unwrap(c):"",d,e)};goog.dom.safe.parseFromStringHtml=function(a,b){return goog.dom.safe.parseFromString(a,b,"text/html")};goog.dom.safe.parseFromString=function(a,b,c){return a.parseFromString(goog.html.SafeHtml.unwrapTrustedHTML(b),c)};
    goog.dom.safe.createImageFromBlob=function(a){if(!/^image\/.*/g.test(a.type))throw Error("goog.dom.safe.createImageFromBlob only accepts MIME type image/.*.");var b=goog.global.URL.createObjectURL(a);a=new goog.global.Image;a.onload=function(){goog.global.URL.revokeObjectURL(b);};goog.dom.safe.setImageSrc(a,goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Image blob URL."),b));return a};goog.string.DETECT_DOUBLE_ESCAPING=!1;goog.string.FORCE_NON_DOM_HTML_UNESCAPING=!1;goog.string.Unicode={NBSP:"\u00a0"};goog.string.startsWith=goog.string.internal.startsWith;goog.string.endsWith=goog.string.internal.endsWith;goog.string.caseInsensitiveStartsWith=goog.string.internal.caseInsensitiveStartsWith;goog.string.caseInsensitiveEndsWith=goog.string.internal.caseInsensitiveEndsWith;goog.string.caseInsensitiveEquals=goog.string.internal.caseInsensitiveEquals;
    goog.string.subs=function(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};goog.string.collapseWhitespace=function(a){return a.replace(/[\s\xa0]+/g," ").replace(/^\s+|\s+$/g,"")};goog.string.isEmptyOrWhitespace=goog.string.internal.isEmptyOrWhitespace;goog.string.isEmptyString=function(a){return 0==a.length};goog.string.isEmpty=goog.string.isEmptyOrWhitespace;goog.string.isEmptyOrWhitespaceSafe=function(a){return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(a))};
    goog.string.isEmptySafe=goog.string.isEmptyOrWhitespaceSafe;goog.string.isBreakingWhitespace=function(a){return !/[^\t\n\r ]/.test(a)};goog.string.isAlpha=function(a){return !/[^a-zA-Z]/.test(a)};goog.string.isNumeric=function(a){return !/[^0-9]/.test(a)};goog.string.isAlphaNumeric=function(a){return !/[^a-zA-Z0-9]/.test(a)};goog.string.isSpace=function(a){return " "==a};goog.string.isUnicodeChar=function(a){return 1==a.length&&" "<=a&&"~">=a||"\u0080"<=a&&"\ufffd">=a};
    goog.string.stripNewlines=function(a){return a.replace(/(\r\n|\r|\n)+/g," ")};goog.string.canonicalizeNewlines=function(a){return a.replace(/(\r\n|\r|\n)/g,"\n")};goog.string.normalizeWhitespace=function(a){return a.replace(/\xa0|\s/g," ")};goog.string.normalizeSpaces=function(a){return a.replace(/\xa0|[ \t]+/g," ")};goog.string.collapseBreakingSpaces=function(a){return a.replace(/[\t\r\n ]+/g," ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g,"")};goog.string.trim=goog.string.internal.trim;
    goog.string.trimLeft=function(a){return a.replace(/^[\s\xa0]+/,"")};goog.string.trimRight=function(a){return a.replace(/[\s\xa0]+$/,"")};goog.string.caseInsensitiveCompare=goog.string.internal.caseInsensitiveCompare;
    goog.string.numberAwareCompare_=function(a,b,c){if(a==b)return 0;if(!a)return -1;if(!b)return 1;for(var d=a.toLowerCase().match(c),e=b.toLowerCase().match(c),f=Math.min(d.length,e.length),g=0;g<f;g++){c=d[g];var h=e[g];if(c!=h)return a=parseInt(c,10),!isNaN(a)&&(b=parseInt(h,10),!isNaN(b)&&a-b)?a-b:c<h?-1:1}return d.length!=e.length?d.length-e.length:a<b?-1:1};goog.string.intAwareCompare=function(a,b){return goog.string.numberAwareCompare_(a,b,/\d+|\D+/g)};
    goog.string.floatAwareCompare=function(a,b){return goog.string.numberAwareCompare_(a,b,/\d+|\.\d+|\D+/g)};goog.string.numerateCompare=goog.string.floatAwareCompare;goog.string.urlEncode=function(a){return encodeURIComponent(String(a))};goog.string.urlDecode=function(a){return decodeURIComponent(a.replace(/\+/g," "))};goog.string.newLineToBr=goog.string.internal.newLineToBr;
    goog.string.htmlEscape=function(a,b){a=goog.string.internal.htmlEscape(a,b);goog.string.DETECT_DOUBLE_ESCAPING&&(a=a.replace(goog.string.E_RE_,"&#101;"));return a};goog.string.E_RE_=/e/g;goog.string.unescapeEntities=function(a){return goog.string.contains(a,"&")?!goog.string.FORCE_NON_DOM_HTML_UNESCAPING&&"document"in goog.global?goog.string.unescapeEntitiesUsingDom_(a):goog.string.unescapePureXmlEntities_(a):a};
    goog.string.unescapeEntitiesWithDocument=function(a,b){return goog.string.contains(a,"&")?goog.string.unescapeEntitiesUsingDom_(a,b):a};
    goog.string.unescapeEntitiesUsingDom_=function(a,b){var c={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"'};var d=b?b.createElement("div"):goog.global.document.createElement("div");return a.replace(goog.string.HTML_ENTITY_PATTERN_,function(a,b){var e=c[a];if(e)return e;"#"==b.charAt(0)&&(b=Number("0"+b.substr(1)),isNaN(b)||(e=String.fromCharCode(b)));e||(goog.dom.safe.setInnerHtml(d,goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Single HTML entity."),
    a+" ")),e=d.firstChild.nodeValue.slice(0,-1));return c[a]=e})};goog.string.unescapePureXmlEntities_=function(a){return a.replace(/&([^;]+);/g,function(a,c){switch(c){case "amp":return "&";case "lt":return "<";case "gt":return ">";case "quot":return '"';default:return "#"!=c.charAt(0)||(c=Number("0"+c.substr(1)),isNaN(c))?a:String.fromCharCode(c)}})};goog.string.HTML_ENTITY_PATTERN_=/&([^;\s<&]+);?/g;goog.string.whitespaceEscape=function(a,b){return goog.string.newLineToBr(a.replace(/  /g," &#160;"),b)};
    goog.string.preserveSpaces=function(a){return a.replace(/(^|[\n ]) /g,"$1"+goog.string.Unicode.NBSP)};goog.string.stripQuotes=function(a,b){for(var c=b.length,d=0;d<c;d++){var e=1==c?b:b.charAt(d);if(a.charAt(0)==e&&a.charAt(a.length-1)==e)return a.substring(1,a.length-1)}return a};goog.string.truncate=function(a,b,c){c&&(a=goog.string.unescapeEntities(a));a.length>b&&(a=a.substring(0,b-3)+"...");c&&(a=goog.string.htmlEscape(a));return a};
    goog.string.truncateMiddle=function(a,b,c,d){c&&(a=goog.string.unescapeEntities(a));if(d&&a.length>b){d>b&&(d=b);var e=a.length-d;a=a.substring(0,b-d)+"..."+a.substring(e);}else a.length>b&&(d=Math.floor(b/2),e=a.length-d,a=a.substring(0,d+b%2)+"..."+a.substring(e));c&&(a=goog.string.htmlEscape(a));return a};goog.string.specialEscapeChars_={"\x00":"\\0","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\x0B":"\\x0B",'"':'\\"',"\\":"\\\\","<":"\\u003C"};goog.string.jsEscapeCache_={"'":"\\'"};
    goog.string.quote=function(a){a=String(a);for(var b=['"'],c=0;c<a.length;c++){var d=a.charAt(c),e=d.charCodeAt(0);b[c+1]=goog.string.specialEscapeChars_[d]||(31<e&&127>e?d:goog.string.escapeChar(d));}b.push('"');return b.join("")};goog.string.escapeString=function(a){for(var b=[],c=0;c<a.length;c++)b[c]=goog.string.escapeChar(a.charAt(c));return b.join("")};
    goog.string.escapeChar=function(a){if(a in goog.string.jsEscapeCache_)return goog.string.jsEscapeCache_[a];if(a in goog.string.specialEscapeChars_)return goog.string.jsEscapeCache_[a]=goog.string.specialEscapeChars_[a];var b=a.charCodeAt(0);if(31<b&&127>b)var c=a;else {if(256>b){if(c="\\x",16>b||256<b)c+="0";}else c="\\u",4096>b&&(c+="0");c+=b.toString(16).toUpperCase();}return goog.string.jsEscapeCache_[a]=c};goog.string.contains=goog.string.internal.contains;goog.string.caseInsensitiveContains=goog.string.internal.caseInsensitiveContains;
    goog.string.countOf=function(a,b){return a&&b?a.split(b).length-1:0};goog.string.removeAt=function(a,b,c){var d=a;0<=b&&b<a.length&&0<c&&(d=a.substr(0,b)+a.substr(b+c,a.length-b-c));return d};goog.string.remove=function(a,b){return a.replace(b,"")};goog.string.removeAll=function(a,b){b=new RegExp(goog.string.regExpEscape(b),"g");return a.replace(b,"")};goog.string.replaceAll=function(a,b,c){b=new RegExp(goog.string.regExpEscape(b),"g");return a.replace(b,c.replace(/\$/g,"$$$$"))};
    goog.string.regExpEscape=function(a){return String(a).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08")};goog.string.repeat=String.prototype.repeat?function(a,b){return a.repeat(b)}:function(a,b){return Array(b+1).join(a)};goog.string.padNumber=function(a,b,c){a=goog.isDef(c)?a.toFixed(c):String(a);c=a.indexOf(".");-1==c&&(c=a.length);return goog.string.repeat("0",Math.max(0,b-c))+a};goog.string.makeSafe=function(a){return null==a?"":String(a)};
    goog.string.buildString=function(a){return Array.prototype.join.call(arguments,"")};goog.string.getRandomString=function(){return Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^goog.now()).toString(36)};goog.string.compareVersions=goog.string.internal.compareVersions;goog.string.hashCode=function(a){for(var b=0,c=0;c<a.length;++c)b=31*b+a.charCodeAt(c)>>>0;return b};goog.string.uniqueStringCounter_=2147483648*Math.random()|0;
    goog.string.createUniqueString=function(){return "goog_"+goog.string.uniqueStringCounter_++};goog.string.toNumber=function(a){var b=Number(a);return 0==b&&goog.string.isEmptyOrWhitespace(a)?NaN:b};goog.string.isLowerCamelCase=function(a){return /^[a-z]+([A-Z][a-z]*)*$/.test(a)};goog.string.isUpperCamelCase=function(a){return /^([A-Z][a-z]*)+$/.test(a)};goog.string.toCamelCase=function(a){return String(a).replace(/\-([a-z])/g,function(a,c){return c.toUpperCase()})};
    goog.string.toSelectorCase=function(a){return String(a).replace(/([A-Z])/g,"-$1").toLowerCase()};goog.string.toTitleCase=function(a,b){b=goog.isString(b)?goog.string.regExpEscape(b):"\\s";return a.replace(new RegExp("(^"+(b?"|["+b+"]+":"")+")([a-z])","g"),function(a,b,e){return b+e.toUpperCase()})};goog.string.capitalize=function(a){return String(a.charAt(0)).toUpperCase()+String(a.substr(1)).toLowerCase()};
    goog.string.parseInt=function(a){isFinite(a)&&(a=String(a));return goog.isString(a)?/^\s*-?0x/i.test(a)?parseInt(a,16):parseInt(a,10):NaN};goog.string.splitLimit=function(a,b,c){a=a.split(b);for(var d=[];0<c&&a.length;)d.push(a.shift()),c--;a.length&&d.push(a.join(b));return d};goog.string.lastComponent=function(a,b){if(b)"string"==typeof b&&(b=[b]);else return a;for(var c=-1,d=0;d<b.length;d++)if(""!=b[d]){var e=a.lastIndexOf(b[d]);e>c&&(c=e);}return -1==c?a:a.slice(c+1)};
    goog.string.editDistance=function(a,b){var c=[],d=[];if(a==b)return 0;if(!a.length||!b.length)return Math.max(a.length,b.length);for(var e=0;e<b.length+1;e++)c[e]=e;for(e=0;e<a.length;e++){d[0]=e+1;for(var f=0;f<b.length;f++)d[f+1]=Math.min(d[f]+1,c[f+1]+1,c[f]+Number(a[e]!=b[f]));for(f=0;f<c.length;f++)c[f]=d[f];}return d[b.length]};goog.labs.userAgent.platform={};goog.labs.userAgent.platform.isAndroid=function(){return goog.labs.userAgent.util.matchUserAgent("Android")};goog.labs.userAgent.platform.isIpod=function(){return goog.labs.userAgent.util.matchUserAgent("iPod")};goog.labs.userAgent.platform.isIphone=function(){return goog.labs.userAgent.util.matchUserAgent("iPhone")&&!goog.labs.userAgent.util.matchUserAgent("iPod")&&!goog.labs.userAgent.util.matchUserAgent("iPad")};goog.labs.userAgent.platform.isIpad=function(){return goog.labs.userAgent.util.matchUserAgent("iPad")};
    goog.labs.userAgent.platform.isIos=function(){return goog.labs.userAgent.platform.isIphone()||goog.labs.userAgent.platform.isIpad()||goog.labs.userAgent.platform.isIpod()};goog.labs.userAgent.platform.isMacintosh=function(){return goog.labs.userAgent.util.matchUserAgent("Macintosh")};goog.labs.userAgent.platform.isLinux=function(){return goog.labs.userAgent.util.matchUserAgent("Linux")};goog.labs.userAgent.platform.isWindows=function(){return goog.labs.userAgent.util.matchUserAgent("Windows")};
    goog.labs.userAgent.platform.isChromeOS=function(){return goog.labs.userAgent.util.matchUserAgent("CrOS")};goog.labs.userAgent.platform.isChromecast=function(){return goog.labs.userAgent.util.matchUserAgent("CrKey")};goog.labs.userAgent.platform.isKaiOS=function(){return goog.labs.userAgent.util.matchUserAgentIgnoreCase("KaiOS")};goog.labs.userAgent.platform.isGo2Phone=function(){return goog.labs.userAgent.util.matchUserAgentIgnoreCase("GAFP")};
    goog.labs.userAgent.platform.getVersion=function(){var a=goog.labs.userAgent.util.getUserAgent(),b="";goog.labs.userAgent.platform.isWindows()?(b=/Windows (?:NT|Phone) ([0-9.]+)/,b=(a=b.exec(a))?a[1]:"0.0"):goog.labs.userAgent.platform.isIos()?(b=/(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/,b=(a=b.exec(a))&&a[1].replace(/_/g,".")):goog.labs.userAgent.platform.isMacintosh()?(b=/Mac OS X ([0-9_.]+)/,b=(a=b.exec(a))?a[1].replace(/_/g,"."):"10"):goog.labs.userAgent.platform.isKaiOS()?(b=/(?:KaiOS)\/(\S+)/i,
    b=(a=b.exec(a))&&a[1]):goog.labs.userAgent.platform.isAndroid()?(b=/Android\s+([^\);]+)(\)|;)/,b=(a=b.exec(a))&&a[1]):goog.labs.userAgent.platform.isChromeOS()&&(b=/(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/,b=(a=b.exec(a))&&a[1]);return b||""};goog.labs.userAgent.platform.isVersionOrHigher=function(a){return 0<=goog.string.compareVersions(goog.labs.userAgent.platform.getVersion(),a)};goog.reflect={};goog.reflect.object=function(a,b){return b};goog.reflect.objectProperty=function(a,b){return a};goog.reflect.sinkValue=function(a){goog.reflect.sinkValue[" "](a);return a};goog.reflect.sinkValue[" "]=goog.nullFunction;goog.reflect.canAccessProperty=function(a,b){try{return goog.reflect.sinkValue(a[b]),!0}catch(c){}return !1};goog.reflect.cache=function(a,b,c,d){d=d?d(b):b;return Object.prototype.hasOwnProperty.call(a,d)?a[d]:a[d]=c(b)};goog.labs.userAgent.engine={};goog.labs.userAgent.engine.isPresto=function(){return goog.labs.userAgent.util.matchUserAgent("Presto")};goog.labs.userAgent.engine.isTrident=function(){return goog.labs.userAgent.util.matchUserAgent("Trident")||goog.labs.userAgent.util.matchUserAgent("MSIE")};goog.labs.userAgent.engine.isEdge=function(){return goog.labs.userAgent.util.matchUserAgent("Edge")};
    goog.labs.userAgent.engine.isWebKit=function(){return goog.labs.userAgent.util.matchUserAgentIgnoreCase("WebKit")&&!goog.labs.userAgent.engine.isEdge()};goog.labs.userAgent.engine.isGecko=function(){return goog.labs.userAgent.util.matchUserAgent("Gecko")&&!goog.labs.userAgent.engine.isWebKit()&&!goog.labs.userAgent.engine.isTrident()&&!goog.labs.userAgent.engine.isEdge()};
    goog.labs.userAgent.engine.getVersion=function(){var a=goog.labs.userAgent.util.getUserAgent();if(a){a=goog.labs.userAgent.util.extractVersionTuples(a);var b=goog.labs.userAgent.engine.getEngineTuple_(a);if(b)return "Gecko"==b[0]?goog.labs.userAgent.engine.getVersionForKey_(a,"Firefox"):b[1];a=a[0];var c;if(a&&(c=a[2])&&(c=/Trident\/([^\s;]+)/.exec(c)))return c[1]}return ""};
    goog.labs.userAgent.engine.getEngineTuple_=function(a){if(!goog.labs.userAgent.engine.isEdge())return a[1];for(var b=0;b<a.length;b++){var c=a[b];if("Edge"==c[0])return c}};goog.labs.userAgent.engine.isVersionOrHigher=function(a){return 0<=goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(),a)};goog.labs.userAgent.engine.getVersionForKey_=function(a,b){return (a=goog.array.find(a,function(a){return b==a[0]}))&&a[1]||""};goog.userAgent={};goog.userAgent.ASSUME_IE=!1;goog.userAgent.ASSUME_EDGE=!1;goog.userAgent.ASSUME_GECKO=!1;goog.userAgent.ASSUME_WEBKIT=!1;goog.userAgent.ASSUME_MOBILE_WEBKIT=!1;goog.userAgent.ASSUME_OPERA=!1;goog.userAgent.ASSUME_ANY_VERSION=!1;goog.userAgent.BROWSER_KNOWN_=goog.userAgent.ASSUME_IE||goog.userAgent.ASSUME_EDGE||goog.userAgent.ASSUME_GECKO||goog.userAgent.ASSUME_MOBILE_WEBKIT||goog.userAgent.ASSUME_WEBKIT||goog.userAgent.ASSUME_OPERA;goog.userAgent.getUserAgentString=function(){return goog.labs.userAgent.util.getUserAgent()};
    goog.userAgent.getNavigatorTyped=function(){return goog.global.navigator||null};goog.userAgent.getNavigator=function(){return goog.userAgent.getNavigatorTyped()};goog.userAgent.OPERA=goog.userAgent.BROWSER_KNOWN_?goog.userAgent.ASSUME_OPERA:goog.labs.userAgent.browser.isOpera();goog.userAgent.IE=goog.userAgent.BROWSER_KNOWN_?goog.userAgent.ASSUME_IE:goog.labs.userAgent.browser.isIE();goog.userAgent.EDGE=goog.userAgent.BROWSER_KNOWN_?goog.userAgent.ASSUME_EDGE:goog.labs.userAgent.engine.isEdge();
    goog.userAgent.EDGE_OR_IE=goog.userAgent.EDGE||goog.userAgent.IE;goog.userAgent.GECKO=goog.userAgent.BROWSER_KNOWN_?goog.userAgent.ASSUME_GECKO:goog.labs.userAgent.engine.isGecko();goog.userAgent.WEBKIT=goog.userAgent.BROWSER_KNOWN_?goog.userAgent.ASSUME_WEBKIT||goog.userAgent.ASSUME_MOBILE_WEBKIT:goog.labs.userAgent.engine.isWebKit();goog.userAgent.isMobile_=function(){return goog.userAgent.WEBKIT&&goog.labs.userAgent.util.matchUserAgent("Mobile")};
    goog.userAgent.MOBILE=goog.userAgent.ASSUME_MOBILE_WEBKIT||goog.userAgent.isMobile_();goog.userAgent.SAFARI=goog.userAgent.WEBKIT;goog.userAgent.determinePlatform_=function(){var a=goog.userAgent.getNavigatorTyped();return a&&a.platform||""};goog.userAgent.PLATFORM=goog.userAgent.determinePlatform_();goog.userAgent.ASSUME_MAC=!1;goog.userAgent.ASSUME_WINDOWS=!1;goog.userAgent.ASSUME_LINUX=!1;goog.userAgent.ASSUME_X11=!1;goog.userAgent.ASSUME_ANDROID=!1;goog.userAgent.ASSUME_IPHONE=!1;
    goog.userAgent.ASSUME_IPAD=!1;goog.userAgent.ASSUME_IPOD=!1;goog.userAgent.ASSUME_KAIOS=!1;goog.userAgent.ASSUME_GO2PHONE=!1;goog.userAgent.PLATFORM_KNOWN_=goog.userAgent.ASSUME_MAC||goog.userAgent.ASSUME_WINDOWS||goog.userAgent.ASSUME_LINUX||goog.userAgent.ASSUME_X11||goog.userAgent.ASSUME_ANDROID||goog.userAgent.ASSUME_IPHONE||goog.userAgent.ASSUME_IPAD||goog.userAgent.ASSUME_IPOD;goog.userAgent.MAC=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_MAC:goog.labs.userAgent.platform.isMacintosh();
    goog.userAgent.WINDOWS=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_WINDOWS:goog.labs.userAgent.platform.isWindows();goog.userAgent.isLegacyLinux_=function(){return goog.labs.userAgent.platform.isLinux()||goog.labs.userAgent.platform.isChromeOS()};goog.userAgent.LINUX=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_LINUX:goog.userAgent.isLegacyLinux_();goog.userAgent.isX11_=function(){var a=goog.userAgent.getNavigatorTyped();return !!a&&goog.string.contains(a.appVersion||"","X11")};
    goog.userAgent.X11=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_X11:goog.userAgent.isX11_();goog.userAgent.ANDROID=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_ANDROID:goog.labs.userAgent.platform.isAndroid();goog.userAgent.IPHONE=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_IPHONE:goog.labs.userAgent.platform.isIphone();goog.userAgent.IPAD=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_IPAD:goog.labs.userAgent.platform.isIpad();
    goog.userAgent.IPOD=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_IPOD:goog.labs.userAgent.platform.isIpod();goog.userAgent.IOS=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_IPHONE||goog.userAgent.ASSUME_IPAD||goog.userAgent.ASSUME_IPOD:goog.labs.userAgent.platform.isIos();goog.userAgent.KAIOS=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_KAIOS:goog.labs.userAgent.platform.isKaiOS();goog.userAgent.GO2PHONE=goog.userAgent.PLATFORM_KNOWN_?goog.userAgent.ASSUME_GO2PHONE:goog.labs.userAgent.platform.isGo2Phone();
    goog.userAgent.determineVersion_=function(){var a="",b=goog.userAgent.getVersionRegexResult_();b&&(a=b?b[1]:"");return goog.userAgent.IE&&(b=goog.userAgent.getDocumentMode_(),null!=b&&b>parseFloat(a))?String(b):a};
    goog.userAgent.getVersionRegexResult_=function(){var a=goog.userAgent.getUserAgentString();if(goog.userAgent.GECKO)return /rv:([^\);]+)(\)|;)/.exec(a);if(goog.userAgent.EDGE)return /Edge\/([\d\.]+)/.exec(a);if(goog.userAgent.IE)return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(goog.userAgent.WEBKIT)return /WebKit\/(\S+)/.exec(a);if(goog.userAgent.OPERA)return /(?:Version)[ \/]?(\S+)/.exec(a)};goog.userAgent.getDocumentMode_=function(){var a=goog.global.document;return a?a.documentMode:void 0};
    goog.userAgent.VERSION=goog.userAgent.determineVersion_();goog.userAgent.compare=function(a,b){return goog.string.compareVersions(a,b)};goog.userAgent.isVersionOrHigherCache_={};goog.userAgent.isVersionOrHigher=function(a){return goog.userAgent.ASSUME_ANY_VERSION||goog.reflect.cache(goog.userAgent.isVersionOrHigherCache_,a,function(){return 0<=goog.string.compareVersions(goog.userAgent.VERSION,a)})};goog.userAgent.isVersion=goog.userAgent.isVersionOrHigher;
    goog.userAgent.isDocumentModeOrHigher=function(a){return Number(goog.userAgent.DOCUMENT_MODE)>=a};goog.userAgent.isDocumentMode=goog.userAgent.isDocumentModeOrHigher;goog.userAgent.DOCUMENT_MODE=function(){if(goog.global.document&&goog.userAgent.IE)return goog.userAgent.getDocumentMode_()}();goog.userAgent.product={};goog.userAgent.product.ASSUME_FIREFOX=!1;goog.userAgent.product.ASSUME_IPHONE=!1;goog.userAgent.product.ASSUME_IPAD=!1;goog.userAgent.product.ASSUME_ANDROID=!1;goog.userAgent.product.ASSUME_CHROME=!1;goog.userAgent.product.ASSUME_SAFARI=!1;
    goog.userAgent.product.PRODUCT_KNOWN_=goog.userAgent.ASSUME_IE||goog.userAgent.ASSUME_EDGE||goog.userAgent.ASSUME_OPERA||goog.userAgent.product.ASSUME_FIREFOX||goog.userAgent.product.ASSUME_IPHONE||goog.userAgent.product.ASSUME_IPAD||goog.userAgent.product.ASSUME_ANDROID||goog.userAgent.product.ASSUME_CHROME||goog.userAgent.product.ASSUME_SAFARI;goog.userAgent.product.OPERA=goog.userAgent.OPERA;goog.userAgent.product.IE=goog.userAgent.IE;goog.userAgent.product.EDGE=goog.userAgent.EDGE;
    goog.userAgent.product.FIREFOX=goog.userAgent.product.PRODUCT_KNOWN_?goog.userAgent.product.ASSUME_FIREFOX:goog.labs.userAgent.browser.isFirefox();goog.userAgent.product.isIphoneOrIpod_=function(){return goog.labs.userAgent.platform.isIphone()||goog.labs.userAgent.platform.isIpod()};goog.userAgent.product.IPHONE=goog.userAgent.product.PRODUCT_KNOWN_?goog.userAgent.product.ASSUME_IPHONE:goog.userAgent.product.isIphoneOrIpod_();
    goog.userAgent.product.IPAD=goog.userAgent.product.PRODUCT_KNOWN_?goog.userAgent.product.ASSUME_IPAD:goog.labs.userAgent.platform.isIpad();goog.userAgent.product.ANDROID=goog.userAgent.product.PRODUCT_KNOWN_?goog.userAgent.product.ASSUME_ANDROID:goog.labs.userAgent.browser.isAndroidBrowser();goog.userAgent.product.CHROME=goog.userAgent.product.PRODUCT_KNOWN_?goog.userAgent.product.ASSUME_CHROME:goog.labs.userAgent.browser.isChrome();
    goog.userAgent.product.isSafariDesktop_=function(){return goog.labs.userAgent.browser.isSafari()&&!goog.labs.userAgent.platform.isIos()};goog.userAgent.product.SAFARI=goog.userAgent.product.PRODUCT_KNOWN_?goog.userAgent.product.ASSUME_SAFARI:goog.userAgent.product.isSafariDesktop_();goog.crypt.base64={};goog.crypt.base64.DEFAULT_ALPHABET_COMMON_="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";goog.crypt.base64.ENCODED_VALS=goog.crypt.base64.DEFAULT_ALPHABET_COMMON_+"+/=";goog.crypt.base64.ENCODED_VALS_WEBSAFE=goog.crypt.base64.DEFAULT_ALPHABET_COMMON_+"-_.";goog.crypt.base64.Alphabet={DEFAULT:0,NO_PADDING:1,WEBSAFE:2,WEBSAFE_DOT_PADDING:3,WEBSAFE_NO_PADDING:4};goog.crypt.base64.paddingChars_="=.";
    goog.crypt.base64.isPadding_=function(a){return goog.string.contains(goog.crypt.base64.paddingChars_,a)};goog.crypt.base64.byteToCharMaps_={};goog.crypt.base64.charToByteMap_=null;goog.crypt.base64.ASSUME_NATIVE_SUPPORT_=goog.userAgent.GECKO||goog.userAgent.WEBKIT&&!goog.userAgent.product.SAFARI||goog.userAgent.OPERA;goog.crypt.base64.HAS_NATIVE_ENCODE_=goog.crypt.base64.ASSUME_NATIVE_SUPPORT_||"function"==typeof goog.global.btoa;
    goog.crypt.base64.HAS_NATIVE_DECODE_=goog.crypt.base64.ASSUME_NATIVE_SUPPORT_||!goog.userAgent.product.SAFARI&&!goog.userAgent.IE&&"function"==typeof goog.global.atob;
    goog.crypt.base64.encodeByteArray=function(a,b){goog.asserts.assert(goog.isArrayLike(a),"encodeByteArray takes an array as a parameter");void 0===b&&(b=goog.crypt.base64.Alphabet.DEFAULT);goog.crypt.base64.init_();b=goog.crypt.base64.byteToCharMaps_[b];for(var c=[],d=0;d<a.length;d+=3){var e=a[d],f=d+1<a.length,g=f?a[d+1]:0,h=d+2<a.length,k=h?a[d+2]:0,l=e>>2;e=(e&3)<<4|g>>4;g=(g&15)<<2|k>>6;k&=63;h||(k=64,f||(g=64));c.push(b[l],b[e],b[g]||"",b[k]||"");}return c.join("")};
    goog.crypt.base64.encodeString=function(a,b){return goog.crypt.base64.HAS_NATIVE_ENCODE_&&!b?goog.global.btoa(a):goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(a),b)};goog.crypt.base64.decodeString=function(a,b){if(goog.crypt.base64.HAS_NATIVE_DECODE_&&!b)return goog.global.atob(a);var c="";goog.crypt.base64.decodeStringInternal_(a,function(a){c+=String.fromCharCode(a);});return c};
    goog.crypt.base64.decodeStringToByteArray=function(a,b){var c=[];goog.crypt.base64.decodeStringInternal_(a,function(a){c.push(a);});return c};
    goog.crypt.base64.decodeStringToUint8Array=function(a){goog.asserts.assert(!goog.userAgent.IE||goog.userAgent.isVersionOrHigher("10"),"Browser does not support typed arrays");var b=a.length,c=3*b/4;c%3?c=Math.floor(c):goog.crypt.base64.isPadding_(a[b-1])&&(c=goog.crypt.base64.isPadding_(a[b-2])?c-2:c-1);var d=new Uint8Array(c),e=0;goog.crypt.base64.decodeStringInternal_(a,function(a){d[e++]=a;});return d.subarray(0,e)};
    goog.crypt.base64.decodeStringInternal_=function(a,b){function c(b){for(;d<a.length;){var c=a.charAt(d++),e=goog.crypt.base64.charToByteMap_[c];if(null!=e)return e;if(!goog.string.isEmptyOrWhitespace(c))throw Error("Unknown base64 encoding at char: "+c);}return b}goog.crypt.base64.init_();for(var d=0;;){var e=c(-1),f=c(0),g=c(64),h=c(64);if(64===h&&-1===e)break;b(e<<2|f>>4);64!=g&&(b(f<<4&240|g>>2),64!=h&&b(g<<6&192|h));}};
    goog.crypt.base64.init_=function(){if(!goog.crypt.base64.charToByteMap_){goog.crypt.base64.charToByteMap_={};for(var a=goog.crypt.base64.DEFAULT_ALPHABET_COMMON_.split(""),b=["+/=","+/","-_=","-_.","-_"],c=0;5>c;c++){var d=a.concat(b[c].split(""));goog.crypt.base64.byteToCharMaps_[c]=d;for(var e=0;e<d.length;e++){var f=d[e],g=goog.crypt.base64.charToByteMap_[f];void 0===g?goog.crypt.base64.charToByteMap_[f]=e:goog.asserts.assert(g===e);}}}};jspb.utils={};jspb.utils.split64Low=0;jspb.utils.split64High=0;jspb.utils.splitUint64=function(a){var b=a>>>0;a=Math.floor((a-b)/jspb.BinaryConstants.TWO_TO_32)>>>0;jspb.utils.split64Low=b;jspb.utils.split64High=a;};jspb.utils.splitInt64=function(a){var b=0>a;a=Math.abs(a);var c=a>>>0;a=Math.floor((a-c)/jspb.BinaryConstants.TWO_TO_32);a>>>=0;b&&(a=~a>>>0,c=(~c>>>0)+1,4294967295<c&&(c=0,a++,4294967295<a&&(a=0)));jspb.utils.split64Low=c;jspb.utils.split64High=a;};
    jspb.utils.splitZigzag64=function(a){var b=0>a;a=2*Math.abs(a);jspb.utils.splitUint64(a);a=jspb.utils.split64Low;var c=jspb.utils.split64High;b&&(0==a?0==c?c=a=4294967295:(c--,a=4294967295):a--);jspb.utils.split64Low=a;jspb.utils.split64High=c;};
    jspb.utils.splitFloat32=function(a){var b=0>a?1:0;a=b?-a:a;if(0===a)0<1/a?(jspb.utils.split64High=0,jspb.utils.split64Low=0):(jspb.utils.split64High=0,jspb.utils.split64Low=2147483648);else if(isNaN(a))jspb.utils.split64High=0,jspb.utils.split64Low=2147483647;else if(a>jspb.BinaryConstants.FLOAT32_MAX)jspb.utils.split64High=0,jspb.utils.split64Low=(b<<31|2139095040)>>>0;else if(a<jspb.BinaryConstants.FLOAT32_MIN)a=Math.round(a/Math.pow(2,-149)),jspb.utils.split64High=0,jspb.utils.split64Low=(b<<31|
    a)>>>0;else {var c=Math.floor(Math.log(a)/Math.LN2);a*=Math.pow(2,-c);a=Math.round(a*jspb.BinaryConstants.TWO_TO_23)&8388607;jspb.utils.split64High=0;jspb.utils.split64Low=(b<<31|c+127<<23|a)>>>0;}};
    jspb.utils.splitFloat64=function(a){var b=0>a?1:0;a=b?-a:a;if(0===a)jspb.utils.split64High=0<1/a?0:2147483648,jspb.utils.split64Low=0;else if(isNaN(a))jspb.utils.split64High=2147483647,jspb.utils.split64Low=4294967295;else if(a>jspb.BinaryConstants.FLOAT64_MAX)jspb.utils.split64High=(b<<31|2146435072)>>>0,jspb.utils.split64Low=0;else if(a<jspb.BinaryConstants.FLOAT64_MIN){var c=a/Math.pow(2,-1074);a=c/jspb.BinaryConstants.TWO_TO_32;jspb.utils.split64High=(b<<31|a)>>>0;jspb.utils.split64Low=c>>>0;}else {c=
    a;var d=0;if(2<=c)for(;2<=c&&1023>d;)d++,c/=2;else for(;1>c&&-1022<d;)c*=2,d--;c=a*Math.pow(2,-d);a=c*jspb.BinaryConstants.TWO_TO_20&1048575;c=c*jspb.BinaryConstants.TWO_TO_52>>>0;jspb.utils.split64High=(b<<31|d+1023<<20|a)>>>0;jspb.utils.split64Low=c;}};
    jspb.utils.splitHash64=function(a){var b=a.charCodeAt(0),c=a.charCodeAt(1),d=a.charCodeAt(2),e=a.charCodeAt(3),f=a.charCodeAt(4),g=a.charCodeAt(5),h=a.charCodeAt(6);a=a.charCodeAt(7);jspb.utils.split64Low=b+(c<<8)+(d<<16)+(e<<24)>>>0;jspb.utils.split64High=f+(g<<8)+(h<<16)+(a<<24)>>>0;};jspb.utils.joinUint64=function(a,b){return b*jspb.BinaryConstants.TWO_TO_32+(a>>>0)};
    jspb.utils.joinInt64=function(a,b){var c=b&2147483648;c&&(a=~a+1>>>0,b=~b>>>0,0==a&&(b=b+1>>>0));a=jspb.utils.joinUint64(a,b);return c?-a:a};jspb.utils.toZigzag64=function(a,b,c){var d=b>>31;return c(a<<1^d,(b<<1|a>>>31)^d)};jspb.utils.joinZigzag64=function(a,b){return jspb.utils.fromZigzag64(a,b,jspb.utils.joinInt64)};jspb.utils.fromZigzag64=function(a,b,c){var d=-(a&1);return c((a>>>1|b<<31)^d,b>>>1^d)};
    jspb.utils.joinFloat32=function(a,b){b=2*(a>>31)+1;var c=a>>>23&255;a&=8388607;return 255==c?a?NaN:Infinity*b:0==c?b*Math.pow(2,-149)*a:b*Math.pow(2,c-150)*(a+Math.pow(2,23))};jspb.utils.joinFloat64=function(a,b){var c=2*(b>>31)+1,d=b>>>20&2047;a=jspb.BinaryConstants.TWO_TO_32*(b&1048575)+a;return 2047==d?a?NaN:Infinity*c:0==d?c*Math.pow(2,-1074)*a:c*Math.pow(2,d-1075)*(a+jspb.BinaryConstants.TWO_TO_52)};
    jspb.utils.joinHash64=function(a,b){return String.fromCharCode(a>>>0&255,a>>>8&255,a>>>16&255,a>>>24&255,b>>>0&255,b>>>8&255,b>>>16&255,b>>>24&255)};jspb.utils.DIGITS="0123456789abcdef".split("");jspb.utils.ZERO_CHAR_CODE_=48;jspb.utils.A_CHAR_CODE_=97;
    jspb.utils.joinUnsignedDecimalString=function(a,b){function c(a,b){a=a?String(a):"";return b?"0000000".slice(a.length)+a:a}if(2097151>=b)return ""+(jspb.BinaryConstants.TWO_TO_32*b+a);var d=(a>>>24|b<<8)>>>0&16777215;b=b>>16&65535;a=(a&16777215)+6777216*d+6710656*b;d+=8147497*b;b*=2;1E7<=a&&(d+=Math.floor(a/1E7),a%=1E7);1E7<=d&&(b+=Math.floor(d/1E7),d%=1E7);return c(b,0)+c(d,b)+c(a,1)};
    jspb.utils.joinSignedDecimalString=function(a,b){var c=b&2147483648;c&&(a=~a+1>>>0,b=~b+(0==a?1:0)>>>0);a=jspb.utils.joinUnsignedDecimalString(a,b);return c?"-"+a:a};jspb.utils.hash64ToDecimalString=function(a,b){jspb.utils.splitHash64(a);a=jspb.utils.split64Low;var c=jspb.utils.split64High;return b?jspb.utils.joinSignedDecimalString(a,c):jspb.utils.joinUnsignedDecimalString(a,c)};
    jspb.utils.hash64ArrayToDecimalStrings=function(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=jspb.utils.hash64ToDecimalString(a[d],b);return c};
    jspb.utils.decimalStringToHash64=function(a){function b(a,b){for(var c=0;8>c&&(1!==a||0<b);c++)b=a*e[c]+b,e[c]=b&255,b>>>=8;}function c(){for(var a=0;8>a;a++)e[a]=~e[a]&255;}goog.asserts.assert(0<a.length);var d=!1;"-"===a[0]&&(d=!0,a=a.slice(1));for(var e=[0,0,0,0,0,0,0,0],f=0;f<a.length;f++)b(10,a.charCodeAt(f)-jspb.utils.ZERO_CHAR_CODE_);d&&(c(),b(1,1));return goog.crypt.byteArrayToString(e)};jspb.utils.splitDecimalString=function(a){jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(a));};
    jspb.utils.toHexDigit_=function(a){return String.fromCharCode(10>a?jspb.utils.ZERO_CHAR_CODE_+a:jspb.utils.A_CHAR_CODE_-10+a)};jspb.utils.fromHexCharCode_=function(a){return a>=jspb.utils.A_CHAR_CODE_?a-jspb.utils.A_CHAR_CODE_+10:a-jspb.utils.ZERO_CHAR_CODE_};jspb.utils.hash64ToHexString=function(a){var b=Array(18);b[0]="0";b[1]="x";for(var c=0;8>c;c++){var d=a.charCodeAt(7-c);b[2*c+2]=jspb.utils.toHexDigit_(d>>4);b[2*c+3]=jspb.utils.toHexDigit_(d&15);}return b.join("")};
    jspb.utils.hexStringToHash64=function(a){a=a.toLowerCase();goog.asserts.assert(18==a.length);goog.asserts.assert("0"==a[0]);goog.asserts.assert("x"==a[1]);for(var b="",c=0;8>c;c++){var d=jspb.utils.fromHexCharCode_(a.charCodeAt(2*c+2)),e=jspb.utils.fromHexCharCode_(a.charCodeAt(2*c+3));b=String.fromCharCode(16*d+e)+b;}return b};
    jspb.utils.hash64ToNumber=function(a,b){jspb.utils.splitHash64(a);a=jspb.utils.split64Low;var c=jspb.utils.split64High;return b?jspb.utils.joinInt64(a,c):jspb.utils.joinUint64(a,c)};jspb.utils.numberToHash64=function(a){jspb.utils.splitInt64(a);return jspb.utils.joinHash64(jspb.utils.split64Low,jspb.utils.split64High)};jspb.utils.countVarints=function(a,b,c){for(var d=0,e=b;e<c;e++)d+=a[e]>>7;return c-b-d};
    jspb.utils.countVarintFields=function(a,b,c,d){var e=0;d=8*d+jspb.BinaryConstants.WireType.VARINT;if(128>d)for(;b<c&&a[b++]==d;)for(e++;;){var f=a[b++];if(0==(f&128))break}else for(;b<c;){for(f=d;128<f;){if(a[b]!=(f&127|128))return e;b++;f>>=7;}if(a[b++]!=f)break;for(e++;f=a[b++],0!=(f&128););}return e};jspb.utils.countFixedFields_=function(a,b,c,d,e){var f=0;if(128>d)for(;b<c&&a[b++]==d;)f++,b+=e;else for(;b<c;){for(var g=d;128<g;){if(a[b++]!=(g&127|128))return f;g>>=7;}if(a[b++]!=g)break;f++;b+=e;}return f};
    jspb.utils.countFixed32Fields=function(a,b,c,d){return jspb.utils.countFixedFields_(a,b,c,8*d+jspb.BinaryConstants.WireType.FIXED32,4)};jspb.utils.countFixed64Fields=function(a,b,c,d){return jspb.utils.countFixedFields_(a,b,c,8*d+jspb.BinaryConstants.WireType.FIXED64,8)};
    jspb.utils.countDelimitedFields=function(a,b,c,d){var e=0;for(d=8*d+jspb.BinaryConstants.WireType.DELIMITED;b<c;){for(var f=d;128<f;){if(a[b++]!=(f&127|128))return e;f>>=7;}if(a[b++]!=f)break;e++;for(var g=0,h=1;f=a[b++],g+=(f&127)*h,h*=128,0!=(f&128););b+=g;}return e};jspb.utils.debugBytesToTextFormat=function(a){var b='"';if(a){a=jspb.utils.byteSourceToUint8Array(a);for(var c=0;c<a.length;c++)b+="\\x",16>a[c]&&(b+="0"),b+=a[c].toString(16);}return b+'"'};
    jspb.utils.debugScalarToTextFormat=function(a){return "string"===typeof a?goog.string.quote(a):a.toString()};jspb.utils.stringToByteArray=function(a){for(var b=new Uint8Array(a.length),c=0;c<a.length;c++){var d=a.charCodeAt(c);if(255<d)throw Error("Conversion error: string contains codepoint outside of byte range");b[c]=d;}return b};
    jspb.utils.byteSourceToUint8Array=function(a){if(a.constructor===Uint8Array)return a;if(a.constructor===ArrayBuffer||"undefined"!=typeof Buffer&&a.constructor===Buffer||a.constructor===Array)return new Uint8Array(a);if(a.constructor===String)return goog.crypt.base64.decodeStringToUint8Array(a);goog.asserts.fail("Type not convertible to Uint8Array.");return new Uint8Array(0)};jspb.BinaryDecoder=function(a,b,c){this.bytes_=null;this.cursor_=this.end_=this.start_=0;this.error_=!1;a&&this.setBlock(a,b,c);};jspb.BinaryDecoder.instanceCache_=[];jspb.BinaryDecoder.alloc=function(a,b,c){if(jspb.BinaryDecoder.instanceCache_.length){var d=jspb.BinaryDecoder.instanceCache_.pop();a&&d.setBlock(a,b,c);return d}return new jspb.BinaryDecoder(a,b,c)};jspb.BinaryDecoder.prototype.free=function(){this.clear();100>jspb.BinaryDecoder.instanceCache_.length&&jspb.BinaryDecoder.instanceCache_.push(this);};
    jspb.BinaryDecoder.prototype.clone=function(){return jspb.BinaryDecoder.alloc(this.bytes_,this.start_,this.end_-this.start_)};jspb.BinaryDecoder.prototype.clear=function(){this.bytes_=null;this.cursor_=this.end_=this.start_=0;this.error_=!1;};jspb.BinaryDecoder.prototype.getBuffer=function(){return this.bytes_};
    jspb.BinaryDecoder.prototype.setBlock=function(a,b,c){this.bytes_=jspb.utils.byteSourceToUint8Array(a);this.start_=void 0!==b?b:0;this.end_=void 0!==c?this.start_+c:this.bytes_.length;this.cursor_=this.start_;};jspb.BinaryDecoder.prototype.getEnd=function(){return this.end_};jspb.BinaryDecoder.prototype.setEnd=function(a){this.end_=a;};jspb.BinaryDecoder.prototype.reset=function(){this.cursor_=this.start_;};jspb.BinaryDecoder.prototype.getCursor=function(){return this.cursor_};
    jspb.BinaryDecoder.prototype.setCursor=function(a){this.cursor_=a;};jspb.BinaryDecoder.prototype.advance=function(a){this.cursor_+=a;goog.asserts.assert(this.cursor_<=this.end_);};jspb.BinaryDecoder.prototype.atEnd=function(){return this.cursor_==this.end_};jspb.BinaryDecoder.prototype.pastEnd=function(){return this.cursor_>this.end_};jspb.BinaryDecoder.prototype.getError=function(){return this.error_||0>this.cursor_||this.cursor_>this.end_};
    jspb.BinaryDecoder.prototype.readSplitVarint64=function(a){for(var b=128,c=0,d=0,e=0;4>e&&128<=b;e++)b=this.bytes_[this.cursor_++],c|=(b&127)<<7*e;128<=b&&(b=this.bytes_[this.cursor_++],c|=(b&127)<<28,d|=(b&127)>>4);if(128<=b)for(e=0;5>e&&128<=b;e++)b=this.bytes_[this.cursor_++],d|=(b&127)<<7*e+3;if(128>b)return a(c>>>0,d>>>0);goog.asserts.fail("Failed to read varint, encoding is invalid.");this.error_=!0;};
    jspb.BinaryDecoder.prototype.readSplitZigzagVarint64=function(a){return this.readSplitVarint64(function(b,c){return jspb.utils.fromZigzag64(b,c,a)})};jspb.BinaryDecoder.prototype.readSplitFixed64=function(a){var b=this.bytes_,c=this.cursor_;this.cursor_+=8;for(var d=0,e=0,f=c+7;f>=c;f--)d=d<<8|b[f],e=e<<8|b[f+4];return a(d,e)};jspb.BinaryDecoder.prototype.skipVarint=function(){for(;this.bytes_[this.cursor_]&128;)this.cursor_++;this.cursor_++;};
    jspb.BinaryDecoder.prototype.unskipVarint=function(a){for(;128<a;)this.cursor_--,a>>>=7;this.cursor_--;};
    jspb.BinaryDecoder.prototype.readUnsignedVarint32=function(){var a=this.bytes_;var b=a[this.cursor_+0];var c=b&127;if(128>b)return this.cursor_+=1,goog.asserts.assert(this.cursor_<=this.end_),c;b=a[this.cursor_+1];c|=(b&127)<<7;if(128>b)return this.cursor_+=2,goog.asserts.assert(this.cursor_<=this.end_),c;b=a[this.cursor_+2];c|=(b&127)<<14;if(128>b)return this.cursor_+=3,goog.asserts.assert(this.cursor_<=this.end_),c;b=a[this.cursor_+3];c|=(b&127)<<21;if(128>b)return this.cursor_+=4,goog.asserts.assert(this.cursor_<=
    this.end_),c;b=a[this.cursor_+4];c|=(b&15)<<28;if(128>b)return this.cursor_+=5,goog.asserts.assert(this.cursor_<=this.end_),c>>>0;this.cursor_+=5;128<=a[this.cursor_++]&&128<=a[this.cursor_++]&&128<=a[this.cursor_++]&&128<=a[this.cursor_++]&&128<=a[this.cursor_++]&&goog.asserts.assert(!1);goog.asserts.assert(this.cursor_<=this.end_);return c};jspb.BinaryDecoder.prototype.readSignedVarint32=jspb.BinaryDecoder.prototype.readUnsignedVarint32;jspb.BinaryDecoder.prototype.readUnsignedVarint32String=function(){return this.readUnsignedVarint32().toString()};
    jspb.BinaryDecoder.prototype.readSignedVarint32String=function(){return this.readSignedVarint32().toString()};jspb.BinaryDecoder.prototype.readZigzagVarint32=function(){var a=this.readUnsignedVarint32();return a>>>1^-(a&1)};jspb.BinaryDecoder.prototype.readUnsignedVarint64=function(){return this.readSplitVarint64(jspb.utils.joinUint64)};jspb.BinaryDecoder.prototype.readUnsignedVarint64String=function(){return this.readSplitVarint64(jspb.utils.joinUnsignedDecimalString)};
    jspb.BinaryDecoder.prototype.readSignedVarint64=function(){return this.readSplitVarint64(jspb.utils.joinInt64)};jspb.BinaryDecoder.prototype.readSignedVarint64String=function(){return this.readSplitVarint64(jspb.utils.joinSignedDecimalString)};jspb.BinaryDecoder.prototype.readZigzagVarint64=function(){return this.readSplitVarint64(jspb.utils.joinZigzag64)};jspb.BinaryDecoder.prototype.readZigzagVarintHash64=function(){return this.readSplitZigzagVarint64(jspb.utils.joinHash64)};
    jspb.BinaryDecoder.prototype.readZigzagVarint64String=function(){return this.readSplitZigzagVarint64(jspb.utils.joinSignedDecimalString)};jspb.BinaryDecoder.prototype.readUint8=function(){var a=this.bytes_[this.cursor_+0];this.cursor_+=1;goog.asserts.assert(this.cursor_<=this.end_);return a};jspb.BinaryDecoder.prototype.readUint16=function(){var a=this.bytes_[this.cursor_+0],b=this.bytes_[this.cursor_+1];this.cursor_+=2;goog.asserts.assert(this.cursor_<=this.end_);return a<<0|b<<8};
    jspb.BinaryDecoder.prototype.readUint32=function(){var a=this.bytes_[this.cursor_+0],b=this.bytes_[this.cursor_+1],c=this.bytes_[this.cursor_+2],d=this.bytes_[this.cursor_+3];this.cursor_+=4;goog.asserts.assert(this.cursor_<=this.end_);return (a<<0|b<<8|c<<16|d<<24)>>>0};jspb.BinaryDecoder.prototype.readUint64=function(){var a=this.readUint32(),b=this.readUint32();return jspb.utils.joinUint64(a,b)};
    jspb.BinaryDecoder.prototype.readUint64String=function(){var a=this.readUint32(),b=this.readUint32();return jspb.utils.joinUnsignedDecimalString(a,b)};jspb.BinaryDecoder.prototype.readInt8=function(){var a=this.bytes_[this.cursor_+0];this.cursor_+=1;goog.asserts.assert(this.cursor_<=this.end_);return a<<24>>24};
    jspb.BinaryDecoder.prototype.readInt16=function(){var a=this.bytes_[this.cursor_+0],b=this.bytes_[this.cursor_+1];this.cursor_+=2;goog.asserts.assert(this.cursor_<=this.end_);return (a<<0|b<<8)<<16>>16};jspb.BinaryDecoder.prototype.readInt32=function(){var a=this.bytes_[this.cursor_+0],b=this.bytes_[this.cursor_+1],c=this.bytes_[this.cursor_+2],d=this.bytes_[this.cursor_+3];this.cursor_+=4;goog.asserts.assert(this.cursor_<=this.end_);return a<<0|b<<8|c<<16|d<<24};
    jspb.BinaryDecoder.prototype.readInt64=function(){var a=this.readUint32(),b=this.readUint32();return jspb.utils.joinInt64(a,b)};jspb.BinaryDecoder.prototype.readInt64String=function(){var a=this.readUint32(),b=this.readUint32();return jspb.utils.joinSignedDecimalString(a,b)};jspb.BinaryDecoder.prototype.readFloat=function(){var a=this.readUint32();return jspb.utils.joinFloat32(a,0)};
    jspb.BinaryDecoder.prototype.readDouble=function(){var a=this.readUint32(),b=this.readUint32();return jspb.utils.joinFloat64(a,b)};jspb.BinaryDecoder.prototype.readBool=function(){return !!this.bytes_[this.cursor_++]};jspb.BinaryDecoder.prototype.readEnum=function(){return this.readSignedVarint32()};
    jspb.BinaryDecoder.prototype.readString=function(a){var b=this.bytes_,c=this.cursor_;a=c+a;for(var d=[],e="";c<a;){var f=b[c++];if(128>f)d.push(f);else if(192>f)continue;else if(224>f){var g=b[c++];d.push((f&31)<<6|g&63);}else if(240>f){g=b[c++];var h=b[c++];d.push((f&15)<<12|(g&63)<<6|h&63);}else if(248>f){g=b[c++];h=b[c++];var k=b[c++];f=(f&7)<<18|(g&63)<<12|(h&63)<<6|k&63;f-=65536;d.push((f>>10&1023)+55296,(f&1023)+56320);}8192<=d.length&&(e+=String.fromCharCode.apply(null,d),d.length=0);}e+=goog.crypt.byteArrayToString(d);
    this.cursor_=c;return e};jspb.BinaryDecoder.prototype.readStringWithLength=function(){var a=this.readUnsignedVarint32();return this.readString(a)};jspb.BinaryDecoder.prototype.readBytes=function(a){if(0>a||this.cursor_+a>this.bytes_.length)return this.error_=!0,goog.asserts.fail("Invalid byte length!"),new Uint8Array(0);var b=this.bytes_.subarray(this.cursor_,this.cursor_+a);this.cursor_+=a;goog.asserts.assert(this.cursor_<=this.end_);return b};jspb.BinaryDecoder.prototype.readVarintHash64=function(){return this.readSplitVarint64(jspb.utils.joinHash64)};
    jspb.BinaryDecoder.prototype.readFixedHash64=function(){var a=this.bytes_,b=this.cursor_,c=a[b+0],d=a[b+1],e=a[b+2],f=a[b+3],g=a[b+4],h=a[b+5],k=a[b+6];a=a[b+7];this.cursor_+=8;return String.fromCharCode(c,d,e,f,g,h,k,a)};jspb.BinaryReader=function(a,b,c){this.decoder_=jspb.BinaryDecoder.alloc(a,b,c);this.fieldCursor_=this.decoder_.getCursor();this.nextField_=jspb.BinaryConstants.INVALID_FIELD_NUMBER;this.nextWireType_=jspb.BinaryConstants.WireType.INVALID;this.error_=!1;this.readCallbacks_=null;};jspb.BinaryReader.instanceCache_=[];
    jspb.BinaryReader.alloc=function(a,b,c){if(jspb.BinaryReader.instanceCache_.length){var d=jspb.BinaryReader.instanceCache_.pop();a&&d.decoder_.setBlock(a,b,c);return d}return new jspb.BinaryReader(a,b,c)};jspb.BinaryReader.prototype.alloc=jspb.BinaryReader.alloc;
    jspb.BinaryReader.prototype.free=function(){this.decoder_.clear();this.nextField_=jspb.BinaryConstants.INVALID_FIELD_NUMBER;this.nextWireType_=jspb.BinaryConstants.WireType.INVALID;this.error_=!1;this.readCallbacks_=null;100>jspb.BinaryReader.instanceCache_.length&&jspb.BinaryReader.instanceCache_.push(this);};jspb.BinaryReader.prototype.getFieldCursor=function(){return this.fieldCursor_};jspb.BinaryReader.prototype.getCursor=function(){return this.decoder_.getCursor()};
    jspb.BinaryReader.prototype.getBuffer=function(){return this.decoder_.getBuffer()};jspb.BinaryReader.prototype.getFieldNumber=function(){return this.nextField_};jspb.BinaryReader.prototype.getWireType=function(){return this.nextWireType_};jspb.BinaryReader.prototype.isEndGroup=function(){return this.nextWireType_==jspb.BinaryConstants.WireType.END_GROUP};jspb.BinaryReader.prototype.getError=function(){return this.error_||this.decoder_.getError()};
    jspb.BinaryReader.prototype.setBlock=function(a,b,c){this.decoder_.setBlock(a,b,c);this.nextField_=jspb.BinaryConstants.INVALID_FIELD_NUMBER;this.nextWireType_=jspb.BinaryConstants.WireType.INVALID;};jspb.BinaryReader.prototype.reset=function(){this.decoder_.reset();this.nextField_=jspb.BinaryConstants.INVALID_FIELD_NUMBER;this.nextWireType_=jspb.BinaryConstants.WireType.INVALID;};jspb.BinaryReader.prototype.advance=function(a){this.decoder_.advance(a);};
    jspb.BinaryReader.prototype.nextField=function(){if(this.decoder_.atEnd())return !1;if(this.getError())return goog.asserts.fail("Decoder hit an error"),!1;this.fieldCursor_=this.decoder_.getCursor();var a=this.decoder_.readUnsignedVarint32(),b=a>>>3;a&=7;if(a!=jspb.BinaryConstants.WireType.VARINT&&a!=jspb.BinaryConstants.WireType.FIXED32&&a!=jspb.BinaryConstants.WireType.FIXED64&&a!=jspb.BinaryConstants.WireType.DELIMITED&&a!=jspb.BinaryConstants.WireType.START_GROUP&&a!=jspb.BinaryConstants.WireType.END_GROUP)return goog.asserts.fail("Invalid wire type: %s (at position %s)",
    a,this.fieldCursor_),this.error_=!0,!1;this.nextField_=b;this.nextWireType_=a;return !0};jspb.BinaryReader.prototype.unskipHeader=function(){this.decoder_.unskipVarint(this.nextField_<<3|this.nextWireType_);};jspb.BinaryReader.prototype.skipMatchingFields=function(){var a=this.nextField_;for(this.unskipHeader();this.nextField()&&this.getFieldNumber()==a;)this.skipField();this.decoder_.atEnd()||this.unskipHeader();};
    jspb.BinaryReader.prototype.skipVarintField=function(){this.nextWireType_!=jspb.BinaryConstants.WireType.VARINT?(goog.asserts.fail("Invalid wire type for skipVarintField"),this.skipField()):this.decoder_.skipVarint();};jspb.BinaryReader.prototype.skipDelimitedField=function(){if(this.nextWireType_!=jspb.BinaryConstants.WireType.DELIMITED)goog.asserts.fail("Invalid wire type for skipDelimitedField"),this.skipField();else {var a=this.decoder_.readUnsignedVarint32();this.decoder_.advance(a);}};
    jspb.BinaryReader.prototype.skipFixed32Field=function(){this.nextWireType_!=jspb.BinaryConstants.WireType.FIXED32?(goog.asserts.fail("Invalid wire type for skipFixed32Field"),this.skipField()):this.decoder_.advance(4);};jspb.BinaryReader.prototype.skipFixed64Field=function(){this.nextWireType_!=jspb.BinaryConstants.WireType.FIXED64?(goog.asserts.fail("Invalid wire type for skipFixed64Field"),this.skipField()):this.decoder_.advance(8);};
    jspb.BinaryReader.prototype.skipGroup=function(){var a=this.nextField_;do{if(!this.nextField()){goog.asserts.fail("Unmatched start-group tag: stream EOF");this.error_=!0;break}if(this.nextWireType_==jspb.BinaryConstants.WireType.END_GROUP){this.nextField_!=a&&(goog.asserts.fail("Unmatched end-group tag"),this.error_=!0);break}this.skipField();}while(1)};
    jspb.BinaryReader.prototype.skipField=function(){switch(this.nextWireType_){case jspb.BinaryConstants.WireType.VARINT:this.skipVarintField();break;case jspb.BinaryConstants.WireType.FIXED64:this.skipFixed64Field();break;case jspb.BinaryConstants.WireType.DELIMITED:this.skipDelimitedField();break;case jspb.BinaryConstants.WireType.FIXED32:this.skipFixed32Field();break;case jspb.BinaryConstants.WireType.START_GROUP:this.skipGroup();break;default:goog.asserts.fail("Invalid wire encoding for field.");}};
    jspb.BinaryReader.prototype.registerReadCallback=function(a,b){null===this.readCallbacks_&&(this.readCallbacks_={});goog.asserts.assert(!this.readCallbacks_[a]);this.readCallbacks_[a]=b;};jspb.BinaryReader.prototype.runReadCallback=function(a){goog.asserts.assert(null!==this.readCallbacks_);a=this.readCallbacks_[a];goog.asserts.assert(a);return a(this)};
    jspb.BinaryReader.prototype.readAny=function(a){this.nextWireType_=jspb.BinaryConstants.FieldTypeToWireType(a);var b=jspb.BinaryConstants.FieldType;switch(a){case b.DOUBLE:return this.readDouble();case b.FLOAT:return this.readFloat();case b.INT64:return this.readInt64();case b.UINT64:return this.readUint64();case b.INT32:return this.readInt32();case b.FIXED64:return this.readFixed64();case b.FIXED32:return this.readFixed32();case b.BOOL:return this.readBool();case b.STRING:return this.readString();
    case b.GROUP:goog.asserts.fail("Group field type not supported in readAny()");case b.MESSAGE:goog.asserts.fail("Message field type not supported in readAny()");case b.BYTES:return this.readBytes();case b.UINT32:return this.readUint32();case b.ENUM:return this.readEnum();case b.SFIXED32:return this.readSfixed32();case b.SFIXED64:return this.readSfixed64();case b.SINT32:return this.readSint32();case b.SINT64:return this.readSint64();case b.FHASH64:return this.readFixedHash64();case b.VHASH64:return this.readVarintHash64();
    default:goog.asserts.fail("Invalid field type in readAny()");}return 0};jspb.BinaryReader.prototype.readMessage=function(a,b){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.DELIMITED);var c=this.decoder_.getEnd(),d=this.decoder_.readUnsignedVarint32();d=this.decoder_.getCursor()+d;this.decoder_.setEnd(d);b(a,this);this.decoder_.setCursor(d);this.decoder_.setEnd(c);};
    jspb.BinaryReader.prototype.readGroup=function(a,b,c){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.START_GROUP);goog.asserts.assert(this.nextField_==a);c(b,this);this.error_||this.nextWireType_==jspb.BinaryConstants.WireType.END_GROUP||(goog.asserts.fail("Group submessage did not end with an END_GROUP tag"),this.error_=!0);};
    jspb.BinaryReader.prototype.getFieldDecoder=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.DELIMITED);var a=this.decoder_.readUnsignedVarint32(),b=this.decoder_.getCursor(),c=b+a;a=jspb.BinaryDecoder.alloc(this.decoder_.getBuffer(),b,a);this.decoder_.setCursor(c);return a};jspb.BinaryReader.prototype.readInt32=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSignedVarint32()};
    jspb.BinaryReader.prototype.readInt32String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSignedVarint32String()};jspb.BinaryReader.prototype.readInt64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSignedVarint64()};jspb.BinaryReader.prototype.readInt64String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSignedVarint64String()};
    jspb.BinaryReader.prototype.readUint32=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readUnsignedVarint32()};jspb.BinaryReader.prototype.readUint32String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readUnsignedVarint32String()};jspb.BinaryReader.prototype.readUint64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readUnsignedVarint64()};
    jspb.BinaryReader.prototype.readUint64String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readUnsignedVarint64String()};jspb.BinaryReader.prototype.readSint32=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readZigzagVarint32()};jspb.BinaryReader.prototype.readSint64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readZigzagVarint64()};
    jspb.BinaryReader.prototype.readSint64String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readZigzagVarint64String()};jspb.BinaryReader.prototype.readFixed32=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED32);return this.decoder_.readUint32()};jspb.BinaryReader.prototype.readFixed64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readUint64()};
    jspb.BinaryReader.prototype.readFixed64String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readUint64String()};jspb.BinaryReader.prototype.readSfixed32=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED32);return this.decoder_.readInt32()};jspb.BinaryReader.prototype.readSfixed32String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED32);return this.decoder_.readInt32().toString()};
    jspb.BinaryReader.prototype.readSfixed64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readInt64()};jspb.BinaryReader.prototype.readSfixed64String=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readInt64String()};jspb.BinaryReader.prototype.readFloat=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED32);return this.decoder_.readFloat()};
    jspb.BinaryReader.prototype.readDouble=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readDouble()};jspb.BinaryReader.prototype.readBool=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return !!this.decoder_.readUnsignedVarint32()};jspb.BinaryReader.prototype.readEnum=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSignedVarint64()};
    jspb.BinaryReader.prototype.readString=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.DELIMITED);var a=this.decoder_.readUnsignedVarint32();return this.decoder_.readString(a)};jspb.BinaryReader.prototype.readBytes=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.DELIMITED);var a=this.decoder_.readUnsignedVarint32();return this.decoder_.readBytes(a)};
    jspb.BinaryReader.prototype.readVarintHash64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readVarintHash64()};jspb.BinaryReader.prototype.readSintHash64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readZigzagVarintHash64()};jspb.BinaryReader.prototype.readSplitVarint64=function(a){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSplitVarint64(a)};
    jspb.BinaryReader.prototype.readSplitZigzagVarint64=function(a){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.VARINT);return this.decoder_.readSplitVarint64(function(b,c){return jspb.utils.fromZigzag64(b,c,a)})};jspb.BinaryReader.prototype.readFixedHash64=function(){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readFixedHash64()};
    jspb.BinaryReader.prototype.readSplitFixed64=function(a){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.FIXED64);return this.decoder_.readSplitFixed64(a)};jspb.BinaryReader.prototype.readPackedField_=function(a){goog.asserts.assert(this.nextWireType_==jspb.BinaryConstants.WireType.DELIMITED);var b=this.decoder_.readUnsignedVarint32();b=this.decoder_.getCursor()+b;for(var c=[];this.decoder_.getCursor()<b;)c.push(a.call(this.decoder_));return c};
    jspb.BinaryReader.prototype.readPackedInt32=function(){return this.readPackedField_(this.decoder_.readSignedVarint32)};jspb.BinaryReader.prototype.readPackedInt32String=function(){return this.readPackedField_(this.decoder_.readSignedVarint32String)};jspb.BinaryReader.prototype.readPackedInt64=function(){return this.readPackedField_(this.decoder_.readSignedVarint64)};jspb.BinaryReader.prototype.readPackedInt64String=function(){return this.readPackedField_(this.decoder_.readSignedVarint64String)};
    jspb.BinaryReader.prototype.readPackedUint32=function(){return this.readPackedField_(this.decoder_.readUnsignedVarint32)};jspb.BinaryReader.prototype.readPackedUint32String=function(){return this.readPackedField_(this.decoder_.readUnsignedVarint32String)};jspb.BinaryReader.prototype.readPackedUint64=function(){return this.readPackedField_(this.decoder_.readUnsignedVarint64)};jspb.BinaryReader.prototype.readPackedUint64String=function(){return this.readPackedField_(this.decoder_.readUnsignedVarint64String)};
    jspb.BinaryReader.prototype.readPackedSint32=function(){return this.readPackedField_(this.decoder_.readZigzagVarint32)};jspb.BinaryReader.prototype.readPackedSint64=function(){return this.readPackedField_(this.decoder_.readZigzagVarint64)};jspb.BinaryReader.prototype.readPackedSint64String=function(){return this.readPackedField_(this.decoder_.readZigzagVarint64String)};jspb.BinaryReader.prototype.readPackedFixed32=function(){return this.readPackedField_(this.decoder_.readUint32)};
    jspb.BinaryReader.prototype.readPackedFixed64=function(){return this.readPackedField_(this.decoder_.readUint64)};jspb.BinaryReader.prototype.readPackedFixed64String=function(){return this.readPackedField_(this.decoder_.readUint64String)};jspb.BinaryReader.prototype.readPackedSfixed32=function(){return this.readPackedField_(this.decoder_.readInt32)};jspb.BinaryReader.prototype.readPackedSfixed64=function(){return this.readPackedField_(this.decoder_.readInt64)};
    jspb.BinaryReader.prototype.readPackedSfixed64String=function(){return this.readPackedField_(this.decoder_.readInt64String)};jspb.BinaryReader.prototype.readPackedFloat=function(){return this.readPackedField_(this.decoder_.readFloat)};jspb.BinaryReader.prototype.readPackedDouble=function(){return this.readPackedField_(this.decoder_.readDouble)};jspb.BinaryReader.prototype.readPackedBool=function(){return this.readPackedField_(this.decoder_.readBool)};jspb.BinaryReader.prototype.readPackedEnum=function(){return this.readPackedField_(this.decoder_.readEnum)};
    jspb.BinaryReader.prototype.readPackedVarintHash64=function(){return this.readPackedField_(this.decoder_.readVarintHash64)};jspb.BinaryReader.prototype.readPackedFixedHash64=function(){return this.readPackedField_(this.decoder_.readFixedHash64)};jspb.Map=function(a,b){this.arr_=a;this.valueCtor_=b;this.map_={};this.arrClean=!0;0<this.arr_.length&&this.loadFromArray_();};jspb.Map.prototype.loadFromArray_=function(){for(var a=0;a<this.arr_.length;a++){var b=this.arr_[a],c=b[0];this.map_[c.toString()]=new jspb.Map.Entry_(c,b[1]);}this.arrClean=!0;};
    jspb.Map.prototype.toArray=function(){if(this.arrClean){if(this.valueCtor_){var a=this.map_,b;for(b in a)if(Object.prototype.hasOwnProperty.call(a,b)){var c=a[b].valueWrapper;c&&c.toArray();}}}else {this.arr_.length=0;a=this.stringKeys_();a.sort();for(b=0;b<a.length;b++){var d=this.map_[a[b]];(c=d.valueWrapper)&&c.toArray();this.arr_.push([d.key,d.value]);}this.arrClean=!0;}return this.arr_};
    jspb.Map.prototype.toObject=function(a,b){for(var c=this.toArray(),d=[],e=0;e<c.length;e++){var f=this.map_[c[e][0].toString()];this.wrapEntry_(f);var g=f.valueWrapper;g?(goog.asserts.assert(b),d.push([f.key,b(a,g)])):d.push([f.key,f.value]);}return d};jspb.Map.fromObject=function(a,b,c){b=new jspb.Map([],b);for(var d=0;d<a.length;d++){var e=a[d][0],f=c(a[d][1]);b.set(e,f);}return b};jspb.Map.ArrayIteratorIterable_=function(a){this.idx_=0;this.arr_=a;};
    jspb.Map.ArrayIteratorIterable_.prototype.next=function(){return this.idx_<this.arr_.length?{done:!1,value:this.arr_[this.idx_++]}:{done:!0,value:void 0}};"undefined"!=typeof Symbol&&(jspb.Map.ArrayIteratorIterable_.prototype[Symbol.iterator]=function(){return this});jspb.Map.prototype.getLength=function(){return this.stringKeys_().length};jspb.Map.prototype.clear=function(){this.map_={};this.arrClean=!1;};
    jspb.Map.prototype.del=function(a){a=a.toString();var b=this.map_.hasOwnProperty(a);delete this.map_[a];this.arrClean=!1;return b};jspb.Map.prototype.getEntryList=function(){var a=[],b=this.stringKeys_();b.sort();for(var c=0;c<b.length;c++){var d=this.map_[b[c]];a.push([d.key,d.value]);}return a};jspb.Map.prototype.entries=function(){var a=[],b=this.stringKeys_();b.sort();for(var c=0;c<b.length;c++){var d=this.map_[b[c]];a.push([d.key,this.wrapEntry_(d)]);}return new jspb.Map.ArrayIteratorIterable_(a)};
    jspb.Map.prototype.keys=function(){var a=[],b=this.stringKeys_();b.sort();for(var c=0;c<b.length;c++)a.push(this.map_[b[c]].key);return new jspb.Map.ArrayIteratorIterable_(a)};jspb.Map.prototype.values=function(){var a=[],b=this.stringKeys_();b.sort();for(var c=0;c<b.length;c++)a.push(this.wrapEntry_(this.map_[b[c]]));return new jspb.Map.ArrayIteratorIterable_(a)};
    jspb.Map.prototype.forEach=function(a,b){var c=this.stringKeys_();c.sort();for(var d=0;d<c.length;d++){var e=this.map_[c[d]];a.call(b,this.wrapEntry_(e),e.key,this);}};jspb.Map.prototype.set=function(a,b){var c=new jspb.Map.Entry_(a);this.valueCtor_?(c.valueWrapper=b,c.value=b.toArray()):c.value=b;this.map_[a.toString()]=c;this.arrClean=!1;return this};jspb.Map.prototype.wrapEntry_=function(a){return this.valueCtor_?(a.valueWrapper||(a.valueWrapper=new this.valueCtor_(a.value)),a.valueWrapper):a.value};
    jspb.Map.prototype.get=function(a){if(a=this.map_[a.toString()])return this.wrapEntry_(a)};jspb.Map.prototype.has=function(a){return a.toString()in this.map_};jspb.Map.prototype.serializeBinary=function(a,b,c,d,e){var f=this.stringKeys_();f.sort();for(var g=0;g<f.length;g++){var h=this.map_[f[g]];b.beginSubMessage(a);c.call(b,1,h.key);this.valueCtor_?d.call(b,2,this.wrapEntry_(h),e):d.call(b,2,h.value);b.endSubMessage();}};
    jspb.Map.deserializeBinary=function(a,b,c,d,e,f,g){for(;b.nextField()&&!b.isEndGroup();){var h=b.getFieldNumber();1==h?f=c.call(b):2==h&&(a.valueCtor_?(goog.asserts.assert(e),g||(g=new a.valueCtor_),d.call(b,g,e)):g=d.call(b));}goog.asserts.assert(void 0!=f);goog.asserts.assert(void 0!=g);a.set(f,g);};jspb.Map.prototype.stringKeys_=function(){var a=this.map_,b=[],c;for(c in a)Object.prototype.hasOwnProperty.call(a,c)&&b.push(c);return b};
    jspb.Map.Entry_=function(a,b){this.key=a;this.value=b;this.valueWrapper=void 0;};jspb.ExtensionFieldInfo=function(a,b,c,d,e){this.fieldIndex=a;this.fieldName=b;this.ctor=c;this.toObjectFn=d;this.isRepeated=e;};jspb.ExtensionFieldBinaryInfo=function(a,b,c,d,e,f){this.fieldInfo=a;this.binaryReaderFn=b;this.binaryWriterFn=c;this.binaryMessageSerializeFn=d;this.binaryMessageDeserializeFn=e;this.isPacked=f;};jspb.ExtensionFieldInfo.prototype.isMessageType=function(){return !!this.ctor};jspb.Message=function(){};jspb.Message.GENERATE_TO_OBJECT=!0;jspb.Message.GENERATE_FROM_OBJECT=!goog.DISALLOW_TEST_ONLY_CODE;
    jspb.Message.GENERATE_TO_STRING=!0;jspb.Message.ASSUME_LOCAL_ARRAYS=!1;jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS=!0;jspb.Message.SUPPORTS_UINT8ARRAY_="function"==typeof Uint8Array;jspb.Message.prototype.getJsPbMessageId=function(){return this.messageId_};jspb.Message.getIndex_=function(a,b){return b+a.arrayIndexOffset_};jspb.Message.hiddenES6Property_=function(){};jspb.Message.getFieldNumber_=function(a,b){return b-a.arrayIndexOffset_};
    jspb.Message.initialize=function(a,b,c,d,e,f){a.wrappers_=null;b||(b=c?[c]:[]);a.messageId_=c?String(c):void 0;a.arrayIndexOffset_=0===c?-1:0;a.array=b;jspb.Message.initPivotAndExtensionObject_(a,d);a.convertedPrimitiveFields_={};jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS||(a.repeatedFields=e);if(e)for(b=0;b<e.length;b++)c=e[b],c<a.pivot_?(c=jspb.Message.getIndex_(a,c),a.array[c]=a.array[c]||jspb.Message.EMPTY_LIST_SENTINEL_):(jspb.Message.maybeInitEmptyExtensionObject_(a),a.extensionObject_[c]=
    a.extensionObject_[c]||jspb.Message.EMPTY_LIST_SENTINEL_);if(f&&f.length)for(b=0;b<f.length;b++)jspb.Message.computeOneofCase(a,f[b]);};jspb.Message.EMPTY_LIST_SENTINEL_=goog.DEBUG&&Object.freeze?Object.freeze([]):[];jspb.Message.isArray_=function(a){return jspb.Message.ASSUME_LOCAL_ARRAYS?a instanceof Array:Array.isArray(a)};jspb.Message.isExtensionObject_=function(a){return null!==a&&"object"==typeof a&&!jspb.Message.isArray_(a)&&!(jspb.Message.SUPPORTS_UINT8ARRAY_&&a instanceof Uint8Array)};
    jspb.Message.initPivotAndExtensionObject_=function(a,b){var c=a.array.length,d=-1;if(c&&(d=c-1,c=a.array[d],jspb.Message.isExtensionObject_(c))){a.pivot_=jspb.Message.getFieldNumber_(a,d);a.extensionObject_=c;return}-1<b?(a.pivot_=Math.max(b,jspb.Message.getFieldNumber_(a,d+1)),a.extensionObject_=null):a.pivot_=Number.MAX_VALUE;};jspb.Message.maybeInitEmptyExtensionObject_=function(a){var b=jspb.Message.getIndex_(a,a.pivot_);a.array[b]||(a.extensionObject_=a.array[b]={});};
    jspb.Message.toObjectList=function(a,b,c){for(var d=[],e=0;e<a.length;e++)d[e]=b.call(a[e],c,a[e]);return d};jspb.Message.toObjectExtension=function(a,b,c,d,e){for(var f in c){var g=c[f],h=d.call(a,g);if(null!=h){for(var k in g.fieldName)if(g.fieldName.hasOwnProperty(k))break;b[k]=g.toObjectFn?g.isRepeated?jspb.Message.toObjectList(h,g.toObjectFn,e):g.toObjectFn(e,h):h;}}};
    jspb.Message.serializeBinaryExtensions=function(a,b,c,d){for(var e in c){var f=c[e],g=f.fieldInfo;if(!f.binaryWriterFn)throw Error("Message extension present that was generated without binary serialization support");var h=d.call(a,g);if(null!=h)if(g.isMessageType())if(f.binaryMessageSerializeFn)f.binaryWriterFn.call(b,g.fieldIndex,h,f.binaryMessageSerializeFn);else throw Error("Message extension present holding submessage without binary support enabled, and message is being serialized to binary format");
    else f.binaryWriterFn.call(b,g.fieldIndex,h);}};jspb.Message.readBinaryExtension=function(a,b,c,d,e){var f=c[b.getFieldNumber()];if(f){c=f.fieldInfo;if(!f.binaryReaderFn)throw Error("Deserializing extension whose generated code does not support binary format");if(c.isMessageType()){var g=new c.ctor;f.binaryReaderFn.call(b,g,f.binaryMessageDeserializeFn);}else g=f.binaryReaderFn.call(b);c.isRepeated&&!f.isPacked?(b=d.call(a,c))?b.push(g):e.call(a,c,[g]):e.call(a,c,g);}else b.skipField();};
    jspb.Message.getField=function(a,b){if(b<a.pivot_){b=jspb.Message.getIndex_(a,b);var c=a.array[b];return c===jspb.Message.EMPTY_LIST_SENTINEL_?a.array[b]=[]:c}if(a.extensionObject_)return c=a.extensionObject_[b],c===jspb.Message.EMPTY_LIST_SENTINEL_?a.extensionObject_[b]=[]:c};jspb.Message.getRepeatedField=function(a,b){return jspb.Message.getField(a,b)};jspb.Message.getOptionalFloatingPointField=function(a,b){a=jspb.Message.getField(a,b);return null==a?a:+a};
    jspb.Message.getBooleanField=function(a,b){a=jspb.Message.getField(a,b);return null==a?a:!!a};jspb.Message.getRepeatedFloatingPointField=function(a,b){var c=jspb.Message.getRepeatedField(a,b);a.convertedPrimitiveFields_||(a.convertedPrimitiveFields_={});if(!a.convertedPrimitiveFields_[b]){for(var d=0;d<c.length;d++)c[d]=+c[d];a.convertedPrimitiveFields_[b]=!0;}return c};
    jspb.Message.getRepeatedBooleanField=function(a,b){var c=jspb.Message.getRepeatedField(a,b);a.convertedPrimitiveFields_||(a.convertedPrimitiveFields_={});if(!a.convertedPrimitiveFields_[b]){for(var d=0;d<c.length;d++)c[d]=!!c[d];a.convertedPrimitiveFields_[b]=!0;}return c};
    jspb.Message.bytesAsB64=function(a){if(null==a||"string"===typeof a)return a;if(jspb.Message.SUPPORTS_UINT8ARRAY_&&a instanceof Uint8Array)return goog.crypt.base64.encodeByteArray(a);goog.asserts.fail("Cannot coerce to b64 string: "+goog.typeOf(a));return null};jspb.Message.bytesAsU8=function(a){if(null==a||a instanceof Uint8Array)return a;if("string"===typeof a)return goog.crypt.base64.decodeStringToUint8Array(a);goog.asserts.fail("Cannot coerce to Uint8Array: "+goog.typeOf(a));return null};
    jspb.Message.bytesListAsB64=function(a){jspb.Message.assertConsistentTypes_(a);return a.length&&"string"!==typeof a[0]?goog.array.map(a,jspb.Message.bytesAsB64):a};jspb.Message.bytesListAsU8=function(a){jspb.Message.assertConsistentTypes_(a);return !a.length||a[0]instanceof Uint8Array?a:goog.array.map(a,jspb.Message.bytesAsU8)};
    jspb.Message.assertConsistentTypes_=function(a){if(goog.DEBUG&&a&&1<a.length){var b=goog.typeOf(a[0]);goog.array.forEach(a,function(a){goog.typeOf(a)!=b&&goog.asserts.fail("Inconsistent type in JSPB repeated field array. Got "+goog.typeOf(a)+" expected "+b);});}};jspb.Message.getFieldWithDefault=function(a,b,c){a=jspb.Message.getField(a,b);return null==a?c:a};jspb.Message.getBooleanFieldWithDefault=function(a,b,c){a=jspb.Message.getBooleanField(a,b);return null==a?c:a};
    jspb.Message.getFloatingPointFieldWithDefault=function(a,b,c){a=jspb.Message.getOptionalFloatingPointField(a,b);return null==a?c:a};jspb.Message.getFieldProto3=jspb.Message.getFieldWithDefault;jspb.Message.getMapField=function(a,b,c,d){a.wrappers_||(a.wrappers_={});if(b in a.wrappers_)return a.wrappers_[b];var e=jspb.Message.getField(a,b);if(!e){if(c)return;e=[];jspb.Message.setField(a,b,e);}return a.wrappers_[b]=new jspb.Map(e,d)};
    jspb.Message.setField=function(a,b,c){goog.asserts.assertInstanceof(a,jspb.Message);b<a.pivot_?a.array[jspb.Message.getIndex_(a,b)]=c:(jspb.Message.maybeInitEmptyExtensionObject_(a),a.extensionObject_[b]=c);return a};jspb.Message.setProto3IntField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,0)};jspb.Message.setProto3FloatField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,0)};
    jspb.Message.setProto3BooleanField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,!1)};jspb.Message.setProto3StringField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,"")};jspb.Message.setProto3BytesField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,"")};jspb.Message.setProto3EnumField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,0)};
    jspb.Message.setProto3StringIntField=function(a,b,c){return jspb.Message.setFieldIgnoringDefault_(a,b,c,"0")};jspb.Message.setFieldIgnoringDefault_=function(a,b,c,d){goog.asserts.assertInstanceof(a,jspb.Message);c!==d?jspb.Message.setField(a,b,c):b<a.pivot_?a.array[jspb.Message.getIndex_(a,b)]=null:(jspb.Message.maybeInitEmptyExtensionObject_(a),delete a.extensionObject_[b]);return a};
    jspb.Message.addToRepeatedField=function(a,b,c,d){goog.asserts.assertInstanceof(a,jspb.Message);b=jspb.Message.getRepeatedField(a,b);void 0!=d?b.splice(d,0,c):b.push(c);return a};jspb.Message.setOneofField=function(a,b,c,d){goog.asserts.assertInstanceof(a,jspb.Message);(c=jspb.Message.computeOneofCase(a,c))&&c!==b&&void 0!==d&&(a.wrappers_&&c in a.wrappers_&&(a.wrappers_[c]=void 0),jspb.Message.setField(a,c,void 0));return jspb.Message.setField(a,b,d)};
    jspb.Message.computeOneofCase=function(a,b){for(var c,d,e=0;e<b.length;e++){var f=b[e],g=jspb.Message.getField(a,f);null!=g&&(c=f,d=g,jspb.Message.setField(a,f,void 0));}return c?(jspb.Message.setField(a,c,d),c):0};jspb.Message.getWrapperField=function(a,b,c,d){a.wrappers_||(a.wrappers_={});if(!a.wrappers_[c]){var e=jspb.Message.getField(a,c);if(d||e)a.wrappers_[c]=new b(e);}return a.wrappers_[c]};
    jspb.Message.getRepeatedWrapperField=function(a,b,c){jspb.Message.wrapRepeatedField_(a,b,c);b=a.wrappers_[c];b==jspb.Message.EMPTY_LIST_SENTINEL_&&(b=a.wrappers_[c]=[]);return b};jspb.Message.wrapRepeatedField_=function(a,b,c){a.wrappers_||(a.wrappers_={});if(!a.wrappers_[c]){for(var d=jspb.Message.getRepeatedField(a,c),e=[],f=0;f<d.length;f++)e[f]=new b(d[f]);a.wrappers_[c]=e;}};
    jspb.Message.setWrapperField=function(a,b,c){goog.asserts.assertInstanceof(a,jspb.Message);a.wrappers_||(a.wrappers_={});var d=c?c.toArray():c;a.wrappers_[b]=c;return jspb.Message.setField(a,b,d)};jspb.Message.setOneofWrapperField=function(a,b,c,d){goog.asserts.assertInstanceof(a,jspb.Message);a.wrappers_||(a.wrappers_={});var e=d?d.toArray():d;a.wrappers_[b]=d;return jspb.Message.setOneofField(a,b,c,e)};
    jspb.Message.setRepeatedWrapperField=function(a,b,c){goog.asserts.assertInstanceof(a,jspb.Message);a.wrappers_||(a.wrappers_={});c=c||[];for(var d=[],e=0;e<c.length;e++)d[e]=c[e].toArray();a.wrappers_[b]=c;return jspb.Message.setField(a,b,d)};
    jspb.Message.addToRepeatedWrapperField=function(a,b,c,d,e){jspb.Message.wrapRepeatedField_(a,d,b);var f=a.wrappers_[b];f||(f=a.wrappers_[b]=[]);c=c?c:new d;a=jspb.Message.getRepeatedField(a,b);void 0!=e?(f.splice(e,0,c),a.splice(e,0,c.toArray())):(f.push(c),a.push(c.toArray()));return c};jspb.Message.toMap=function(a,b,c,d){for(var e={},f=0;f<a.length;f++)e[b.call(a[f])]=c?c.call(a[f],d,a[f]):a[f];return e};
    jspb.Message.prototype.syncMapFields_=function(){if(this.wrappers_)for(var a in this.wrappers_){var b=this.wrappers_[a];if(Array.isArray(b))for(var c=0;c<b.length;c++)b[c]&&b[c].toArray();else b&&b.toArray();}};jspb.Message.prototype.toArray=function(){this.syncMapFields_();return this.array};jspb.Message.GENERATE_TO_STRING&&(jspb.Message.prototype.toString=function(){this.syncMapFields_();return this.array.toString()});
    jspb.Message.prototype.getExtension=function(a){if(this.extensionObject_){this.wrappers_||(this.wrappers_={});var b=a.fieldIndex;if(a.isRepeated){if(a.isMessageType())return this.wrappers_[b]||(this.wrappers_[b]=goog.array.map(this.extensionObject_[b]||[],function(b){return new a.ctor(b)})),this.wrappers_[b]}else if(a.isMessageType())return !this.wrappers_[b]&&this.extensionObject_[b]&&(this.wrappers_[b]=new a.ctor(this.extensionObject_[b])),this.wrappers_[b];return this.extensionObject_[b]}};
    jspb.Message.prototype.setExtension=function(a,b){this.wrappers_||(this.wrappers_={});jspb.Message.maybeInitEmptyExtensionObject_(this);var c=a.fieldIndex;a.isRepeated?(b=b||[],a.isMessageType()?(this.wrappers_[c]=b,this.extensionObject_[c]=goog.array.map(b,function(a){return a.toArray()})):this.extensionObject_[c]=b):a.isMessageType()?(this.wrappers_[c]=b,this.extensionObject_[c]=b?b.toArray():b):this.extensionObject_[c]=b;return this};
    jspb.Message.difference=function(a,b){if(!(a instanceof b.constructor))throw Error("Messages have different types.");var c=a.toArray();b=b.toArray();var d=[],e=0,f=c.length>b.length?c.length:b.length;a.getJsPbMessageId()&&(d[0]=a.getJsPbMessageId(),e=1);for(;e<f;e++)jspb.Message.compareFields(c[e],b[e])||(d[e]=b[e]);return new a.constructor(d)};jspb.Message.equals=function(a,b){return a==b||!(!a||!b)&&a instanceof b.constructor&&jspb.Message.compareFields(a.toArray(),b.toArray())};
    jspb.Message.compareExtensions=function(a,b){a=a||{};b=b||{};var c={},d;for(d in a)c[d]=0;for(d in b)c[d]=0;for(d in c)if(!jspb.Message.compareFields(a[d],b[d]))return !1;return !0};
    jspb.Message.compareFields=function(a,b){if(a==b)return !0;if(!goog.isObject(a)||!goog.isObject(b))return "number"===typeof a&&isNaN(a)||"number"===typeof b&&isNaN(b)?String(a)==String(b):!1;if(a.constructor!=b.constructor)return !1;if(jspb.Message.SUPPORTS_UINT8ARRAY_&&a.constructor===Uint8Array){if(a.length!=b.length)return !1;for(var c=0;c<a.length;c++)if(a[c]!=b[c])return !1;return !0}if(a.constructor===Array){var d=void 0,e=void 0,f=Math.max(a.length,b.length);for(c=0;c<f;c++){var g=a[c],h=b[c];g&&
    g.constructor==Object&&(goog.asserts.assert(void 0===d),goog.asserts.assert(c===a.length-1),d=g,g=void 0);h&&h.constructor==Object&&(goog.asserts.assert(void 0===e),goog.asserts.assert(c===b.length-1),e=h,h=void 0);if(!jspb.Message.compareFields(g,h))return !1}return d||e?(d=d||{},e=e||{},jspb.Message.compareExtensions(d,e)):!0}if(a.constructor===Object)return jspb.Message.compareExtensions(a,b);throw Error("Invalid type in JSPB array");};jspb.Message.prototype.cloneMessage=function(){return jspb.Message.cloneMessage(this)};
    jspb.Message.prototype.clone=function(){return jspb.Message.cloneMessage(this)};jspb.Message.clone=function(a){return jspb.Message.cloneMessage(a)};jspb.Message.cloneMessage=function(a){return new a.constructor(jspb.Message.clone_(a.toArray()))};
    jspb.Message.copyInto=function(a,b){goog.asserts.assertInstanceof(a,jspb.Message);goog.asserts.assertInstanceof(b,jspb.Message);goog.asserts.assert(a.constructor==b.constructor,"Copy source and target message should have the same type.");a=jspb.Message.clone(a);for(var c=b.toArray(),d=a.toArray(),e=c.length=0;e<d.length;e++)c[e]=d[e];b.wrappers_=a.wrappers_;b.extensionObject_=a.extensionObject_;};
    jspb.Message.clone_=function(a){if(Array.isArray(a)){for(var b=Array(a.length),c=0;c<a.length;c++){var d=a[c];null!=d&&(b[c]="object"==typeof d?jspb.Message.clone_(goog.asserts.assert(d)):d);}return b}if(jspb.Message.SUPPORTS_UINT8ARRAY_&&a instanceof Uint8Array)return new Uint8Array(a);b={};for(c in a)d=a[c],null!=d&&(b[c]="object"==typeof d?jspb.Message.clone_(goog.asserts.assert(d)):d);return b};jspb.Message.registerMessageType=function(a,b){b.messageId=a;};jspb.Message.messageSetExtensions={};
    jspb.Message.messageSetExtensionsBinary={};jspb.arith={};jspb.arith.UInt64=function(a,b){this.lo=a;this.hi=b;};jspb.arith.UInt64.prototype.cmp=function(a){return this.hi<a.hi||this.hi==a.hi&&this.lo<a.lo?-1:this.hi==a.hi&&this.lo==a.lo?0:1};jspb.arith.UInt64.prototype.rightShift=function(){return new jspb.arith.UInt64((this.lo>>>1|(this.hi&1)<<31)>>>0,this.hi>>>1>>>0)};jspb.arith.UInt64.prototype.leftShift=function(){return new jspb.arith.UInt64(this.lo<<1>>>0,(this.hi<<1|this.lo>>>31)>>>0)};
    jspb.arith.UInt64.prototype.msb=function(){return !!(this.hi&2147483648)};jspb.arith.UInt64.prototype.lsb=function(){return !!(this.lo&1)};jspb.arith.UInt64.prototype.zero=function(){return 0==this.lo&&0==this.hi};jspb.arith.UInt64.prototype.add=function(a){return new jspb.arith.UInt64((this.lo+a.lo&4294967295)>>>0>>>0,((this.hi+a.hi&4294967295)>>>0)+(4294967296<=this.lo+a.lo?1:0)>>>0)};
    jspb.arith.UInt64.prototype.sub=function(a){return new jspb.arith.UInt64((this.lo-a.lo&4294967295)>>>0>>>0,((this.hi-a.hi&4294967295)>>>0)-(0>this.lo-a.lo?1:0)>>>0)};jspb.arith.UInt64.mul32x32=function(a,b){var c=a&65535;a>>>=16;var d=b&65535,e=b>>>16;b=c*d+65536*(c*e&65535)+65536*(a*d&65535);for(c=a*e+(c*e>>>16)+(a*d>>>16);4294967296<=b;)b-=4294967296,c+=1;return new jspb.arith.UInt64(b>>>0,c>>>0)};
    jspb.arith.UInt64.prototype.mul=function(a){var b=jspb.arith.UInt64.mul32x32(this.lo,a);a=jspb.arith.UInt64.mul32x32(this.hi,a);a.hi=a.lo;a.lo=0;return b.add(a)};
    jspb.arith.UInt64.prototype.div=function(a){if(0==a)return [];var b=new jspb.arith.UInt64(0,0),c=new jspb.arith.UInt64(this.lo,this.hi);a=new jspb.arith.UInt64(a,0);for(var d=new jspb.arith.UInt64(1,0);!a.msb();)a=a.leftShift(),d=d.leftShift();for(;!d.zero();)0>=a.cmp(c)&&(b=b.add(d),c=c.sub(a)),a=a.rightShift(),d=d.rightShift();return [b,c]};jspb.arith.UInt64.prototype.toString=function(){for(var a="",b=this;!b.zero();){b=b.div(10);var c=b[0];a=b[1].lo+a;b=c;}""==a&&(a="0");return a};
    jspb.arith.UInt64.fromString=function(a){for(var b=new jspb.arith.UInt64(0,0),c=new jspb.arith.UInt64(0,0),d=0;d<a.length;d++){if("0">a[d]||"9"<a[d])return null;var e=parseInt(a[d],10);c.lo=e;b=b.mul(10).add(c);}return b};jspb.arith.UInt64.prototype.clone=function(){return new jspb.arith.UInt64(this.lo,this.hi)};jspb.arith.Int64=function(a,b){this.lo=a;this.hi=b;};
    jspb.arith.Int64.prototype.add=function(a){return new jspb.arith.Int64((this.lo+a.lo&4294967295)>>>0>>>0,((this.hi+a.hi&4294967295)>>>0)+(4294967296<=this.lo+a.lo?1:0)>>>0)};jspb.arith.Int64.prototype.sub=function(a){return new jspb.arith.Int64((this.lo-a.lo&4294967295)>>>0>>>0,((this.hi-a.hi&4294967295)>>>0)-(0>this.lo-a.lo?1:0)>>>0)};jspb.arith.Int64.prototype.clone=function(){return new jspb.arith.Int64(this.lo,this.hi)};
    jspb.arith.Int64.prototype.toString=function(){var a=0!=(this.hi&2147483648),b=new jspb.arith.UInt64(this.lo,this.hi);a&&(b=(new jspb.arith.UInt64(0,0)).sub(b));return (a?"-":"")+b.toString()};jspb.arith.Int64.fromString=function(a){var b=0<a.length&&"-"==a[0];b&&(a=a.substring(1));a=jspb.arith.UInt64.fromString(a);if(null===a)return null;b&&(a=(new jspb.arith.UInt64(0,0)).sub(a));return new jspb.arith.Int64(a.lo,a.hi)};jspb.BinaryEncoder=function(){this.buffer_=[];};jspb.BinaryEncoder.prototype.length=function(){return this.buffer_.length};jspb.BinaryEncoder.prototype.end=function(){var a=this.buffer_;this.buffer_=[];return a};
    jspb.BinaryEncoder.prototype.writeSplitVarint64=function(a,b){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(b==Math.floor(b));goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_32);for(goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_32);0<b||127<a;)this.buffer_.push(a&127|128),a=(a>>>7|b<<25)>>>0,b>>>=7;this.buffer_.push(a);};
    jspb.BinaryEncoder.prototype.writeSplitFixed64=function(a,b){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(b==Math.floor(b));goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_32);goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_32);this.writeUint32(a);this.writeUint32(b);};
    jspb.BinaryEncoder.prototype.writeUnsignedVarint32=function(a){goog.asserts.assert(a==Math.floor(a));for(goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_32);127<a;)this.buffer_.push(a&127|128),a>>>=7;this.buffer_.push(a);};
    jspb.BinaryEncoder.prototype.writeSignedVarint32=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_31&&a<jspb.BinaryConstants.TWO_TO_31);if(0<=a)this.writeUnsignedVarint32(a);else {for(var b=0;9>b;b++)this.buffer_.push(a&127|128),a>>=7;this.buffer_.push(1);}};
    jspb.BinaryEncoder.prototype.writeUnsignedVarint64=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_64);jspb.utils.splitInt64(a);this.writeSplitVarint64(jspb.utils.split64Low,jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeSignedVarint64=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_63&&a<jspb.BinaryConstants.TWO_TO_63);jspb.utils.splitInt64(a);this.writeSplitVarint64(jspb.utils.split64Low,jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeZigzagVarint32=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_31&&a<jspb.BinaryConstants.TWO_TO_31);this.writeUnsignedVarint32((a<<1^a>>31)>>>0);};jspb.BinaryEncoder.prototype.writeZigzagVarint64=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_63&&a<jspb.BinaryConstants.TWO_TO_63);jspb.utils.splitZigzag64(a);this.writeSplitVarint64(jspb.utils.split64Low,jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeZigzagVarint64String=function(a){this.writeZigzagVarintHash64(jspb.utils.decimalStringToHash64(a));};jspb.BinaryEncoder.prototype.writeZigzagVarintHash64=function(a){var b=this;jspb.utils.splitHash64(a);jspb.utils.toZigzag64(jspb.utils.split64Low,jspb.utils.split64High,function(a,d){b.writeSplitVarint64(a>>>0,d>>>0);});};
    jspb.BinaryEncoder.prototype.writeUint8=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(0<=a&&256>a);this.buffer_.push(a>>>0&255);};jspb.BinaryEncoder.prototype.writeUint16=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(0<=a&&65536>a);this.buffer_.push(a>>>0&255);this.buffer_.push(a>>>8&255);};
    jspb.BinaryEncoder.prototype.writeUint32=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_32);this.buffer_.push(a>>>0&255);this.buffer_.push(a>>>8&255);this.buffer_.push(a>>>16&255);this.buffer_.push(a>>>24&255);};jspb.BinaryEncoder.prototype.writeUint64=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_64);jspb.utils.splitUint64(a);this.writeUint32(jspb.utils.split64Low);this.writeUint32(jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeInt8=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(-128<=a&&128>a);this.buffer_.push(a>>>0&255);};jspb.BinaryEncoder.prototype.writeInt16=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(-32768<=a&&32768>a);this.buffer_.push(a>>>0&255);this.buffer_.push(a>>>8&255);};
    jspb.BinaryEncoder.prototype.writeInt32=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_31&&a<jspb.BinaryConstants.TWO_TO_31);this.buffer_.push(a>>>0&255);this.buffer_.push(a>>>8&255);this.buffer_.push(a>>>16&255);this.buffer_.push(a>>>24&255);};
    jspb.BinaryEncoder.prototype.writeInt64=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_63&&a<jspb.BinaryConstants.TWO_TO_63);jspb.utils.splitInt64(a);this.writeSplitFixed64(jspb.utils.split64Low,jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeInt64String=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(+a>=-jspb.BinaryConstants.TWO_TO_63&&+a<jspb.BinaryConstants.TWO_TO_63);jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(a));this.writeSplitFixed64(jspb.utils.split64Low,jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeFloat=function(a){goog.asserts.assert(Infinity===a||-Infinity===a||isNaN(a)||a>=-jspb.BinaryConstants.FLOAT32_MAX&&a<=jspb.BinaryConstants.FLOAT32_MAX);jspb.utils.splitFloat32(a);this.writeUint32(jspb.utils.split64Low);};
    jspb.BinaryEncoder.prototype.writeDouble=function(a){goog.asserts.assert(Infinity===a||-Infinity===a||isNaN(a)||a>=-jspb.BinaryConstants.FLOAT64_MAX&&a<=jspb.BinaryConstants.FLOAT64_MAX);jspb.utils.splitFloat64(a);this.writeUint32(jspb.utils.split64Low);this.writeUint32(jspb.utils.split64High);};jspb.BinaryEncoder.prototype.writeBool=function(a){goog.asserts.assert("boolean"===typeof a||"number"===typeof a);this.buffer_.push(a?1:0);};
    jspb.BinaryEncoder.prototype.writeEnum=function(a){goog.asserts.assert(a==Math.floor(a));goog.asserts.assert(a>=-jspb.BinaryConstants.TWO_TO_31&&a<jspb.BinaryConstants.TWO_TO_31);this.writeSignedVarint32(a);};jspb.BinaryEncoder.prototype.writeBytes=function(a){this.buffer_.push.apply(this.buffer_,a);};jspb.BinaryEncoder.prototype.writeVarintHash64=function(a){jspb.utils.splitHash64(a);this.writeSplitVarint64(jspb.utils.split64Low,jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeFixedHash64=function(a){jspb.utils.splitHash64(a);this.writeUint32(jspb.utils.split64Low);this.writeUint32(jspb.utils.split64High);};
    jspb.BinaryEncoder.prototype.writeString=function(a){for(var b=this.buffer_.length,c=0;c<a.length;c++){var d=a.charCodeAt(c);if(128>d)this.buffer_.push(d);else if(2048>d)this.buffer_.push(d>>6|192),this.buffer_.push(d&63|128);else if(65536>d)if(55296<=d&&56319>=d&&c+1<a.length){var e=a.charCodeAt(c+1);56320<=e&&57343>=e&&(d=1024*(d-55296)+e-56320+65536,this.buffer_.push(d>>18|240),this.buffer_.push(d>>12&63|128),this.buffer_.push(d>>6&63|128),this.buffer_.push(d&63|128),c++);}else this.buffer_.push(d>>
    12|224),this.buffer_.push(d>>6&63|128),this.buffer_.push(d&63|128);}return this.buffer_.length-b};jspb.BinaryWriter=function(){this.blocks_=[];this.totalLength_=0;this.encoder_=new jspb.BinaryEncoder;this.bookmarks_=[];};jspb.BinaryWriter.prototype.appendUint8Array_=function(a){var b=this.encoder_.end();this.blocks_.push(b);this.blocks_.push(a);this.totalLength_+=b.length+a.length;};
    jspb.BinaryWriter.prototype.beginDelimited_=function(a){this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED);a=this.encoder_.end();this.blocks_.push(a);this.totalLength_+=a.length;a.push(this.totalLength_);return a};jspb.BinaryWriter.prototype.endDelimited_=function(a){var b=a.pop();b=this.totalLength_+this.encoder_.length()-b;for(goog.asserts.assert(0<=b);127<b;)a.push(b&127|128),b>>>=7,this.totalLength_++;a.push(b);this.totalLength_++;};
    jspb.BinaryWriter.prototype.writeSerializedMessage=function(a,b,c){this.appendUint8Array_(a.subarray(b,c));};jspb.BinaryWriter.prototype.maybeWriteSerializedMessage=function(a,b,c){null!=a&&null!=b&&null!=c&&this.writeSerializedMessage(a,b,c);};jspb.BinaryWriter.prototype.reset=function(){this.blocks_=[];this.encoder_.end();this.totalLength_=0;this.bookmarks_=[];};
    jspb.BinaryWriter.prototype.getResultBuffer=function(){goog.asserts.assert(0==this.bookmarks_.length);for(var a=new Uint8Array(this.totalLength_+this.encoder_.length()),b=this.blocks_,c=b.length,d=0,e=0;e<c;e++){var f=b[e];a.set(f,d);d+=f.length;}b=this.encoder_.end();a.set(b,d);d+=b.length;goog.asserts.assert(d==a.length);this.blocks_=[a];return a};jspb.BinaryWriter.prototype.getResultBase64String=function(a){return goog.crypt.base64.encodeByteArray(this.getResultBuffer(),a)};
    jspb.BinaryWriter.prototype.beginSubMessage=function(a){this.bookmarks_.push(this.beginDelimited_(a));};jspb.BinaryWriter.prototype.endSubMessage=function(){goog.asserts.assert(0<=this.bookmarks_.length);this.endDelimited_(this.bookmarks_.pop());};jspb.BinaryWriter.prototype.writeFieldHeader_=function(a,b){goog.asserts.assert(1<=a&&a==Math.floor(a));this.encoder_.writeUnsignedVarint32(8*a+b);};
    jspb.BinaryWriter.prototype.writeAny=function(a,b,c){var d=jspb.BinaryConstants.FieldType;switch(a){case d.DOUBLE:this.writeDouble(b,c);break;case d.FLOAT:this.writeFloat(b,c);break;case d.INT64:this.writeInt64(b,c);break;case d.UINT64:this.writeUint64(b,c);break;case d.INT32:this.writeInt32(b,c);break;case d.FIXED64:this.writeFixed64(b,c);break;case d.FIXED32:this.writeFixed32(b,c);break;case d.BOOL:this.writeBool(b,c);break;case d.STRING:this.writeString(b,c);break;case d.GROUP:goog.asserts.fail("Group field type not supported in writeAny()");
    break;case d.MESSAGE:goog.asserts.fail("Message field type not supported in writeAny()");break;case d.BYTES:this.writeBytes(b,c);break;case d.UINT32:this.writeUint32(b,c);break;case d.ENUM:this.writeEnum(b,c);break;case d.SFIXED32:this.writeSfixed32(b,c);break;case d.SFIXED64:this.writeSfixed64(b,c);break;case d.SINT32:this.writeSint32(b,c);break;case d.SINT64:this.writeSint64(b,c);break;case d.FHASH64:this.writeFixedHash64(b,c);break;case d.VHASH64:this.writeVarintHash64(b,c);break;default:goog.asserts.fail("Invalid field type in writeAny()");}};
    jspb.BinaryWriter.prototype.writeUnsignedVarint32_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeUnsignedVarint32(b));};jspb.BinaryWriter.prototype.writeSignedVarint32_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeSignedVarint32(b));};jspb.BinaryWriter.prototype.writeUnsignedVarint64_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeUnsignedVarint64(b));};
    jspb.BinaryWriter.prototype.writeSignedVarint64_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeSignedVarint64(b));};jspb.BinaryWriter.prototype.writeZigzagVarint32_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeZigzagVarint32(b));};jspb.BinaryWriter.prototype.writeZigzagVarint64_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeZigzagVarint64(b));};
    jspb.BinaryWriter.prototype.writeZigzagVarint64String_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeZigzagVarint64String(b));};jspb.BinaryWriter.prototype.writeZigzagVarintHash64_=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeZigzagVarintHash64(b));};
    jspb.BinaryWriter.prototype.writeInt32=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_31&&b<jspb.BinaryConstants.TWO_TO_31),this.writeSignedVarint32_(a,b));};jspb.BinaryWriter.prototype.writeInt32String=function(a,b){null!=b&&(b=parseInt(b,10),goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_31&&b<jspb.BinaryConstants.TWO_TO_31),this.writeSignedVarint32_(a,b));};
    jspb.BinaryWriter.prototype.writeInt64=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_63&&b<jspb.BinaryConstants.TWO_TO_63),this.writeSignedVarint64_(a,b));};jspb.BinaryWriter.prototype.writeInt64String=function(a,b){null!=b&&(b=jspb.arith.Int64.fromString(b),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeSplitVarint64(b.lo,b.hi));};
    jspb.BinaryWriter.prototype.writeUint32=function(a,b){null!=b&&(goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_32),this.writeUnsignedVarint32_(a,b));};jspb.BinaryWriter.prototype.writeUint32String=function(a,b){null!=b&&(b=parseInt(b,10),goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_32),this.writeUnsignedVarint32_(a,b));};jspb.BinaryWriter.prototype.writeUint64=function(a,b){null!=b&&(goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_64),this.writeUnsignedVarint64_(a,b));};
    jspb.BinaryWriter.prototype.writeUint64String=function(a,b){null!=b&&(b=jspb.arith.UInt64.fromString(b),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeSplitVarint64(b.lo,b.hi));};jspb.BinaryWriter.prototype.writeSint32=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_31&&b<jspb.BinaryConstants.TWO_TO_31),this.writeZigzagVarint32_(a,b));};
    jspb.BinaryWriter.prototype.writeSint64=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_63&&b<jspb.BinaryConstants.TWO_TO_63),this.writeZigzagVarint64_(a,b));};jspb.BinaryWriter.prototype.writeSintHash64=function(a,b){null!=b&&this.writeZigzagVarintHash64_(a,b);};jspb.BinaryWriter.prototype.writeSint64String=function(a,b){null!=b&&this.writeZigzagVarint64String_(a,b);};
    jspb.BinaryWriter.prototype.writeFixed32=function(a,b){null!=b&&(goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_32),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED32),this.encoder_.writeUint32(b));};jspb.BinaryWriter.prototype.writeFixed64=function(a,b){null!=b&&(goog.asserts.assert(0<=b&&b<jspb.BinaryConstants.TWO_TO_64),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64),this.encoder_.writeUint64(b));};
    jspb.BinaryWriter.prototype.writeFixed64String=function(a,b){null!=b&&(b=jspb.arith.UInt64.fromString(b),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64),this.encoder_.writeSplitFixed64(b.lo,b.hi));};jspb.BinaryWriter.prototype.writeSfixed32=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_31&&b<jspb.BinaryConstants.TWO_TO_31),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED32),this.encoder_.writeInt32(b));};
    jspb.BinaryWriter.prototype.writeSfixed64=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_63&&b<jspb.BinaryConstants.TWO_TO_63),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64),this.encoder_.writeInt64(b));};jspb.BinaryWriter.prototype.writeSfixed64String=function(a,b){null!=b&&(b=jspb.arith.Int64.fromString(b),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64),this.encoder_.writeSplitFixed64(b.lo,b.hi));};
    jspb.BinaryWriter.prototype.writeFloat=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED32),this.encoder_.writeFloat(b));};jspb.BinaryWriter.prototype.writeDouble=function(a,b){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64),this.encoder_.writeDouble(b));};
    jspb.BinaryWriter.prototype.writeBool=function(a,b){null!=b&&(goog.asserts.assert("boolean"===typeof b||"number"===typeof b),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeBool(b));};jspb.BinaryWriter.prototype.writeEnum=function(a,b){null!=b&&(goog.asserts.assert(b>=-jspb.BinaryConstants.TWO_TO_31&&b<jspb.BinaryConstants.TWO_TO_31),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeSignedVarint32(b));};
    jspb.BinaryWriter.prototype.writeString=function(a,b){null!=b&&(a=this.beginDelimited_(a),this.encoder_.writeString(b),this.endDelimited_(a));};jspb.BinaryWriter.prototype.writeBytes=function(a,b){null!=b&&(b=jspb.utils.byteSourceToUint8Array(b),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(b.length),this.appendUint8Array_(b));};jspb.BinaryWriter.prototype.writeMessage=function(a,b,c){null!=b&&(a=this.beginDelimited_(a),c(b,this),this.endDelimited_(a));};
    jspb.BinaryWriter.prototype.writeMessageSet=function(a,b,c){null!=b&&(this.writeFieldHeader_(1,jspb.BinaryConstants.WireType.START_GROUP),this.writeFieldHeader_(2,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeSignedVarint32(a),a=this.beginDelimited_(3),c(b,this),this.endDelimited_(a),this.writeFieldHeader_(1,jspb.BinaryConstants.WireType.END_GROUP));};
    jspb.BinaryWriter.prototype.writeGroup=function(a,b,c){null!=b&&(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.START_GROUP),c(b,this),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.END_GROUP));};jspb.BinaryWriter.prototype.writeFixedHash64=function(a,b){null!=b&&(goog.asserts.assert(8==b.length),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64),this.encoder_.writeFixedHash64(b));};
    jspb.BinaryWriter.prototype.writeVarintHash64=function(a,b){null!=b&&(goog.asserts.assert(8==b.length),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT),this.encoder_.writeVarintHash64(b));};jspb.BinaryWriter.prototype.writeSplitFixed64=function(a,b,c){this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.FIXED64);this.encoder_.writeSplitFixed64(b,c);};
    jspb.BinaryWriter.prototype.writeSplitVarint64=function(a,b,c){this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT);this.encoder_.writeSplitVarint64(b,c);};jspb.BinaryWriter.prototype.writeSplitZigzagVarint64=function(a,b,c){this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.VARINT);var d=this.encoder_;jspb.utils.toZigzag64(b,c,function(a,b){d.writeSplitVarint64(a>>>0,b>>>0);});};
    jspb.BinaryWriter.prototype.writeRepeatedInt32=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeSignedVarint32_(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedInt32String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeInt32String(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedInt64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeSignedVarint64_(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedSplitFixed64=function(a,b,c,d){if(null!=b)for(var e=0;e<b.length;e++)this.writeSplitFixed64(a,c(b[e]),d(b[e]));};jspb.BinaryWriter.prototype.writeRepeatedSplitVarint64=function(a,b,c,d){if(null!=b)for(var e=0;e<b.length;e++)this.writeSplitVarint64(a,c(b[e]),d(b[e]));};jspb.BinaryWriter.prototype.writeRepeatedSplitZigzagVarint64=function(a,b,c,d){if(null!=b)for(var e=0;e<b.length;e++)this.writeSplitZigzagVarint64(a,c(b[e]),d(b[e]));};
    jspb.BinaryWriter.prototype.writeRepeatedInt64String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeInt64String(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedUint32=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeUnsignedVarint32_(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedUint32String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeUint32String(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedUint64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeUnsignedVarint64_(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedUint64String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeUint64String(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedSint32=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeZigzagVarint32_(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedSint64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeZigzagVarint64_(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedSint64String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeZigzagVarint64String_(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedSintHash64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeZigzagVarintHash64_(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedFixed32=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeFixed32(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedFixed64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeFixed64(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedFixed64String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeFixed64String(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedSfixed32=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeSfixed32(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedSfixed64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeSfixed64(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedSfixed64String=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeSfixed64String(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedFloat=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeFloat(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedDouble=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeDouble(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedBool=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeBool(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedEnum=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeEnum(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedString=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeString(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedBytes=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeBytes(a,b[c]);};jspb.BinaryWriter.prototype.writeRepeatedMessage=function(a,b,c){if(null!=b)for(var d=0;d<b.length;d++){var e=this.beginDelimited_(a);c(b[d],this);this.endDelimited_(e);}};
    jspb.BinaryWriter.prototype.writeRepeatedGroup=function(a,b,c){if(null!=b)for(var d=0;d<b.length;d++)this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.START_GROUP),c(b[d],this),this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.END_GROUP);};jspb.BinaryWriter.prototype.writeRepeatedFixedHash64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeFixedHash64(a,b[c]);};
    jspb.BinaryWriter.prototype.writeRepeatedVarintHash64=function(a,b){if(null!=b)for(var c=0;c<b.length;c++)this.writeVarintHash64(a,b[c]);};jspb.BinaryWriter.prototype.writePackedInt32=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeSignedVarint32(b[c]);this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedInt32String=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeSignedVarint32(parseInt(b[c],10));this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedInt64=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeSignedVarint64(b[c]);this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedSplitFixed64=function(a,b,c,d){if(null!=b){a=this.beginDelimited_(a);for(var e=0;e<b.length;e++)this.encoder_.writeSplitFixed64(c(b[e]),d(b[e]));this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedSplitVarint64=function(a,b,c,d){if(null!=b){a=this.beginDelimited_(a);for(var e=0;e<b.length;e++)this.encoder_.writeSplitVarint64(c(b[e]),d(b[e]));this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedSplitZigzagVarint64=function(a,b,c,d){if(null!=b){a=this.beginDelimited_(a);for(var e=this.encoder_,f=0;f<b.length;f++)jspb.utils.toZigzag64(c(b[f]),d(b[f]),function(a,b){e.writeSplitVarint64(a>>>0,b>>>0);});this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedInt64String=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++){var d=jspb.arith.Int64.fromString(b[c]);this.encoder_.writeSplitVarint64(d.lo,d.hi);}this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedUint32=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeUnsignedVarint32(b[c]);this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedUint32String=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeUnsignedVarint32(parseInt(b[c],10));this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedUint64=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeUnsignedVarint64(b[c]);this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedUint64String=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++){var d=jspb.arith.UInt64.fromString(b[c]);this.encoder_.writeSplitVarint64(d.lo,d.hi);}this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedSint32=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeZigzagVarint32(b[c]);this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedSint64=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeZigzagVarint64(b[c]);this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedSint64String=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeZigzagVarintHash64(jspb.utils.decimalStringToHash64(b[c]));this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedSintHash64=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeZigzagVarintHash64(b[c]);this.endDelimited_(a);}};
    jspb.BinaryWriter.prototype.writePackedFixed32=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(4*b.length),a=0;a<b.length;a++)this.encoder_.writeUint32(b[a]);};jspb.BinaryWriter.prototype.writePackedFixed64=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(8*b.length),a=0;a<b.length;a++)this.encoder_.writeUint64(b[a]);};
    jspb.BinaryWriter.prototype.writePackedFixed64String=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(8*b.length),a=0;a<b.length;a++){var c=jspb.arith.UInt64.fromString(b[a]);this.encoder_.writeSplitFixed64(c.lo,c.hi);}};
    jspb.BinaryWriter.prototype.writePackedSfixed32=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(4*b.length),a=0;a<b.length;a++)this.encoder_.writeInt32(b[a]);};jspb.BinaryWriter.prototype.writePackedSfixed64=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(8*b.length),a=0;a<b.length;a++)this.encoder_.writeInt64(b[a]);};
    jspb.BinaryWriter.prototype.writePackedSfixed64String=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(8*b.length),a=0;a<b.length;a++)this.encoder_.writeInt64String(b[a]);};jspb.BinaryWriter.prototype.writePackedFloat=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(4*b.length),a=0;a<b.length;a++)this.encoder_.writeFloat(b[a]);};
    jspb.BinaryWriter.prototype.writePackedDouble=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(8*b.length),a=0;a<b.length;a++)this.encoder_.writeDouble(b[a]);};jspb.BinaryWriter.prototype.writePackedBool=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(b.length),a=0;a<b.length;a++)this.encoder_.writeBool(b[a]);};
    jspb.BinaryWriter.prototype.writePackedEnum=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeEnum(b[c]);this.endDelimited_(a);}};jspb.BinaryWriter.prototype.writePackedFixedHash64=function(a,b){if(null!=b&&b.length)for(this.writeFieldHeader_(a,jspb.BinaryConstants.WireType.DELIMITED),this.encoder_.writeUnsignedVarint32(8*b.length),a=0;a<b.length;a++)this.encoder_.writeFixedHash64(b[a]);};
    jspb.BinaryWriter.prototype.writePackedVarintHash64=function(a,b){if(null!=b&&b.length){a=this.beginDelimited_(a);for(var c=0;c<b.length;c++)this.encoder_.writeVarintHash64(b[c]);this.endDelimited_(a);}};jspb.Export={};var _Map=jspb.Map;var Message=jspb.Message;var BinaryReader=jspb.BinaryReader;var BinaryWriter=jspb.BinaryWriter;var ExtensionFieldInfo=jspb.ExtensionFieldInfo;var ExtensionFieldBinaryInfo=jspb.ExtensionFieldBinaryInfo;var exportSymbol=goog.exportSymbol;var inherits=goog.inherits;var object={extend:goog.object.extend};var typeOf=goog.typeOf;

    var googleProtobuf = {
    	Map: _Map,
    	Message: Message,
    	BinaryReader: BinaryReader,
    	BinaryWriter: BinaryWriter,
    	ExtensionFieldInfo: ExtensionFieldInfo,
    	ExtensionFieldBinaryInfo: ExtensionFieldBinaryInfo,
    	exportSymbol: exportSymbol,
    	inherits: inherits,
    	object: object,
    	typeOf: typeOf
    };

    var hub_pb = createCommonjsModule(function (module, exports) {
    // source: hub.proto
    /**
     * @fileoverview
     * @enhanceable
     * @suppress {messageConventions} JS Compiler reports an error if a variable or
     *     field starts with 'MSG_' and isn't a translatable message.
     * @public
     */
    // GENERATED CODE -- DO NOT EDIT!


    var goog = googleProtobuf;
    var global = Function('return this')();

    goog.exportSymbol('proto.api.hub.pb.BuildInfoRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.BuildInfoResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.CreateKeyRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.CreateKeyResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.CreateOrgRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.CreateOrgResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.DestroyAccountRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.DestroyAccountResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.GetIdentityRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.GetIdentityResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.GetOrgRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.GetOrgResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.GetSessionInfoRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.GetSessionInfoResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.InvalidateKeyRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.InvalidateKeyResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.InviteToOrgRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.InviteToOrgResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.IsOrgNameAvailableRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.IsOrgNameAvailableResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.IsUsernameAvailableRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.IsUsernameAvailableResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.KeyInfo', null, global);
    goog.exportSymbol('proto.api.hub.pb.KeyType', null, global);
    goog.exportSymbol('proto.api.hub.pb.LeaveOrgRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.LeaveOrgResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.ListKeysRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.ListKeysResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.ListOrgsRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.ListOrgsResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.OrgInfo', null, global);
    goog.exportSymbol('proto.api.hub.pb.OrgInfo.Member', null, global);
    goog.exportSymbol('proto.api.hub.pb.RemoveOrgRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.RemoveOrgResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.SigninRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.SigninResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.SignoutRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.SignoutResponse', null, global);
    goog.exportSymbol('proto.api.hub.pb.SignupRequest', null, global);
    goog.exportSymbol('proto.api.hub.pb.SignupResponse', null, global);
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.BuildInfoRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.BuildInfoRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.BuildInfoRequest.displayName = 'proto.api.hub.pb.BuildInfoRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.BuildInfoResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.BuildInfoResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.BuildInfoResponse.displayName = 'proto.api.hub.pb.BuildInfoResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.SignupRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.SignupRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.SignupRequest.displayName = 'proto.api.hub.pb.SignupRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.SignupResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.SignupResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.SignupResponse.displayName = 'proto.api.hub.pb.SignupResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.SigninRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.SigninRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.SigninRequest.displayName = 'proto.api.hub.pb.SigninRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.SigninResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.SigninResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.SigninResponse.displayName = 'proto.api.hub.pb.SigninResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.SignoutRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.SignoutRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.SignoutRequest.displayName = 'proto.api.hub.pb.SignoutRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.SignoutResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.SignoutResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.SignoutResponse.displayName = 'proto.api.hub.pb.SignoutResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.GetSessionInfoRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.GetSessionInfoRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.GetSessionInfoRequest.displayName = 'proto.api.hub.pb.GetSessionInfoRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.GetSessionInfoResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.GetSessionInfoResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.GetSessionInfoResponse.displayName = 'proto.api.hub.pb.GetSessionInfoResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.GetIdentityRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.GetIdentityRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.GetIdentityRequest.displayName = 'proto.api.hub.pb.GetIdentityRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.GetIdentityResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.GetIdentityResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.GetIdentityResponse.displayName = 'proto.api.hub.pb.GetIdentityResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.KeyInfo = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.KeyInfo, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.KeyInfo.displayName = 'proto.api.hub.pb.KeyInfo';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.CreateKeyRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.CreateKeyRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.CreateKeyRequest.displayName = 'proto.api.hub.pb.CreateKeyRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.CreateKeyResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.CreateKeyResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.CreateKeyResponse.displayName = 'proto.api.hub.pb.CreateKeyResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.InvalidateKeyRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.InvalidateKeyRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.InvalidateKeyRequest.displayName = 'proto.api.hub.pb.InvalidateKeyRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.InvalidateKeyResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.InvalidateKeyResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.InvalidateKeyResponse.displayName = 'proto.api.hub.pb.InvalidateKeyResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.ListKeysRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.ListKeysRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.ListKeysRequest.displayName = 'proto.api.hub.pb.ListKeysRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.ListKeysResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, proto.api.hub.pb.ListKeysResponse.repeatedFields_, null);
    };
    goog.inherits(proto.api.hub.pb.ListKeysResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.ListKeysResponse.displayName = 'proto.api.hub.pb.ListKeysResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.OrgInfo = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, proto.api.hub.pb.OrgInfo.repeatedFields_, null);
    };
    goog.inherits(proto.api.hub.pb.OrgInfo, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.OrgInfo.displayName = 'proto.api.hub.pb.OrgInfo';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.OrgInfo.Member = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.OrgInfo.Member, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.OrgInfo.Member.displayName = 'proto.api.hub.pb.OrgInfo.Member';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.CreateOrgRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.CreateOrgRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.CreateOrgRequest.displayName = 'proto.api.hub.pb.CreateOrgRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.CreateOrgResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.CreateOrgResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.CreateOrgResponse.displayName = 'proto.api.hub.pb.CreateOrgResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.GetOrgRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.GetOrgRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.GetOrgRequest.displayName = 'proto.api.hub.pb.GetOrgRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.GetOrgResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.GetOrgResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.GetOrgResponse.displayName = 'proto.api.hub.pb.GetOrgResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.ListOrgsRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.ListOrgsRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.ListOrgsRequest.displayName = 'proto.api.hub.pb.ListOrgsRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.ListOrgsResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, proto.api.hub.pb.ListOrgsResponse.repeatedFields_, null);
    };
    goog.inherits(proto.api.hub.pb.ListOrgsResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.ListOrgsResponse.displayName = 'proto.api.hub.pb.ListOrgsResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.RemoveOrgRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.RemoveOrgRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.RemoveOrgRequest.displayName = 'proto.api.hub.pb.RemoveOrgRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.RemoveOrgResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.RemoveOrgResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.RemoveOrgResponse.displayName = 'proto.api.hub.pb.RemoveOrgResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.InviteToOrgRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.InviteToOrgRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.InviteToOrgRequest.displayName = 'proto.api.hub.pb.InviteToOrgRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.InviteToOrgResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.InviteToOrgResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.InviteToOrgResponse.displayName = 'proto.api.hub.pb.InviteToOrgResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.LeaveOrgRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.LeaveOrgRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.LeaveOrgRequest.displayName = 'proto.api.hub.pb.LeaveOrgRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.LeaveOrgResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.LeaveOrgResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.LeaveOrgResponse.displayName = 'proto.api.hub.pb.LeaveOrgResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.IsUsernameAvailableRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.IsUsernameAvailableRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.IsUsernameAvailableRequest.displayName = 'proto.api.hub.pb.IsUsernameAvailableRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.IsUsernameAvailableResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.IsUsernameAvailableResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.IsUsernameAvailableResponse.displayName = 'proto.api.hub.pb.IsUsernameAvailableResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.IsOrgNameAvailableRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.IsOrgNameAvailableRequest.displayName = 'proto.api.hub.pb.IsOrgNameAvailableRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.IsOrgNameAvailableResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.IsOrgNameAvailableResponse.displayName = 'proto.api.hub.pb.IsOrgNameAvailableResponse';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.DestroyAccountRequest = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.DestroyAccountRequest, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.DestroyAccountRequest.displayName = 'proto.api.hub.pb.DestroyAccountRequest';
    }
    /**
     * Generated by JsPbCodeGenerator.
     * @param {Array=} opt_data Optional initial data array, typically from a
     * server response, or constructed directly in Javascript. The array is used
     * in place and becomes part of the constructed object. It is not cloned.
     * If no data is provided, the constructed object will be empty, but still
     * valid.
     * @extends {jspb.Message}
     * @constructor
     */
    proto.api.hub.pb.DestroyAccountResponse = function(opt_data) {
      googleProtobuf.Message.initialize(this, opt_data, 0, -1, null, null);
    };
    goog.inherits(proto.api.hub.pb.DestroyAccountResponse, googleProtobuf.Message);
    if (goog.DEBUG && !COMPILED) {
      /**
       * @public
       * @override
       */
      proto.api.hub.pb.DestroyAccountResponse.displayName = 'proto.api.hub.pb.DestroyAccountResponse';
    }



    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.BuildInfoRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.BuildInfoRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.BuildInfoRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.BuildInfoRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.BuildInfoRequest}
     */
    proto.api.hub.pb.BuildInfoRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.BuildInfoRequest;
      return proto.api.hub.pb.BuildInfoRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.BuildInfoRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.BuildInfoRequest}
     */
    proto.api.hub.pb.BuildInfoRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.BuildInfoRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.BuildInfoRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.BuildInfoRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.BuildInfoRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.BuildInfoResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.BuildInfoResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.BuildInfoResponse.toObject = function(includeInstance, msg) {
      var obj = {
        gitCommit: googleProtobuf.Message.getFieldWithDefault(msg, 1, ""),
        gitBranch: googleProtobuf.Message.getFieldWithDefault(msg, 2, ""),
        gitState: googleProtobuf.Message.getFieldWithDefault(msg, 3, ""),
        gitSummary: googleProtobuf.Message.getFieldWithDefault(msg, 4, ""),
        buildDate: googleProtobuf.Message.getFieldWithDefault(msg, 5, ""),
        version: googleProtobuf.Message.getFieldWithDefault(msg, 6, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.BuildInfoResponse}
     */
    proto.api.hub.pb.BuildInfoResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.BuildInfoResponse;
      return proto.api.hub.pb.BuildInfoResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.BuildInfoResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.BuildInfoResponse}
     */
    proto.api.hub.pb.BuildInfoResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setGitCommit(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setGitBranch(value);
          break;
        case 3:
          var value = /** @type {string} */ (reader.readString());
          msg.setGitState(value);
          break;
        case 4:
          var value = /** @type {string} */ (reader.readString());
          msg.setGitSummary(value);
          break;
        case 5:
          var value = /** @type {string} */ (reader.readString());
          msg.setBuildDate(value);
          break;
        case 6:
          var value = /** @type {string} */ (reader.readString());
          msg.setVersion(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.BuildInfoResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.BuildInfoResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.BuildInfoResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getGitCommit();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
      f = message.getGitBranch();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
      f = message.getGitState();
      if (f.length > 0) {
        writer.writeString(
          3,
          f
        );
      }
      f = message.getGitSummary();
      if (f.length > 0) {
        writer.writeString(
          4,
          f
        );
      }
      f = message.getBuildDate();
      if (f.length > 0) {
        writer.writeString(
          5,
          f
        );
      }
      f = message.getVersion();
      if (f.length > 0) {
        writer.writeString(
          6,
          f
        );
      }
    };


    /**
     * optional string git_commit = 1;
     * @return {string}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.getGitCommit = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.BuildInfoResponse} returns this
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.setGitCommit = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };


    /**
     * optional string git_branch = 2;
     * @return {string}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.getGitBranch = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.BuildInfoResponse} returns this
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.setGitBranch = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };


    /**
     * optional string git_state = 3;
     * @return {string}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.getGitState = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 3, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.BuildInfoResponse} returns this
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.setGitState = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 3, value);
    };


    /**
     * optional string git_summary = 4;
     * @return {string}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.getGitSummary = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 4, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.BuildInfoResponse} returns this
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.setGitSummary = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 4, value);
    };


    /**
     * optional string build_date = 5;
     * @return {string}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.getBuildDate = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 5, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.BuildInfoResponse} returns this
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.setBuildDate = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 5, value);
    };


    /**
     * optional string version = 6;
     * @return {string}
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.getVersion = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 6, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.BuildInfoResponse} returns this
     */
    proto.api.hub.pb.BuildInfoResponse.prototype.setVersion = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 6, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.SignupRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.SignupRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.SignupRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignupRequest.toObject = function(includeInstance, msg) {
      var obj = {
        username: googleProtobuf.Message.getFieldWithDefault(msg, 1, ""),
        email: googleProtobuf.Message.getFieldWithDefault(msg, 2, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.SignupRequest}
     */
    proto.api.hub.pb.SignupRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.SignupRequest;
      return proto.api.hub.pb.SignupRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.SignupRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.SignupRequest}
     */
    proto.api.hub.pb.SignupRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setUsername(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setEmail(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SignupRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.SignupRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.SignupRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignupRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getUsername();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
      f = message.getEmail();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
    };


    /**
     * optional string username = 1;
     * @return {string}
     */
    proto.api.hub.pb.SignupRequest.prototype.getUsername = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.SignupRequest} returns this
     */
    proto.api.hub.pb.SignupRequest.prototype.setUsername = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };


    /**
     * optional string email = 2;
     * @return {string}
     */
    proto.api.hub.pb.SignupRequest.prototype.getEmail = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.SignupRequest} returns this
     */
    proto.api.hub.pb.SignupRequest.prototype.setEmail = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.SignupResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.SignupResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.SignupResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignupResponse.toObject = function(includeInstance, msg) {
      var obj = {
        key: msg.getKey_asB64(),
        session: googleProtobuf.Message.getFieldWithDefault(msg, 2, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.SignupResponse}
     */
    proto.api.hub.pb.SignupResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.SignupResponse;
      return proto.api.hub.pb.SignupResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.SignupResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.SignupResponse}
     */
    proto.api.hub.pb.SignupResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!Uint8Array} */ (reader.readBytes());
          msg.setKey(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setSession(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SignupResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.SignupResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.SignupResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignupResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey_asU8();
      if (f.length > 0) {
        writer.writeBytes(
          1,
          f
        );
      }
      f = message.getSession();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
    };


    /**
     * optional bytes key = 1;
     * @return {!(string|Uint8Array)}
     */
    proto.api.hub.pb.SignupResponse.prototype.getKey = function() {
      return /** @type {!(string|Uint8Array)} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * optional bytes key = 1;
     * This is a type-conversion wrapper around `getKey()`
     * @return {string}
     */
    proto.api.hub.pb.SignupResponse.prototype.getKey_asB64 = function() {
      return /** @type {string} */ (googleProtobuf.Message.bytesAsB64(
          this.getKey()));
    };


    /**
     * optional bytes key = 1;
     * Note that Uint8Array is not supported on all browsers.
     * @see http://caniuse.com/Uint8Array
     * This is a type-conversion wrapper around `getKey()`
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SignupResponse.prototype.getKey_asU8 = function() {
      return /** @type {!Uint8Array} */ (googleProtobuf.Message.bytesAsU8(
          this.getKey()));
    };


    /**
     * @param {!(string|Uint8Array)} value
     * @return {!proto.api.hub.pb.SignupResponse} returns this
     */
    proto.api.hub.pb.SignupResponse.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3BytesField(this, 1, value);
    };


    /**
     * optional string session = 2;
     * @return {string}
     */
    proto.api.hub.pb.SignupResponse.prototype.getSession = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.SignupResponse} returns this
     */
    proto.api.hub.pb.SignupResponse.prototype.setSession = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.SigninRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.SigninRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.SigninRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SigninRequest.toObject = function(includeInstance, msg) {
      var obj = {
        usernameOrEmail: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.SigninRequest}
     */
    proto.api.hub.pb.SigninRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.SigninRequest;
      return proto.api.hub.pb.SigninRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.SigninRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.SigninRequest}
     */
    proto.api.hub.pb.SigninRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setUsernameOrEmail(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SigninRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.SigninRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.SigninRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SigninRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getUsernameOrEmail();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string username_or_email = 1;
     * @return {string}
     */
    proto.api.hub.pb.SigninRequest.prototype.getUsernameOrEmail = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.SigninRequest} returns this
     */
    proto.api.hub.pb.SigninRequest.prototype.setUsernameOrEmail = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.SigninResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.SigninResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.SigninResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SigninResponse.toObject = function(includeInstance, msg) {
      var obj = {
        key: msg.getKey_asB64(),
        session: googleProtobuf.Message.getFieldWithDefault(msg, 2, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.SigninResponse}
     */
    proto.api.hub.pb.SigninResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.SigninResponse;
      return proto.api.hub.pb.SigninResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.SigninResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.SigninResponse}
     */
    proto.api.hub.pb.SigninResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!Uint8Array} */ (reader.readBytes());
          msg.setKey(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setSession(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SigninResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.SigninResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.SigninResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SigninResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey_asU8();
      if (f.length > 0) {
        writer.writeBytes(
          1,
          f
        );
      }
      f = message.getSession();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
    };


    /**
     * optional bytes key = 1;
     * @return {!(string|Uint8Array)}
     */
    proto.api.hub.pb.SigninResponse.prototype.getKey = function() {
      return /** @type {!(string|Uint8Array)} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * optional bytes key = 1;
     * This is a type-conversion wrapper around `getKey()`
     * @return {string}
     */
    proto.api.hub.pb.SigninResponse.prototype.getKey_asB64 = function() {
      return /** @type {string} */ (googleProtobuf.Message.bytesAsB64(
          this.getKey()));
    };


    /**
     * optional bytes key = 1;
     * Note that Uint8Array is not supported on all browsers.
     * @see http://caniuse.com/Uint8Array
     * This is a type-conversion wrapper around `getKey()`
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SigninResponse.prototype.getKey_asU8 = function() {
      return /** @type {!Uint8Array} */ (googleProtobuf.Message.bytesAsU8(
          this.getKey()));
    };


    /**
     * @param {!(string|Uint8Array)} value
     * @return {!proto.api.hub.pb.SigninResponse} returns this
     */
    proto.api.hub.pb.SigninResponse.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3BytesField(this, 1, value);
    };


    /**
     * optional string session = 2;
     * @return {string}
     */
    proto.api.hub.pb.SigninResponse.prototype.getSession = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.SigninResponse} returns this
     */
    proto.api.hub.pb.SigninResponse.prototype.setSession = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.SignoutRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.SignoutRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.SignoutRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignoutRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.SignoutRequest}
     */
    proto.api.hub.pb.SignoutRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.SignoutRequest;
      return proto.api.hub.pb.SignoutRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.SignoutRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.SignoutRequest}
     */
    proto.api.hub.pb.SignoutRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SignoutRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.SignoutRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.SignoutRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignoutRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.SignoutResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.SignoutResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.SignoutResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignoutResponse.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.SignoutResponse}
     */
    proto.api.hub.pb.SignoutResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.SignoutResponse;
      return proto.api.hub.pb.SignoutResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.SignoutResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.SignoutResponse}
     */
    proto.api.hub.pb.SignoutResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.SignoutResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.SignoutResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.SignoutResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.SignoutResponse.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.GetSessionInfoRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.GetSessionInfoRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.GetSessionInfoRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetSessionInfoRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.GetSessionInfoRequest}
     */
    proto.api.hub.pb.GetSessionInfoRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.GetSessionInfoRequest;
      return proto.api.hub.pb.GetSessionInfoRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.GetSessionInfoRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.GetSessionInfoRequest}
     */
    proto.api.hub.pb.GetSessionInfoRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetSessionInfoRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.GetSessionInfoRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.GetSessionInfoRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetSessionInfoRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.GetSessionInfoResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.GetSessionInfoResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetSessionInfoResponse.toObject = function(includeInstance, msg) {
      var obj = {
        key: msg.getKey_asB64(),
        username: googleProtobuf.Message.getFieldWithDefault(msg, 2, ""),
        email: googleProtobuf.Message.getFieldWithDefault(msg, 3, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.GetSessionInfoResponse}
     */
    proto.api.hub.pb.GetSessionInfoResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.GetSessionInfoResponse;
      return proto.api.hub.pb.GetSessionInfoResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.GetSessionInfoResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.GetSessionInfoResponse}
     */
    proto.api.hub.pb.GetSessionInfoResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!Uint8Array} */ (reader.readBytes());
          msg.setKey(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setUsername(value);
          break;
        case 3:
          var value = /** @type {string} */ (reader.readString());
          msg.setEmail(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.GetSessionInfoResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.GetSessionInfoResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetSessionInfoResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey_asU8();
      if (f.length > 0) {
        writer.writeBytes(
          1,
          f
        );
      }
      f = message.getUsername();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
      f = message.getEmail();
      if (f.length > 0) {
        writer.writeString(
          3,
          f
        );
      }
    };


    /**
     * optional bytes key = 1;
     * @return {!(string|Uint8Array)}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.getKey = function() {
      return /** @type {!(string|Uint8Array)} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * optional bytes key = 1;
     * This is a type-conversion wrapper around `getKey()`
     * @return {string}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.getKey_asB64 = function() {
      return /** @type {string} */ (googleProtobuf.Message.bytesAsB64(
          this.getKey()));
    };


    /**
     * optional bytes key = 1;
     * Note that Uint8Array is not supported on all browsers.
     * @see http://caniuse.com/Uint8Array
     * This is a type-conversion wrapper around `getKey()`
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.getKey_asU8 = function() {
      return /** @type {!Uint8Array} */ (googleProtobuf.Message.bytesAsU8(
          this.getKey()));
    };


    /**
     * @param {!(string|Uint8Array)} value
     * @return {!proto.api.hub.pb.GetSessionInfoResponse} returns this
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3BytesField(this, 1, value);
    };


    /**
     * optional string username = 2;
     * @return {string}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.getUsername = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.GetSessionInfoResponse} returns this
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.setUsername = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };


    /**
     * optional string email = 3;
     * @return {string}
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.getEmail = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 3, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.GetSessionInfoResponse} returns this
     */
    proto.api.hub.pb.GetSessionInfoResponse.prototype.setEmail = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 3, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.GetIdentityRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.GetIdentityRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.GetIdentityRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetIdentityRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.GetIdentityRequest}
     */
    proto.api.hub.pb.GetIdentityRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.GetIdentityRequest;
      return proto.api.hub.pb.GetIdentityRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.GetIdentityRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.GetIdentityRequest}
     */
    proto.api.hub.pb.GetIdentityRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetIdentityRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.GetIdentityRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.GetIdentityRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetIdentityRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.GetIdentityResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.GetIdentityResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.GetIdentityResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetIdentityResponse.toObject = function(includeInstance, msg) {
      var obj = {
        identity: msg.getIdentity_asB64()
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.GetIdentityResponse}
     */
    proto.api.hub.pb.GetIdentityResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.GetIdentityResponse;
      return proto.api.hub.pb.GetIdentityResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.GetIdentityResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.GetIdentityResponse}
     */
    proto.api.hub.pb.GetIdentityResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!Uint8Array} */ (reader.readBytes());
          msg.setIdentity(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetIdentityResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.GetIdentityResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.GetIdentityResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetIdentityResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getIdentity_asU8();
      if (f.length > 0) {
        writer.writeBytes(
          1,
          f
        );
      }
    };


    /**
     * optional bytes identity = 1;
     * @return {!(string|Uint8Array)}
     */
    proto.api.hub.pb.GetIdentityResponse.prototype.getIdentity = function() {
      return /** @type {!(string|Uint8Array)} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * optional bytes identity = 1;
     * This is a type-conversion wrapper around `getIdentity()`
     * @return {string}
     */
    proto.api.hub.pb.GetIdentityResponse.prototype.getIdentity_asB64 = function() {
      return /** @type {string} */ (googleProtobuf.Message.bytesAsB64(
          this.getIdentity()));
    };


    /**
     * optional bytes identity = 1;
     * Note that Uint8Array is not supported on all browsers.
     * @see http://caniuse.com/Uint8Array
     * This is a type-conversion wrapper around `getIdentity()`
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetIdentityResponse.prototype.getIdentity_asU8 = function() {
      return /** @type {!Uint8Array} */ (googleProtobuf.Message.bytesAsU8(
          this.getIdentity()));
    };


    /**
     * @param {!(string|Uint8Array)} value
     * @return {!proto.api.hub.pb.GetIdentityResponse} returns this
     */
    proto.api.hub.pb.GetIdentityResponse.prototype.setIdentity = function(value) {
      return googleProtobuf.Message.setProto3BytesField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.KeyInfo.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.KeyInfo.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.KeyInfo} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.KeyInfo.toObject = function(includeInstance, msg) {
      var obj = {
        key: googleProtobuf.Message.getFieldWithDefault(msg, 1, ""),
        secret: googleProtobuf.Message.getFieldWithDefault(msg, 2, ""),
        type: googleProtobuf.Message.getFieldWithDefault(msg, 3, 0),
        valid: googleProtobuf.Message.getBooleanFieldWithDefault(msg, 4, false),
        threads: googleProtobuf.Message.getFieldWithDefault(msg, 5, 0),
        secure: googleProtobuf.Message.getBooleanFieldWithDefault(msg, 6, false)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.KeyInfo}
     */
    proto.api.hub.pb.KeyInfo.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.KeyInfo;
      return proto.api.hub.pb.KeyInfo.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.KeyInfo} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.KeyInfo}
     */
    proto.api.hub.pb.KeyInfo.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setKey(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setSecret(value);
          break;
        case 3:
          var value = /** @type {!proto.api.hub.pb.KeyType} */ (reader.readEnum());
          msg.setType(value);
          break;
        case 4:
          var value = /** @type {boolean} */ (reader.readBool());
          msg.setValid(value);
          break;
        case 5:
          var value = /** @type {number} */ (reader.readInt32());
          msg.setThreads(value);
          break;
        case 6:
          var value = /** @type {boolean} */ (reader.readBool());
          msg.setSecure(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.KeyInfo.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.KeyInfo.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.KeyInfo} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.KeyInfo.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
      f = message.getSecret();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
      f = message.getType();
      if (f !== 0.0) {
        writer.writeEnum(
          3,
          f
        );
      }
      f = message.getValid();
      if (f) {
        writer.writeBool(
          4,
          f
        );
      }
      f = message.getThreads();
      if (f !== 0) {
        writer.writeInt32(
          5,
          f
        );
      }
      f = message.getSecure();
      if (f) {
        writer.writeBool(
          6,
          f
        );
      }
    };


    /**
     * optional string key = 1;
     * @return {string}
     */
    proto.api.hub.pb.KeyInfo.prototype.getKey = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.KeyInfo} returns this
     */
    proto.api.hub.pb.KeyInfo.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };


    /**
     * optional string secret = 2;
     * @return {string}
     */
    proto.api.hub.pb.KeyInfo.prototype.getSecret = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.KeyInfo} returns this
     */
    proto.api.hub.pb.KeyInfo.prototype.setSecret = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };


    /**
     * optional KeyType type = 3;
     * @return {!proto.api.hub.pb.KeyType}
     */
    proto.api.hub.pb.KeyInfo.prototype.getType = function() {
      return /** @type {!proto.api.hub.pb.KeyType} */ (googleProtobuf.Message.getFieldWithDefault(this, 3, 0));
    };


    /**
     * @param {!proto.api.hub.pb.KeyType} value
     * @return {!proto.api.hub.pb.KeyInfo} returns this
     */
    proto.api.hub.pb.KeyInfo.prototype.setType = function(value) {
      return googleProtobuf.Message.setProto3EnumField(this, 3, value);
    };


    /**
     * optional bool valid = 4;
     * @return {boolean}
     */
    proto.api.hub.pb.KeyInfo.prototype.getValid = function() {
      return /** @type {boolean} */ (googleProtobuf.Message.getBooleanFieldWithDefault(this, 4, false));
    };


    /**
     * @param {boolean} value
     * @return {!proto.api.hub.pb.KeyInfo} returns this
     */
    proto.api.hub.pb.KeyInfo.prototype.setValid = function(value) {
      return googleProtobuf.Message.setProto3BooleanField(this, 4, value);
    };


    /**
     * optional int32 threads = 5;
     * @return {number}
     */
    proto.api.hub.pb.KeyInfo.prototype.getThreads = function() {
      return /** @type {number} */ (googleProtobuf.Message.getFieldWithDefault(this, 5, 0));
    };


    /**
     * @param {number} value
     * @return {!proto.api.hub.pb.KeyInfo} returns this
     */
    proto.api.hub.pb.KeyInfo.prototype.setThreads = function(value) {
      return googleProtobuf.Message.setProto3IntField(this, 5, value);
    };


    /**
     * optional bool secure = 6;
     * @return {boolean}
     */
    proto.api.hub.pb.KeyInfo.prototype.getSecure = function() {
      return /** @type {boolean} */ (googleProtobuf.Message.getBooleanFieldWithDefault(this, 6, false));
    };


    /**
     * @param {boolean} value
     * @return {!proto.api.hub.pb.KeyInfo} returns this
     */
    proto.api.hub.pb.KeyInfo.prototype.setSecure = function(value) {
      return googleProtobuf.Message.setProto3BooleanField(this, 6, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.CreateKeyRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.CreateKeyRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.CreateKeyRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateKeyRequest.toObject = function(includeInstance, msg) {
      var obj = {
        type: googleProtobuf.Message.getFieldWithDefault(msg, 1, 0),
        secure: googleProtobuf.Message.getBooleanFieldWithDefault(msg, 2, false)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.CreateKeyRequest}
     */
    proto.api.hub.pb.CreateKeyRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.CreateKeyRequest;
      return proto.api.hub.pb.CreateKeyRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.CreateKeyRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.CreateKeyRequest}
     */
    proto.api.hub.pb.CreateKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!proto.api.hub.pb.KeyType} */ (reader.readEnum());
          msg.setType(value);
          break;
        case 2:
          var value = /** @type {boolean} */ (reader.readBool());
          msg.setSecure(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.CreateKeyRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.CreateKeyRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.CreateKeyRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateKeyRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getType();
      if (f !== 0.0) {
        writer.writeEnum(
          1,
          f
        );
      }
      f = message.getSecure();
      if (f) {
        writer.writeBool(
          2,
          f
        );
      }
    };


    /**
     * optional KeyType type = 1;
     * @return {!proto.api.hub.pb.KeyType}
     */
    proto.api.hub.pb.CreateKeyRequest.prototype.getType = function() {
      return /** @type {!proto.api.hub.pb.KeyType} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, 0));
    };


    /**
     * @param {!proto.api.hub.pb.KeyType} value
     * @return {!proto.api.hub.pb.CreateKeyRequest} returns this
     */
    proto.api.hub.pb.CreateKeyRequest.prototype.setType = function(value) {
      return googleProtobuf.Message.setProto3EnumField(this, 1, value);
    };


    /**
     * optional bool secure = 2;
     * @return {boolean}
     */
    proto.api.hub.pb.CreateKeyRequest.prototype.getSecure = function() {
      return /** @type {boolean} */ (googleProtobuf.Message.getBooleanFieldWithDefault(this, 2, false));
    };


    /**
     * @param {boolean} value
     * @return {!proto.api.hub.pb.CreateKeyRequest} returns this
     */
    proto.api.hub.pb.CreateKeyRequest.prototype.setSecure = function(value) {
      return googleProtobuf.Message.setProto3BooleanField(this, 2, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.CreateKeyResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.CreateKeyResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.CreateKeyResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateKeyResponse.toObject = function(includeInstance, msg) {
      var f, obj = {
        keyInfo: (f = msg.getKeyInfo()) && proto.api.hub.pb.KeyInfo.toObject(includeInstance, f)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.CreateKeyResponse}
     */
    proto.api.hub.pb.CreateKeyResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.CreateKeyResponse;
      return proto.api.hub.pb.CreateKeyResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.CreateKeyResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.CreateKeyResponse}
     */
    proto.api.hub.pb.CreateKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = new proto.api.hub.pb.KeyInfo;
          reader.readMessage(value,proto.api.hub.pb.KeyInfo.deserializeBinaryFromReader);
          msg.setKeyInfo(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.CreateKeyResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.CreateKeyResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.CreateKeyResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateKeyResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKeyInfo();
      if (f != null) {
        writer.writeMessage(
          1,
          f,
          proto.api.hub.pb.KeyInfo.serializeBinaryToWriter
        );
      }
    };


    /**
     * optional KeyInfo key_info = 1;
     * @return {?proto.api.hub.pb.KeyInfo}
     */
    proto.api.hub.pb.CreateKeyResponse.prototype.getKeyInfo = function() {
      return /** @type{?proto.api.hub.pb.KeyInfo} */ (
        googleProtobuf.Message.getWrapperField(this, proto.api.hub.pb.KeyInfo, 1));
    };


    /**
     * @param {?proto.api.hub.pb.KeyInfo|undefined} value
     * @return {!proto.api.hub.pb.CreateKeyResponse} returns this
    */
    proto.api.hub.pb.CreateKeyResponse.prototype.setKeyInfo = function(value) {
      return googleProtobuf.Message.setWrapperField(this, 1, value);
    };


    /**
     * Clears the message field making it undefined.
     * @return {!proto.api.hub.pb.CreateKeyResponse} returns this
     */
    proto.api.hub.pb.CreateKeyResponse.prototype.clearKeyInfo = function() {
      return this.setKeyInfo(undefined);
    };


    /**
     * Returns whether this field is set.
     * @return {boolean}
     */
    proto.api.hub.pb.CreateKeyResponse.prototype.hasKeyInfo = function() {
      return googleProtobuf.Message.getField(this, 1) != null;
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.InvalidateKeyRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.InvalidateKeyRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.InvalidateKeyRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InvalidateKeyRequest.toObject = function(includeInstance, msg) {
      var obj = {
        key: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.InvalidateKeyRequest}
     */
    proto.api.hub.pb.InvalidateKeyRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.InvalidateKeyRequest;
      return proto.api.hub.pb.InvalidateKeyRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.InvalidateKeyRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.InvalidateKeyRequest}
     */
    proto.api.hub.pb.InvalidateKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setKey(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.InvalidateKeyRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.InvalidateKeyRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.InvalidateKeyRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InvalidateKeyRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string key = 1;
     * @return {string}
     */
    proto.api.hub.pb.InvalidateKeyRequest.prototype.getKey = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.InvalidateKeyRequest} returns this
     */
    proto.api.hub.pb.InvalidateKeyRequest.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.InvalidateKeyResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.InvalidateKeyResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.InvalidateKeyResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InvalidateKeyResponse.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.InvalidateKeyResponse}
     */
    proto.api.hub.pb.InvalidateKeyResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.InvalidateKeyResponse;
      return proto.api.hub.pb.InvalidateKeyResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.InvalidateKeyResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.InvalidateKeyResponse}
     */
    proto.api.hub.pb.InvalidateKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.InvalidateKeyResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.InvalidateKeyResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.InvalidateKeyResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InvalidateKeyResponse.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.ListKeysRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.ListKeysRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.ListKeysRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListKeysRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.ListKeysRequest}
     */
    proto.api.hub.pb.ListKeysRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.ListKeysRequest;
      return proto.api.hub.pb.ListKeysRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.ListKeysRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.ListKeysRequest}
     */
    proto.api.hub.pb.ListKeysRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.ListKeysRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.ListKeysRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.ListKeysRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListKeysRequest.serializeBinaryToWriter = function(message, writer) {
    };



    /**
     * List of repeated fields within this message type.
     * @private {!Array<number>}
     * @const
     */
    proto.api.hub.pb.ListKeysResponse.repeatedFields_ = [1];



    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.ListKeysResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.ListKeysResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.ListKeysResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListKeysResponse.toObject = function(includeInstance, msg) {
      var obj = {
        listList: googleProtobuf.Message.toObjectList(msg.getListList(),
        proto.api.hub.pb.KeyInfo.toObject, includeInstance)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.ListKeysResponse}
     */
    proto.api.hub.pb.ListKeysResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.ListKeysResponse;
      return proto.api.hub.pb.ListKeysResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.ListKeysResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.ListKeysResponse}
     */
    proto.api.hub.pb.ListKeysResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = new proto.api.hub.pb.KeyInfo;
          reader.readMessage(value,proto.api.hub.pb.KeyInfo.deserializeBinaryFromReader);
          msg.addList(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.ListKeysResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.ListKeysResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.ListKeysResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListKeysResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getListList();
      if (f.length > 0) {
        writer.writeRepeatedMessage(
          1,
          f,
          proto.api.hub.pb.KeyInfo.serializeBinaryToWriter
        );
      }
    };


    /**
     * repeated KeyInfo list = 1;
     * @return {!Array<!proto.api.hub.pb.KeyInfo>}
     */
    proto.api.hub.pb.ListKeysResponse.prototype.getListList = function() {
      return /** @type{!Array<!proto.api.hub.pb.KeyInfo>} */ (
        googleProtobuf.Message.getRepeatedWrapperField(this, proto.api.hub.pb.KeyInfo, 1));
    };


    /**
     * @param {!Array<!proto.api.hub.pb.KeyInfo>} value
     * @return {!proto.api.hub.pb.ListKeysResponse} returns this
    */
    proto.api.hub.pb.ListKeysResponse.prototype.setListList = function(value) {
      return googleProtobuf.Message.setRepeatedWrapperField(this, 1, value);
    };


    /**
     * @param {!proto.api.hub.pb.KeyInfo=} opt_value
     * @param {number=} opt_index
     * @return {!proto.api.hub.pb.KeyInfo}
     */
    proto.api.hub.pb.ListKeysResponse.prototype.addList = function(opt_value, opt_index) {
      return googleProtobuf.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.api.hub.pb.KeyInfo, opt_index);
    };


    /**
     * Clears the list making it empty but non-null.
     * @return {!proto.api.hub.pb.ListKeysResponse} returns this
     */
    proto.api.hub.pb.ListKeysResponse.prototype.clearListList = function() {
      return this.setListList([]);
    };



    /**
     * List of repeated fields within this message type.
     * @private {!Array<number>}
     * @const
     */
    proto.api.hub.pb.OrgInfo.repeatedFields_ = [5];



    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.OrgInfo.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.OrgInfo.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.OrgInfo} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.OrgInfo.toObject = function(includeInstance, msg) {
      var obj = {
        key: msg.getKey_asB64(),
        name: googleProtobuf.Message.getFieldWithDefault(msg, 2, ""),
        slug: googleProtobuf.Message.getFieldWithDefault(msg, 3, ""),
        host: googleProtobuf.Message.getFieldWithDefault(msg, 4, ""),
        membersList: googleProtobuf.Message.toObjectList(msg.getMembersList(),
        proto.api.hub.pb.OrgInfo.Member.toObject, includeInstance),
        createdAt: googleProtobuf.Message.getFieldWithDefault(msg, 6, 0)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.OrgInfo}
     */
    proto.api.hub.pb.OrgInfo.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.OrgInfo;
      return proto.api.hub.pb.OrgInfo.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.OrgInfo} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.OrgInfo}
     */
    proto.api.hub.pb.OrgInfo.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!Uint8Array} */ (reader.readBytes());
          msg.setKey(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setName(value);
          break;
        case 3:
          var value = /** @type {string} */ (reader.readString());
          msg.setSlug(value);
          break;
        case 4:
          var value = /** @type {string} */ (reader.readString());
          msg.setHost(value);
          break;
        case 5:
          var value = new proto.api.hub.pb.OrgInfo.Member;
          reader.readMessage(value,proto.api.hub.pb.OrgInfo.Member.deserializeBinaryFromReader);
          msg.addMembers(value);
          break;
        case 6:
          var value = /** @type {number} */ (reader.readInt64());
          msg.setCreatedAt(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.OrgInfo.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.OrgInfo.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.OrgInfo} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.OrgInfo.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey_asU8();
      if (f.length > 0) {
        writer.writeBytes(
          1,
          f
        );
      }
      f = message.getName();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
      f = message.getSlug();
      if (f.length > 0) {
        writer.writeString(
          3,
          f
        );
      }
      f = message.getHost();
      if (f.length > 0) {
        writer.writeString(
          4,
          f
        );
      }
      f = message.getMembersList();
      if (f.length > 0) {
        writer.writeRepeatedMessage(
          5,
          f,
          proto.api.hub.pb.OrgInfo.Member.serializeBinaryToWriter
        );
      }
      f = message.getCreatedAt();
      if (f !== 0) {
        writer.writeInt64(
          6,
          f
        );
      }
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.OrgInfo.Member.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.OrgInfo.Member} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.OrgInfo.Member.toObject = function(includeInstance, msg) {
      var obj = {
        key: msg.getKey_asB64(),
        username: googleProtobuf.Message.getFieldWithDefault(msg, 2, ""),
        role: googleProtobuf.Message.getFieldWithDefault(msg, 3, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.OrgInfo.Member}
     */
    proto.api.hub.pb.OrgInfo.Member.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.OrgInfo.Member;
      return proto.api.hub.pb.OrgInfo.Member.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.OrgInfo.Member} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.OrgInfo.Member}
     */
    proto.api.hub.pb.OrgInfo.Member.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {!Uint8Array} */ (reader.readBytes());
          msg.setKey(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setUsername(value);
          break;
        case 3:
          var value = /** @type {string} */ (reader.readString());
          msg.setRole(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.OrgInfo.Member.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.OrgInfo.Member} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.OrgInfo.Member.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getKey_asU8();
      if (f.length > 0) {
        writer.writeBytes(
          1,
          f
        );
      }
      f = message.getUsername();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
      f = message.getRole();
      if (f.length > 0) {
        writer.writeString(
          3,
          f
        );
      }
    };


    /**
     * optional bytes key = 1;
     * @return {!(string|Uint8Array)}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.getKey = function() {
      return /** @type {!(string|Uint8Array)} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * optional bytes key = 1;
     * This is a type-conversion wrapper around `getKey()`
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.getKey_asB64 = function() {
      return /** @type {string} */ (googleProtobuf.Message.bytesAsB64(
          this.getKey()));
    };


    /**
     * optional bytes key = 1;
     * Note that Uint8Array is not supported on all browsers.
     * @see http://caniuse.com/Uint8Array
     * This is a type-conversion wrapper around `getKey()`
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.getKey_asU8 = function() {
      return /** @type {!Uint8Array} */ (googleProtobuf.Message.bytesAsU8(
          this.getKey()));
    };


    /**
     * @param {!(string|Uint8Array)} value
     * @return {!proto.api.hub.pb.OrgInfo.Member} returns this
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3BytesField(this, 1, value);
    };


    /**
     * optional string username = 2;
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.getUsername = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.OrgInfo.Member} returns this
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.setUsername = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };


    /**
     * optional string role = 3;
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.getRole = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 3, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.OrgInfo.Member} returns this
     */
    proto.api.hub.pb.OrgInfo.Member.prototype.setRole = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 3, value);
    };


    /**
     * optional bytes key = 1;
     * @return {!(string|Uint8Array)}
     */
    proto.api.hub.pb.OrgInfo.prototype.getKey = function() {
      return /** @type {!(string|Uint8Array)} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * optional bytes key = 1;
     * This is a type-conversion wrapper around `getKey()`
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.prototype.getKey_asB64 = function() {
      return /** @type {string} */ (googleProtobuf.Message.bytesAsB64(
          this.getKey()));
    };


    /**
     * optional bytes key = 1;
     * Note that Uint8Array is not supported on all browsers.
     * @see http://caniuse.com/Uint8Array
     * This is a type-conversion wrapper around `getKey()`
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.OrgInfo.prototype.getKey_asU8 = function() {
      return /** @type {!Uint8Array} */ (googleProtobuf.Message.bytesAsU8(
          this.getKey()));
    };


    /**
     * @param {!(string|Uint8Array)} value
     * @return {!proto.api.hub.pb.OrgInfo} returns this
     */
    proto.api.hub.pb.OrgInfo.prototype.setKey = function(value) {
      return googleProtobuf.Message.setProto3BytesField(this, 1, value);
    };


    /**
     * optional string name = 2;
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.prototype.getName = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.OrgInfo} returns this
     */
    proto.api.hub.pb.OrgInfo.prototype.setName = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };


    /**
     * optional string slug = 3;
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.prototype.getSlug = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 3, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.OrgInfo} returns this
     */
    proto.api.hub.pb.OrgInfo.prototype.setSlug = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 3, value);
    };


    /**
     * optional string host = 4;
     * @return {string}
     */
    proto.api.hub.pb.OrgInfo.prototype.getHost = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 4, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.OrgInfo} returns this
     */
    proto.api.hub.pb.OrgInfo.prototype.setHost = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 4, value);
    };


    /**
     * repeated Member members = 5;
     * @return {!Array<!proto.api.hub.pb.OrgInfo.Member>}
     */
    proto.api.hub.pb.OrgInfo.prototype.getMembersList = function() {
      return /** @type{!Array<!proto.api.hub.pb.OrgInfo.Member>} */ (
        googleProtobuf.Message.getRepeatedWrapperField(this, proto.api.hub.pb.OrgInfo.Member, 5));
    };


    /**
     * @param {!Array<!proto.api.hub.pb.OrgInfo.Member>} value
     * @return {!proto.api.hub.pb.OrgInfo} returns this
    */
    proto.api.hub.pb.OrgInfo.prototype.setMembersList = function(value) {
      return googleProtobuf.Message.setRepeatedWrapperField(this, 5, value);
    };


    /**
     * @param {!proto.api.hub.pb.OrgInfo.Member=} opt_value
     * @param {number=} opt_index
     * @return {!proto.api.hub.pb.OrgInfo.Member}
     */
    proto.api.hub.pb.OrgInfo.prototype.addMembers = function(opt_value, opt_index) {
      return googleProtobuf.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.api.hub.pb.OrgInfo.Member, opt_index);
    };


    /**
     * Clears the list making it empty but non-null.
     * @return {!proto.api.hub.pb.OrgInfo} returns this
     */
    proto.api.hub.pb.OrgInfo.prototype.clearMembersList = function() {
      return this.setMembersList([]);
    };


    /**
     * optional int64 created_at = 6;
     * @return {number}
     */
    proto.api.hub.pb.OrgInfo.prototype.getCreatedAt = function() {
      return /** @type {number} */ (googleProtobuf.Message.getFieldWithDefault(this, 6, 0));
    };


    /**
     * @param {number} value
     * @return {!proto.api.hub.pb.OrgInfo} returns this
     */
    proto.api.hub.pb.OrgInfo.prototype.setCreatedAt = function(value) {
      return googleProtobuf.Message.setProto3IntField(this, 6, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.CreateOrgRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.CreateOrgRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.CreateOrgRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateOrgRequest.toObject = function(includeInstance, msg) {
      var obj = {
        name: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.CreateOrgRequest}
     */
    proto.api.hub.pb.CreateOrgRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.CreateOrgRequest;
      return proto.api.hub.pb.CreateOrgRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.CreateOrgRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.CreateOrgRequest}
     */
    proto.api.hub.pb.CreateOrgRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setName(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.CreateOrgRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.CreateOrgRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.CreateOrgRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateOrgRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getName();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string name = 1;
     * @return {string}
     */
    proto.api.hub.pb.CreateOrgRequest.prototype.getName = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.CreateOrgRequest} returns this
     */
    proto.api.hub.pb.CreateOrgRequest.prototype.setName = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.CreateOrgResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.CreateOrgResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.CreateOrgResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateOrgResponse.toObject = function(includeInstance, msg) {
      var f, obj = {
        orgInfo: (f = msg.getOrgInfo()) && proto.api.hub.pb.OrgInfo.toObject(includeInstance, f)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.CreateOrgResponse}
     */
    proto.api.hub.pb.CreateOrgResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.CreateOrgResponse;
      return proto.api.hub.pb.CreateOrgResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.CreateOrgResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.CreateOrgResponse}
     */
    proto.api.hub.pb.CreateOrgResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = new proto.api.hub.pb.OrgInfo;
          reader.readMessage(value,proto.api.hub.pb.OrgInfo.deserializeBinaryFromReader);
          msg.setOrgInfo(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.CreateOrgResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.CreateOrgResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.CreateOrgResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.CreateOrgResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getOrgInfo();
      if (f != null) {
        writer.writeMessage(
          1,
          f,
          proto.api.hub.pb.OrgInfo.serializeBinaryToWriter
        );
      }
    };


    /**
     * optional OrgInfo org_info = 1;
     * @return {?proto.api.hub.pb.OrgInfo}
     */
    proto.api.hub.pb.CreateOrgResponse.prototype.getOrgInfo = function() {
      return /** @type{?proto.api.hub.pb.OrgInfo} */ (
        googleProtobuf.Message.getWrapperField(this, proto.api.hub.pb.OrgInfo, 1));
    };


    /**
     * @param {?proto.api.hub.pb.OrgInfo|undefined} value
     * @return {!proto.api.hub.pb.CreateOrgResponse} returns this
    */
    proto.api.hub.pb.CreateOrgResponse.prototype.setOrgInfo = function(value) {
      return googleProtobuf.Message.setWrapperField(this, 1, value);
    };


    /**
     * Clears the message field making it undefined.
     * @return {!proto.api.hub.pb.CreateOrgResponse} returns this
     */
    proto.api.hub.pb.CreateOrgResponse.prototype.clearOrgInfo = function() {
      return this.setOrgInfo(undefined);
    };


    /**
     * Returns whether this field is set.
     * @return {boolean}
     */
    proto.api.hub.pb.CreateOrgResponse.prototype.hasOrgInfo = function() {
      return googleProtobuf.Message.getField(this, 1) != null;
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.GetOrgRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.GetOrgRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.GetOrgRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetOrgRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.GetOrgRequest}
     */
    proto.api.hub.pb.GetOrgRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.GetOrgRequest;
      return proto.api.hub.pb.GetOrgRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.GetOrgRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.GetOrgRequest}
     */
    proto.api.hub.pb.GetOrgRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetOrgRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.GetOrgRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.GetOrgRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetOrgRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.GetOrgResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.GetOrgResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.GetOrgResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetOrgResponse.toObject = function(includeInstance, msg) {
      var f, obj = {
        orgInfo: (f = msg.getOrgInfo()) && proto.api.hub.pb.OrgInfo.toObject(includeInstance, f)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.GetOrgResponse}
     */
    proto.api.hub.pb.GetOrgResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.GetOrgResponse;
      return proto.api.hub.pb.GetOrgResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.GetOrgResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.GetOrgResponse}
     */
    proto.api.hub.pb.GetOrgResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = new proto.api.hub.pb.OrgInfo;
          reader.readMessage(value,proto.api.hub.pb.OrgInfo.deserializeBinaryFromReader);
          msg.setOrgInfo(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.GetOrgResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.GetOrgResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.GetOrgResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.GetOrgResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getOrgInfo();
      if (f != null) {
        writer.writeMessage(
          1,
          f,
          proto.api.hub.pb.OrgInfo.serializeBinaryToWriter
        );
      }
    };


    /**
     * optional OrgInfo org_info = 1;
     * @return {?proto.api.hub.pb.OrgInfo}
     */
    proto.api.hub.pb.GetOrgResponse.prototype.getOrgInfo = function() {
      return /** @type{?proto.api.hub.pb.OrgInfo} */ (
        googleProtobuf.Message.getWrapperField(this, proto.api.hub.pb.OrgInfo, 1));
    };


    /**
     * @param {?proto.api.hub.pb.OrgInfo|undefined} value
     * @return {!proto.api.hub.pb.GetOrgResponse} returns this
    */
    proto.api.hub.pb.GetOrgResponse.prototype.setOrgInfo = function(value) {
      return googleProtobuf.Message.setWrapperField(this, 1, value);
    };


    /**
     * Clears the message field making it undefined.
     * @return {!proto.api.hub.pb.GetOrgResponse} returns this
     */
    proto.api.hub.pb.GetOrgResponse.prototype.clearOrgInfo = function() {
      return this.setOrgInfo(undefined);
    };


    /**
     * Returns whether this field is set.
     * @return {boolean}
     */
    proto.api.hub.pb.GetOrgResponse.prototype.hasOrgInfo = function() {
      return googleProtobuf.Message.getField(this, 1) != null;
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.ListOrgsRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.ListOrgsRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.ListOrgsRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListOrgsRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.ListOrgsRequest}
     */
    proto.api.hub.pb.ListOrgsRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.ListOrgsRequest;
      return proto.api.hub.pb.ListOrgsRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.ListOrgsRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.ListOrgsRequest}
     */
    proto.api.hub.pb.ListOrgsRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.ListOrgsRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.ListOrgsRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.ListOrgsRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListOrgsRequest.serializeBinaryToWriter = function(message, writer) {
    };



    /**
     * List of repeated fields within this message type.
     * @private {!Array<number>}
     * @const
     */
    proto.api.hub.pb.ListOrgsResponse.repeatedFields_ = [1];



    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.ListOrgsResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.ListOrgsResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.ListOrgsResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListOrgsResponse.toObject = function(includeInstance, msg) {
      var obj = {
        listList: googleProtobuf.Message.toObjectList(msg.getListList(),
        proto.api.hub.pb.OrgInfo.toObject, includeInstance)
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.ListOrgsResponse}
     */
    proto.api.hub.pb.ListOrgsResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.ListOrgsResponse;
      return proto.api.hub.pb.ListOrgsResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.ListOrgsResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.ListOrgsResponse}
     */
    proto.api.hub.pb.ListOrgsResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = new proto.api.hub.pb.OrgInfo;
          reader.readMessage(value,proto.api.hub.pb.OrgInfo.deserializeBinaryFromReader);
          msg.addList(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.ListOrgsResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.ListOrgsResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.ListOrgsResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.ListOrgsResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getListList();
      if (f.length > 0) {
        writer.writeRepeatedMessage(
          1,
          f,
          proto.api.hub.pb.OrgInfo.serializeBinaryToWriter
        );
      }
    };


    /**
     * repeated OrgInfo list = 1;
     * @return {!Array<!proto.api.hub.pb.OrgInfo>}
     */
    proto.api.hub.pb.ListOrgsResponse.prototype.getListList = function() {
      return /** @type{!Array<!proto.api.hub.pb.OrgInfo>} */ (
        googleProtobuf.Message.getRepeatedWrapperField(this, proto.api.hub.pb.OrgInfo, 1));
    };


    /**
     * @param {!Array<!proto.api.hub.pb.OrgInfo>} value
     * @return {!proto.api.hub.pb.ListOrgsResponse} returns this
    */
    proto.api.hub.pb.ListOrgsResponse.prototype.setListList = function(value) {
      return googleProtobuf.Message.setRepeatedWrapperField(this, 1, value);
    };


    /**
     * @param {!proto.api.hub.pb.OrgInfo=} opt_value
     * @param {number=} opt_index
     * @return {!proto.api.hub.pb.OrgInfo}
     */
    proto.api.hub.pb.ListOrgsResponse.prototype.addList = function(opt_value, opt_index) {
      return googleProtobuf.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.api.hub.pb.OrgInfo, opt_index);
    };


    /**
     * Clears the list making it empty but non-null.
     * @return {!proto.api.hub.pb.ListOrgsResponse} returns this
     */
    proto.api.hub.pb.ListOrgsResponse.prototype.clearListList = function() {
      return this.setListList([]);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.RemoveOrgRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.RemoveOrgRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.RemoveOrgRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.RemoveOrgRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.RemoveOrgRequest}
     */
    proto.api.hub.pb.RemoveOrgRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.RemoveOrgRequest;
      return proto.api.hub.pb.RemoveOrgRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.RemoveOrgRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.RemoveOrgRequest}
     */
    proto.api.hub.pb.RemoveOrgRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.RemoveOrgRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.RemoveOrgRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.RemoveOrgRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.RemoveOrgRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.RemoveOrgResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.RemoveOrgResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.RemoveOrgResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.RemoveOrgResponse.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.RemoveOrgResponse}
     */
    proto.api.hub.pb.RemoveOrgResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.RemoveOrgResponse;
      return proto.api.hub.pb.RemoveOrgResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.RemoveOrgResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.RemoveOrgResponse}
     */
    proto.api.hub.pb.RemoveOrgResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.RemoveOrgResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.RemoveOrgResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.RemoveOrgResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.RemoveOrgResponse.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.InviteToOrgRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.InviteToOrgRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.InviteToOrgRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InviteToOrgRequest.toObject = function(includeInstance, msg) {
      var obj = {
        email: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.InviteToOrgRequest}
     */
    proto.api.hub.pb.InviteToOrgRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.InviteToOrgRequest;
      return proto.api.hub.pb.InviteToOrgRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.InviteToOrgRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.InviteToOrgRequest}
     */
    proto.api.hub.pb.InviteToOrgRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setEmail(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.InviteToOrgRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.InviteToOrgRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.InviteToOrgRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InviteToOrgRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getEmail();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string email = 1;
     * @return {string}
     */
    proto.api.hub.pb.InviteToOrgRequest.prototype.getEmail = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.InviteToOrgRequest} returns this
     */
    proto.api.hub.pb.InviteToOrgRequest.prototype.setEmail = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.InviteToOrgResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.InviteToOrgResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.InviteToOrgResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InviteToOrgResponse.toObject = function(includeInstance, msg) {
      var obj = {
        token: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.InviteToOrgResponse}
     */
    proto.api.hub.pb.InviteToOrgResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.InviteToOrgResponse;
      return proto.api.hub.pb.InviteToOrgResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.InviteToOrgResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.InviteToOrgResponse}
     */
    proto.api.hub.pb.InviteToOrgResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setToken(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.InviteToOrgResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.InviteToOrgResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.InviteToOrgResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.InviteToOrgResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getToken();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string token = 1;
     * @return {string}
     */
    proto.api.hub.pb.InviteToOrgResponse.prototype.getToken = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.InviteToOrgResponse} returns this
     */
    proto.api.hub.pb.InviteToOrgResponse.prototype.setToken = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.LeaveOrgRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.LeaveOrgRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.LeaveOrgRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.LeaveOrgRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.LeaveOrgRequest}
     */
    proto.api.hub.pb.LeaveOrgRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.LeaveOrgRequest;
      return proto.api.hub.pb.LeaveOrgRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.LeaveOrgRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.LeaveOrgRequest}
     */
    proto.api.hub.pb.LeaveOrgRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.LeaveOrgRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.LeaveOrgRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.LeaveOrgRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.LeaveOrgRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.LeaveOrgResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.LeaveOrgResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.LeaveOrgResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.LeaveOrgResponse.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.LeaveOrgResponse}
     */
    proto.api.hub.pb.LeaveOrgResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.LeaveOrgResponse;
      return proto.api.hub.pb.LeaveOrgResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.LeaveOrgResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.LeaveOrgResponse}
     */
    proto.api.hub.pb.LeaveOrgResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.LeaveOrgResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.LeaveOrgResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.LeaveOrgResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.LeaveOrgResponse.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.IsUsernameAvailableRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.IsUsernameAvailableRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.toObject = function(includeInstance, msg) {
      var obj = {
        username: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.IsUsernameAvailableRequest}
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.IsUsernameAvailableRequest;
      return proto.api.hub.pb.IsUsernameAvailableRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.IsUsernameAvailableRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.IsUsernameAvailableRequest}
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setUsername(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.IsUsernameAvailableRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.IsUsernameAvailableRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getUsername();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string username = 1;
     * @return {string}
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.prototype.getUsername = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.IsUsernameAvailableRequest} returns this
     */
    proto.api.hub.pb.IsUsernameAvailableRequest.prototype.setUsername = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.IsUsernameAvailableResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.IsUsernameAvailableResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.IsUsernameAvailableResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsUsernameAvailableResponse.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.IsUsernameAvailableResponse}
     */
    proto.api.hub.pb.IsUsernameAvailableResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.IsUsernameAvailableResponse;
      return proto.api.hub.pb.IsUsernameAvailableResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.IsUsernameAvailableResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.IsUsernameAvailableResponse}
     */
    proto.api.hub.pb.IsUsernameAvailableResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.IsUsernameAvailableResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.IsUsernameAvailableResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.IsUsernameAvailableResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsUsernameAvailableResponse.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.IsOrgNameAvailableRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.IsOrgNameAvailableRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.toObject = function(includeInstance, msg) {
      var obj = {
        name: googleProtobuf.Message.getFieldWithDefault(msg, 1, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.IsOrgNameAvailableRequest}
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.IsOrgNameAvailableRequest;
      return proto.api.hub.pb.IsOrgNameAvailableRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.IsOrgNameAvailableRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.IsOrgNameAvailableRequest}
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setName(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.IsOrgNameAvailableRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.IsOrgNameAvailableRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getName();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
    };


    /**
     * optional string name = 1;
     * @return {string}
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.prototype.getName = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.IsOrgNameAvailableRequest} returns this
     */
    proto.api.hub.pb.IsOrgNameAvailableRequest.prototype.setName = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.IsOrgNameAvailableResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.IsOrgNameAvailableResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.toObject = function(includeInstance, msg) {
      var obj = {
        slug: googleProtobuf.Message.getFieldWithDefault(msg, 1, ""),
        host: googleProtobuf.Message.getFieldWithDefault(msg, 2, "")
      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.IsOrgNameAvailableResponse}
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.IsOrgNameAvailableResponse;
      return proto.api.hub.pb.IsOrgNameAvailableResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.IsOrgNameAvailableResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.IsOrgNameAvailableResponse}
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        case 1:
          var value = /** @type {string} */ (reader.readString());
          msg.setSlug(value);
          break;
        case 2:
          var value = /** @type {string} */ (reader.readString());
          msg.setHost(value);
          break;
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.IsOrgNameAvailableResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.IsOrgNameAvailableResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.serializeBinaryToWriter = function(message, writer) {
      var f = undefined;
      f = message.getSlug();
      if (f.length > 0) {
        writer.writeString(
          1,
          f
        );
      }
      f = message.getHost();
      if (f.length > 0) {
        writer.writeString(
          2,
          f
        );
      }
    };


    /**
     * optional string slug = 1;
     * @return {string}
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.prototype.getSlug = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 1, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.IsOrgNameAvailableResponse} returns this
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.prototype.setSlug = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 1, value);
    };


    /**
     * optional string host = 2;
     * @return {string}
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.prototype.getHost = function() {
      return /** @type {string} */ (googleProtobuf.Message.getFieldWithDefault(this, 2, ""));
    };


    /**
     * @param {string} value
     * @return {!proto.api.hub.pb.IsOrgNameAvailableResponse} returns this
     */
    proto.api.hub.pb.IsOrgNameAvailableResponse.prototype.setHost = function(value) {
      return googleProtobuf.Message.setProto3StringField(this, 2, value);
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.DestroyAccountRequest.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.DestroyAccountRequest.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.DestroyAccountRequest} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.DestroyAccountRequest.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.DestroyAccountRequest}
     */
    proto.api.hub.pb.DestroyAccountRequest.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.DestroyAccountRequest;
      return proto.api.hub.pb.DestroyAccountRequest.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.DestroyAccountRequest} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.DestroyAccountRequest}
     */
    proto.api.hub.pb.DestroyAccountRequest.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.DestroyAccountRequest.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.DestroyAccountRequest.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.DestroyAccountRequest} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.DestroyAccountRequest.serializeBinaryToWriter = function(message, writer) {
    };





    if (googleProtobuf.Message.GENERATE_TO_OBJECT) {
    /**
     * Creates an object representation of this proto.
     * Field names that are reserved in JavaScript and will be renamed to pb_name.
     * Optional fields that are not set will be set to undefined.
     * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
     * For the list of reserved names please see:
     *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
     * @param {boolean=} opt_includeInstance Deprecated. whether to include the
     *     JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @return {!Object}
     */
    proto.api.hub.pb.DestroyAccountResponse.prototype.toObject = function(opt_includeInstance) {
      return proto.api.hub.pb.DestroyAccountResponse.toObject(opt_includeInstance, this);
    };


    /**
     * Static version of the {@see toObject} method.
     * @param {boolean|undefined} includeInstance Deprecated. Whether to include
     *     the JSPB instance for transitional soy proto support:
     *     http://goto/soy-param-migration
     * @param {!proto.api.hub.pb.DestroyAccountResponse} msg The msg instance to transform.
     * @return {!Object}
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.DestroyAccountResponse.toObject = function(includeInstance, msg) {
      var obj = {

      };

      if (includeInstance) {
        obj.$jspbMessageInstance = msg;
      }
      return obj;
    };
    }


    /**
     * Deserializes binary data (in protobuf wire format).
     * @param {jspb.ByteSource} bytes The bytes to deserialize.
     * @return {!proto.api.hub.pb.DestroyAccountResponse}
     */
    proto.api.hub.pb.DestroyAccountResponse.deserializeBinary = function(bytes) {
      var reader = new googleProtobuf.BinaryReader(bytes);
      var msg = new proto.api.hub.pb.DestroyAccountResponse;
      return proto.api.hub.pb.DestroyAccountResponse.deserializeBinaryFromReader(msg, reader);
    };


    /**
     * Deserializes binary data (in protobuf wire format) from the
     * given reader into the given message object.
     * @param {!proto.api.hub.pb.DestroyAccountResponse} msg The message object to deserialize into.
     * @param {!jspb.BinaryReader} reader The BinaryReader to use.
     * @return {!proto.api.hub.pb.DestroyAccountResponse}
     */
    proto.api.hub.pb.DestroyAccountResponse.deserializeBinaryFromReader = function(msg, reader) {
      while (reader.nextField()) {
        if (reader.isEndGroup()) {
          break;
        }
        var field = reader.getFieldNumber();
        switch (field) {
        default:
          reader.skipField();
          break;
        }
      }
      return msg;
    };


    /**
     * Serializes the message to binary data (in protobuf wire format).
     * @return {!Uint8Array}
     */
    proto.api.hub.pb.DestroyAccountResponse.prototype.serializeBinary = function() {
      var writer = new googleProtobuf.BinaryWriter();
      proto.api.hub.pb.DestroyAccountResponse.serializeBinaryToWriter(this, writer);
      return writer.getResultBuffer();
    };


    /**
     * Serializes the given message to binary data (in protobuf wire
     * format), writing to the given BinaryWriter.
     * @param {!proto.api.hub.pb.DestroyAccountResponse} message
     * @param {!jspb.BinaryWriter} writer
     * @suppress {unusedLocalVariables} f is only used for nested messages
     */
    proto.api.hub.pb.DestroyAccountResponse.serializeBinaryToWriter = function(message, writer) {
    };


    /**
     * @enum {number}
     */
    proto.api.hub.pb.KeyType = {
      KEY_TYPE_UNSPECIFIED: 0,
      KEY_TYPE_ACCOUNT: 1,
      KEY_TYPE_USER: 2
    };

    goog.object.extend(exports, proto.api.hub.pb);
    });

    var pb = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), hub_pb, {
        'default': hub_pb
    }));

    // package: api.hub.pb
    // file: hub.proto


    var grpc = grpcWebClient_umd.grpc;

    var APIService = (function () {
      function APIService() {}
      APIService.serviceName = "api.hub.pb.APIService";
      return APIService;
    }());

    APIService.BuildInfo = {
      methodName: "BuildInfo",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.BuildInfoRequest,
      responseType: hub_pb.BuildInfoResponse
    };

    APIService.Signup = {
      methodName: "Signup",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.SignupRequest,
      responseType: hub_pb.SignupResponse
    };

    APIService.Signin = {
      methodName: "Signin",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.SigninRequest,
      responseType: hub_pb.SigninResponse
    };

    APIService.Signout = {
      methodName: "Signout",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.SignoutRequest,
      responseType: hub_pb.SignoutResponse
    };

    APIService.GetSessionInfo = {
      methodName: "GetSessionInfo",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.GetSessionInfoRequest,
      responseType: hub_pb.GetSessionInfoResponse
    };

    APIService.GetIdentity = {
      methodName: "GetIdentity",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.GetIdentityRequest,
      responseType: hub_pb.GetIdentityResponse
    };

    APIService.CreateKey = {
      methodName: "CreateKey",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.CreateKeyRequest,
      responseType: hub_pb.CreateKeyResponse
    };

    APIService.ListKeys = {
      methodName: "ListKeys",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.ListKeysRequest,
      responseType: hub_pb.ListKeysResponse
    };

    APIService.InvalidateKey = {
      methodName: "InvalidateKey",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.InvalidateKeyRequest,
      responseType: hub_pb.InvalidateKeyResponse
    };

    APIService.CreateOrg = {
      methodName: "CreateOrg",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.CreateOrgRequest,
      responseType: hub_pb.CreateOrgResponse
    };

    APIService.GetOrg = {
      methodName: "GetOrg",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.GetOrgRequest,
      responseType: hub_pb.GetOrgResponse
    };

    APIService.ListOrgs = {
      methodName: "ListOrgs",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.ListOrgsRequest,
      responseType: hub_pb.ListOrgsResponse
    };

    APIService.RemoveOrg = {
      methodName: "RemoveOrg",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.RemoveOrgRequest,
      responseType: hub_pb.RemoveOrgResponse
    };

    APIService.InviteToOrg = {
      methodName: "InviteToOrg",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.InviteToOrgRequest,
      responseType: hub_pb.InviteToOrgResponse
    };

    APIService.LeaveOrg = {
      methodName: "LeaveOrg",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.LeaveOrgRequest,
      responseType: hub_pb.LeaveOrgResponse
    };

    APIService.IsUsernameAvailable = {
      methodName: "IsUsernameAvailable",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.IsUsernameAvailableRequest,
      responseType: hub_pb.IsUsernameAvailableResponse
    };

    APIService.IsOrgNameAvailable = {
      methodName: "IsOrgNameAvailable",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.IsOrgNameAvailableRequest,
      responseType: hub_pb.IsOrgNameAvailableResponse
    };

    APIService.DestroyAccount = {
      methodName: "DestroyAccount",
      service: APIService,
      requestStream: false,
      responseStream: false,
      requestType: hub_pb.DestroyAccountRequest,
      responseType: hub_pb.DestroyAccountResponse
    };

    var APIService_1 = APIService;

    function APIServiceClient(serviceHost, options) {
      this.serviceHost = serviceHost;
      this.options = options || {};
    }

    APIServiceClient.prototype.buildInfo = function buildInfo(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.BuildInfo, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.signup = function signup(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.Signup, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.signin = function signin(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.Signin, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.signout = function signout(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.Signout, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.getSessionInfo = function getSessionInfo(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.GetSessionInfo, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.getIdentity = function getIdentity(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.GetIdentity, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.createKey = function createKey(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.CreateKey, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.listKeys = function listKeys(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.ListKeys, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.invalidateKey = function invalidateKey(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.InvalidateKey, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.createOrg = function createOrg(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.CreateOrg, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.getOrg = function getOrg(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.GetOrg, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.listOrgs = function listOrgs(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.ListOrgs, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.removeOrg = function removeOrg(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.RemoveOrg, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.inviteToOrg = function inviteToOrg(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.InviteToOrg, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.leaveOrg = function leaveOrg(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.LeaveOrg, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.isUsernameAvailable = function isUsernameAvailable(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.IsUsernameAvailable, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.isOrgNameAvailable = function isOrgNameAvailable(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.IsOrgNameAvailable, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    APIServiceClient.prototype.destroyAccount = function destroyAccount(requestMessage, metadata, callback) {
      if (arguments.length === 2) {
        callback = arguments[1];
      }
      var client = grpc.unary(APIService.DestroyAccount, {
        request: requestMessage,
        host: this.serviceHost,
        metadata: metadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (callback) {
            if (response.status !== grpc.Code.OK) {
              var err = new Error(response.statusMessage);
              err.code = response.status;
              err.metadata = response.trailers;
              callback(err, null);
            } else {
              callback(null, response.message);
            }
          }
        }
      });
      return {
        cancel: function () {
          callback = null;
          client.close();
        }
      };
    };

    var APIServiceClient_1 = APIServiceClient;

    var hub_pb_service = {
    	APIService: APIService_1,
    	APIServiceClient: APIServiceClient_1
    };

    // https://github.com/maxogden/websocket-stream/blob/48dc3ddf943e5ada668c31ccd94e9186f02fafbd/ws-fallback.js

    var ws = null;

    if (typeof WebSocket !== 'undefined') {
      ws = WebSocket;
    } else if (typeof MozWebSocket !== 'undefined') {
      ws = MozWebSocket;
    } else if (typeof commonjsGlobal !== 'undefined') {
      ws = commonjsGlobal.WebSocket || commonjsGlobal.MozWebSocket;
    } else if (typeof window !== 'undefined') {
      ws = window.WebSocket || window.MozWebSocket;
    } else if (typeof self !== 'undefined') {
      ws = self.WebSocket || self.MozWebSocket;
    }

    var browser = ws;

    var loglevel = createCommonjsModule(function (module) {
    /*
    * loglevel - https://github.com/pimterry/loglevel
    *
    * Copyright (c) 2013 Tim Perry
    * Licensed under the MIT license.
    */
    (function (root, definition) {
        if ( module.exports) {
            module.exports = definition();
        } else {
            root.log = definition();
        }
    }(commonjsGlobal, function () {

        // Slightly dubious tricks to cut down minimized file size
        var noop = function() {};
        var undefinedType = "undefined";
        var isIE = (typeof window !== undefinedType) && (typeof window.navigator !== undefinedType) && (
            /Trident\/|MSIE /.test(window.navigator.userAgent)
        );

        var logMethods = [
            "trace",
            "debug",
            "info",
            "warn",
            "error"
        ];

        // Cross-browser bind equivalent that works at least back to IE6
        function bindMethod(obj, methodName) {
            var method = obj[methodName];
            if (typeof method.bind === 'function') {
                return method.bind(obj);
            } else {
                try {
                    return Function.prototype.bind.call(method, obj);
                } catch (e) {
                    // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                    return function() {
                        return Function.prototype.apply.apply(method, [obj, arguments]);
                    };
                }
            }
        }

        // Trace() doesn't print the message in IE, so for that case we need to wrap it
        function traceForIE() {
            if (console.log) {
                if (console.log.apply) {
                    console.log.apply(console, arguments);
                } else {
                    // In old IE, native console methods themselves don't have apply().
                    Function.prototype.apply.apply(console.log, [console, arguments]);
                }
            }
            if (console.trace) console.trace();
        }

        // Build the best logging method possible for this env
        // Wherever possible we want to bind, not wrap, to preserve stack traces
        function realMethod(methodName) {
            if (methodName === 'debug') {
                methodName = 'log';
            }

            if (typeof console === undefinedType) {
                return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives
            } else if (methodName === 'trace' && isIE) {
                return traceForIE;
            } else if (console[methodName] !== undefined) {
                return bindMethod(console, methodName);
            } else if (console.log !== undefined) {
                return bindMethod(console, 'log');
            } else {
                return noop;
            }
        }

        // These private functions always need `this` to be set properly

        function replaceLoggingMethods(level, loggerName) {
            /*jshint validthis:true */
            for (var i = 0; i < logMethods.length; i++) {
                var methodName = logMethods[i];
                this[methodName] = (i < level) ?
                    noop :
                    this.methodFactory(methodName, level, loggerName);
            }

            // Define log.log as an alias for log.debug
            this.log = this.debug;
        }

        // In old IE versions, the console isn't present until you first open it.
        // We build realMethod() replacements here that regenerate logging methods
        function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
            return function () {
                if (typeof console !== undefinedType) {
                    replaceLoggingMethods.call(this, level, loggerName);
                    this[methodName].apply(this, arguments);
                }
            };
        }

        // By default, we use closely bound real methods wherever possible, and
        // otherwise we wait for a console to appear, and then try again.
        function defaultMethodFactory(methodName, level, loggerName) {
            /*jshint validthis:true */
            return realMethod(methodName) ||
                   enableLoggingWhenConsoleArrives.apply(this, arguments);
        }

        function Logger(name, defaultLevel, factory) {
          var self = this;
          var currentLevel;

          var storageKey = "loglevel";
          if (typeof name === "string") {
            storageKey += ":" + name;
          } else if (typeof name === "symbol") {
            storageKey = undefined;
          }

          function persistLevelIfPossible(levelNum) {
              var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

              if (typeof window === undefinedType || !storageKey) return;

              // Use localStorage if available
              try {
                  window.localStorage[storageKey] = levelName;
                  return;
              } catch (ignore) {}

              // Use session cookie as fallback
              try {
                  window.document.cookie =
                    encodeURIComponent(storageKey) + "=" + levelName + ";";
              } catch (ignore) {}
          }

          function getPersistedLevel() {
              var storedLevel;

              if (typeof window === undefinedType || !storageKey) return;

              try {
                  storedLevel = window.localStorage[storageKey];
              } catch (ignore) {}

              // Fallback to cookies if local storage gives us nothing
              if (typeof storedLevel === undefinedType) {
                  try {
                      var cookie = window.document.cookie;
                      var location = cookie.indexOf(
                          encodeURIComponent(storageKey) + "=");
                      if (location !== -1) {
                          storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                      }
                  } catch (ignore) {}
              }

              // If the stored level is not valid, treat it as if nothing was stored.
              if (self.levels[storedLevel] === undefined) {
                  storedLevel = undefined;
              }

              return storedLevel;
          }

          /*
           *
           * Public logger API - see https://github.com/pimterry/loglevel for details
           *
           */

          self.name = name;

          self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
              "ERROR": 4, "SILENT": 5};

          self.methodFactory = factory || defaultMethodFactory;

          self.getLevel = function () {
              return currentLevel;
          };

          self.setLevel = function (level, persist) {
              if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
                  level = self.levels[level.toUpperCase()];
              }
              if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
                  currentLevel = level;
                  if (persist !== false) {  // defaults to true
                      persistLevelIfPossible(level);
                  }
                  replaceLoggingMethods.call(self, level, name);
                  if (typeof console === undefinedType && level < self.levels.SILENT) {
                      return "No console available for logging";
                  }
              } else {
                  throw "log.setLevel() called with invalid level: " + level;
              }
          };

          self.setDefaultLevel = function (level) {
              if (!getPersistedLevel()) {
                  self.setLevel(level, false);
              }
          };

          self.enableAll = function(persist) {
              self.setLevel(self.levels.TRACE, persist);
          };

          self.disableAll = function(persist) {
              self.setLevel(self.levels.SILENT, persist);
          };

          // Initialize with the right level
          var initialLevel = getPersistedLevel();
          if (initialLevel == null) {
              initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
          }
          self.setLevel(initialLevel, false);
        }

        /*
         *
         * Top-level API
         *
         */

        var defaultLogger = new Logger();

        var _loggersByName = {};
        defaultLogger.getLogger = function getLogger(name) {
            if ((typeof name !== "symbol" && typeof name !== "string") || name === "") {
              throw new TypeError("You must supply a name when creating a logger.");
            }

            var logger = _loggersByName[name];
            if (!logger) {
              logger = _loggersByName[name] = new Logger(
                name, defaultLogger.getLevel(), defaultLogger.methodFactory);
            }
            return logger;
        };

        // Grab the current global log variable in case of overwrite
        var _log = (typeof window !== undefinedType) ? window.log : undefined;
        defaultLogger.noConflict = function() {
            if (typeof window !== undefinedType &&
                   window.log === defaultLogger) {
                window.log = _log;
            }

            return defaultLogger;
        };

        defaultLogger.getLoggers = function getLoggers() {
            return _loggersByName;
        };

        // ES6 default export, for compatibility
        defaultLogger['default'] = defaultLogger;

        return defaultLogger;
    }));
    });

    var dist$2 = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebsocketTransport = void 0;
    // Copyright improbable-eng Apache License 2.0
    // https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/src/transports/websocket/websocket.ts
    const isomorphic_ws_1 = __importDefault(browser);
    const loglevel_1 = __importDefault(loglevel);
    const { debug } = loglevel_1.default.getLogger('grpc-transport');
    const isAllowedControlChars = (char) => char === 0x9 || char === 0xa || char === 0xd;
    function isValidHeaderAscii(val) {
        return isAllowedControlChars(val) || (val >= 0x20 && val <= 0x7e);
    }
    function encodeASCII(input) {
        const encoded = new Uint8Array(input.length);
        for (let i = 0; i !== input.length; ++i) {
            const charCode = input.charCodeAt(i);
            if (!isValidHeaderAscii(charCode)) {
                throw new Error('Metadata contains invalid ASCII');
            }
            encoded[i] = charCode;
        }
        return encoded;
    }
    var WebsocketSignal;
    (function (WebsocketSignal) {
        WebsocketSignal[WebsocketSignal["FINISH_SEND"] = 1] = "FINISH_SEND";
    })(WebsocketSignal || (WebsocketSignal = {}));
    const finishSendFrame = new Uint8Array([1]);
    function constructWebSocketAddress(url) {
        if (url.substr(0, 8) === 'https://') {
            return `wss://${url.substr(8)}`;
        }
        else if (url.substr(0, 7) === 'http://') {
            return `ws://${url.substr(7)}`;
        }
        throw new Error('Websocket transport constructed with non-https:// or http:// host.');
    }
    function headersToBytes(headers) {
        let asString = '';
        headers.forEach((key, values) => {
            asString += `${key}: ${values.join(', ')}\r\n`;
        });
        return encodeASCII(asString);
    }
    function websocketRequest(options) {
        options.debug && debug('websocketRequest', options);
        const webSocketAddress = constructWebSocketAddress(options.url);
        const sendQueue = [];
        let ws;
        function sendToWebsocket(toSend) {
            if (toSend === WebsocketSignal.FINISH_SEND) {
                ws.send(finishSendFrame);
            }
            else {
                const byteArray = toSend;
                const c = new Int8Array(byteArray.byteLength + 1);
                c.set(new Uint8Array([0]));
                c.set(byteArray, 1);
                ws.send(c);
            }
        }
        return {
            sendMessage: (msgBytes) => {
                if (!ws || ws.readyState === ws.CONNECTING) {
                    sendQueue.push(msgBytes);
                }
                else {
                    sendToWebsocket(msgBytes);
                }
            },
            finishSend: () => {
                if (!ws || ws.readyState === ws.CONNECTING) {
                    sendQueue.push(WebsocketSignal.FINISH_SEND);
                }
                else {
                    sendToWebsocket(WebsocketSignal.FINISH_SEND);
                }
            },
            start: (metadata) => {
                ws = new isomorphic_ws_1.default(webSocketAddress, ['grpc-websockets']);
                ws.binaryType = 'arraybuffer';
                ws.onopen = function () {
                    options.debug && debug('websocketRequest.onopen');
                    ws.send(headersToBytes(metadata));
                    // send any messages that were passed to sendMessage before the connection was ready
                    sendQueue.forEach((toSend) => {
                        sendToWebsocket(toSend);
                    });
                };
                ws.onclose = function (closeEvent) {
                    options.debug && debug('websocketRequest.onclose', closeEvent);
                    options.onEnd();
                };
                ws.onerror = function (error) {
                    options.debug && debug('websocketRequest.onerror', error);
                };
                ws.onmessage = function (e) {
                    options.onChunk(new Uint8Array(e.data));
                };
            },
            cancel: () => {
                options.debug && debug('websocket.abort');
                ws.close();
            },
        };
    }
    function WebsocketTransport() {
        return (opts) => {
            return websocketRequest(opts);
        };
    }
    exports.WebsocketTransport = WebsocketTransport;

    });

    /* src/components/Login.svelte generated by Svelte v3.29.0 */

    const { console: console_1 } = globals;
    const file = "src/components/Login.svelte";

    // (112:10) {#if loginProcess == LoginState.None}
    function create_if_block_3(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let a;
    	let t4;
    	let t5;
    	let form;
    	let div;
    	let label;
    	let t7;
    	let input;
    	let t8;
    	let button0;
    	let t10;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Omo Sapien Login";
    			t1 = space();
    			p = element("p");
    			t2 = text("Willkommen in der Omo Welt. Omo's entwickeln und kontrollieren\n              100% ihre eigenen Daten und Apps. Um dich als Omo Sapien\n              einzuloggen oder einen neuen OmoPod zu installieren, melde dich\n              bei unserem Daten Hosting Partner\n              ");
    			a = element("a");
    			a.textContent = "Textile";
    			t4 = text("\n              an.");
    			t5 = space();
    			form = element("form");
    			div = element("div");
    			label = element("label");
    			label.textContent = "Email";
    			t7 = space();
    			input = element("input");
    			t8 = space();
    			button0 = element("button");
    			button0.textContent = "Send Magic Login";
    			t10 = space();
    			button1 = element("button");
    			attr_dev(h1, "class", "text-3xl pt-12 text-center mb-4 font-title text-primary");
    			add_location(h1, file, 112, 12, 4654);
    			attr_dev(a, "href", "https://textile.io");
    			add_location(a, file, 120, 14, 5097);
    			attr_dev(p, "class", "text-sm mb-8");
    			add_location(p, file, 115, 12, 4784);
    			attr_dev(label, "for", "email");
    			attr_dev(label, "class", "block mb-1 text-xs font-medium text-gray-600");
    			add_location(label, file, 126, 16, 5398);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "email");
    			attr_dev(input, "class", "block mb-1 text-xl w-full rounded bg-gray-200 border border-transparent focus:outline-none");
    			add_location(input, file, 130, 16, 5537);
    			attr_dev(div, "class", "mb-5 w-full px-2 pt-1 rounded bg-gray-200 border border-transparent focus:outline-none");
    			add_location(div, file, 124, 14, 5265);
    			attr_dev(button0, "class", "w-full p-3 bg-primary text-white rounded shadow");
    			add_location(button0, file, 136, 14, 5797);
    			add_location(button1, file, 139, 14, 5972);
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "class", "");
    			attr_dev(form, "action", "#");
    			attr_dev(form, "onsubmit", "return false;");
    			add_location(form, file, 123, 12, 5185);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			append_dev(p, a);
    			append_dev(p, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div);
    			append_dev(div, label);
    			append_dev(div, t7);
    			append_dev(div, input);
    			set_input_value(input, /*login*/ ctx[0]);
    			append_dev(form, t8);
    			append_dev(form, button0);
    			append_dev(form, t10);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*login*/ 1 && input.value !== /*login*/ ctx[0]) {
    				set_input_value(input, /*login*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(112:10) {#if loginProcess == LoginState.None}",
    		ctx
    	});

    	return block;
    }

    // (143:10) {#if loginProcess == LoginState.LoggingIn}
    function create_if_block_2(ctx) {
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Logging in ...";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Magic Login Link has been send to you, please check you email";
    			attr_dev(h1, "class", "text-3xl pt-12 text-center mb-4 font-title text-primary");
    			add_location(h1, file, 143, 12, 6084);
    			attr_dev(p, "class", "my-8");
    			add_location(p, file, 146, 12, 6212);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(143:10) {#if loginProcess == LoginState.LoggingIn}",
    		ctx
    	});

    	return block;
    }

    // (151:10) {#if loginProcess == LoginState.LoggedIn}
    function create_if_block_1(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t2_value = /*user*/ ctx[2].name + "";
    	let t2;
    	let t3;
    	let t4_value = /*user*/ ctx[2].email + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Herzlich willkommen";
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = text("(");
    			t4 = text(t4_value);
    			t5 = text(")");
    			attr_dev(h1, "class", "text-3xl pt-12 text-center mb-4 font-title text-primary");
    			add_location(h1, file, 151, 12, 6402);
    			attr_dev(p, "class", "my-8");
    			add_location(p, file, 154, 12, 6535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user*/ 4 && t2_value !== (t2_value = /*user*/ ctx[2].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*user*/ 4 && t4_value !== (t4_value = /*user*/ ctx[2].email + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(151:10) {#if loginProcess == LoginState.LoggedIn}",
    		ctx
    	});

    	return block;
    }

    // (158:10) {#if loginProcess == LoginState.Error}
    function create_if_block(ctx) {
    	let div;
    	let p0;
    	let t1;
    	let p1;
    	let t2_value = /*error*/ ctx[3].message + "";
    	let t2;
    	let t3;
    	let t4_value = /*error*/ ctx[3].code + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6_value = JSON.stringify(/*error*/ ctx[3].metadata) + "";
    	let t6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = "Fehler!";
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" Code: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text(t6_value);
    			add_location(p0, file, 159, 14, 6691);
    			add_location(p1, file, 160, 14, 6720);
    			add_location(p2, file, 161, 14, 6776);
    			attr_dev(div, "class", "m-8");
    			add_location(div, file, 158, 12, 6659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 8 && t2_value !== (t2_value = /*error*/ ctx[3].message + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*error*/ 8 && t4_value !== (t4_value = /*error*/ ctx[3].code + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*error*/ 8 && t6_value !== (t6_value = JSON.stringify(/*error*/ ctx[3].metadata) + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(158:10) {#if loginProcess == LoginState.Error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let body;
    	let div4;
    	let div3;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let a;
    	let t4;
    	let span;
    	let if_block0 = /*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].None && create_if_block_3(ctx);
    	let if_block1 = /*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].LoggingIn && create_if_block_2(ctx);
    	let if_block2 = /*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].LoggedIn && create_if_block_1(ctx);
    	let if_block3 = /*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].Error && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			div1 = element("div");
    			a = element("a");
    			t4 = text("Dein privater Omo DatenPod wird bei\n            Textile gehosted:\n            ");
    			span = element("span");
    			span.textContent = `${/*addrGatewayUrl*/ ctx[5]}`;
    			attr_dev(div0, "class", "px-8");
    			add_location(div0, file, 110, 8, 4575);
    			attr_dev(span, "class", "hover:text-green-500 text-blue-700");
    			add_location(span, file, 170, 12, 7087);
    			attr_dev(a, "href", "https://textile.io/");
    			add_location(a, file, 168, 10, 6979);
    			attr_dev(div1, "class", "flex justify-between p-8 text-sm border-t border-gray-300 bg-gray-100");
    			add_location(div1, file, 166, 8, 6875);
    			attr_dev(div2, "class", "bg-white rounded-lg overflow-hidden shadow-2xl");
    			add_location(div2, file, 109, 6, 4506);
    			attr_dev(div3, "class", "max-w-md w-full mx-auto");
    			add_location(div3, file, 108, 4, 4462);
    			attr_dev(div4, "class", "container mx-auto mt-24 flex");
    			add_location(div4, file, 107, 2, 4415);
    			attr_dev(body, "class", "flex h-screen bg-gray-200 font-sans text-gray-600");
    			add_location(body, file, 106, 0, 4348);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block3) if_block3.m(div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    			append_dev(a, t4);
    			append_dev(a, span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].None) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].LoggingIn) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].LoggedIn) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div0, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*loginProcess*/ ctx[1] == /*LoginState*/ ctx[4].Error) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	var LoginState;

    	(function (LoginState) {
    		LoginState[LoginState["None"] = 1] = "None";
    		LoginState[LoginState["LoggingIn"] = 2] = "LoggingIn";
    		LoginState[LoginState["LoggedIn"] = 3] = "LoggedIn";
    		LoginState[LoginState["Error"] = 4] = "Error";
    		LoginState[LoginState["Register"] = 5] = "Register";
    	})(LoginState || (LoginState = {}));

    	class ApiResponse {
    		
    	}

    	class User {
    		
    	}

    	let { login = "" } = $$props;
    	let { loginProcess = LoginState.None } = $$props;
    	let { user } = $$props;
    	let { error } = $$props;
    	let local = window.location.hostname == "localhost" || window.location.hostname == "127.0.0.1";
    	let development = window.location.hostname == "dev.omo.local";

    	let addrGatewayUrl = local || development
    	? "https://hub.dev.omo.earth"
    	: "https://hub.textile.io";

    	let addrAPIUrl = local || development
    	? "https://webapi.dev.omo.earth"
    	: dist$1.defaultHost;

    	function signInOrSignUpAsync() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (login == null || login == "") return;
    			$$invalidate(1, loginProcess = LoginState.LoggingIn);
    			const ctx = new dist$1.Context(addrAPIUrl);
    			const client = new APIServiceClient_1(ctx.host, { transport: dist$2.WebsocketTransport() });
    			let resp = yield signIn(client, ctx);

    			if (resp.error && resp.error.code == 5) {
    				console.log("signUp");
    				resp = yield signUp(client, ctx);
    			}

    			if (resp.error) {
    				$$invalidate(3, error = resp.error);
    				$$invalidate(1, loginProcess = LoginState.Error);
    				return;
    			}

    			$$invalidate(2, user = yield getUser(resp.session, client, ctx));
    			$$invalidate(1, loginProcess = LoginState.LoggedIn);
    		});
    	}

    	function getUser(session, client, ctx) {
    		return __awaiter(this, void 0, void 0, function* () {
    			let meta = yield ctx.withSession(session).toMetadata();
    			let req = new hub_pb.GetSessionInfoRequest();

    			return new Promise(resolve => {
    					client.getSessionInfo(req, meta, (error, message) => {
    						let user = error
    						? { name: "", email: "" }
    						: {
    								name: message.getUsername(),
    								email: message.getEmail()
    							};

    						resolve(user);
    					});
    				});
    		});
    	}

    	function signUp(client, ctx) {
    		return __awaiter(this, void 0, void 0, function* () {
    			let meta = yield ctx.toMetadata();
    			let req = new hub_pb.SignupRequest();
    			req.setEmail(login);
    			req.setUsername(login.split("@")[0]);

    			return new Promise(resolve => {
    					client.signup(req, meta, (error, message) => {
    						let resp = error
    						? { error, session: null }
    						: {
    								error: null,
    								session: message === null || message === void 0
    								? void 0
    								: message.getSession()
    							};

    						resolve(resp);
    					});
    				});
    		});
    	}

    	function signIn(client, ctx) {
    		return __awaiter(this, void 0, void 0, function* () {
    			let meta = yield ctx.toMetadata();
    			let req = new hub_pb.SigninRequest();
    			req.setUsernameOrEmail(login);

    			return new Promise(resolve => {
    					client.signin(req, meta, (error, message) => {
    						let resp = error
    						? { error, session: null }
    						: {
    								error: null,
    								session: message === null || message === void 0
    								? void 0
    								: message.getSession()
    							};

    						resolve(resp);
    					});
    				});
    		});
    	}

    	const writable_props = ["login", "loginProcess", "user", "error"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		login = this.value;
    		$$invalidate(0, login);
    	}

    	const click_handler = () => signInOrSignUpAsync();

    	$$self.$$set = $$props => {
    		if ("login" in $$props) $$invalidate(0, login = $$props.login);
    		if ("loginProcess" in $$props) $$invalidate(1, loginProcess = $$props.loginProcess);
    		if ("user" in $$props) $$invalidate(2, user = $$props.user);
    		if ("error" in $$props) $$invalidate(3, error = $$props.error);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		Context: dist$1.Context,
    		defaultHost: dist$1.defaultHost,
    		APIServiceClient: APIServiceClient_1,
    		ServiceError: hub_pb_service.ServiceError,
    		WebsocketTransport: dist$2.WebsocketTransport,
    		pb,
    		LoginState,
    		ApiResponse,
    		User,
    		login,
    		loginProcess,
    		user,
    		error,
    		local,
    		development,
    		addrGatewayUrl,
    		addrAPIUrl,
    		signInOrSignUpAsync,
    		getUser,
    		signUp,
    		signIn
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("LoginState" in $$props) $$invalidate(4, LoginState = $$props.LoginState);
    		if ("login" in $$props) $$invalidate(0, login = $$props.login);
    		if ("loginProcess" in $$props) $$invalidate(1, loginProcess = $$props.loginProcess);
    		if ("user" in $$props) $$invalidate(2, user = $$props.user);
    		if ("error" in $$props) $$invalidate(3, error = $$props.error);
    		if ("local" in $$props) local = $$props.local;
    		if ("development" in $$props) development = $$props.development;
    		if ("addrGatewayUrl" in $$props) $$invalidate(5, addrGatewayUrl = $$props.addrGatewayUrl);
    		if ("addrAPIUrl" in $$props) addrAPIUrl = $$props.addrAPIUrl;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		login,
    		loginProcess,
    		user,
    		error,
    		LoginState,
    		addrGatewayUrl,
    		signInOrSignUpAsync,
    		input_input_handler,
    		click_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			login: 0,
    			loginProcess: 1,
    			user: 2,
    			error: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*user*/ ctx[2] === undefined && !("user" in props)) {
    			console_1.warn("<Login> was created without expected prop 'user'");
    		}

    		if (/*error*/ ctx[3] === undefined && !("error" in props)) {
    			console_1.warn("<Login> was created without expected prop 'error'");
    		}
    	}

    	get login() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set login(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loginProcess() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loginProcess(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get user() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */

    function create_fragment$2(ctx) {
    	let tailwind;
    	let t;
    	let login;
    	let current;
    	tailwind = new Tailwind({ $$inline: true });
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tailwind.$$.fragment);
    			t = space();
    			create_component(login.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwind, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwind.$$.fragment, local);
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwind.$$.fragment, local);
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwind, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(login, detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Tailwind, Login });
    	return [];
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
