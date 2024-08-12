const Joi = require('joi');

const scoreSchema = Joi.object({
    score: Joi.number().min(0).max(10).required(),
});

module.exports = scoreSchema;
