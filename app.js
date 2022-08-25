//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const flash = require('express-flash')
const articleRouter = require('./routes/articles')
const methodOverride = require('method-override')

const Article = require('./models/article')
const User = require("./models/user")

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(flash())
app.use(methodOverride('_method'))
app.use(session({
  secret: "Mysecret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'))

// mongoose.connect("mongodb+srv://sarthak_paliwal:sarthak123@blogdb.rt7uc.mongodb.net/?retryWrites=true&w=majority", {
//      useNewUrlParser: true,
//      useUnifiedTopology: true
// });

mongoose.connect('mongodb://localhost/userDB', {
  useNewUrlParser: true, useUnifiedTopology: true
});


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {

  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    // callbackURL: "https://young-gorge-34969.herokuapp.com/auth/google/blog"
    callbackURL:"http://localhost:3000/auth/google/article",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
         console.log(profile.id);
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
     if (req.isAuthenticated()){
          res.redirect("/articles")
     } else{
          res.render("home");
     }

});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/article",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/articles");
  });

app.get("/login", function(req, res){
  if (req.isAuthenticated()){
    res.redirect("/articles");
  } else {
    res.render("login");
  }
});

app.get("/register", function(req, res){
     if (req.isAuthenticated()){
       res.redirect("/articles");
     } else {
       res.render("register");
     }

});

app.get("/tryAgain", function(req, res){
    res.render("tryAgain");
});

app.get("/articles" , async (req, res) => {
  if (req.isAuthenticated()){
       const articles = await Article.find().sort({ createdAt: 'desc' })
       res.render('articles/index', { articles: articles });
  } else {
    res.redirect("/login");
  }
});

app.get("/myarticle", function(req, res){
  if (req.isAuthenticated()){
    res.render("myArticle");
  } else {
    res.redirect("/login");
  }
});
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});
app.post("/register", function(req, res,err){
     if(err){
          console.log(err);
     }
     let Users=new User({username : req.body.username});
     var plainTextPassword=req.body.password;
     var textUsername=req.body.username;
     User.register(Users, req.body.password, function(err, user){
          if (err) {
               console.log(err);
               res.render("register");
          } else {
               passport.authenticate("local")(req, res, function(){
                res.redirect("/articles");
               });


          }
     });
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/tryAgain',
  failureFlash: true
}))

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.use('/articles', articleRouter)

let port=process.env.PORT;
app.listen(port || 3000, function() {
  console.log("Server started on port 3000.");
});
