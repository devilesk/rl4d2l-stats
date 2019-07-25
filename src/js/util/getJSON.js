import Promise from 'bluebird';

const getJSON = (url, qs_params) => {
    function buildQueryString(params) {
        return Object.entries(params).map(d => `${d[0]}=${d[1]}`).join('&');
    }

    return new Promise((resolve, reject) => {
        const qs = qs_params ? '?' + buildQueryString(qs_params) : '';
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${url}${qs}`);

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(xhr.statusText));
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    });
}

export default getJSON;