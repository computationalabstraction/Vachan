/*
Library Object
*/
const vachan = {}

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
vachan.Pending = Symbol('Pending')
vachan.Fulfilled = Symbol('Fulfilled')
vachan.Rejected = Symbol('Rejected')

/*
Promise Internal Symbols -
These symbols should not be visible to the consumer directly.
This should make it difficult (but not impossible) to access internal
promise data and operations from outside can be achieved
but would need reverse engineering using something like
Object.getOwnPropertySymbols() or Reflect API
*/
const resolve = Symbol('Resolve')
const reject = Symbol('Reject')
const successHandler = Symbol('Success Handler')
const failureHandler = Symbol('Failure Handler')
const state = Symbol('State')
const value = Symbol('Value')
const scheduler = Symbol('Scheduler')
const executor = Symbol('Executor')
const custom = Symbol('Custom')
const queueTask = Symbol('Queue Task')
const nothing = Symbol("Nothingness");

/*
Predefined Schedulers or Modes -
Macro Scheduler/Mode: This mode can be implementated either through
                      setTimeout or setImmdiate
Micro Scheduler/Mode: This mode can be implementated only in one way on
                      Node.js and it is through process.nextTick
Sync Scheduler/Mode:  This mode will call the next handler synchronously
                      blocking the thread
*/
vachan.Macro = Symbol('Macro')
vachan.Micro = Symbol('Micro')
vachan.Sync = Symbol('Sync')
vachan.default_type = vachan.Micro

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

TODO: Explore the applicability of use of queueMicrotask method for the browser 
or write a custom polyfill for it.
*/
vachan.schedulers = {}
vachan.schedulers[vachan.Macro] = h => setTimeout(h, 0)
vachan.schedulers[vachan.Micro] = h => process.nextTick(h)
/*
Only for debugging or to be used in a very urgent scenario where the
consequent task/s has/have to be done directly after the async task completes
and cannot wait for excution through async scheduling.
*/
vachan.schedulers[vachan.Sync] = h => h()
Object.seal(vachan.schedulers)

/*
Event Portal -
The default implementation is provided using conciseee package but
any object can be used provided it has emit and on methods.

This implementation is swappable by any object which has
emit and on methods defined.
*/
vachan.realm = require('conciseee')()

/*
Events Defintions -
Events which will be raised on the Event Portal
*/
vachan.events = {}
vachan.events.Created = Symbol('Created')
vachan.events.ExecutorExecuted = Symbol('ExecutorExecuted')
vachan.events.ExecutorThrows = Symbol('ExecutorThrows')
vachan.events.Fulfilled = Symbol('Fulfilled')
vachan.events.Rejected = Symbol('Rejected')
vachan.events.Preresolved = Symbol('Preresolved')
vachan.events.Prerejected = Symbol('Prerejected')
vachan.events.Chained = Symbol('Chained')
vachan.events.HandlerQueued = Symbol('HandlerQueued')
vachan.events.HandlerExecuted = Symbol('HandlerExecuted')
vachan.events.Rechained = Symbol('Rechained')
Object.freeze(vachan.events)

/*
Adapter function to the event portal -
This function is used for loose coupling between the portal and the
internal promise code as the implementation for the portal can be swapped.
*/
vachan.raiseEvent = (eventname, data) => {
  data.event = eventname
  data.timestamp = new Date()
  vachan.realm.emit(eventname, data, true)
}

// Funtional Utils
// Identity
// const I = x => x;
// Autocurrying
// const curry = (f) => {
//     function $internal(...args) {
//         if(args.length < f.length) return $internal.bind(null,...args);
//         return f(...args);
//     };
//     return $internal;
// };
// Function Composition
// const compose = (...f) => x => f.reverse().reduce((acc,f) => f(acc),x);

/*
This function/logic has to be applied on both the resolved value
of a promise and on the return value of a success or reject handler.
*/
const recurHandler = (value, context) => {
  if (value === null) context.resolve(value)
  else if (value === context.cp) context.reject(new TypeError('It cannot return the same Promise'))
  else if (
    value instanceof Object ||
        value instanceof Function ||
        typeof (value) === 'object' ||
        typeof (value) === 'function'
  ) {
    let rcalled = false
    let recalled = false
    try {
      const then = value.then
      if (then !== undefined && (then instanceof Function && typeof (then) === 'function')) {
        then.call(value, v => {
          if (!rcalled && !recalled) recurHandler(v, context)
          rcalled = true
        }, e => {
          if (!rcalled && !recalled) context.reject(e)
          recalled = true
        })
        vachan.raiseEvent(vachan.events.Rechained, { value: value, promise: context.cp })
      } else {
        context.resolve(value)
      }
    } catch (e) {
      if (!rcalled && !recalled) context.reject(e)
    }
  } else {
    context.resolve(value)
  }
}

/*
This is a universal wrapper which wraps every success and reject handler
*/
const handler = (f, context) => (v) => {
  try {
    recurHandler(f(v), context)
  } catch (e) {
    context.reject(e)
  }
  vachan.raiseEvent(vachan.events.HandlerExecuted, { promise: context.cp, handler: f })
}

/*
Promise class
*/
class P {
  /*
        Creating a preresolved Promise
    */
  static resolve (v) {
    return new P((resolve) => resolve(v))
  }

  /*
        Creating a prerejected Promise
    */
  static reject (e) {
    return new P((resolve, reject) => reject(e))
  }

  /*
        Accepts an array or varargs of promises and returns a
        promise which waits for all the promises sent to get resolved
        if all are fulfilled then it will fulfill with an array which will
        contain all the fulfilled values of promises sent and even if one
        of the passed promises rejects then it will reject with the reason.
    */
  static all (...p) {
    if (p.length === 1 && Array.isArray(p[0])) p = p[0]
    return new P(
      (resolve, reject) => {
        let fullilled = 0
        const values = []
        const check = _ => fullilled === p.length ? resolve(values) : 0
        const handler = v => ++fullilled && values.push(v) && check()
        const rejHandler = e => reject(e)
        for (const prom of p) prom.then(handler, rejHandler)
      }
    )
  }

  /*
        Accepts an array or varargs of promises and returns a
        promise which waits for the first promise of all the
        promises (all promises race and the first one to get
        resolve wins) sent to get resolved and will either
        fulfill or reject with the same value or reason.
    */
  static race (...p) {
    if (p.length === 1 && Array.isArray(p[0])) p = p[0]
    return new P(
      (resolve, reject) => {
        let done = false
        const handler = v => !done ? (done = true) && resolve(v) : 0
        const rejHandler = e => reject(e)
        for (const prom of p) prom.then(handler, rejHandler)
      }
    )
  }

  /*
        Accepts an array or varargs of promises and returns a
        promise which waits for any one promise of all the
        promises (any one successful fulfillment) sent to get
        fulfilled and then fulfill the consequent promise or
        wait for all the promises to get rejected and reject
        the consequent promise with array of reasons.
    */
  static any (...p) {
    if (p.length === 1 && Array.isArray(p[0])) p = p[0]
    return new P(
      (resolve, reject) => {
        let rejected = 0
        let done = false
        const errors = []
        const check = _ => rejected === p.length ? reject(errors) : 0
        const handler = v => !done ? (done = true) && resolve(v) : 0
        const rejHandler = e => ++rejected && errors.push(e) && check()
        for (const prom of p) prom.then(handler, rejHandler)
      }
    )
  }

  /*
        Accepts an array or varargs of promises and returns a
        promise which waits for all of them to get resolved and
        then resolves the consequent promise but with no values.
    */
  static allSettled (...p) {
    if (p.length === 1 && Array.isArray(p[0])) p = p[0]
    return new P(
      (resolve, reject) => {
        let settled = 0
        const handler = v => ++settled && (settled === p.length ? resolve() : 0)
        for (const prom of p) prom.then(handler, handler)
      }
    )
  }

  /*
       Creates and returns a new promise but delays its resolution with
       the passed value for the given milleseconds.
    */
  static delay (value, ms) {
    return new P((resolve) => setTimeout(() => resolve(value), ms))
  }

  /*
       Promisifys any Node.js style callback based function which accepts
       a callback with the given signature: (err,data) => {}
    */
  static vachanify (functor) {
    return (...args) => {
      return new P((resolve, reject) => {
        if (args.length > 0) {
          functor(...args, (err, data) => err ? reject(err) : resolve(data))
        } else functor((err, data) => err ? reject(err) : resolve(data))
      })
    }
  }

  /*
        TODO: Articulation Left
    */
  constructor (executorFunc, scheduler = vachan.default_type) {
    this[state] = vachan.Pending
    this.setScheduler(scheduler)
    this[value] = undefined
    this[successHandler] = []
    this[failureHandler] = []
    vachan.raiseEvent(vachan.events.Created, { promise: this })
    if (executorFunc && executorFunc instanceof Function && typeof executorFunc === 'function') {
      this[executor] = executorFunc
      try {
        const context = {
          resolve: v => this[resolve](v),
          reject: e => this[reject](e),
          cp: this
        }
        this[executor](
          v => recurHandler(v, context),
          context.reject,
          this
        )
        vachan.raiseEvent(vachan.events.ExecutorExecuted, { promise: this, executor: this[executor] })
      } catch (e) {
        this[reject](e)
        vachan.raiseEvent(vachan.events.ExecutorExecuted, { promise: this, executor: this[executor] })
        vachan.raiseEvent(vachan.events.ExecutorThrows, { promise: this, executor: this[executor] })
      }
    }
  }

  /*
        This method when invoked on the promise object returns a boolean to the
        proposition is the given promise fulfilled or not.
    */
  isFulfilled () {
    return this[state] === vachan.Fulfilled
  }

  /*
        This method when invoked on the promise object returns a boolean to the
        proposition is the given promise rejected or not.
    */
  isRejected () {
    return this[state] === vachan.Rejected
  }

  /*
        This method when invoked on the promise object returns a boolean to the
        proposition is the given promise pending or not.
    */
  isPending () {
    return this[state] === vachan.Pending
  }

  resultant () {
    this.isPending() ? 
    this.then(v => v instanceof internalSemigroup? v.vals:v) : 
    this[value] instanceof internalSemigroup? this[value].vals: this[value];
  }

  /*
        This method is for internal not to be accessed by the consumer, but responsible
        for notifying the attached success handler/s through a given scheduler
    */
  [resolve] (v) {
    if (this[state] === vachan.Pending) {
      this[state] = vachan.Fulfilled
      this[value] = v
      for (const handler of this[successHandler]) {
        this[queueTask](() => handler(v))
      }
      vachan.raiseEvent(vachan.events.Fulfilled, { promise: this })
    }
  }

  /*
        This method is for internal not to be accessed by the consumer, but responsible
        for notifying the attached failure handler/s through a given scheduler
    */
  [reject] (e) {
    if (this[state] === vachan.Pending) {
      this[state] = vachan.Rejected
      this[value] = e
      for (const handler of this[failureHandler]) {
        this[queueTask](() => handler(e))
      }
      vachan.raiseEvent(vachan.events.Rejected, { promise: this })
    }
  }

  /*
        This method allows the consumer set custom scheduler through
        which either success and failure handlers are scheduled.
    */
  setScheduler (newScheduler) {
    if (this[state] === vachan.Pending) {
      if (newScheduler instanceof Function && typeof newScheduler === 'function') {
        this[custom] = true
        this[scheduler] = newScheduler
      } else if (newScheduler in vachan.schedulers) this[scheduler] = newScheduler
    }
    return this
  }

  /*
        This method is for internal use but this is the method through
        with resolve/reject queue tasks.
    */
  [queueTask] (h) {
    this[custom] ? this[scheduler](h) : vachan.schedulers[this[scheduler]](h)
    vachan.raiseEvent(vachan.events.HandlerQueued, { promise: this, scheduler: this[scheduler], handler: h })
  }

  /*
        The main method which allows the user to compose,
        compound and linearize asynchronicity.
    */
  then (s, f) {
    if (typeof (s) !== 'function') s = undefined
    if (typeof (f) !== 'function') f = undefined
    const parasite = new P()
    const context = {
      resolve: v => parasite[resolve](v),
      reject: e => parasite[reject](e),
      cp: parasite
    }
    if (this[state] === vachan.Fulfilled) {
      if (s) this[queueTask](() => handler(s, context)(this[value]))
      else this[queueTask](() => parasite[resolve](this[value]))
      vachan.raiseEvent(vachan.events.Preresolved, { substrate: this, parasite: parasite, handler: s })
    } else if (this[state] === vachan.Rejected) {
      if (f) this[queueTask](() => handler(f, context)(this[value]))
      else this[queueTask](() => parasite[reject](this[value]))
      vachan.raiseEvent(vachan.events.Prerejected, { substrate: this, parasite: parasite, handler: f })
    } else {
      if (s) this[successHandler].push(handler(s, context))
      else this[successHandler].push(context.resolve)
      if (f) this[failureHandler].push(handler(f, context))
      else this[failureHandler].push(context.reject)
      vachan.raiseEvent(vachan.events.Chained, { substrate: this, parasite: parasite })
    }
    return parasite
  }

  /*
        An easy chainable way of attaching N handlers to the given promise.
    */
  fork (...handlers) {
    return P.all(
      handlers.map(
        h => h instanceof Function
          ? this.then(h)
          : this.then(h[0], h[1])
      )
    )
  }

  /*
        Joining and waiting collectively for multiple promises including
        the promise on which this was invoked.
    */
  join (...promises) {
    return P.all(this, ...promises)
  }

  /*
        This method allows the user to monitor the resolution value
        without effecting the promise and promise chain.
    */
  tap (s, f) {
    return this.then(
      v => { if (s)s(v); return this },
      e => { if (f)f(e); return this }
    )
  }

  /*
        This allows to attach failure handler.
    */
  catch (f) {
    return this.then(undefined, f)
  }

  /*
        This allows to attach a handler which will get
        executed whatever happens ( fulfilled or rejected ).
    */
  finally (h) {
    return this.then(h, h)
  }

  /*
        Allows to chain promises whose resolution is delayed by a given time.
    */
  delay (ms) {
    return new P(
      (resolve, reject) => {
        this.then(
          v => setTimeout(() => resolve(v), ms),
          v => setTimeout(() => reject(v), ms)
        )
      }
    )
  }

  // x = Tested
  // ~ = Compatibility WIP (May not be included)
  // Fantasy Land and Static Land---------------------------------------
  // + Semigroup x
  // + Monoid x
  // + Apply x
  // + Applicative x
  // + Alt x
  // + Plus x
  // + Alternative x
  // + Chain x
  // + Monad x
  // + Functor x
  // + Bifunctor x
  // + Filterable x
  // + Semigroupoid ~
  // + Category ~
  // + Setoid(*Not Exactly)
  // --------------------------------------------------------------------

  equals(promise) {
    if(this.isPending() || promise.isPending()) {
        let handler = i => promise.then(j => i === j,j => i === j)
        return this.then(handler,handler)
    }
    return this.resultant() === promise.resultant()
  }

  map (h) {
    return this['fantasy-land/map'](h)
  }

  bimap (s, f) {
    return this['fantasy-land/bimap'](s, f)
  }

  ap (promise) {
    return this['fantasy-land/ap'](promise)
  }

  alt(promise) {
    return this['fantasy-land/alt'](promise)
  }

  chain(h) {
      return this['fantasy-land/chain'](h);
  }

  unwrap() {
    return this.then(v => v instanceof internalSemigroup?v.vals:v);
  }

  concat(promise) {
    return this['fantasy-land/concat'](promise);
  }

  filter(h) {
    return this['fantasy-land/filter'](h);
  }

//   shortcircuit(cond,h1,h2) { 
//     return this.filter(cond).then(h1,h2);
//   }

//   compose(promise) {
//     return this['fantasy-land/compose'](promise); 
//   }

  static ['fantasy-land/of'](v) {
    return P.resolve(v);
  }

  static of(v) {
    return P['fantasy-land/of'](v);
  }

  static ['fantasy-land/id']() {
    return P.resolve(I);
  }

  static id() {
    return P['fantasy-land/id']();
  }

  static ['fantasy-land/zero']() {
    return P.reject(nothing);
  }

  static zero() {
    return P['fantasy-land/zero'](); 
  }

  static ['fantasy-land/empty']() {
    return P.resolve(nothing);
  }

  static empty() {
    return P['fantasy-land/empty'](); 
  }
}

P.prototype['fantasy-land/map'] = function (f) {
  if (f instanceof Function && typeof f === 'function') {
    return this.then(f)
  }
  return this
}

P.prototype['fantasy-land/bimap'] = function (f1, f2) {
  if (f1 instanceof Function && typeof f1 === 'function' && f2 instanceof Function && typeof f2 === 'function') {
    return this.then(f1, f2)
  }
  return this
}

P.prototype['fantasy-land/ap'] = function (p) {
  return this.then(
    a => p.then(f => f instanceof Function && typeof f === 'function' ? f(a) : P.zero())
  )
}

P.prototype['fantasy-land/alt'] = function (p) {
   return this.then(v => v,e => p);
}

P.prototype['fantasy-land/chain'] = function (f) {
    return f instanceof Function && typeof f === 'function' ? this.then(f): this;
}

function internalSemigroup(...initial) {
    this.vals = [...initial];
}

internalSemigroup.prototype.concat = function(...v) {
    this.vals.push(...v);
    return this;
}

P.prototype['fantasy-land/concat'] = function (p) {
    return this.then(x => p.then(y => {
        let o = new internalSemigroup()
        let i = false;
        x instanceof internalSemigroup? o.concat(...(x.vals)): x !== nothing? o.concat(x): i=y;
        y instanceof internalSemigroup? o.concat(...(y.vals)): y !== nothing? o.concat(y): i=x;
        return i?i:o
    }))
}

P.prototype['fantasy-land/filter'] = function (f) {
    return this.then(v => f(v) ? v : P.zero());
} 

// P.prototype['fantasy-land/compose'] = function (f) {
//     return this.then(v => f(v) ? v : P.resolve(undefined));
// } 

// Pure Functional Definitions for Static Land
// Will use existing Fantasy Land methods and write a wrapper
// WIP

vachan.P = P

/*
Export
*/
for (const key of Object.keys(vachan)) {
  if (key !== 'realm' && key !== 'default_type') {
    Object.defineProperty(vachan, key, {
      configurable: false,
      writable: false
    })
  }
}
module.exports = vachan
