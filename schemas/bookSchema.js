const Joi = require('joi');

const bookSchema = Joi.object({
    name: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Book name cannot be empty',
        'any.required': 'Book name is required',
    }),
});

module.exports = bookSchema;
