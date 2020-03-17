var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');

var ArticleSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: String,
  description: String,
  body: String,
  image: String,
  imgcaption: String,
  duration: { type: Number, default: 5 },
  favoritesCount: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tagList: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' });

ArticleSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify(this.title);
    next();
  }

  this.slugify(this.slug);
  next();
});

ArticleSchema.methods.slugify = function (text = '') {
  this.slug = slug(text || this.slug);
  // uncomment this if you want some Random hash at the end
  // + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
};

ArticleSchema.methods.updateFavoriteCount = function () {
  var article = this;

  return User.count({ favorites: { $in: [article._id] } }).then(function (count) {
    article.favoritesCount = count;

    return article.save();
  });
};

ArticleSchema.methods.toJSONFor = function (user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    image: this.image,
    imgcaption: this.imgcaption,
    duration: this.duration,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList.filter(e => e),
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  };
};

mongoose.model('Article', ArticleSchema);
