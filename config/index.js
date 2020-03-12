module.exports = {
  secret: process.env.NODE_ENV === 'PROD' ? process.env.SECRET : 'DEV'
};
