mongoose = require('mongoose');

if (!process.env.now) require("dotenv").config();


console.log('connect to the database');


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
    console.warn('DB is connected');
    connection.isConnected = db.connections[0].readyState;
  } catch (exception) {
    const error = new Error(exception);
    console.log('cant connect to the database')
    throw error;
  }
}

module.exports = connectDb;

// if (isProduction) {
//   console.warn('this is production for mongo')
//   mongoose.connect(uri);
// } else {
//   console.warn('process.env.NODE_ENV ', process.env.NODE_ENV);


// }