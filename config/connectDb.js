mongoose = require('mongoose');
var createError = require('http-errors');
var httpStatus = require('http-status');


const connection = {};


let uri = process.env.MONGO_URI;
uri = uri.replace('<username>', process.env.MONGO_USR).replace('<password>', process.env.MONGO_PWD);

async function connectDb() {
  //  use new database connection
  if (connection.isConnected) {
    // Use exsisting database connection
    console.warn('Using existing connection')
    return;
  }


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