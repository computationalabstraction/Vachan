const promisesAplusTests = require("promises-aplus-tests");
const v = require("../src/vachan");
const P = v.P;

function deferred() {
    let res;
    let rej;
    let p = new P(
        (resolve,reject) => {
            res = resolve;
            rej = reject;
        }
    );
    return {
        promise: p,
        resolve: res,
        reject: rej
    };
}

const adapter = {};
adapter.resolved = v.P.resolve;
adapter.rejected = v.P.reject;
adapter.deferred = deferred;

P.vachanify(promisesAplusTests)(adapter)
    .then(_ => console.log("Passing the Promise/A+ Specification Compliance Test Suite"));