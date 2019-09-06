const fs = require('fs-extra');
const path = require('path');
const logger = require('../cli/logger');

const mergeObjects = (a, b) => {
    for (const [key, value] of Object.entries(b)) {
        if (typeof value === 'object') {
            a[key] = mergeObjects(a[key] || {}, b[key]);
        }
        else {
            a[key] = value;
        }
    }
    return a;
};

class Config {
    constructor() {
        this.settings = {};
    }

    get strings() {
        return this.settings.strings;
    }

    async load() {
        logger.info('Loading bot config...');
        this.settings = await fs.readJson(path.join(__dirname, '../../config.default.json'));
        const exists = await fs.pathExists(path.join(__dirname, '../../config.json'));
        if (exists) {
            const settingsOverrides = await fs.readJson(path.join(__dirname, '../../config.json'));
            mergeObjects(this.settings, settingsOverrides);
        }
    }
}

const config = new Config();

module.exports = config;
