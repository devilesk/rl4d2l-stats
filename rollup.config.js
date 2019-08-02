const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const resolve = require('rollup-plugin-node-resolve');
const terser = require('rollup-plugin-terser').terser;
const pjson = require('./package.json');

module.exports = {
    input: 'src/js/index.js',
    external: ['jquery', 'handsontable', 'moment', 'chart.js'],
    plugins: [
        resolve({ browser: true }),
        commonjs({}),
        json({}),
        terser(),
    ],
    watch: { exclude: 'node_modules/**' },
    output: {
        name: 'RL4D2LBUFF',
        file: 'public/js/bundle.min.js',
        format: 'iife',
        strict: false,
        sourcemap: true,
        globals: {
            jquery: '$',
            handsontable: 'Handsontable',
            moment: 'moment',
            'chart.js': 'Chart',
        },
    },
};
