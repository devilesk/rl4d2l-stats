#!/usr/bin/env node

require('dotenv').config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const fs = require('fs-extra');
const path = require('path');
const pug = require('pug');
const columns = require("./src/data/columns.json");

const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const resolve = require('rollup-plugin-node-resolve');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');

const publicDir = process.env.PUBLIC_DIR;
const sides = ['survivor', 'infected'];

console.log('Rendering template...');
const templatePath = path.join(__dirname, 'src/templates/weightEditor.pug');
const compiledFunction = pug.compileFile(templatePath, { pretty: true });
const indexPath = path.join(publicDir, 'weighteditor.html');
fs.writeFileSync(indexPath, compiledFunction({ columns, sides }));
console.log('Done rendering.');

const buildJs = async (publicDir) => {
    console.log('Building weightEditor.js...');
    const inputOptions = {
        input: path.join(__dirname, 'src/js/weightEditor.js'),
        external: ['jquery', 'handsontable', 'moment', 'chart.js'],
        plugins: [
            resolve({ browser: true }),
            commonjs({}),
            builtins(),
            globals(),
            json({}),
        ],
        watch: { exclude: 'node_modules/**' }
    };
    const outputOptions = {
        name: 'RL4D2LBUFF',
        file: path.join(publicDir, 'js/weightEditor.js'),
        format: 'iife',
        strict: false,
        sourcemap: true,
        globals: {
            jquery: '$',
            handsontable: 'Handsontable',
            moment: 'moment',
            'chart.js': 'Chart'
        }
    };
    const bundle = await rollup.rollup(inputOptions);
    const { output } = await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
    console.log('Done building js.');
}

buildJs(publicDir);