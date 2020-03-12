module.exports = {
  secret: process.env.node_env === 'PROD' ? process.env.secret : 'DEV'
};
