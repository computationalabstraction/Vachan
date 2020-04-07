const fs = require("fs");
const v = require("../src/vachan");
const P = v.P;

test('P.vachanify', () => {
    let read = P.vachanify(fs.readFile);
    let temp = P.vachanify((cb)=>{cb(true,null)});
    return Promise.all([
        expect(read("./__tests__/one.txt").then(data => data.toString())).resolves.toMatch("hello world"),
        expect(read("xyz.txt")).rejects.toThrow(/ENOENT: no such file or directory/),
        expect(read("./__tests__/one.txt").setScheduler(v.Macro).then(data => data.toString())).resolves.toMatch("hello world"),
        expect(temp().then()).rejects.toBe(true)
    ]);
});

test('P.all', () => {
    let resolves = [];

    // Microtask
    let p1 = P.delay(10, 100);
    let p2 = P.delay(20, 200);
    let p3 = P.delay(30, 300);
    resolves.push(expect(P.all(p1, p2, p3)).resolves.toEqual([10, 20, 30]));
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100));
    p2 = P.delay(20, 200);
    p3 = P.delay(30, 300);
    resolves.push(expect(P.all([p1, p2, p3])).rejects.toMatch(/Failed/))

    // Macrotask
    p1 = P.delay(10, 100).setScheduler(v.Macro);
    p2 = P.delay(20, 200).setScheduler(v.Macro);
    p3 = P.delay(30, 300).setScheduler(v.Macro);
    resolves.push(expect(P.all(p1, p2, p3)).resolves.toEqual([10, 20, 30]));
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100)).setScheduler(v.Macro);
    p2 = P.delay(20, 200).setScheduler(v.Macro);
    p3 = P.delay(30, 300).setScheduler(v.Macro);
    resolves.push(expect(P.all([p1, p2, p3])).rejects.toMatch(/Failed/))

    // Final
    return Promise.all(resolves);
});

test('P.race', () => {
    let resolves = [];

    // Microtask
    let p1 = new P((resolve) => setTimeout(() => resolve(10), 100));
    let p2 = new P((resolve) => setTimeout(() => resolve(20), 200));
    let p3 = new P((resolve) => setTimeout(() => resolve(30), 300));
    resolves.push(expect(P.race(p1, p2, p3)).resolves.toBe(10));
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100));
    p2 = new P((resolve) => setTimeout(() => resolve(10), 300));
    p3 = new P((resolve) => setTimeout(() => resolve(30), 300));
    resolves.push(expect(P.race([p1, p2, p3])).rejects.toMatch(/Failed/))

    // Macrotask
    p1 = new P((resolve) => setTimeout(() => resolve(10), 100)).setScheduler(v.Macro);
    p2 = new P((resolve) => setTimeout(() => resolve(20), 200)).setScheduler(v.Macro);
    p3 = new P((resolve) => setTimeout(() => resolve(30), 300)).setScheduler(v.Macro);
    resolves.push(expect(P.race(p1, p2, p3)).resolves.toBe(10));
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100)).setScheduler(v.Macro);
    p2 = new P((resolve) => setTimeout(() => resolve(10), 300)).setScheduler(v.Macro);
    p3 = new P((resolve) => setTimeout(() => resolve(30), 300)).setScheduler(v.Macro);
    resolves.push(expect(P.race([p1, p2, p3])).rejects.toMatch(/Failed/))

    // Final
    return Promise.all(resolves);
});

test('P.any', () => {
    let resolves = [];

    // Microtask
    let p1 = P.delay(10, 100);
    let p2 = P.delay(20, 200);
    let p3 = P.delay(30, 300);
    resolves.push(expect(P.any(p1, p2, p3)).resolves.toBe(10));
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100));
    p2 = P.delay(20, 200);
    p3 = P.delay(30, 300);
    resolves.push(expect(P.any([p1, p2, p3])).resolves.toBe(20));
    resolves.push(expect(P.any([P.reject(10), P.reject(20)])).rejects.toEqual([10, 20]));

    // Macrotask
    p1 = P.delay(10, 100).setScheduler(v.Macro);
    p2 = P.delay(20, 200).setScheduler(v.Macro);
    p3 = P.delay(30, 300).setScheduler(v.Macro);
    resolves.push(expect(P.any(p1, p2, p3)).resolves.toBe(10));
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100)).setScheduler(v.Macro);
    p2 = P.delay(20, 200).setScheduler(v.Macro);
    p3 = P.delay(30, 300).setScheduler(v.Macro);
    resolves.push(expect(P.any([p1, p2, p3])).resolves.toBe(20));

    // Final
    return Promise.all(resolves);
});

test('P.allSettled', () => {
    let resolves = [];

    // Microtask
    let p1 = P.delay(10, 100);
    let p2 = P.delay(20, 200);
    let p3 = P.delay(30, 300);
    resolves.push(expect(P.allSettled(p1, p2, p3)).resolves);
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100));
    p2 = P.delay(20, 200);
    p3 = P.delay(30, 300);
    resolves.push(expect(P.allSettled([p1, p2, p3])).resolves);

    // Macrotask
    p1 = P.delay(10, 100).setScheduler(v.Macro);
    p2 = P.delay(20, 200).setScheduler(v.Macro);
    p3 = P.delay(30, 300).setScheduler(v.Macro);
    resolves.push(expect(P.allSettled(p1, p2, p3)).resolves);
    p1 = new P((resolve, reject) => setTimeout(() => reject("Failed"), 100)).setScheduler(v.Macro);
    p2 = P.delay(20, 200).setScheduler(v.Macro);
    p3 = P.delay(30, 300).setScheduler(v.Macro);
    resolves.push(expect(P.allSettled([p1, p2, p3])).resolves);

    // Final
    return Promise.all(resolves);
});

test('P.resolve', () => {
    let resolves = [];

    // Microtask
    resolves.push(expect(P.resolve(10)).resolves.toBe(10));
    resolves.push(expect(P.resolve("hello")).resolves.toMatch("hello"));
    resolves.push(expect(P.resolve({ x: 10, y: 20 })).resolves.toEqual({ x: 10, y: 20 }));

    // Macrotask
    resolves.push(expect(P.resolve(10).setScheduler(v.Macro)).resolves.toBe(10));
    resolves.push(expect(P.resolve("hello").setScheduler(v.Macro)).resolves.toMatch("hello"));
    resolves.push(expect(P.resolve({ x: 10, y: 20 }).setScheduler(v.Macro)).resolves.toEqual({ x: 10, y: 20 }));

    // Final
    return P.all(resolves);
});

test('P.reject', () => {
    let resolves = [];

    // Microtask
    resolves.push(expect(P.reject(10)).rejects.toBe(10));
    resolves.push(expect(P.reject("hello")).rejects.toMatch("hello"));
    resolves.push(expect(P.reject({ x: 10, y: 20 })).rejects.toEqual({ x: 10, y: 20 }));

    // Macrotask
    resolves.push(expect(P.reject(10).setScheduler(v.Macro)).rejects.toBe(10));
    resolves.push(expect(P.reject("hello").setScheduler(v.Macro)).rejects.toMatch("hello"));
    resolves.push(expect(P.reject({ x: 10, y: 20 }).setScheduler(v.Macro)).rejects.toEqual({ x: 10, y: 20 }));

    return P.all(resolves);
});

test('P.delay', () => {
    let resolves = [];

    // Microtask
    resolves.push(expect(P.delay(10, 100)).resolves.toBe(10))
    resolves.push(expect(P.delay("hello", 200)).resolves.toMatch("hello"))
    resolves.push(expect(P.delay({ x: 10, y: 20 }, 300)).resolves.toEqual({ x: 10, y: 20 }))

    // Macrotask
    resolves.push(expect(P.delay(10, 100).setScheduler(v.Macro)).resolves.toBe(10))
    resolves.push(expect(P.delay("hello", 200).setScheduler(v.Macro)).resolves.toMatch("hello"))
    resolves.push(expect(P.delay({ x: 10, y: 20 }, 300).setScheduler(v.Macro)).resolves.toEqual({ x: 10, y: 20 }))

    // Final
    return P.all(resolves);
});

test('P.prototype.isFulfilled', () => {
    expect(P.resolve(10).isFulfilled()).toBeTruthy();
    expect(P.resolve(20).isFulfilled()).toBeTruthy();
    expect(P.resolve(null).isFulfilled()).toBeTruthy();
    expect(P.resolve({ x: 10, y: 20 }).isFulfilled()).toBeTruthy();
});

test('P.prototype.isRejected', () => {
    expect(P.reject(10).isRejected()).toBeTruthy();
    expect(P.reject(20).isRejected()).toBeTruthy();
    expect(P.reject(null).isRejected()).toBeTruthy();
    expect(P.reject({ x: 10, y: 20 }).isRejected()).toBeTruthy();
});

test('P.prototype.isPending', () => {
    expect(new P().isPending()).toBeTruthy();
});

test('P.prototype.catch', () => {
    let resolves = [];
    resolves.push(expect(P.reject(10).catch(e => e)).resolves.toBe(10));
    resolves.push(expect(P.reject(20).catch(e => e)).resolves.toBe(20));
    resolves.push(expect(P.reject(null).catch(e => e)).resolves.toBe(null));
    return Promise.all(resolves)
});

test('P.prototype.tap', () => {
    let resolves = [];
    resolves.push(expect(P.resolve(10).tap(console.log, console.log)).resolves.toBe(10));
    resolves.push(expect(P.reject(20).tap(console.log, console.log)).rejects.toBe(20));
    resolves.push(expect(P.resolve(null).tap(console.log, console.log)).resolves.toBe(null));
    return Promise.all(resolves)
});

test('P.prototype.finally', () => {
    let resolves = [];
    resolves.push(expect(P.reject(10).finally(e => e)).resolves.toBe(10));
    resolves.push(expect(P.resolve(20).finally(e => e)).resolves.toBe(20));
    resolves.push(expect(P.reject(null).finally(e => e)).resolves.toBe(null));
    return Promise.all(resolves)
});

test('P.prototype.delay', () => {
    let resolves = [];
    resolves.push(expect(P.resolve(10).delay(100)).resolves.toBe(10))
    resolves.push(expect(P.resolve("hello").delay(100)).resolves.toMatch("hello"))
    resolves.push(expect(P.resolve({ x: 10, y: 20 }).delay(100)).resolves.toEqual({ x: 10, y: 20 }))
    return P.all(resolves);
});

test('P.prototype.join', () => {
    let resolves = [];
    resolves.push(expect(
        P.resolve(10).delay(100)
            .join(P.resolve("hello").delay(200))
    ).resolves.toEqual([10, "hello"]));
    resolves.push(expect(
        P.resolve("hello").delay(100)
            .join(P.resolve({ x: 10, y: 20 }).delay(200))
    ).resolves.toEqual(["hello", { x: 10, y: 20 }]));
    return P.all(resolves);
});

test('P.prototype.fork', () => {
    let resolves = [];
    resolves.push(expect(
        P.resolve(10).fork(v => v + 1, v => v + 2, v => v + 3, v => v + 4)
    ).resolves.toEqual([11, 12, 13, 14]));
    resolves.push(expect(
        P.resolve(10).fork([v => v,v => v],[v => v,v => v])
    ).resolves.toEqual([10,10]));
    resolves.push(expect(
        P.reject(10).fork([v => v,v => v],[v => v,v => v])
    ).resolves.toEqual([10,10]));
    return P.all(resolves);
});

test('P.prototype.map', () => {
    let p = [];
    // Fantasy Land Laws - Functor
    // Law 1 - Identity
    // I(x) == x
    let p1 = P.resolve(10);
    let p2 = p1.map(v => v);
    p.push(
        expect(P.all(p1,p2).then(v => v[0] == v[1]))
        .resolves.toBe(true)
    );
    // Law 2 - Consistent Composition
    // x.map(i => f(g(i))) == x.map(g).map(f)
    let f = x => x + 10;
    let g = x => x * 2;
    p.push(
        expect(P.all(p1.map(v => f(g(v))),p1.map(g).map(f)))
        .resolves.toEqual([30,30])
    );
    return P.all(p);
});

test('P.prototype.bimap', () => {
    let p = [];
    // Fantasy Land Laws - Bifunctor
    // Law 1 - Identity
    // I(x) == x
    let I = v => v;
    let p1 = P.resolve(10);
    let p2 = p1.bimap(I,I);
    let p3 = P.reject(10);
    let p4 = p3.bimap(I,I);
    p.push(
        expect(P.all(p1,p2).then(v => v[0] == v[1]))
        .resolves.toBe(true)
    );
    p.push(
        expect(P.any(p3,p4))
        .resolves.toBe(10)
    );
    // Law 2 - Consistent Composition
    // x.bimap(i => f(g(i)),j => a(b(j))) == x.bimap(g,b).bimap(f,a)
    let f = x => x + 10;
    let g = x => x * 2;
    p.push(
        expect(
            P.all(
                p1.bimap(v => f(g(v)),I),
                p1.bimap(g,I).then(f,I),
            )
        )
        .resolves.toEqual([30,30])
    );
    p.push(
        expect(
            P.any(
                p3.bimap(I,v => f(g(v))),
                p3.bimap(I,g).bimap(I,f)
            )
        )
        .resolves.toEqual(30)
    );
    return P.all(p);
});

test('P.prototype.ap', () => {
    let p = [];
    // Fantasy Land Laws - Apply
    // Law Composition
    let I = x => x;
    let a = P.resolve(I);
    let u = P.resolve(I);
    let v = P.resolve(20);
    p.push(expect(v.ap(u.ap(a.map(f => g => x => f(g(x)))))).resolves.toBe(20));
    p.push(expect(v.ap(u).ap(a)).resolves.toBe(20));
    return P.all(p);
});

test('P.of', () => {
    let p = [];
    // Fantasy Land Laws - Applicative
    // Law 1 - Identity
    // I(x) == x
    let I = x => x;
    let v = P.of(10);
    let a = P.of(I);
    p.push(expect(v.ap(a)).resolves.toBe(10));
    // Law 2 - Homomorphism
    p.push(expect(P.all(v.ap(a),P.of(I(10)))).resolves.toEqual([10,10]));
    // Law 3 - Interchange
    p.push(expect(P.all(v.ap(a),a.ap(P.of(f => f(10))))).resolves.toEqual([10,10]))
    return P.all(p);
});

test('P.prototype.alt', () => {
    let p = [];
    // Fantasy Land Laws - Alt
    // Law - Associativity
    let I = x => x;
    let a = P.reject(10);
    let b = P.reject(20);
    let c = P.resolve(30);
    p.push(expect(a.alt(b).alt(c)).resolves.toBe(30));
    p.push(expect(a.alt(b.alt(c))).resolves.toBe(30));
    // Law - Distributivity 
    p.push(expect(a.alt(c).map(x => x*x)).resolves.toBe(900));
    p.push(expect(a.map(x => x*x).alt(c.map(x => x*x))).resolves.toBe(900));  
    return P.all(p);
});

test('P.prototype.chain', () => {
    let p = [];
    // Fantasy Land Laws - Chain
    // Law - Associativity
    let I = x => x;
    let a = P.resolve(10);
    p.push(expect(a.chain(P.resolve).chain(I)).resolves.toBe(10));
    p.push(expect(a.chain(x => P.resolve(x).chain(I))).resolves.toBe(10));
    return P.all(p);
});

test('P.zero', () => {
    let p = [];
    // Fantasy Land Laws - Plus
    // Law - Right Identity
    let a = P.resolve(30);
    p.push(expect(a.alt(P.zero())).resolves.toBe(30));
    // Law - Left Identity
    p.push(expect(P.zero().alt(a)).resolves.toBe(30));
    // Law - Annihilation 
    p.push(expect(P.zero().map(x => x).equals(P.zero())).resolves.toBe(true));
    return P.all(p);
});

test('P.prototype.concat', () => {
    let p = [];
    // Fantasy Land Laws - Semigroup
    // Law - Associativity
    let a = P.resolve(10);
    let b = P.resolve(20);
    let c = P.resolve(30);
    p.push(expect(a.concat(b).concat(c).unwrap()).resolves.toEqual([10,20,30]));
    p.push(expect(a.concat(b.concat(c)).unwrap()).resolves.toEqual([10,20,30]));
    return P.all(p);
});

test('P.empty', () => {
    let p = [];
    // Fantasy Land Laws - Monoid
    let a = P.of(10);
    // Law - Left Identity
    p.push(expect(a.concat(P.empty())).resolves.toBe(10));
    // Law - Right Identity
    p.push(expect(P.empty().concat(a)).resolves.toBe(10));
    return P.all(p);
});

// Next Test Filter******

test('P.prototype.filter', () => {
    let p = [];
    // Fantasy Land Laws - Filter 
    let c1 = x => x == 10;
    let c2 = x => x < 20;
    let a = P.resolve(10);
    let b = P.resolve(10);
    // Law - Distributivity
    p.push(expect(a.filter(v => c1(v) && c2(v))).resolves.toBe(10));
    p.push(expect(a.filter(c1).filter(c2)).resolves.toBe(10));
    // Law - Identity
    p.push(expect(a.filter(x => true)).resolves.toBe(10));
    // Law - Annihilation
    p.push(expect(a.filter(x => false).equals(b.filter(x => false))).resolves.toBe(true));
    return P.all(p);
});

test('Alternative Test', () => {
    let p = [];
    // Fantasy Land Laws - Alternative
    let I = x => x;
    let a = P.resolve(10);
    let f = P.reject(I);
    let g = P.resolve(I);
    // Law - Distributivity
    p.push(expect(a.ap(f.alt(g))).resolves.toBe(10));
    p.push(expect(a.ap(f).alt(a.alt(g))).resolves.toBe(10));
    // Law - Annihilation 
    p.push(expect(P.zero().equals(a.ap(P.zero()))).resolves.toBe(true));
    return P.all(p);
});

test('Monad Test', () => {
    let p = [];
    // Fantasy Land Laws - Monad
    let I = x => x;
    let a = P.of(10);
    // Law - Left Identity
    p.push(expect(a.chain(I)).resolves.toBe(10));
    // Law - Right Identity
    p.push(expect(a.chain(P.of)).resolves.toBe(10));
    return P.all(p);
});

test('Edge Cases', () => {
    let resolves = [];
    resolves.push(expect(new P((r, re, cp) => r(cp))).rejects.toThrow(/It cannot return the same Promise/));
    resolves.push(expect(P.resolve(P.resolve(10))).resolves.toBe(10));
    resolves.push(expect(P.resolve(P.reject(10))).rejects.toBe(10));
    resolves.push(expect(P.resolve(Promise.resolve(10))).resolves.toBe(10));
    resolves.push(expect(P.resolve(Promise.reject(10))).rejects.toBe(10));
    resolves.push(expect(P.resolve(10).then()).resolves.toBe(10));
    resolves.push(expect(P.reject(10).then()).rejects.toBe(10));
    resolves.push(expect(P.resolve(10).delay(100).then()).resolves.toBe(10));
    resolves.push(expect(P.reject(10).delay(100).then()).rejects.toBe(10));
    resolves.push(expect(new P(() => { throw new Error("Error case"); })).rejects.toThrow(/Error case/));
    resolves.push(expect(P.resolve({
        then() {
            throw new Error("Testing Edge Case in recurhandler");
        }
    })).rejects.toThrow("Testing Edge Case in recurhandler"));
    resolves.push(expect(P.vachanify((cb) => cb(null, null))().then(() => { })).resolves.toBe(undefined));
    resolves.push(expect(P.resolve(10).then(() => { throw new Error(); })).rejects.toThrow());
    resolves.push(expect(new P((re,rj,cp)=>{cp.setScheduler(f=>f());re(10)}).then()).resolves.toBe(10))
    return P.all(resolves);
});