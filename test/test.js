const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const execQuery = require('../src/common/execQuery.js');
const getGeneratedTeams = require('../src/discord/teamgen.js');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});
connection.connect();

async function test() {
    users = [
        { id: '122154474390159362'},
        { id: '193963554024587264'},
        { id: '164738446542372864'},
        { id: '145376951501062144'},
        { id: '179684304882761728'},
        { id: '213682066850709506'},
        { id: '193915635401621504'},
        { id: '117878147126394882'},
    ]
    let embed;
    embed = await getGeneratedTeams(process.env.DATA_DIR, connection);
    console.log('1', embed);
    embed = await getGeneratedTeams(process.env.DATA_DIR, connection, users.map(user => user.id), null, true, true);
    console.log('2', embed);
}

test();