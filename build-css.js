/* Css build script
 *
 * Concatenates files in src/css directory to public/css/index.css.
 * Unused css from src/css/app.css and src/css/bootstrap.css is purged.
 * Minifies index.css to index.min.css.
 */

const fs = require('fs-extra');
const path = require('path');
const Purgecss = require('purgecss');
const CleanCSS = require('clean-css');
const Promise = require('bluebird');

module.exports = async (publicDir) => {
    console.log('Writing index.css...');
    const cssPath = path.join(publicDir, 'css/index.css');
    await fs.copy(path.join(__dirname, 'src/css/handsontable.css'), cssPath);

    console.log('Purging unused css...');
    const content = ['js/bundle.min.js', 'js/bootstrap.bundle.min.js', 'index.html'].map(f => path.join(publicDir, f));
    const css = ['src/css/bootstrap.css', 'src/css/app.css'].map(f => path.join(__dirname, f));
    const purgecss = new Purgecss({
        content,
        css
    })

    const results = purgecss.purge();

    for (const result of results) {
        console.log(`Appending purged ${result.file} to index.css...`);
        await fs.appendFile(cssPath, result.css);
    }

    console.log('Minifying index.css...');
    const input = await fs.readFile(cssPath);
    const output = new CleanCSS({}).minify(input);

    console.log('Writing index.min.css...');
    await fs.writeFile(path.join(publicDir, 'css/index.min.css'), output.styles);

    console.log('Done building css.');
}