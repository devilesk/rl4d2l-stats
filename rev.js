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
const fs = require('fs-extra');
const path = require('path');

module.exports = async (publicDir) => {
    console.log('Revisioning bundle.min.js...');

    const input = await fs.readFile(path.join(publicDir, 'js/bundle.min.js'), 'utf8');
    const hash = md5(input);

    await fs.writeFile(path.join(publicDir, `js/bundle.min.${hash}.js`), input.replace(/bundle\.min\.js\.map/g, `bundle.min.${hash}.js.map`));
    console.log(`Renamed bundle.min.js to bundle.min.${hash}.js`);

    const sourcemap = await fs.readFile(path.join(publicDir, 'js/bundle.min.js.map'), 'utf8');
    await fs.writeFile(path.join(publicDir, `js/bundle.min.${hash}.js.map`), sourcemap.replace(/bundle\.min\.js/g, `bundle.min.${hash}.js`));
    console.log(`Renamed bundle.min.js.map to bundle.min.${hash}.js.map`);

    console.log('Revisioning index.min.css...');
    const cssInput = await fs.readFile(path.join(publicDir, 'css/index.min.css'), 'utf8');
    const cssHash = md5(cssInput);

    await fs.writeFile(path.join(publicDir, `css/index.min.${cssHash}.css`), cssInput);
    console.log(`Renamed index.min.css to index.min.${cssHash}.css`);
    
    console.log('Revisioning index.html...');
    let htmlInput = await fs.readFile(path.join(publicDir, 'index.html'), 'utf8');
    htmlInput = htmlInput.replace(/src="js\/bundle\.min(\.[a-zA-Z0-9]+?)?\.js"/g, `src="js/bundle.min.${hash}.js"`);
    htmlInput = htmlInput.replace(/href="css\/index\.min(\.[a-zA-Z0-9]+?)?\.css"/g, `href="css/index.min.${cssHash}.css"`);
    await fs.writeFile(path.join(publicDir, `index.html`), htmlInput);
    console.log(`Renamed js and css references in index.html`);

    console.log('Writing rev-manifest.json...');
    await fs.writeJson(`rev-manifest.json`, {
        'bundle.min.js': `bundle.min.${hash}.js`,
        'index.min.css': `index.min.${cssHash}.css`
    });

    console.log('Done revisioning.');
}