const config = require('./config');
const logger = require('../cli/logger');
const got = require('got');
const FormData = require('form-data');

const createPaste = async (data, options) => {
    const body = Object.assign({
        api_dev_key: config.settings.pastebinApiKey,
        api_option: 'paste',
        api_paste_private: 1,
        api_paste_code: data,
    }, options);
    const form = new FormData();
    for (const [key, value] of Object.entries(body)) {
        form.append(key, value);
    }
    const response = await got.post('https://pastebin.com/api/api_post.php', { body: form });
    logger.debug(`createPaste ${response.body}`);
    if (response.body.startsWith('Bad API request')) {
        logger.error(response.body);
        return { error: response.body };
    }
    return { link: response.body };
}

module.exports = createPaste;