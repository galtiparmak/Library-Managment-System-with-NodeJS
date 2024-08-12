const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Update the Book model to include the `count` attribute
const Book = sequelize.define('Book', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    averageRating: {
        type: DataTypes.FLOAT,
        allowNull: true,  // Optional field that will be calculated based on user ratings
    },
});

module.exports = Book;
