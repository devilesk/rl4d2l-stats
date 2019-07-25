/* Css build script
 *
 * Concatenates files in src/css directory to public/css/index.css.
 * Unused css from src/css/app.css and src/css/bootstrap.css is purged.
 * Minifies index.css to index.min.css.
 */

const fs = require('fs');
const Purgecss = require('purgecss');
const CleanCSS = require('clean-css');

console.log('Writing index.css...');
fs.writeFileSync('public/css/index.css', fs.readFileSync('src/css/handsontable.css'));

console.log('Purging unused css...');
const content = ['public/js/bundle.min.js', 'public/js/bootstrap.bundle.min.js', 'public/index.html']
const css = ['src/css/bootstrap.css', 'src/css/app.css']
const purgecss = new Purgecss({
    content,
    css
})

const results = purgecss.purge();

for (const result of results) {
    console.log(`Appending purged ${result.file} to index.css...`);
    fs.appendFileSync('public/css/index.css', result.css);
}

console.log('Minifying index.css...');
const input = fs.readFileSync('public/css/index.css');
const output = new CleanCSS({}).minify(input);

console.log('Writing index.min.css...');
fs.writeFileSync('public/css/index.min.css', output.styles);

console.log('Done.');