/* JS and css revisioning script
 *
 * Appends hash of file contents to filenames for cache busting purposes.
 * Revisions bundle.min.js to bundle.min.[hash].js
 * Revisions bundle.min.js.map to bundle.min[hash].js.map
 * References to bundle.min.js and bundle.min.js.map are updated within the files.
 * Revisions index.min.css to index.min.[hash].css
 * Outputs rev-manifest.json mapping of filename to revisioned filenames.
 */
 
const md5 = require('md5');
const fs = require('fs');

console.log('Revisioning bundle.min.js...');

const input = fs.readFileSync('public/js/bundle.min.js', 'utf8');
const hash = md5(input);

fs.writeFileSync(`public/js/bundle.min.${hash}.js`, input.replace(/bundle\.min\.js\.map/g, `bundle.min.${hash}.js.map`));
console.log(`Renamed bundle.min.js to bundle.min.${hash}.js`);

const sourcemap = fs.readFileSync('public/js/bundle.min.js.map', 'utf8');
fs.writeFileSync(`public/js/bundle.min.${hash}.js.map`, sourcemap.replace(/bundle\.min\.js/g, `bundle.min.${hash}.js`));
console.log(`Renamed bundle.min.js.map to bundle.min.${hash}.js.map`);

console.log('Revisioning index.min.css...');
const cssInput = fs.readFileSync('public/css/index.min.css', 'utf8');
const cssHash = md5(cssInput);

fs.writeFileSync(`public/css/index.min.${cssHash}.css`, cssInput);
console.log(`Renamed index.min.css to index.min.${cssHash}.css`);

console.log('Writing rev-manifest.json...');
fs.writeFileSync(`rev-manifest.json`, JSON.stringify({
    'bundle.min.js': `bundle.min.${hash}.js`,
    'index.min.css': `index.min.${cssHash}.css`
}));

console.log('Done.');