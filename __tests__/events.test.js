const v = require("../src/vachan");
const P = v.P;

/*
TODO: Next Release

Comprehensive Event Tests yet to be done
*/

test('Event: Created', () => {
    let counter = 0;
    v.realm.on("Created", p => counter++);
    for(let i = 0;i < 10;i++) P.resolve(i*10);
    expect(counter).toBe(10);
});

test('Event: ExecutorExecuted', () => {
    let counter = 0;
    v.realm.on("ExecutorExecuted", p => counter++);
    for(let i = 0;i < 10;i++) new P(_ => {});
    expect(counter).toBe(10);
});

test('Event: ExecutorThrows', () => {
    let counter = 0;
    v.realm.on("ExecutorExecuted", p => counter++);
    v.realm.on("ExecutorThrows", p => counter++);
    for(let i = 0;i < 10;i++) new P(_ => {throw new Error()});
    expect(counter).toBe(20);
});


test('Event: Fulfilled', () => {
    let counter = 0;
    v.realm.on("Fulfilled", p => counter++);
    for(let i = 0;i < 10;i++) P.resolve(i*10);
    expect(counter).toBe(10);
});

test('Event: Rejected', () => {
    let counter = 0;
    v.realm.on("Rejected", p => counter++);
    for(let i = 0;i < 10;i++) P.reject(i*10);
    expect(counter).toBe(10);
});

test('Event: Preresolved', () => {
    let counter = 0;
    v.realm.on("Preresolved", p => counter++);
    for(let i = 0;i < 10;i++) P.resolve(i*10).then();
    expect(counter).toBe(10);
});

test('Event: Prerejected', () => {
    let counter = 0;
    v.realm.on("Prerejected", p => counter++);
    for(let i = 0;i < 10;i++) P.reject(i*10).then();
    expect(counter).toBe(10);
});

test('Event: Chained', () => {
    let counter = 0;
    v.realm.on("Chained", p => counter++);
    for(let i = 0;i < 10;i++) new P().then();
    expect(counter).toBe(10);
});

test('Event: Rechained', () => {
    let counter = 0;
    v.realm.on("Rechained", p => counter++);
    for(let i = 0;i < 10;i++) P.resolve(P.resolve(i*10));
    expect(counter).toBe(10);
});