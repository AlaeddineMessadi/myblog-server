var router = require('express').Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var auth = require('../auth');
var connectDb = require('../../config/connectDb');
var createError = require('http-errors');
var httpStatus = require('http-status');
const errorMSG = require('../../utils/errorMSG');

connectDb();

// { tagList: { '$in': ['berlin', 'bone.js'] } }
// { username: username }
// { $or: [{ '_id': objId }, { 'name': param }, { 'nickname': param }] }

// Preload user profile on routes with ':username'
router.param('username', function (req, res, next, username) {
  User.findOne(
    { $or: [{ 'username': username }, { 'email': username }] }
  ).then(function (user) {
    if (!user) return next(createError(httpStatus.NOT_FOUND));

    req.profile = user;
    return next();
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

router.get('/', auth.optional, function (req, res, next) {
  console.log('here we go')
  return next();
});

//  get profile by username
router.get('/:username', auth.optional, function (req, res, next) {
  if (req.payload) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) { return res.json({ profile: req.profile.toProfileJSONFor(false) }); }

      return res.json({ profile: req.profile.toProfileJSONFor(user) });
    });
  } else {
    return res.json({ profile: req.profile.toProfileJSONFor(false) });
  }
});

// Update a profile
router.get('/:username', auth.required, function (req, res, next) {
  if (req.payload) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) { return res.json({ profile: req.profile.toProfileJSONFor(false) }); }

      return res.json({ profile: req.profile.toProfileJSONFor(user) });
    });
  } else {
    return res.json({ profile: req.profile.toProfileJSONFor(false) });
  }
});



router.post('/:username/follow', auth.required, function (req, res, next) {
  var profileId = req.profile._id;

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.NOT_FOUND));

    return user.follow(profileId).then(function () {
      return res.json({ profile: req.profile.toProfileJSONFor(user) });
    });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

router.delete('/:username/follow', auth.required, function (req, res, next) {
  var profileId = req.profile._id;

  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.NOT_FOUND));

    return user.unfollow(profileId).then(function () {
      return res.json({ profile: req.profile.toProfileJSONFor(user) });
    });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

module.exports = router;
