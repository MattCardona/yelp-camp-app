const express = require("express");
const router = express.Router();
const passport = require("passport");
const {User} = require("../models/user.js");
const {Campground} = require("../models/campground.js");
const async = require('async');
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

//forgot password route
router.get("/forgot", (req, res) => {
    res.render("forgot");
});

router.post("/forgot", (req, res, next) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf){
                const token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({email: req.body.email}).then((user) => {
                if(!user){
                    req.flash("error", "No account with that email address exists");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done){
            const smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "elvisthebassethounddog@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: "elvisthebassethounddog@gmail.com",
                subject: "Password Reset YelpCamp",
                text: `You are recieving this because you ( or someone else ) have requested the reset of the password. Please click on the following link, or paste this into your browser to complete the process. http://${req.headers.host}/reset/${token}\n\n If you did not request this, please ignore this email and your password will remain unchanged.`
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log('mail sent');
                req.flash("success", `An e-mail has been sent to ${user.email} with further instructions.`);
                done(err, "done");
            });
        }
    ], function(err){
        if(err) return next(err);
        res.redirect("/forgot");
    })
});

//router reset password route
router.get("/reset/:token", (req, res) => {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}).then((user) => {
        if(!user){
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", {token: req.params.token});
    })
});

router.post("/reset/:token", (req, res) => {
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}).then((user) => {
                if(!user){
                    req.flash("error", "Password reset token is invalid or expired");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                        user.setPasswordToken = undefined;
                        user.setPasswordExpires = undefined;
                        user.save(function(err){
                            req.logIn(user, function(err){
                                done(err, user);
                            });
                        });
                    });
                }else{
                    req.flash("error", "Password does not match");
                    return res.redirect("back");
                }
            });
        },
        function(user, done){
            const smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "elvisthebassethounddog@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: "elvisthebassethounddog@gmail.com",
                subject: "Your Password has been changed",
                text: `Hello \n\n This is a confirmation that the password for you account ${user.email} has just been changed.`
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log('mail sent');
                req.flash("success", `Success! Your password has been changed!`);
                done(err);
            });
        }
    ], function(err){
        res.redirect("/campgrounds");
    });
});

//User profile route
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