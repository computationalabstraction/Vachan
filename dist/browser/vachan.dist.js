(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vachan = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function ee(){let a={"*":[]},b=[];return{emit(c,...d){return a[c]?a[c].forEach(a=>a(...d)):0,b.forEach(a=>null==c.match(a.p)?0:a.f(...d)),"*"==c?0:a["*"].forEach(a=>a(c,...d)),this},on(c,d){return c instanceof RegExp?b.push({p:c,f:d}):a[c]?a[c].push(d):(a[c]=[]).push(d),this},off(c,d){let e;return c instanceof RegExp?b.forEach(a=>c.toString()==a.p.toString()&&d==a.f?e=a:0)||e?delete b[b.indexOf(e)]:0:a[c]?a[c].forEach(a=>d==a?e=a:0)||e?delete a[c][a[c].indexOf(e)]:0:0,this}}}"undefined"!=typeof module&&(module.exports=ee);
},{}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (process){
const vachan = {};
vachan.Pending = Symbol("Pending");
vachan.Fulfilled = Symbol("Fulfilled");
vachan.Rejected = Symbol("Rejected");
vachan.Macro = Symbol("Macro");
vachan.Micro = Symbol("Micro");
vachan.Sync = Symbol("Sync");
vachan.default_type = vachan.Micro;
vachan.realm = require("conciseee")();

let schedulers = {};
schedulers[vachan.Macro] = h => setTimeout(h,0); 
schedulers[vachan.Micro] = h => process.nextTick(h);
// Only for debugging
schedulers[vachan.Sync] = h => h();

let recurHandler = (value,context) => {
    if(value == null) context.resolve(value);
    else if(value === context.cp) context.reject(new TypeError("It cannot return the same Promise"));
    else if(value instanceof P)
    {
        value.then(v => recurHandler(v,context),context.reject);
        vachan.realm.emit("Rechained",value,context.cp);
    }
    else if( 
            value instanceof Object || 
            value instanceof Function || 
            typeof(value) === "object" || 
            typeof(value) === "function"
        )
    {
        let rcalled = false;
        let recalled = false;
        try
        {
            let then = value["then"];
            if(then !== undefined && (then instanceof Function && typeof(then) == "function"))
            {
                then.call(value,v => {
                    if(!rcalled && !recalled) recurHandler(v,context);
                    rcalled = true;
                },e => {
                    if(!rcalled && !recalled) context.reject(e);
                    recalled = true;
                });
                vachan.realm.emit("Rechained",value,context.cp);
            } 
            else
            {
                context.resolve(value);
            }
        }
        catch(e)
        {
            if(!rcalled && !recalled) context.reject(e)
        } 
    }
    else
    {
        context.resolve(value);
    } 
};

let handler = (f,context) => (v) => { 
    try
    {   
        recurHandler(f(v),context);
    }
    catch(e)
    {
        context.reject(e);
    }
    vachan.realm.emit("HandlerExecuted",{promise:context.cp,handler:f,timestamp:new Date()});
};

class P
{
    static resolve(v)
    {
        return new P((resolve) => resolve(v));
    }

    static reject(e)
    {
        return new P((resolve,reject) => reject(e));
    }

    static all(...p)
    {
        if(p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P( 
            (resolve,reject) => {
                let fullilled = 0;
                let values = [];
                let check = _ => fullilled == p.length?resolve(values):0;
                let handler = v => ++fullilled && values.push(v) && check()
                let rejHandler = e => reject(e);
                for(let prom of p) prom.then(handler,rejHandler);
            }
        );
    }

    static race(...p)
    {
        if(p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P( 
            (resolve,reject) => {
                let done = false;
                let handler = v => !done?done = true&&resolve(v):0;
                let rejHandler = e => reject(e);
                for(let prom of p) prom.then(handler,rejHandler);
            }
        );
    }

    static any(...p)
    {
        if(p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P(
            (resolve,reject) => {
                let rejected = 0;
                let done = false;
                let errors = [];
                let check = _ => rejected == p.length?reject(errors):0;
                let handler = v => !done?done = true && resolve(v):0;
                let rejHandler = e => ++rejected && errors.push(v) && check();
                for(let prom of p) prom.then(handler,rejHandler);
            }
        )
    }

    static allSettled(...p)
    {
        if(p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P( 
            (resolve,reject) => {
                let settled = 0;
                let handler = v => ++settled && (settled == p.length?resolve():0);
                for(let prom of p) prom.then(handler,handler);
            }
        );
    }

    static delay(value,ms)
    {
        return new P((resolve) => setTimeout(()=>resolve(value),ms));
    }

    static vachanify(functor)
    {
        return (...args) => {
            return new P((resolve,reject) => {
                if(args.length > 0)
                {
                    functor(...args,(err,data) => err?reject(err):resolve(data));
                }
                else functor((err,data) => err?reject(err):resolve(data));
            });
        }
    }

    constructor(executor,scheduler = vachan.default_type)
    {
        this.setScheduler(scheduler);
        this.state = vachan.Pending;
        this.value = undefined;
        this.success_handler = [];
        this.failure_handler = [];
        vachan.realm.emit("Created",{promise:this,timestamp:new Date()});
        if(executor)
        {
            this.executor = executor;
            try
            {   
                const context = {
                    resolve:v => this.resolve(v),
                    reject:e => this.reject(e),
                    cp:this
                };
                this.executor( 
                    v => recurHandler(v,context), 
                    context.reject,
                    this
                );
            }
            catch(e)
            {
                context.reject(e);
            }
            vachan.realm.emit("ExecutorExecuted",{promise:this,executor:this.executor,timestamp:new Date()});
        }
    }

    isFulfilled()
    {
        return this.state === vachan.Fulfilled;
    }

    isRejected()
    {
        return this.state === vachan.Rejected;
    }

    isPending()
    {
        return this.state === vachan.Pending;
    }

    resolve(v)
    {
        if(this.state === vachan.Pending)
        {
            this.state = vachan.Fulfilled;
            this.value = v;
            for(let handler of this.success_handler)
            {
                this.queueTask(() => handler(v));
            }
            vachan.realm.emit("Fulfilled",{promise:this,timestamp:new Date()});
        }
    }

    reject(e)
    {
        if(this.state === vachan.Pending)
        {
            this.state = vachan.Rejected;
            this.value = e;
            for(let handler of this.failure_handler)
            {
                this.queueTask(() => handler(e));
            }
            vachan.realm.emit("Rejected",{promise:this,timestamp:new Date()});
        }
    }

    setScheduler(scheduler) 
    {
        this.scheduler = scheduler instanceof Function && typeof scheduler === "function"?this.custom = true||scheduler:scheduler in schedulers?scheduler:vachan.default_type;
        return this;
    }

    queueTask(h)
    {
        this.custom?this.scheduler(h):schedulers[this.scheduler](h);
        vachan.realm.emit("HandlerQueued",{promise:this,scheduler:this.scheduler,handler:h,timestamp:new Date()});
    }

    then(s,f)
    {
        if(typeof(s) !== "function") s = undefined;
        if(typeof(f) !== "function") f = undefined;
        const parasite = new P();
        const context = {
            resolve:v => parasite.resolve(v),
            reject:e => parasite.reject(e),
            cp:parasite
        };
        if(this.state === vachan.Fulfilled)
        {
            if(s) this.queueTask(() => handler(s,context)(this.value));
            else this.queueTask(() => parasite.resolve(this.value));
            vachan.realm.emit("Preresolved",{substrate:this,parasite:parasite,handler:s,timestamp:new Date()});
        }
        else if(this.state === vachan.Rejected)
        {
            if(f) this.queueTask(() => handler(f,context)(this.value));
            else this.queueTask(() => parasite.reject(this.value));
            vachan.realm.emit("Prerejected",{substrate:this,parasite:parasite,handler:f,timestamp:new Date()});
        }
        else
        {
            if(s) this.success_handler.push(handler(s,context));
            else this.success_handler.push(context.resolve);
            if(f) this.failure_handler.push(handler(f,context));
            else this.failure_handler.push(context.reject);
            vachan.realm.emit("Chained",{substrate:this,parasite:parasite,timestamp:new Date()});
        }
        return parasite;
    }

    fork(...handlers) 
    {
        return P.all(
            handlers.map(
                h => h instanceof Function?
                    this.then(h) :
                    this.then(h[0],h[1])
            )
        ); 
    }

    join(...promises) 
    {
        return P.all(this,...promises);
    }

    tap(s,f) 
    {
        return this.then(
            v => {s?s(v):0;return this;},
            e => {f?f(e):0;return this;}
        );
    }

    catch(f)
    {
        return this.then(undefined,f);
    }

    finally(h)
    {
        return this.then(h,h);
    }

    delay(ms)
    {
        return new P(
            (resolve,reject) => {
                this.then( 
                    v => setTimeout(()=>resolve(v),ms),
                    v => setTimeout(()=>reject(v),ms)
                );
            }
        );
    }
}

vachan.P = P;
module.exports = vachan;
}).call(this,require('_process'))
},{"_process":2,"conciseee":1}]},{},[3])(3)
});
