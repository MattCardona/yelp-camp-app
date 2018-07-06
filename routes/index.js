const express = require("express");
const router = express.Router();
const passport = require("passport");
const {User} = require("../models/user.js");

router.get("/", (req,res) => {
    res.status(200).render("landing");
});
//==============
//Auth Routes
//==============
//show register form
router.get("/register", (req,res) => {
    res.render("register");
});

//sign up logic
router.post("/register", (req,res) => {
    const password = req.body.password;
    const newUser = new User({username: req.body.username});
    //what this does is saves our newUser and also salts and hashes the password
    User.register(newUser, password).then((user) => {
        //login the user
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Welcome to YelpCamp ${user.username}`);
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
    res.render("login");
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

module.exports = router;