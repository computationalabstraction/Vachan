# <img src="https://raw.githubusercontent.com/archanpatkar/Vachan/master/vachan.png"/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Actions Status](https://github.com/archanpatkar/vachan/workflows/build/badge.svg)](https://github.com/archanpatkar/vachan/actions?workflow=build) ![Coverage: 99%](https://img.shields.io/badge/Coverage-99%25-success)

<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>

A **lightweight** (3kB) cross-platform **Promises/A+ spec compliant** promise library. Vachan works both on the **Browser** and **Node.js**. Vachan provides extra features over the `standard promise implementation` such as _monitoring_ the complete internal **chaining and rechaining** of promises, **queuing of callbacks** and **execution of callbacks**, **mode of execution** and other _functional_ and _utilitarian_ features and also gives you implementation for ESNext functions - `any` and `allSettled` (Currently in Stage 2). This project was partly a fruition of exploring promises from the perspective of an implementor and also in an effort to create a core ecosystem of libraries, constructs and utilities which can be reused across domains. 

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

## Installation

### Node
```
npm i vachan
```
### Browser
```
<script src="https://unpkg.com/vachan"></script>
```

## Usage

[Documentation](https://vachan.archan.io)
