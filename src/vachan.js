const vachan = {};
vachan.Pending = Symbol("Pending");
vachan.Fulfilled = Symbol("Fulfilled");
vachan.Rejected = Symbol("Rejected");
vachan.Macro = Symbol("Macro");
vachan.Micro = Symbol("Micro");
vachan.Sync = Symbol("Sync");
vachan.default_type = vachan.Micro;
vachan.realm = (require("conciseee"))();

let schedulers = {};
schedulers[vachan.Macro] = h => setTimeout(h,0); 
schedulers[vachan.Micro] = h => process.nextTick(h);
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
            if(rcalled || recalled) {}
            else context.reject(e);
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
        this.scheduler = scheduler instanceof Function && typeof scheduler === "function"?this.custom = true||scheduler:scheduler in schedulers?scheduler:vachan.default_type;
        this.state = vachan.Pending;
        this.value = undefined;
        this.success_handler = [];
        this.failure_handler = [];
        if(executor)
        {
            this.executor = executor;
            this.executor( 
                v => this.resolve(v), 
                v => this.reject(v),
                this
            );
        }
        vachan.realm.emit("Created",{promise:this});
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
            vachan.realm.emit("Fulfilled",{promise:this});
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
            vachan.realm.emit("Rejected",{promise:this});
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
        vachan.realm.emit("TaskQueued",{promise:this,scheduler:this.scheduler,handler:h});
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
            vachan.realm.emit("Preresolved",{substrate:this,parasite:parasite,handler:s});
        }
        else if(this.state === vachan.Rejected)
        {
            if(f) this.queueTask(() => handler(f,context)(this.value));
            else this.queueTask(() => parasite.reject(this.value));
            vachan.realm.emit("Prerejected",{substrate:this,parasite:parasite,handler:f});
        }
        else
        {
            if(s) this.success_handler.push(handler(s,context));
            else this.success_handler.push(context.resolve);
            if(f) this.failure_handler.push(handler(f,context));
            else this.failure_handler.push(context.reject);
            vachan.realm.emit("Chained",{substrate:this,parasite:parasite});
        }
        return parasite;
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