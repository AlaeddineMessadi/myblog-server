var router = require('express').Router();
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var auth = require('../auth');
var connectDb = require('../../config/connectDb');
var createError = require('http-errors');
var httpStatus = require('http-status');
const errorMSG = require('../../utils/errorMSG');

var DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80';


connectDb();


// Count Dashboard
router.get('/', auth.required, async function (req, res, next) {
  const { role } = req.payload;
  if (role !== 'admin') return next(createError(httpStatus.FORBIDDEN, errorMSG.FORBIDDEN));

  try {
    const articles = await Article.find().count();
    const comments = await Comment.find().count();
    const users = await User.find().count();
    const tags = await Article.find().count('tagList');
    const lastArticles = await Article.find().sort({ createdAt: -1 }).limit(Number(2));

    return res.json({ status: httpStatus.OK, data: { articles, comments, users, tags }, lastArticles });

  } catch (error) {
    next(createError(httpStatus.INTERNAL_SERVER_ERROR))
  }
});


module.exports = router; 