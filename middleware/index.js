const {Campground} = require("../models/campground.js");
const {Comment} = require("../models/comment.js");

const isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
};

const checkCommentOwnership = (req, res, next) => {
    let commentid = req.params.comment_id;
    if(req.isAuthenticated()){
        Comment.findById({_id: commentid}).then((fulldoc) => {
                ///does the user own the comment?
                if(fulldoc.author.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }
            }).catch((err) => {
                req.flash("error", "Commment not found");
                // console.log(`Unable to get ${err}`);
                res.redirect("back");
            });
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};

const checkCampgroundOwnership = (req, res, next) => {
    let id = req.params.id;
    if(req.isAuthenticated()){
        Campground.findById({_id: id}).then((fulldoc) => {
                if(fulldoc.author.id.equals(req.user._id)){
                    next();
                }else{
                  req.flash("error", "You don't have permission to do that.");
                    res.redirect("back");
                }
            }).catch((err) => {
                req.flash("error", "Campground not found");
                // console.log(`Unable to get ${err}`);
                res.redirect("back");
            });
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
};

module.exports = {isLoggedIn, checkCommentOwnership, checkCampgroundOwnership};