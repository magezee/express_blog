const mysql = require('mysql');

const config = require('./config');

const database = mysql.createConnection({
    host: config.host,
    prot: config.prot,
    user: config.user,
    password: config.password,
    database: config.database
})

database.connect();

module.exports = database;