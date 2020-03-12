var http = require('http'),
  path = require('path'),
  methods = require('methods'),
  express = require('express'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  cors = require('cors'),
  passport = require('passport'),
  errorhandler = require('errorhandler');

var mailer = require('./utils/mailer');

if (!process.env.now) require("dotenv").config();

var isProduction = process.env.node_env === 'PROD';
var port = process.env.now ? 8080 : 4000;

// Create global app object
var app = express();

app.use(cors());

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('method-override')());
app.use(express.static(__dirname + '/public'));


app.use(session({
  secret: 'conduit',
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true
}));

if (!isProduction) {
  app.use(errorhandler());
}


require('./models/User');
require('./models/Article');
require('./models/Comment');
require('./config/passport');

var apiRoutes = require('./routes');


app.use('/health', async function (req, res, next) {
  console.log(' this is the mailer')
  const result = await mailer();
  console.log('this si result ', result)
  res.json({ message: 'here we go' })
});

app.use(apiRoutes);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function (err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({
      'errors': {
        message: err.message,
        error: err
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    'errors': {
      message: err.message,
      error: {}
    }
  });
});

// finally, let's start our server...
var server = app.listen(process.env.port || 3000, function () {
  console.log('Listening on port ' + server.address().port);
});


// app.set('port', process.env.PORT || 3000)

// module.exports = app;