const User = require('./User');
const Book = require('./Book');
const UserBookHistory = require('./UserBookHistory');

// index.js
User.belongsToMany(Book, { as: 'currentlyBorrowedBooks', through: 'UserCurrentBooks' });
User.belongsToMany(Book, { as: 'booksBorrowedWithScores', through: UserBookHistory });
Book.belongsToMany(User, { as: 'borrowersWithScores', through: UserBookHistory });


module.exports = { User, Book, UserBookHistory };
