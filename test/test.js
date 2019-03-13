const v = require("../index");
const P = v.P;

new P((resolve,reject) => setTimeout(()=>resolve({hello:"world" ,__proto__:null}),300))
    .then((v) => v)
    .then((v) => console.log(v));

console.log("resolved");
let p1 = P.resolve(10);

console.log("after");
p1.then( (v) => console.log(v) );  
console.log("before");

const fs = require("fs");

p1 = new P( 
    (resolve,reject) => {
        fs.readFile("one.txt",(err,data) => {
            if(err) reject(err);
            else resolve(data);
        });
    }
);

p1.then(data => console.log("1." + data.toString()));
p1.then(data => console.log("2." + data.toString()));
p1.then(data => console.log("3." + data.toString()));

let p2 = P.resolve(10);
p2.then((v) => console.log("1." + v));
p2.then((v) => console.log("2." + v));
p2.then((v) => console.log("3." + v));