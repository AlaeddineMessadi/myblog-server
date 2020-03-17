var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');
var connectDb = require('../../config/connectDb');
var mailer = require('../../utils/mailer');
var createError = require('http-errors');
var httpStatus = require('http-status');


connectDb();

// {
//   const { role } = req.user;
// if (role !== 'admin') {
//   return res.sendStatus(403);
//   }
// }


router.get('/', auth.required, async function (req, res, next) {


  // the Authorization should be handled first by express-jwt as auth.required, a second layer
  User.findById(req.payload.id).then(function (user) {
    if (!user) return next(createError(httpStatus.NOT_FOUND));

    return res.json({ user: user.toAuthJSON() });
  }).catch(next);
});

// update user
router.put('/', auth.required, function (req, res, next) {

  User.findById(req.payload.id).then(function (user) {

    // just incase if the user was not found
    if (!user) return next(createError(httpStatus.NOT_FOUND));

    // only update fields that were actually passed...
    if (typeof req.body.user.username !== 'undefined') {
      user.username = req.body.user.username;
    }

    if (typeof req.body.user.email !== 'undefined') {
      user.email = req.body.user.email;
    }
    if (typeof req.body.user.bio !== 'undefined') {
      user.bio = req.body.user.bio;
    }
    if (typeof req.body.user.image !== 'undefined') {
      user.image = req.body.user.image;
    }
    if (typeof req.body.user.password !== 'undefined') {
      user.setPassword(req.body.user.password);
    }



    console.log('my pfole')
    return user.save().then(function () {
      return res.json({ user: user.toAuthJSON() });
    });


  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

//  register a user
router.post('/', async function (req, res, next) {
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user.save().then(async function () {
    // prepare email:
    const objectMail = { from: 'example@example.com', to: 'alaeddine.messadi@gmail.com', subject: 'Activate your account' };
    const data = {
      name: user.username,
      activationLink: `http://localhost:3000/api/users/activation?hash=${user.activationHash}`,
      text: 'Thank you for registration, please activate your account using this link',
      button: "ACTIVATE LINK"
    };
    // const response = await mailer(objectMail, data);
    return res.json({ user: user.toAuthJSON() });
  }).catch(e => next(createError(httpStatus.INTERNAL_SERVER_ERROR)));
});

router.get('/activation', function (req, res, next) {
  const { hash } = req.query;

  if (!hash) {
    return next(createError(httpStatus.UNPROCESSABLE_ENTITY, 'ACTIVATION Code is not provided'));
  }

  User.findOne({ activationHash: hash }).then(user => {
    if (user.activate(hash)) {
      return user.save().then(function () {
        return res.json({ ...user.toJSON, message: 'User is activated' });
      });
    }
    return next(createError(httpStatus.INTERNAL_SERVER_ERROR, `User ${user.username} cannot be Activated`));
  }).catch(error => {
    return next(createError(httpStatus.UNPROCESSABLE_ENTITY, 'Activation code is incorrect'));
  });
});



router.post('/login', function (req, res, next) {
  if (!req.body.user.email) {
    return next(createError(httpStatus.UNPROCESSABLE_ENTITY, `Email can't be blank`));
  }

  if (!req.body.user.password) {
    return next(createError(httpStatus.UNPROCESSABLE_ENTITY, `Password can't be blank`));

  }

  passport.authenticate('local', { session: false }, function (err, user, info) {
    if (err) { return next(err); }

    if (!user.isActive) return next(createError(httpStatus.METHOD_NOT_ALLOWED, `User is not activated`));

    if (user) {
      user.token = user.generateJWT();
      return res.json(user.toAuthJSON());
    } else {
      return next(createError(httpStatus.UNPROCESSABLE_ENTITY, info));
    }
  })(req, res, next);
});


module.exports = router;
