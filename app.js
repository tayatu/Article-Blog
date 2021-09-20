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
app.use(methodOverride('_method'))
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://sarthak_paliwal:sarthak123@blogdb.rt7uc.mongodb.net/blogDB", {
     useNewUrlParser: true,
     useUnifiedTopology: true
});
// mongoose.connect('mongodb://localhost/userDB', {
//   useNewUrlParser: true, useUnifiedTopology: true
// });
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
    callbackURL: "https://young-gorge-34969.herokuapp.com/auth/google/blog"
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

app.get("/auth/google/blog",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/articles");
  });

app.get("/login", function(req, res){
     let flag=0;
     let errorMessage=" ";
  if (req.isAuthenticated()){
    res.redirect("/articles");
  } else {
    res.render("login",{flag:flag ,errorMessage:errorMessage});
  }
});

app.get("/register", function(req, res){
     let flag=0;
     let errorMessage=" ";
     if (req.isAuthenticated()){
       res.redirect("/articles");
     } else {
       res.render("register",{flag:flag ,errorMessage:errorMessage});
     }

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

     if(textUsername.length<=5){
          errorMessage='Username must be of 6 characters' ;
          flag=1;
          res.render("register",{flag:flag ,errorMessage:errorMessage});
     }
	if (plainTextPassword.length < 5) {
		 errorMessage ='Password should be atleast 6 characters';
           flag=1;
           res.render("register",{flag:flag ,errorMessage:errorMessage});
	}
     User.register(Users, req.body.password, function(err, user){
          if (err) {
               console.log(err);
               flag=1;
               errorMessage="User already exists";
               res.render("register",{flag:flag ,errorMessage:errorMessage});
          } else {
               passport.authenticate("local")(req, res, function(){
               res.redirect("/articles");
               });
          }
     });
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
        passport.authenticate("local")(req, res, function(){
         res.redirect("/articles");
      });
    }

  });

});

app.use('/articles', articleRouter)

let port=process.env.PORT;
app.listen(port || 3000, function() {
  console.log("Server started on port 3000.");
});
