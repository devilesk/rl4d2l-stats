const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const logger = require('./logger');
const dotenv = require('dotenv');

const prompt = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

const envWizard = async () => {
    const envConfig = dotenv.parse(await fs.readFile(path.join(__dirname, '../../.env.example')));
    for (const [key, value] of Object.entries(envConfig)) {
        const result = await prompt(`${key}: (${value}) `);
        envConfig[key] = result || value;
    }
    console.log(`About to write to ${path.join(process.cwd(), '.env')}:`);
    const data = Object.entries(envConfig).map(([key, value]) => `${key}=${value}`).join('\n');
    console.log(data);
    const result = await prompt('Is this OK? (yes) ');
    if (!result || result.toLowerCase() === 'y' || result.toLowerCase() === 'yes') {
        await fs.writeFile('.env', data);
        dotenv.config();
    }
    else {
        console.log('Aborted.');
        process.exit(0);
    }
};

module.exports = envWizard;