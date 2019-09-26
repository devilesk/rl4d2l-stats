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
const logger = require('../src/cli/logger');

module.exports = async (publicDir) => {
    logger.info('Writing index.css...');
    const cssPath = path.join(publicDir, 'css/index.css');
    await fs.copy(path.join(__dirname, '../src/css/handsontable.css'), cssPath);

    logger.info('Purging unused css...');
    const content = ['js/bundle.min.js', 'js/bootstrap.bundle.min.js', 'index.html'].map(f => path.join(publicDir, f));
    const css = ['src/css/bootstrap.css', 'src/css/app.css', 'src/css/playoffbracket.css'].map(f => path.join(__dirname, '../', f));
    const purgecss = new Purgecss({
        content,
        css,
        whitelist: ['survivor-chart-legend-item', 'infected-chart-legend-item', 'htAutocompleteArrow'],
    });

    const results = purgecss.purge();

    for (const result of results) {
        logger.info(`Appending purged ${result.file} to index.css...`);
        await fs.appendFile(cssPath, result.css);
    }

    logger.info('Minifying index.css...');
    const input = await fs.readFile(cssPath);
    const output = new CleanCSS({}).minify(input);

    logger.info('Writing index.min.css...');
    await fs.writeFile(path.join(publicDir, 'css/index.min.css'), output.styles);

    logger.info('Done building css.');
};
