(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function ee(){let e={"*":[]},f=[];return{emit:(n,...o)=>{e[n]&&e[n].forEach(e=>e(...o)),f.forEach(e=>null==n.match(e.p)?0:e.f(...o)),"*"!=n&&e["*"].forEach(e=>e(n,...o))},on:(n,o)=>n instanceof RegExp?f.push({p:n,f:o}):e[n]?e[n].push(o):(e[n]=[]).push(o),off:(n,o)=>{let t;n instanceof RegExp?(f.forEach(e=>n.toString()==e.p.toString()&&o==e.f?t=e:0)||t)&&delete f[f.indexOf(t)]:e[n]&&((e[n].forEach(e=>o==e?t=e:0)||t)&&delete e[n][e[n].indexOf(t)])}}}"undefined"==typeof window&&(module.exports=ee);
},{}],2:[function(require,module,exports){
(function (process){
const vachan = {};
vachan.Pending = Symbol("Pending");
vachan.Fulfilled = Symbol("Fulfilled");
vachan.Rejected = Symbol("Rejected");
vachan.Macro = Symbol("Macro");
vachan.Micro = Symbol("Micro");
vachan.Sync = Symbol("Sync");
vachan.default_type = vachan.Macro;
vachan.realm = require("conciseee")();

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
                let handler = v => {
                    fullilled++;
                    values.push(v);
                    check();
                }
                let rejHandler = e => reject(e);
                for(let prom of p) prom.then(handler,rejHandler);
            }
        );
    }

    static race(...p)
    {
        if(p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P( 
            (resolve) => {
                let fullilled = 0;
                let done = false;
                let handler = v => {
                    if(!done) 
                    {
                        done = true;
                        resolve(v);
                    }
                }
                let rejHandler = e => reject(e);
                for(let prom of p)
                {
                    prom.then(handler,rejHandler);
                }
            }
        );
    }

    static delay(value,ms)
    {
        return new P((resolve) => setTimeout(()=>resolve(value),ms));
    }

    constructor(logic,async = true,type = vachan.default_type)
    {
        this.async = async;
        this.type = type;
        this.state = vachan.Pending;
        this.value = undefined;
        this.success_handler = [];
        this.failure_handler = [];
        if(logic)
        {
            this.logic = logic;
            this.logic( 
                (v) => this.resolve(v), 
                (v) => this.reject(v),
                this
            );
        }
        vachan.realm.emit("Created",this);
    }

    isFullfilled()
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
            vachan.realm.emit("Fulfilled",this);
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
            vachan.realm.emit("Rejected",this);
        }
    }

    queueTask(h)
    {
        if(this.async)
        {
            if(this.type === vachan.Micro)
            {
                process.nextTick(h);
                vachan.realm.emit("TaskQueued",vachan.Micro,h);
            }
            else if(this.type === vachan.Macro)
            {
                setTimeout(h,0);
                vachan.realm.emit("TaskQueued",vachan.Macro,h);
            }
        }
        else
        {
            h();
            vachan.realm.emit("TaskQueued",vachan.Sync,h);
        } 
    }

    then(s,f)
    {
        if(typeof(s) !== "function") s = undefined;
        if(typeof(f) !== "function") f = undefined;
        return new P((resolve,reject,cp) => {
            let recurHandler = (x) => {
                if(x == null) resolve(x);
                else if(x === cp) reject(new TypeError("It cannot return the same Promise"));
                else if(x instanceof P)
                {
                    let rcalled = false;
                    let recalled = false;
                    x.then((v) => {
                        if(!rcalled && !recalled) recurHandler(v);
                        rcalled = true;
                    },(e) => {
                        if(!rcalled && !recalled) reject(e);
                        recalled = true;
                    });
                    vachan.realm.emit("Rechained",x,cp);
                }
                else if( 
                        x instanceof Object || 
                        x instanceof Function || 
                        typeof(x) === "object" || 
                        typeof(x) === "function"
                    )
                {
                    let rcalled = false;
                    let recalled = false;
                    try
                    {
                        let then = x["then"];
                        if(then !== undefined && (then instanceof Function && typeof(then) == "function"))
                        {
                            then.call(x,(v) => {
                                if(!rcalled && !recalled) recurHandler(v);
                                rcalled = true;
                            },(e) => {
                                if(!rcalled && !recalled) reject(e);
                                recalled = true;
                            });
                            vachan.realm.emit("Rechained",x,cp);
                        } 
                        else
                        {
                            resolve(x);
                        }
                    }
                    catch(e)
                    {
                        if(rcalled || recalled) {}
                        else reject(e);
                    }
                }
                else
                {
                    resolve(x);
                } 
            };
            let handler = (f) => (v) => { 
                let x;
                try
                {   
                    x = f(v);
                    recurHandler(x);
                }
                catch(e)
                {
                    reject(e);
                }
            };
            if(this.state === vachan.Fulfilled)
            {
                if(s) this.queueTask(() => handler(s)(this.value));
                else this.queueTask(() => resolve(this.value));
                vachan.realm.emit("Preresolved",this,cp,s);
            }
            else if(this.state === vachan.Rejected)
            {
                if(f) this.queueTask(() => handler(f)(this.value));
                else this.queueTask(() => reject(this.value));
                vachan.realm.emit("Prerejected",this,cp,f);
            }
            else
            {
                if(s) this.success_handler.push(handler(s));
                else this.success_handler.push(resolve);
                if(f) this.failure_handler.push(handler(f));
                else this.failure_handler.push(reject);
                vachan.realm.emit("Chained",this,cp);
            }
        });
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
module.exports.P = vachan.P;
module.exports.Macro = vachan.Macro;
module.exports.Micro = vachan.Micro;
}).call(this,require('_process'))
},{"_process":3,"conciseee":1}],3:[function(require,module,exports){
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

},{}]},{},[2]);