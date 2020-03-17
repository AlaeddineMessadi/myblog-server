var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');
var connectDb = require('../../config/connectDb');
var mailer = require('../../utils/mailer');
var createError = require('http-errors');
var httpStatus = require('http-status');



router.post('/', async function (req, res, next) {
  const { name, email, body } = req.body;

  if (!name) return next(createError(httpStatus.NO_CONTENT, 'Name must be provided'));
  if (!email) return next(createError(httpStatus.NO_CONTENT, 'Email must be provided'));
  if (!body) return next(createError(httpStatus.NO_CONTENT, 'Text must be provided'));

  // prepare email:
  const objectMail = { name, from: email, to: 'alaeddine.messadi@gmail.com', subject: 'Contacted From Contact Page' };
  const data = {
    name: `Alaeddine! You go a new Email from ${name}  ${email}`,
    text: body,
  };
  try {
    const response = await mailer(objectMail, data);
    return res.json({ status: httpStatus.OK, message: "Email was sent successfully" })
  } catch (error) {
    return next(createError(httpStatus.INTERNAL_SERVER_ERROR, error));
  }

});


module.exports = router;