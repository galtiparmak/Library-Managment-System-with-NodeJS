const { User, Book, UserBookHistory } = require('../models');
const userSchema = require('../schemas/userSchema');
const scoreSchema = require('../schemas/scoreSchema');

// ... rest of the controller code


const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'name'] });
        res.json(users);
    } catch (err) {
        next(err);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                { model: Book, as: 'currentlyBorrowedBooks', attributes: ['name'] },
                { model: Book, as: 'booksBorrowedWithScores', through: { attributes: ['score'] }, attributes: ['name'] }
            ]
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            name: user.name,
            books: {
                past: user.booksBorrowedWithScores.map(b => ({
                    name: b.name,
                    userScore: b.UserBookHistory.score
                })),
                present: user.currentlyBorrowedBooks.map(b => ({
                    name: b.name
                }))
            }
        });
    } catch (err) {
        next(err);
    }
};

const createUser = async (req, res, next) => {
    try {
        const { error } = userSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const user = await User.create({ name: req.body.name });
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

const borrowBook = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.userId);
        const book = await Book.findByPk(req.params.bookId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const isAlreadyBorrowed = await user.sequelize.models.UserCurrentBooks.findOne({
            where: { BookId: book.id }
        });

        if (isAlreadyBorrowed) {
            return res.status(400).json({ error: 'This book is currently borrowed by another user' });
        }

        await user.addCurrentlyBorrowedBooks(book);

        res.status(204).send();  // No Content
    } catch (err) {
        next(err);
    }
};

const returnBook = async (req, res, next) => {
    try {
        const { error } = scoreSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await User.findByPk(req.params.userId);
        const book = await Book.findByPk(req.params.bookId);

        if (!user || !book) {
            return res.status(404).json({ error: 'User or Book not found' });
        }

        const isBorrowed = await user.hasCurrentlyBorrowedBooks(book);
        if (!isBorrowed) {
            return res.status(400).json({ error: 'This book has not been borrowed by the user or has already been returned' });
        }

        await user.removeCurrentlyBorrowedBooks(book);

        const latestBorrowing = await UserBookHistory.findOne({
            where: {
                UserId: user.id,
                BookId: book.id,
                returnedAt: null
            },
            order: [['borrowedAt', 'DESC']]
        });

        if (latestBorrowing) {
            latestBorrowing.returnedAt = new Date();
            latestBorrowing.score = req.body.score;
            await latestBorrowing.save();
        } else {
            await UserBookHistory.create({
                UserId: user.id,
                BookId: book.id,
                borrowedAt: new Date(),
                returnedAt: new Date(),
                score: req.body.score,
            });
        }

        res.status(204).send();  // No Content
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    borrowBook,
    returnBook,
};
