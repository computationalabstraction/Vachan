/*
Library Object
*/
const vachan = {};

/*
Promise States -

Diagrammatic Representation:

Promise -> Pending -> resolve() -> Fulfilled <- -
              |                                  |   Either State it is
              v                                  |        Resolved
           reject() -> Rejected <- - - - - - - - 

State Table Representation:

      Initial State is always Pending
 -------------------------------------------
|   Input   |   Current State   |  Outcome  |
 -------------------------------------------
|  resolve  |      Pending      | Fulfilled |
 -------------------------------------------
|  reject   |      Pending      | Rejected  |
 -------------------------------------------
|  resolve  |     Fulfilled     |   NOP     |
 -------------------------------------------
|  resolve  |     Rejected      |   NOP     |
 -------------------------------------------
|  reject   |     Fulfilled     |   NOP     |
 -------------------------------------------
|  reject   |     Rejected      |   NOP     |
 -------------------------------------------
*/
vachan.Pending = Symbol("Pending");
vachan.Fulfilled = Symbol("Fulfilled");
vachan.Rejected = Symbol("Rejected");

/*
TODO: Next Release

Promise Internal Symbols - 
These symbols should not be visible to the consumer directly.
This should make it difficult (but not impossible) to access internal 
promise data and operations from outside can be achieved
but would need reverse engineering using something like 
Object.getOwnPropertySymbols() or Reflect API

let resolve = Symbol("Resolve");
let reject = Symbol("Reject");
let success_handler = Symbol("Success Handler");
let failure_handler = Symbol("Failure Handler");
let state = Symbol("State");
let value = Symbol("Value");
*/

/*
Predefined Schedulers or Modes -
Macro Scheduler/Mode: This mode can be implementated either through 
                      setTimeout or setImmdiate
Micro Scheduler/Mode: This mode can be implementated only in one way on 
                      Node.js and it is through process.nextTick
Sync Scheduler/Mode:  This mode will call the next handler synchronously 
                      blocking the thread
*/
vachan.Macro = Symbol("Macro");
vachan.Micro = Symbol("Micro");
vachan.Sync = Symbol("Sync");
vachan.default_type = vachan.Micro;

/* 
Predefined Schedulers Implementation - 
Macro: This has been implemented using setTimeout(function, 0)
Micro: This has been implemented using process.nextTick(function)
Sync: This will directly call the passed function

These scheduler implementations are swappable but not recommended

NOTE: 
On Node.js there is direct support for process.nextTick but 
on the browser the implementation will use the proccess.nextTick 
polyfill by Browserify.
*/
vachan.schedulers = {};
vachan.schedulers[vachan.Macro] = h => setTimeout(h, 0);
vachan.schedulers[vachan.Micro] = h => process.nextTick(h);
/* 
Only for debugging or to be used in a very urgent scenario where the 
consequent task/s has/have to be done directly after the async task completes 
and cannot wait for excution through async scheduling.
*/
vachan.schedulers[vachan.Sync] = h => h();

/*
Event Portal -
The default implementation is provided using conciseee package but 
any object can be used provided it has emit and on methods.

This implementation is swappable by any object which has 
emit and on methods defined.
*/
vachan.realm = require("conciseee")();

/*
TODO: Next Release

Events Defintions -
Events which will be raised on the Event Portal

vachan.events = {};
vachan.events.Created = Symbol("Created");
vachan.events.ExecutorExecuted = Symbol("ExecutorExecuted");
vachan.events.ExecutorThrows = Symbol("ExecutorThrows");
vachan.events.Fulfilled = Symbol("Fulfilled");
vachan.events.Rejected = Symbol("Rejected");
vachan.events.Preresolved = Symbol("Preresolved");
vachan.events.Prerejected = Symbol("Prerejected");
vachan.events.Chained = Symbol("Chained");
vachan.events.HandlerQueued = Symbol("HandlerQueued");
vachan.events.HandlerExecuted = Symbol("HandlerExecuted");
vachan.events.Rechained = Symbol("Rechained");
*/


/*
Adapter function to the event portal -
This function is used for loose coupling between the portal and the 
internal promise code as the implementation for the portal can be swapped.
*/
vachan.raiseEvent = (eventname, data) => {
    data.name = eventname;
    data.timestamp = new Date();
    vachan.realm.emit(eventname, data);
};

/*
This function/logic has to be applied on both the resolved value
of a promise and on the return value of a success or reject handler.
*/
let recurHandler = (value, context) => {
    if (value === null) context.resolve(value);
    else if (value === context.cp) context.reject(new TypeError("It cannot return the same Promise"));
    else if (
        value instanceof Object ||
        value instanceof Function ||
        typeof (value) === "object" ||
        typeof (value) === "function"
    ) {
        let rcalled = false;
        let recalled = false;
        try {
            let then = value["then"];
            if (then !== undefined && (then instanceof Function && typeof (then) == "function")) {
                then.call(value, v => {
                    if (!rcalled && !recalled) recurHandler(v, context);
                    rcalled = true;
                }, e => {
                    if (!rcalled && !recalled) context.reject(e);
                    recalled = true;
                });
                vachan.raiseEvent("Rechained", { value: value, promise: context.cp });
            }
            else {
                context.resolve(value);
            }
        }
        catch (e) {
            if (!rcalled && !recalled) context.reject(e)
        }
    }
    else {
        context.resolve(value);
    }
};

/*
This is a universal wrapper which wraps every success and reject handler
*/
let handler = (f, context) => (v) => {
    try {
        recurHandler(f(v), context);
    }
    catch (e) {
        context.reject(e);
    }
    vachan.raiseEvent("HandlerExecuted", { promise: context.cp, handler: f });
};

/*
Promise class 
*/
class P {
    /* 
        Creating a preresolved Promise
    */
    static resolve(v) {
        return new P((resolve) => resolve(v));
    }

    /* 
        Creating a prerejected Promise
    */
    static reject(e) {
        return new P((resolve, reject) => reject(e));
    }

    /* 
        Accepts an array or varargs of promises and returns a 
        promise which waits for all the promises sent to get resolved 
        if all are fulfilled then it will fulfill with an array which will 
        contain all the fulfilled values of promises sent and even if one 
        of the passed promises rejects then it will reject with the reason.
    */
    static all(...p) {
        if (p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P(
            (resolve, reject) => {
                let fullilled = 0;
                let values = [];
                let check = _ => fullilled == p.length ? resolve(values) : 0;
                let handler = v => ++fullilled && values.push(v) && check()
                let rejHandler = e => reject(e);
                for (let prom of p) prom.then(handler, rejHandler);
            }
        );
    }

    /* 
        Accepts an array or varargs of promises and returns a 
        promise which waits for the first promise of all the 
        promises (all promises race and the first one to get 
        resolve wins) sent to get resolved and will either 
        fulfill or reject with the same value or reason.
    */
    static race(...p) {
        if (p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P(
            (resolve, reject) => {
                let done = false;
                let handler = v => !done ? done = true && resolve(v) : 0;
                let rejHandler = e => reject(e);
                for (let prom of p) prom.then(handler, rejHandler);
            }
        );
    }

    /* 
        Accepts an array or varargs of promises and returns a 
        promise which waits for any one promise of all the 
        promises (any one successful fulfillment) sent to get
        fulfilled and then fulfill the consequent promise or 
        wait for all the promises to get rejected and reject 
        the consequent promise with array of reasons.
    */
    static any(...p) {
        if (p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P(
            (resolve, reject) => {
                let rejected = 0;
                let done = false;
                let errors = [];
                let check = _ => rejected == p.length ? reject(errors) : 0;
                let handler = v => !done ? done = true && resolve(v) : 0;
                let rejHandler = e => ++rejected && errors.push(e) && check();
                for (let prom of p) prom.then(handler, rejHandler);
            }
        )
    }

    /* 
        Accepts an array or varargs of promises and returns a 
        promise which waits for all of them to get resolved and 
        then resolves the consequent promise but with no values.
    */
    static allSettled(...p) {
        if (p.length == 1 && Array.isArray(p[0])) p = p[0];
        return new P(
            (resolve, reject) => {
                let settled = 0;
                let handler = v => ++settled && (settled == p.length ? resolve() : 0);
                for (let prom of p) prom.then(handler, handler);
            }
        );
    }

    /* 
       Creates and returns a new promise but delays its resolution with
       the passed value for the given milleseconds.
    */
    static delay(value, ms) {
        return new P((resolve) => setTimeout(() => resolve(value), ms));
    }

    /* 
       Promisifys any Node.js style callback based function which accepts 
       a callback with the given signature: (err,data) => {}
    */
    static vachanify(functor) {
        return (...args) => {
            return new P((resolve, reject) => {
                if (args.length > 0) {
                    functor(...args, (err, data) => err ? reject(err) : resolve(data));
                }
                else functor((err, data) => err ? reject(err) : resolve(data));
            });
        }
    }

    /*
        TODO: Articulation Left 
    */
    constructor(executor, scheduler = vachan.default_type) {
        this.setScheduler(scheduler);
        this.state = vachan.Pending;
        this.value = undefined;
        this.success_handler = [];
        this.failure_handler = [];
        vachan.raiseEvent("Created", { promise: this });
        if (executor) {
            this.executor = executor;
            try {
                const context = {
                    resolve: v => this.resolve(v),
                    reject: e => this.reject(e),
                    cp: this
                };
                this.executor(
                    v => recurHandler(v, context),
                    context.reject,
                    this
                );
                vachan.raiseEvent("ExecutorExecuted", { promise: this, executor: this.executor });
            }
            catch (e) {
                this.reject(e);
                vachan.raiseEvent("ExecutorExecuted", { promise: this, executor: this.executor });
                vachan.raiseEvent("ExecutorThrows", { promise: this, executor: this.executor });
            }
        }
    }

    /*
        This method when invoked on the promise object returns a boolean to the 
        proposition is the given promise fulfilled or not.
    */
    isFulfilled() {
        return this.state === vachan.Fulfilled;
    }

    /*
        This method when invoked on the promise object returns a boolean to the 
        proposition is the given promise rejected or not.
    */
    isRejected() {
        return this.state === vachan.Rejected;
    }

    /*
        This method when invoked on the promise object returns a boolean to the 
        proposition is the given promise pending or not.
    */
    isPending() {
        return this.state === vachan.Pending;
    }

    /*
        This method is for internal not to be accessed by the consumer, but responsible 
        for notifying the attached success handler/s through a given scheduler
        TODO: Dealing with the access issue in the next release.
    */
    resolve(v) {
        if (this.state === vachan.Pending) {
            this.state = vachan.Fulfilled;
            this.value = v;
            for (let handler of this.success_handler) {
                this.queueTask(() => handler(v));
            }
            vachan.raiseEvent("Fulfilled", { promise: this });
        }
    }

    /*
        This method is for internal not to be accessed by the consumer, but responsible 
        for notifying the attached failure handler/s through a given scheduler
        TODO: Dealing with the access issue in the next release.
    */
    reject(e) {
        if (this.state === vachan.Pending) {
            this.state = vachan.Rejected;
            this.value = e;
            for (let handler of this.failure_handler) {
                this.queueTask(() => handler(e));
            }
            vachan.raiseEvent("Rejected", { promise: this });
        }
    }

    /*
        This method allows the consumer set custom scheduler through 
        which either success and failure handlers are scheduled.
    */
    setScheduler(scheduler) {
        this.scheduler = scheduler instanceof Function && typeof scheduler === "function" ? this.custom = true || scheduler : scheduler in vachan.schedulers ? scheduler : vachan.default_type;
        return this;
    }

    /*
        This method is for internal use but this is the method through 
        with resolve/reject queue tasks.
        TODO: Dealing with the access issue in the next release
    */
    queueTask(h) {
        this.custom ? this.scheduler(h) : vachan.schedulers[this.scheduler](h);
        vachan.raiseEvent("HandlerQueued", { promise: this, scheduler: this.scheduler, handler: h });
    }

    /*
        The main method which allows the user to compose, 
        compound and linearize asynchronicity.
    */
    then(s, f) {
        if (typeof (s) !== "function") s = undefined;
        if (typeof (f) !== "function") f = undefined;
        const parasite = new P();
        const context = {
            resolve: v => parasite.resolve(v),
            reject: e => parasite.reject(e),
            cp: parasite
        };
        if (this.state === vachan.Fulfilled) {
            if (s) this.queueTask(() => handler(s, context)(this.value));
            else this.queueTask(() => parasite.resolve(this.value));
            vachan.raiseEvent("Preresolved", { substrate: this, parasite: parasite, handler: s });
        }
        else if (this.state === vachan.Rejected) {
            if (f) this.queueTask(() => handler(f, context)(this.value));
            else this.queueTask(() => parasite.reject(this.value));
            vachan.raiseEvent("Prerejected", { substrate: this, parasite: parasite, handler: f });
        }
        else {
            if (s) this.success_handler.push(handler(s, context));
            else this.success_handler.push(context.resolve);
            if (f) this.failure_handler.push(handler(f, context));
            else this.failure_handler.push(context.reject);
            vachan.raiseEvent("Chained", { substrate: this, parasite: parasite });
        }
        return parasite;
    }

    /*
        An easy chainable way of attaching N handlers to the given promise.
    */ 
    fork(...handlers) {
        return P.all(
            handlers.map(
                h => h instanceof Function ?
                    this.then(h) :
                    this.then(h[0], h[1])
            )
        );
    }

    /*
        Joining and waiting collectively for multiple promises including 
        the promise on which this was invoked.
    */
    join(...promises) {
        return P.all(this, ...promises);
    }

    /*
        This method allows the user to monitor the resolution value 
        without effecting the promise and promise chain.
    */
    tap(s, f) {
        return this.then(
            v => { s ? s(v) : 0; return this; },
            e => { f ? f(e) : 0; return this; }
        );
    }

    /*
        This allows to attach failure handler.
    */
    catch(f) {
        return this.then(undefined, f);
    }

    /*
        This allows to attach a handler which will get
        executed whatever happens ( fulfilled or rejected ).
    */
    finally(h) {
        return this.then(h, h);
    }

    /*
        Allows to chain promises whose resolution is delayed by a given time.
    */
    delay(ms) {
        return new P(
            (resolve, reject) => {
                this.then(
                    v => setTimeout(() => resolve(v), ms),
                    v => setTimeout(() => reject(v), ms)
                );
            }
        );
    }
}
vachan.P = P;

/*
Export
*/
module.exports = vachan;