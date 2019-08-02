/* Js build script
 *
 * Uses Rollup to create a minified js bundle.
 * Entry point: src/js/index.js
 * Output: <publicDir>/js/bundle.min.js
 * Optional watchOpt argument enables Rollup watching
 * for automatic rebuilds
 */

const path = require('path');
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const resolve = require('rollup-plugin-node-resolve');
const terser = require('rollup-plugin-terser').terser;
const logger = require('./src/cli/logger');

module.exports = async (publicDir, watchOpt) => {
    logger.info('Building bundle.min.js...');
    const inputOptions = {
        input: path.join(__dirname, 'src/js/index.js'),
        external: ['jquery', 'handsontable', 'moment', 'chart.js'],
        plugins: [
            resolve({ browser: true }),
            commonjs({}),
            json({}),
            terser(),
        ],
        watch: { exclude: 'node_modules/**' },
    };
    const outputOptions = {
        name: 'RL4D2LBUFF',
        file: path.join(publicDir, 'js/bundle.min.js'),
        format: 'iife',
        strict: false,
        sourcemap: true,
        globals: {
            jquery: '$',
            handsontable: 'Handsontable',
            moment: 'moment',
            'chart.js': 'Chart',
        },
    };
    if (!watchOpt) {
        const bundle = await rollup.rollup(inputOptions);
        const { output } = await bundle.generate(outputOptions);
        await bundle.write(outputOptions);
        logger.info('Done building js.');
    }
    else {
        inputOptions.output = outputOptions;
        const watcher = rollup.watch(inputOptions);
        watcher.on('event', (event) => {
            switch (event.code) {
            case 'START':
                logger.info('Watching for js file changes...');
                break;
            case 'END':
                logger.info('Bundle built.');
                break;
            case 'ERROR':
                logger.info('Bundle error.');
                console.error(event.error);
                break;
            case 'FATAL':
                logger.info('Watch js build fatal error.');
                console.error(event.error);
                break;
            }
        });
    }
};
