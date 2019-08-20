# <img src="vachan.png"/>
<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>

A **lightweight** (2.8kB) cross-platform **Promises/A+ spec compliant** promise library. Vachan works both on the **Browser** and **Node.js**. Vachan provides extra features over the `standard promise implementation` such as _monitoring_ the complete internal **chaining and rechaining** of promises, **queuing of callbacks** and **execution of callbacks**, **mode of execution** and other _functional_ and _utilitarian_ features and also gives you implementation for ESNext functions- `any` and `allSettled`(Currently in Stage 2). This project was partly a fruition of learning promises from the dimension of an implementor and also in an effort to create a core ecosystem of libraries, constructs and utilities which can be reused across domains.

#### `Example Usage`
```javascript
const { P } = require("vachan");

let a = [];

for(let i = 0;i < 10;i++)
{
    a.push(
        P.resolve(i*10)
         .delay(.1*i)
    );
}

P.all(a)
 .then(vals => console.log(vals));
```
#### `More Details`

[Website](https://vachan.dev)
