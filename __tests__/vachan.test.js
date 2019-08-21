const fs = require("fs");
const promisesAplusTests = require("promises-aplus-tests");
const v = require("../src/vachan");
const P = v.P;

test('P.vachanify', () => {
    let read = P.vachanify(fs.readFile);
    return Promise.all([
        expect(read("./__tests__/one.txt").then(data=>data.toString())).resolves.toMatch("hello world"),
        expect(read("xyz.txt")).rejects.toThrow(/ENOENT: no such file or directory/)
    ]);
});

test('P.all', () => {
    let resolves = [];
    let p1 = P.delay(10,100);
    let p2 = P.delay(20,200);
    let p3 = P.delay(30,300);
    resolves.push(expect(P.all(p1,p2,p3)).resolves.toEqual([10,20,30]));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = P.delay(20,200);
    p3 = P.delay(30,300);
    resolves.push(expect(P.all(p1,p2,p3)).rejects.toMatch(/Failed/))
    return Promise.all(resolves);
});

test('P.race', () => {
    let resolves = [];
    let p1 = new P((resolve) => setTimeout(()=>resolve(10),100));
    let p2 = new P((resolve) => setTimeout(()=>resolve(20),200));
    let p3 = new P((resolve) => setTimeout(()=>resolve(30),300));
    resolves.push(expect(P.race(p1,p2,p3)).resolves.toBe(10));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = new P((resolve) => setTimeout(()=>resolve(10),300));
    p3 = new P((resolve) => setTimeout(()=>resolve(30),300));
    resolves.push(expect(P.race(p1,p2,p3)).rejects.toMatch(/Failed/))
    return Promise.all(resolves);
});

test('P.any', () => {
    let resolves = [];
    let p1 = P.delay(10,100);
    let p2 = P.delay(20,200);
    let p3 = P.delay(30,300);
    resolves.push(expect(P.any(p1,p2,p3)).resolves.toBe(10));
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = P.delay(20,200);
    p3 = P.delay(30,300);
    resolves.push(expect(P.any(p1,p2,p3)).resolves.toBe(20))
    return Promise.all(resolves);
});

test('P.allSettled', () => {
    let resolves = [];
    let p1 = P.delay(10,100);
    let p2 = P.delay(20,200);
    let p3 = P.delay(30,300);
    resolves.push(expect(P.allSettled(p1,p2,p3)).resolves);
    p1 = new P((resolve,reject) => setTimeout(()=>reject("Failed"),100));
    p2 = P.delay(20,200);
    p3 = P.delay(30,300);
    resolves.push(expect(P.allSettled(p1,p2,p3)).resolves)
    return Promise.all(resolves);
});

test('P.resolve', () => {
    let resolves = [];
    resolves.push(expect(P.resolve(10)).resolves.toBe(10))
    resolves.push(expect(P.resolve("hello")).resolves.toMatch("hello"))
    resolves.push(expect(P.resolve({x:10,y:20})).resolves.toEqual({x:10,y:20}))
    return P.all(resolves);
});

test('P.reject', () => {
    let resolves = [];
    resolves.push(expect(P.reject(10)).rejects.toBe(10))
    resolves.push(expect(P.reject("hello")).rejects.toMatch("hello"))
    resolves.push(expect(P.reject({x:10,y:20})).rejects.toEqual({x:10,y:20}))
    return P.all(resolves);
});

test('P.delay', () => {
    let resolves = [];
    resolves.push(expect(P.delay(10,100)).resolves.toBe(10))
    resolves.push(expect(P.delay("hello",200)).resolves.toMatch("hello"))
    resolves.push(expect(P.delay({x:10,y:20},300)).resolves.toEqual({x:10,y:20}))
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