const { P } = require("./src/vachan");

let p1 = P.resolve(10);
let p2 = p1.map(v => v);

P.all(p1,p2).then(v => v[0] == v[1]).then(console.log);

P.reject(10);

console.log("here!");