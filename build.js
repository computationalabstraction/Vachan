const fs = require("fs");
const gzip = require('zlib').createGzip();
const babel = require("@babel/core");
const browserify = require('browserify');
const { P } = require("./src/vachan");

const transform = P.vachanify(babel.transformFile);

// Node dist
transform(`${__dirname}/src/vachan.js`,{"presets":["@babel/preset-env","minify"],"comments":false})
.then(result => {
    fs.writeFileSync(`${__dirname}/dist/node/vachan.min.js`,result.code);
})

// Browser dist
browserify([`${__dirname}/src/vachan.js`])
.bundle()
.pipe(fs.createWriteStream(`${__dirname}/dist/browser/vachan.dist.js`))
.on("finish", _ => {
    transform(`${__dirname}/dist/browser/vachan.dist.js`,{"presets":["@babel/preset-env","minify"],"comments":false})
    .then(result => {
        fs.writeFileSync(`${__dirname}/dist/browser/vachan.dist.min.js`,result.code);
        fs.createReadStream(`${__dirname}/dist/browser/vachan.dist.min.js`)
        .pipe(gzip)
        .pipe(fs.createWriteStream(`${__dirname}/dist/browser/vachan.dist.min.js.gz`));
    });
});