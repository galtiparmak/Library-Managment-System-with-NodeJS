const Joi = require('joi');

const userSchema = Joi.object({
    name: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Name cannot be empty',
        'any.required': 'Name is required',
    }),
});

module.exports = userSchema;
