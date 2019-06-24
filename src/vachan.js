const vachan = {};
vachan.Pending = Symbol("Pending");
vachan.Fulfilled = Symbol("Fulfilled");
vachan.Rejected = Symbol("Rejected");
vachan.Macro = Symbol("Macro");
vachan.Micro = Symbol("Micro");
vachan.Sync = Symbol("Sync");
vachan.default_type = vachan.Micro;
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