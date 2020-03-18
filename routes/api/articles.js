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


// Preload article objects on routes with ':article'
router.param('article', function (req, res, next, slug) {
  // { $or: [{ slug: 20 } }, { price: 10 }] } 
  Article.findOne({ slug: slug })
    .populate('author')
    .then(function (article) {
      if (!article) return next(createError(httpStatus.NOT_FOUND));

      req.article = article;

      return next();
    }).catch(next);
});

router.param('comment', function (req, res, next, id) {
  Comment.findById(id).then(function (comment) {
    if (!comment) return next(createError(httpStatus.NOT_FOUND));

    req.comment = comment;

    return next();
  }).catch(next);
});


// Count articles articles
router.get('/count', auth.required, function (req, res, next) {
  const { role } = req.payload;
  if (role !== 'admin') return next(createError(httpStatus.FORBIDDEN, errorMSG.FORBIDDEN));

  Article.find().count().then(function (count) {
    return res.json({ status: httpStatus.OK, count });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});


// Get me last published article
router.get('/last', auth.required, function (req, res, next) {
  Article.find().sort({ createdAt: -1 }).then(function (article) {
    return res.json({ status: httpStatus.OK, data: article });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});



// get articles
router.get('/', auth.optional, async function (req, res, next) {
  var query = {};
  var limit = 5;
  var offset = 0;

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }

  if (typeof req.query.tag !== 'undefined') {
    query.tagList = { "$in": req.query.tag.split(',') };
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
  ]).then(function (results) {
    var author = results[0];
    var favoriter = results[1];

    if (author) {
      query.author = author._id;
    }

    if (favoriter) {
      query._id = { $in: favoriter.favorites };
    } else if (req.query.favorited) {
      query._id = { $in: [] };
    }

    return Promise.all([
      Article.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ createdAt: 'desc' })
        .populate('author')
        .exec(),
      Article.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function (results) {
      var articles = results[0];
      var articlesCount = results[1];
      var user = results[2];

      return res.json({
        articles: articles.map(function (article) {
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount
      });
    });
  }).catch(next);
});

router.get('/feed', auth.optional, function (req, res, next) {
  var limit = 20;
  var offset = 0;

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.NOT_FOUND));

    Promise.all([
      Article.find({ author: { $in: user.following } })
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author')
        .exec(),
      Article.count({ author: { $in: user.following } })
    ]).then(function (results) {
      var articles = results[0];
      var articlesCount = results[1];

      return res.json({
        articles: articles.map(function (article) {
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount
      });
    }).catch(next);
  });
});

//  create article
router.post('/', auth.required, function (req, res, next) {
  const { role } = req.payload;
  if (role !== 'admin') return next(createError(httpStatus.FORBIDDEN, errorMSG.FORBIDDEN));

  // when you find User
  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.NOT_FOUND));
    if (user.role !== 'admin') return next(createError(httpStatus.FORBIDDEN, 'You don\'t have the privileges for this operation'));

    var article = new Article(req.body.article);

    article.author = user;

    return article.save().then(function () {
      return res.json({ article: article.toJSONFor(user) });
    });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

// return a article
router.get('/:article', auth.optional, function (req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.article.populate('author').execPopulate()
  ]).then(function (results) {
    var user = results[0];

    return res.json({ article: req.article.toJSONFor(user) });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

// update article
router.put('/:article', auth.required, function (req, res, next) {
  const { role } = req.payload;
  if (role !== 'admin') return next(createError(httpStatus.FORBIDDEN));

  User.findById(req.payload.id).then(function (user) {
    if (user.role !== 'admin') return next(createError(httpStatus.FORBIDDEN, 'You don\'t have the privileges for this operation'));
    if (req.article.author._id.toString() === req.payload.id.toString() || user.role === 'admin') {
      if (typeof req.body.article.title !== 'undefined') {
        req.article.title = req.body.article.title;
      }

      if (typeof req.body.article.description !== 'undefined') {
        req.article.description = req.body.article.description;
      }

      if (typeof req.body.article.body !== 'undefined') {
        req.article.body = req.body.article.body;
      }

      if (typeof req.body.article.tagList !== 'undefined') {
        req.article.tagList = req.body.article.tagList
      }

      if (req.body.article.image) {
        req.article.image = req.body.article.image
      } else {
        req.article.image = DEFAULT_PHOTO;
      }

      if (req.body.article.imgcaption) {
        req.article.imgcaption = req.body.article.imgcaption
      }


      req.article.save().then(function (article) {
        return res.json({ status: httpStatus.OK, message: `Article ${article._id} Updated successfully` });
      }).catch(err => next(createError(httpStatus.INTERNAL_SERVER_ERROR, 'Cannot update article')));
    } else {
      return next(createError(httpStatus.FORBIDDEN, 'Forbidden cannot update article'));
    }
  });
});

// delete article
router.delete('/:article', auth.required, function (req, res, next) {
  const { role } = req.payload;
  if (role !== 'admin') return next(createError(httpStatus.FORBIDDEN));

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.UNAUTHORIZED));

    if (req.article.author._id.toString() === req.payload.id.toString()) {
      return req.article.remove().then(function () {
        return res.sendStatus(204);
      });
    } else {
      return next(createError(httpStatus.UNAUTHORIZED));
    }
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

// Favorite an article
router.post('/:article/favorite', auth.required, function (req, res, next) {
  var articleId = req.article._id;

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.UNAUTHORIZED));

    return user.favorite(articleId).then(function () {
      return req.article.updateFavoriteCount().then(function (article) {
        return res.json({ article: article.toJSONFor(user) });
      });
    });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

// Unfavorite an article
router.delete('/:article/favorite', auth.required, function (req, res, next) {
  var articleId = req.article._id;

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.UNAUTHORIZED));

    return user.unfavorite(articleId).then(function () {
      return req.article.updateFavoriteCount().then(function (article) {
        return res.json({ article: article.toJSONFor(user) });
      });
    });
  }).catch(next);
});

// return an article's comments
router.get('/:article/comments', auth.optional, function (req, res, next) {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function (user) {
    return req.article.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function (article) {
      return res.json({
        comments: req.article.comments.map(function (comment) {
          return comment.toJSONFor(user);
        })
      });
    });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

// create a new comment
router.post('/:article/comments', auth.required, function (req, res, next) {
  const { role } = req.payload;
  if (!['user', 'admin'].includes(role)) {
    return res.sendStatus(403);
  }

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.UNAUTHORIZED));

    var comment = new Comment(req.body.comment);
    comment.article = req.article;
    comment.author = user;

    return comment.save().then(function () {
      req.article.comments.push(comment);

      return req.article.save().then(function (article) {
        res.json({ comment: comment.toJSONFor(user) });
      });
    });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

router.delete('/:article/comments/:comment', auth.required, function (req, res, next) {
  const { role } = req.payload;
  if (!['user', 'admin'].includes(role)) return next(createError(httpStatus.UNAUTHORIZED));

  if (req.comment.author.toString() === req.payload.id.toString()) {
    req.article.comments.remove(req.comment._id);
    req.article.save()
      .then(Comment.find({ _id: req.comment._id }).remove().exec())
      .then(function () {
        res.sendStatus(204);
      });
  } else {
    return next(createError(httpStatus.UNAUTHORIZED));
  }
});

module.exports = router;




// update articles without any tagList
// const result = await Article.updateMany({
//   "$or": [
//     // { "tagList": { "$exists": false } },
//     // { "tagList": null },
//     { "tagList": [] }
//   ]
// },
//   { "$set": { "tagList": ["javascript", "frontend", "Reactjs"] } });
