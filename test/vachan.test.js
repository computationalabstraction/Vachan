const v = require("../src/vachan");
const P = v.P;

let p1 = new P((resolve) => setTimeout(()=>resolve(10),100));
let p2 = new P((resolve) => setTimeout(()=>resolve(20),200));
let p3 = new P((resolve) => setTimeout(()=>resolve(30),300));

P.all(p1,p2,p3).then( (v) => console.log(v) );

P.race(p1,p2,p3).then( (v) => console.log(v) );

new P((resolve,reject) => setTimeout(()=>resolve({hello:"world" ,__proto__:null}),300))
    .then((v) => v)
    .then((v) => console.log(v));

console.log("resolved");
p1 = P.resolve(10);

console.log("after");
p1.then( (v) => console.log(v) );  
console.log("before");

const fs = require("fs");

let read = P.vachanify(fs.readFile);
let write = P.vachanify(fs.writeFile);

read("one.txt")
.then(data => write("two.txt",data))
.catch(err => console.log("Unsuccessful"));


p1 = read("one.txt");

p1.then(data => console.log("1." + data.toString()));
p1.then(data => console.log("2." + data.toString()));
p1.then(data => console.log("3." + data.toString()));

p2 = P.resolve(10);
p2.then((v) => console.log("1." + v));
p2.then((v) => console.log("2." + v));
p2.then((v) => console.log("3." + v));