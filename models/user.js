const mongoose = require('mongoose')
const marked = require('marked')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  googleId: String,
  fav:{
       type: String
 },
  secret: String
},

);
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.pre('validate', function(next) {
//        next();
// });

module.exports = mongoose.model('User', userSchema)
