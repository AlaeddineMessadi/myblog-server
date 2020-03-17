var router = require('express').Router();
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var connectDb = require('../../config/connectDb');
var createError = require('http-errors');
var httpStatus = require('http-status');

connectDb();


// return a list of tags
router.get('/', function (req, res, next) {
  Article.find().distinct('tagList').then(function (tags) {
    return res.json({ tags: tags });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

router.get('/count', function (req, res, next) {
  Article.find().count('tagList').then(function (tags) {
    return res.json({ tags: tags });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});


router.get('/list', function (req, res, next) {
  Article.find().distinct('tagList').then(async function (tags) {
    if (!tags) return next(createError(httpStatus.NOT_FOUND))
    const result = await Promise.all(tags.filter(e => e).map(async tag => {
      const count = await Article.find({ tagList: tag }).count();
      return { tag: tag, count: count };
    }));

    return res.json({ result });

  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR, e)));
});

// get all articles with same tag
router.get('/:tag', function (req, res, next) {
  Article.find().distinct('tagList').then(async function (tags) {

    const result = await Promise.all(tags.filter(e => e).map(async tag => {
      const count = await Article.find({ tagList: tag }).count();
      return { tag: tag, count: count };
    }));

    return res.json({ result });

  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR, e)));
});

module.exports = router;
