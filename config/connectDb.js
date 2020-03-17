mongoose = require('mongoose');
var createError = require('http-errors');
var httpStatus = require('http-status');


if (!process.env.now) require("dotenv").config();

// var createError = require('http-errors');

const connection = {};

if (connection.isConnected) {
  // Use exsisting database connection
  console.warn('using existing connection')
  return;
}

let uri = process.env.mongo_uri;
uri = uri.replace('<username>', process.env.mongo_usr).replace('<password>', process.env.mongo_pwd);

async function connectDb() {
  //  use new database connection
  try {
    const db = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useCreateIndex: true
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('Connected to Database')
  } catch (exception) {
    const error = createError(httpStatus.INTERNAL_SERVER_ERROR, exception);
    console.error({ status: error.status, name: error.name, message: `Cannot connect to the Database : ${error.message}` });
  }
}

module.exports = connectDb;

// if (isProduction) {
//   console.warn('this is production for mongo')
//   mongoose.connect(uri);
// } else {
//   console.warn('process.env.NODE_ENV ', process.env.NODE_ENV);


// }