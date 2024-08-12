const express = require('express');
const Joi = require('joi');
const sequelize = require('./config/database');
const { User, Book, UserBookHistory } = require('./models');
const app = express();

app.use(express.json());

// Sync database and create tables
//sequelize.sync({ force: true })
//  .then(() => {
//    console.log('Database & tables created!');
//  })
//  .catch(err => {
//    console.error('Error creating database & tables:', err);
//  });


// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        error: err.message || 'Internal Server Error'
    });
}

// Schema for validating the score
const scoreSchema = Joi.object({
    score: Joi.number().min(0).max(10).required()
});

// Schema for validating the user creation
const userSchema = Joi.object({
    name: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Name cannot be empty',
        'any.required': 'Name is required'
    })
});

// Schema for validating the book creation
const bookSchema = Joi.object({
    name: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Book name cannot be empty',
        'any.required': 'Book name is required'
    })
});

// Get all users
app.get('/users', async (req, res, next) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'name'] });
        res.json(users);
    } catch (err) {
        next(err);
    }
});

// Fetch a user by ID with error handling for non-existent user
app.get('/users/:id', async (req, res, next) => {
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
});

// Create a new user with validation
app.post('/users', async (req, res, next) => {
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
});

// Get all books
app.get('/books', async (req, res, next) => {
    try {
        const books = await Book.findAll({ attributes: ['id', 'name'] });
        res.json(books);
    } catch (err) {
        next(err);
    }
});

// Get a book by ID with error handling for non-existent book
app.get('/books/:id', async (req, res, next) => {
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
});

// Create a new book with validation
app.post('/books', async (req, res, next) => {
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
});


// Borrow a book without considering a count
app.post('/users/:userId/borrow/:bookId', async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.userId);
        const book = await Book.findByPk(req.params.bookId);

        // Edge Case: Borrowing a Non-Existent User
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Edge Case: Borrowing a Non-Existent Book
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Check if the book is currently borrowed by querying the UserCurrentBooks table
        const isAlreadyBorrowed = await user.sequelize.models.UserCurrentBooks.findOne({
            where: {
                BookId: book.id,
            }
        });

        if (isAlreadyBorrowed) {
            return res.status(400).json({ error: 'This book is currently borrowed by another user' });
        }

        // Add the book to the user's currently borrowed books
        await user.addCurrentlyBorrowedBooks(book);

        res.status(204).send();  // No Content
    } catch (err) {
        next(err);
    }
});





// Return a book without considering a count
app.post('/users/:userId/return/:bookId', async (req, res, next) => {
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

        // Check if the book is in the user's currently borrowed books
        const isBorrowed = await user.hasCurrentlyBorrowedBooks(book);
        if (!isBorrowed) {
            return res.status(400).json({ error: 'This book has not been borrowed by the user or has already been returned' });
        }

        // Remove the book from the user's currently borrowed books
        await user.removeCurrentlyBorrowedBooks(book);

        // Find the latest borrowing history (assuming no overlaps in borrowing the same book without returning)
        const latestBorrowing = await UserBookHistory.findOne({
            where: {
                UserId: user.id,
                BookId: book.id,
                returnedAt: null,  // Only consider entries that haven't been returned yet
            },
            order: [['borrowedAt', 'DESC']],  // Get the most recent borrowing entry
        });

        if (latestBorrowing) {
            // Update the borrowing history with the return date and score
            latestBorrowing.returnedAt = new Date();
            latestBorrowing.score = req.body.score;
            await latestBorrowing.save();
        } else {
            // In case something goes wrong and no borrowing history exists, add it manually
            await UserBookHistory.create({
                UserId: user.id,
                BookId: book.id,
                borrowedAt: new Date(), // This would ideally be the actual borrowed date
                returnedAt: new Date(),
                score: req.body.score,
            });
        }

        res.status(204).send();  // No Content
    } catch (err) {
        next(err);
    }
});



// Use error handling middleware
app.use(errorHandler);

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
