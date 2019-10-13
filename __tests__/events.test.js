const v = require("../src/vachan");
const P = v.P;

/*
TODO: Next Release

Complete Event Tests to be done
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