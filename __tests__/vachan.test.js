const fs = require("fs");
const promisesAplusTests = require("promises-aplus-tests");
const v = require("../src/vachan");
const P = v.P;

test('P.vachanify', () => {
    let read = P.vachanify(fs.readFile);
    return Promise.all([
        expect(read("./__tests__/one.txt").then(data=>data.toString())).resolves.toMatch("hello world"),
        expect(read("xyz.txt")).rejects.toThrow(/ENOENT: no such file or directory/),
        expect(read("./__tests__/one.txt").setScheduler(v.Macro).then(data=>data.toString())).resolves.toMatch("hello world"),
    ]);
});

test('P.all', () => {
    let resolves = [];

    // Microtask
    let p1 = P.delay(10,100);
    let p2 = P.delay(20,200);
    let p3 = P.delay(30,300);
    resolves.push(expect(P.all(p1,p2,p3)).resolves.toEqual([10,20,30]));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = P.delay(20,200);
    p3 = P.delay(30,300);
    resolves.push(expect(P.all([p1,p2,p3])).rejects.toMatch(/Failed/))

    // Macrotask
    p1 = P.delay(10,100).setScheduler(v.Macro);
    p2 = P.delay(20,200).setScheduler(v.Macro);
    p3 = P.delay(30,300).setScheduler(v.Macro);
    resolves.push(expect(P.all(p1,p2,p3)).resolves.toEqual([10,20,30]));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100)).setScheduler(v.Macro);
    p2 = P.delay(20,200).setScheduler(v.Macro);
    p3 = P.delay(30,300).setScheduler(v.Macro);
    resolves.push(expect(P.all([p1,p2,p3])).rejects.toMatch(/Failed/))

    // Final
    return Promise.all(resolves);
});

test('P.race', () => {
    let resolves = [];

    // Microtask
    let p1 = new P((resolve) => setTimeout(()=>resolve(10),100));
    let p2 = new P((resolve) => setTimeout(()=>resolve(20),200));
    let p3 = new P((resolve) => setTimeout(()=>resolve(30),300));
    resolves.push(expect(P.race(p1,p2,p3)).resolves.toBe(10));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = new P((resolve) => setTimeout(()=>resolve(10),300));
    p3 = new P((resolve) => setTimeout(()=>resolve(30),300));
    resolves.push(expect(P.race([p1,p2,p3])).rejects.toMatch(/Failed/))
    
    // Macrotask
    p1 = new P((resolve) => setTimeout(()=>resolve(10),100)).setScheduler(v.Macro);
    p2 = new P((resolve) => setTimeout(()=>resolve(20),200)).setScheduler(v.Macro);
    p3 = new P((resolve) => setTimeout(()=>resolve(30),300)).setScheduler(v.Macro);
    resolves.push(expect(P.race(p1,p2,p3)).resolves.toBe(10));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100)).setScheduler(v.Macro);
    p2 = new P((resolve) => setTimeout(()=>resolve(10),300)).setScheduler(v.Macro);
    p3 = new P((resolve) => setTimeout(()=>resolve(30),300)).setScheduler(v.Macro);
    resolves.push(expect(P.race([p1,p2,p3])).rejects.toMatch(/Failed/))
    
    // Final
    return Promise.all(resolves);
});

test('P.any', () => {
    let resolves = [];

    // Microtask
    let p1 = P.delay(10,100);
    let p2 = P.delay(20,200);
    let p3 = P.delay(30,300);
    resolves.push(expect(P.any(p1,p2,p3)).resolves.toBe(10));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = P.delay(20,200);
    p3 = P.delay(30,300);
    resolves.push(expect(P.any([p1,p2,p3])).resolves.toBe(20));

    // Macrotask
    p1 = P.delay(10,100).setScheduler(v.Macro);
    p2 = P.delay(20,200).setScheduler(v.Macro);
    p3 = P.delay(30,300).setScheduler(v.Macro);
    resolves.push(expect(P.any(p1,p2,p3)).resolves.toBe(10));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100)).setScheduler(v.Macro);
    p2 = P.delay(20,200).setScheduler(v.Macro);
    p3 = P.delay(30,300).setScheduler(v.Macro);
    resolves.push(expect(P.any([p1,p2,p3])).resolves.toBe(20));

    // Final
    return Promise.all(resolves);
});

test('P.allSettled', () => {
    let resolves = [];

    // Microtask
    let p1 = P.delay(10,100);
    let p2 = P.delay(20,200);
    let p3 = P.delay(30,300);
    resolves.push(expect(P.allSettled(p1,p2,p3)).resolves);
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = P.delay(20,200);
    p3 = P.delay(30,300);
    resolves.push(expect(P.allSettled([p1,p2,p3])).resolves);

    // Macrotask
    p1 = P.delay(10,100).setScheduler(v.Macro);
    p2 = P.delay(20,200).setScheduler(v.Macro);
    p3 = P.delay(30,300).setScheduler(v.Macro);
    resolves.push(expect(P.allSettled(p1,p2,p3)).resolves);
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100)).setScheduler(v.Macro);
    p2 = P.delay(20,200).setScheduler(v.Macro);
    p3 = P.delay(30,300).setScheduler(v.Macro);
    resolves.push(expect(P.allSettled([p1,p2,p3])).resolves);

    // Final
    return Promise.all(resolves);
});

test('P.resolve', () => {
    let resolves = [];
    
    // Microtask
    resolves.push(expect(P.resolve(10)).resolves.toBe(10));
    resolves.push(expect(P.resolve("hello")).resolves.toMatch("hello"));
    resolves.push(expect(P.resolve({x:10,y:20})).resolves.toEqual({x:10,y:20}));

    // Macrotask
    resolves.push(expect(P.resolve(10).setScheduler(v.Macro)).resolves.toBe(10));
    resolves.push(expect(P.resolve("hello").setScheduler(v.Macro)).resolves.toMatch("hello"));
    resolves.push(expect(P.resolve({x:10,y:20}).setScheduler(v.Macro)).resolves.toEqual({x:10,y:20}));

    // Final
    return P.all(resolves);
});

test('P.reject', () => {
    let resolves = [];
    
    // Microtask
    resolves.push(expect(P.reject(10)).rejects.toBe(10));
    resolves.push(expect(P.reject("hello")).rejects.toMatch("hello"));
    resolves.push(expect(P.reject({x:10,y:20})).rejects.toEqual({x:10,y:20}));

    // Macrotask
    resolves.push(expect(P.reject(10).setScheduler(v.Macro)).rejects.toBe(10));
    resolves.push(expect(P.reject("hello").setScheduler(v.Macro)).rejects.toMatch("hello"));
    resolves.push(expect(P.reject({x:10,y:20}).setScheduler(v.Macro)).rejects.toEqual({x:10,y:20}));

    return P.all(resolves);
});

test('P.delay', () => {
    let resolves = [];

    // Microtask
    resolves.push(expect(P.delay(10,100)).resolves.toBe(10))
    resolves.push(expect(P.delay("hello",200)).resolves.toMatch("hello"))
    resolves.push(expect(P.delay({x:10,y:20},300)).resolves.toEqual({x:10,y:20}))

    // Macrotask
    resolves.push(expect(P.delay(10,100).setScheduler(v.Macro)).resolves.toBe(10))
    resolves.push(expect(P.delay("hello",200).setScheduler(v.Macro)).resolves.toMatch("hello"))
    resolves.push(expect(P.delay({x:10,y:20},300).setScheduler(v.Macro)).resolves.toEqual({x:10,y:20}))
   
    // Final
    return P.all(resolves);
});

test('P.prototype.isFulfilled', () => {
    expect(P.resolve(10).isFulfilled()).toBeTruthy();
    expect(P.resolve(20).isFulfilled()).toBeTruthy();
    expect(P.resolve(null).isFulfilled()).toBeTruthy();
    expect(P.resolve({x:10,y:20}).isFulfilled()).toBeTruthy();
});

test('P.prototype.isRejected', () => {
    expect(P.reject(10).isRejected()).toBeTruthy();
    expect(P.reject(20).isRejected()).toBeTruthy();
    expect(P.reject(null).isRejected()).toBeTruthy();
    expect(P.reject({x:10,y:20}).isRejected()).toBeTruthy();
});

test('P.prototype.isPending', () => {
    expect(new P().isPending()).toBeTruthy();
});

test('P.prototype.catch', () => {
    let resolves = [];
    resolves.push(expect(P.reject(10).catch(e=>e)).resolves.toBe(10));
    resolves.push(expect(P.reject(20).catch(e=>e)).resolves.toBe(20));
    resolves.push(expect(P.reject(null).catch(e=>e)).resolves.toBe(null));
    return Promise.all(resolves)
});

test('P.prototype.tap', () => {
    let resolves = [];
    resolves.push(expect(P.resolve(10).tap(console.log,console.log)).resolves.toBe(10));
    resolves.push(expect(P.reject(20).tap(console.log,console.log)).rejects.toBe(20));
    resolves.push(expect(P.resolve(null).tap(console.log,console.log)).resolves.toBe(null));
    return Promise.all(resolves)
});

test('P.prototype.finally', () => {
    let resolves = [];
    resolves.push(expect(P.reject(10).finally(e=>e)).resolves.toBe(10));
    resolves.push(expect(P.resolve(20).finally(e=>e)).resolves.toBe(20));
    resolves.push(expect(P.reject(null).finally(e=>e)).resolves.toBe(null));
    return Promise.all(resolves)
});

test('P.prototype.delay', () => {
    let resolves = [];
    resolves.push(expect(P.resolve(10).delay(100)).resolves.toBe(10))
    resolves.push(expect(P.resolve("hello").delay(100)).resolves.toMatch("hello"))
    resolves.push(expect(P.resolve({x:10,y:20}).delay(100)).resolves.toEqual({x:10,y:20}))
    return P.all(resolves);
});

test('P.prototype.join', () => {
    let resolves = [];
    resolves.push(expect(
        P.resolve(10).delay(100)
        .join(P.resolve("hello").delay(200))
    ).resolves.toEqual([10,"hello"]));
    resolves.push(expect(
        P.resolve("hello").delay(100)
        .join(P.resolve({x:10,y:20}).delay(200))
    ).resolves.toEqual(["hello",{x:10,y:20}]));
    return P.all(resolves);
});

test('P.prototype.fork', () => {
    let resolves = [];
    resolves.push(expect(
        P.resolve(10).fork(v=>v+1,v=>v+2,v=>v+3,v=>v+4)
    ).resolves.toEqual([11,12,13,14]));
    return P.all(resolves);
});

test('Edge Cases', () => {
    let resolves = [];
    resolves.push(expect(new P((r,re,cp) => r(cp))).rejects.toThrow(/It cannot return the same Promise/));
    resolves.push(expect(P.resolve(P.resolve(10))).resolves.toBe(10));
    resolves.push(expect(P.resolve(P.reject(10))).rejects.toBe(10));
    resolves.push(expect(P.resolve(Promise.resolve(10))).resolves.toBe(10));
    resolves.push(expect(P.resolve(Promise.reject(10))).rejects.toBe(10));
    resolves.push(expect(P.resolve(10).then()).resolves.toBe(10));
    resolves.push(expect(P.reject(10).then()).rejects.toBe(10));
    resolves.push(expect(P.resolve(10).delay(100).then()).resolves.toBe(10));
    resolves.push(expect(P.reject(10).delay(100).then()).rejects.toBe(10));
    return P.all(resolves);
});