const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserBookHistory = sequelize.define('UserBookHistory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    borrowedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    returnedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
});


module.exports = UserBookHistory;
