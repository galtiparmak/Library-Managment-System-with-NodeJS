const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    averageRating: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
});

module.exports = Book;
