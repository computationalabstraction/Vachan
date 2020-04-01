<div style="align-content:center;margin-left:auto;margin-right:auto;">

### <img src="https://raw.githubusercontent.com/archanpatkar/Vachan/master/vachan.png"/>

[![License: MIT](https://img.shields.io/badge/License-MIT-success.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/vachan.svg)](https://badge.fury.io/js/vachan) [![Actions Status](https://github.com/archanpatkar/vachan/workflows/build/badge.svg)](https://github.com/archanpatkar/vachan/actions?workflow=build) [![Maintainability](https://api.codeclimate.com/v1/badges/e064b9ca3fc02867c203/maintainability)](https://codeclimate.com/github/archanpatkar/Vachan/maintainability) ![Coverage: 99%](https://img.shields.io/badge/Coverage-99%25-success) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


</div>

<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" width="82" height="82" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="left" />
</a>
 <a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land logo" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png" align="left"></a>

 <a href="https://github.com/fantasyland/static-land"><img height="82" alt="Static Land logo" src="https://raw.githubusercontent.com/fantasyland/static-land/master/logo/logo.png" align="left"></a>

A **lightweight** (3.5kB) cross-platform **Promises/A+ spec compliant** promise library. Vachan works both on the **Browser** and **Node.js**. Vachan provides extra features over the `standard promise implementation` such as _monitoring_ the complete internal **chaining and rechaining** of promises, **queuing of callbacks** and **execution of callbacks**, **mode of execution**, other _utilitarian_ features and also gives you polyfills for ESNext functions - `any` and `allSettled`. This project was partly a fruition of exploring promises from the perspective of an implementor and also in an effort to create a core ecosystem of libraries, constructs and utilities which can be reused across domains. **Fantasy Land** and **Static Land** compliance is a work in progess.

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
### Browser Optimized (gzipped)
```
<script src="https://unpkg.com/vachan/dist/browser/vachan.dist.min.js.gz"></script>
```

## Usage

[Documentation](https://vachan.archan.io)
