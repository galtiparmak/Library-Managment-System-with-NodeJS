const express = require('express');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

app.use(express.json());

// Sync database and create tables
// sequelize.sync({ force: true })
//   .then(() => {
//     console.log('Database & tables created!');
//   })
//   .catch(err => {
//     console.error('Error creating database & tables:', err);
//   });

// Routes
app.use('/users', userRoutes);
app.use('/books', bookRoutes);

// Use error handling middleware
app.use(errorHandler);

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
