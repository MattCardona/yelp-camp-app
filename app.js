require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");
const path = require("path");
const flash = require("connect-flash");

//need to put in .env file
console.log(process.env.MONGODB_URI);
console.log(process.env.SESSION_SECRET);
const url = process.env.MONGODB_URI;

const {Campground} = require("./models/campground.js");
const {Comment} = require("./models/comment.js");
const {User} = require("./models/user.js");
const {seedDb} = require("./seeds.js");
const campgroundRoutes = require("./routes/campgrounds.js");
const commentRoutes = require("./routes/comments.js");
const indexRoutes = require("./routes/index.js");

// seedDb();//seed the database
const app = express();
const port  = process.env.PORT || 3000;

mongoose.Promise = global.Promise;
mongoose.connect(url)

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine", "ejs");
//===============
//Passport Config
//===============
//need to change the secrete to a proccess.env variable as well
app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(express.static(path.resolve(__dirname, "public")));
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

const isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
};

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);


app.listen(port, () => {
   console.log(`Yelp-Camp server up and running on port ${port}`);
});