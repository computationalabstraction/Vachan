const v = require("../src/vachan");
const P = v.P;

/*
TODO: Next Release

Comprehensive Event Tests yet to be done
*/

// To be replaced with code which deals with async events

test('Event: Created', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Created, p => counter++);
    // for(let i = 0;i < 10;i++) P.resolve(i*10);
    // expect(counter).toBe(10);
});

test('Event: ExecutorExecuted', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.ExecutorExecuted, p => counter++);
    // for(let i = 0;i < 10;i++) new P(_ => {});
    // expect(counter).toBe(10);
});

test('Event: ExecutorThrows', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.ExecutorExecuted, p => counter++);
    // v.realm.onEvent(v.realm.events.ExecutorThrows, p => counter++);
    // for(let i = 0;i < 10;i++) new P(_ => {throw new Error()});
    // expect(counter).toBe(20);
});


test('Event: Fulfilled', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Fulfilled, p => counter++);
    // for(let i = 0;i < 10;i++) P.resolve(i*10);
    // expect(counter).toBe(10);
});

test('Event: Rejected', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Rejected, p => counter++);
    // for(let i = 0;i < 10;i++) P.reject(i*10);
    // expect(counter).toBe(10);
});

test('Event: Preresolved', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Preresolved, p => counter++);
    // for(let i = 0;i < 10;i++) P.resolve(i*10).then();
    // expect(counter).toBe(10);
});

test('Event: Prerejected', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Prerejected, p => counter++);
    // for(let i = 0;i < 10;i++) P.reject(i*10).then();
    // expect(counter).toBe(10);
});

test('Event: Chained', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Chained, p => counter++);
    // for(let i = 0;i < 10;i++) new P().then();
    // expect(counter).toBe(10);
});

test('Event: Rechained', () => {
    // let counter = 0;
    // v.realm.onEvent(v.realm.events.Rechained, p => counter++);
    // for(let i = 0;i < 10;i++) P.resolve(P.resolve(i*10));
    // expect(counter).toBe(10);
});