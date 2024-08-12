// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('invent', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;


