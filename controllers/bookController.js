const { Book, UserBookHistory } = require('../models');
const bookSchema = require('../schemas/bookSchema');

const getAllBooks = async (req, res, next) => {
    try {
        const books = await Book.findAll({ attributes: ['id', 'name'] });
        res.json(books);
    } catch (err) {
        next(err);
    }
};

const getBookById = async (req, res, next) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        const ratings = await UserBookHistory.findAll({ where: { BookId: book.id } });
        const averageScore = ratings.length
            ? (ratings.reduce((acc, item) => acc + item.score, 0) / ratings.length).toFixed(2)
            : -1;
        res.json({ id: book.id, name: book.name, score: averageScore });
    } catch (err) {
        next(err);
    }
};

const createBook = async (req, res, next) => {
    try {
        const { error } = bookSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const book = await Book.create({ name: req.body.name });
        res.status(201).json(book);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllBooks,
    getBookById,
    createBook,
};
