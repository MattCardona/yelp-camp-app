const express = require("express");
const router = express.Router();
const passport = require("passport");
const {User} = require("../models/user.js");
const {Campground} = require("../models/campground.js");


router.get("/", (req,res) => {
    res.status(200).render("landing");
});
//==============
//Auth Routes
//==============
//show register form
router.get("/register", (req,res) => {
    res.render("register", {page: "register"});
});

//sign up logic
router.post("/register", (req,res) => {
    const password = req.body.password;
    const {username, firstName, avatar, lastName, email} = req.body;
    const newUser = new User({
        username,
        firstName,
        lastName,
        avatar,
        email
    });
    console.log(newUser);
    if(req.body.admin === process.env.ADMIN_SAUCE){
        newUser.isAdmin = true;
    }
    //what this does is saves our newUser and also salts and hashes the password
    User.register(newUser, password).then((user) => {
        //login the user
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Successfully! Signed Up! Welcome to YelpCamp ${user.username}`);
            res.redirect("/campgrounds");
        });
    }).catch((err) => {
        req.flash("error", err.message);
        // console.log(`Error awww ${err}`);
        res.redirect("register")
    });
});

//Show Login form
router.get("/login", (req,res) => {
    res.render("login", {page: "login"});
});

//handles login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}),(req,res) => {
});

//logout route
router.get("/logout", (req,res) => {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

router.get("/users/:id", (req, res) => {
    User.findById(req.params.id).then((foundUser) => {
        Campground.find().where("author.id").equals(foundUser._id).exec().then((campgrounds) => {
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        }).catch((err) => {
            req.flash("error", "Something went wrong");
            return res.redirect("/");
            });
    }).catch((err) => {
        req.flash("error", "Something went wrong");
         return res.redirect("/");
    })
});

module.exports = router;