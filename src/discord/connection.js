const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const mysql = require('mysql');
const execQuery = require('../common/execQuery.js');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});
connection.connect();

const pingDatabase = async () => execQuery(connection, 'SELECT 1');

setInterval(pingDatabase, 60000);

module.exports = connection;
