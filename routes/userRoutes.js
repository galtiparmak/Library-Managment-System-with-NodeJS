const express = require('express');
const {
    getAllUsers,
    getUserById,
    createUser,
    borrowBook,
    returnBook,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/:userId/borrow/:bookId', borrowBook);
router.post('/:userId/return/:bookId', returnBook);

module.exports = router;
