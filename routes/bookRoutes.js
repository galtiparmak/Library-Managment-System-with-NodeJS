const express = require('express');
const {
    getAllBooks,
    getBookById,
    createBook,
} = require('../controllers/bookController');

const router = express.Router();

router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', createBook);

module.exports = router;
