const promisesAplusTests = require("promises-aplus-tests");
const v = require("../src/vachan");
const P = v.P;

function deferred()
{
    let p = new P();
    return {
        promise:p,
        resolve:(v) => p.resolve(v),
        reject:(v) => p.reject(v)
    };
}      

const adapter = {};
adapter.resolved = v.P.resolve;
adapter.rejected = v.P.reject;
adapter.deferred = deferred;

P.vachanify(promisesAplusTests)(adapter)
.then(_ => console.log("Passing the Promise/A+ Specification Compliance Test Suite"));