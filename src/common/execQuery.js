const Promise = require('bluebird');

const execQuery = async (connection, query, values = []) => new Promise((resolve, reject) => {
    const callback = (err, results, fields) => {
        if (err) {
            reject(err);
        }
        else {
            resolve({ results, fields });
        }
    };
    if (values.length) {
        connection.query(query, values, callback);
    }
    else {
        connection.query(query, callback);
    }
});

module.exports = execQuery;
