const express = require("express");
const router = express.Router({mergeParams: true});
const {Campground} = require("../models/campground.js");
const {Comment} = require("../models/comment.js");
const {isLoggedIn, checkCommentOwnership} = require("../middleware")

router.get("/new", isLoggedIn, (req,res) => {
    let id = req.params.id;
    Campground.findById({_id: id}).then((doc) => {
        res.status(200).render("comments/new", {campground: doc});
    }).catch((err) => {
        // console.log(`Error: ${err}`);
        res.status(400);
    });
});

router.post("/", isLoggedIn, (req,res) => {
    let id = req.params.id;
    let comment = req.body.comment;
    Campground.findById({_id: id}).then((camp) => {
        new Comment(comment).save().then((newcomment) => {
            newcomment.author.id = req.user._id;
            newcomment.author.username = req.user.username;
            newcomment.save();
            // console.log(newcomment);
            camp.comments.push(newcomment);
            camp.save().then((campwcomment) => {
                // console.log(`Saved new comment ${campwcomment}`);
                req.flash("success", "Successfully added comment");
                res.status(200).redirect(`/campgrounds/${id}`);
            }).catch((err) => {
                // console.log(`Error w/ saving comment ${err}`);
            });
        })
    }).catch((err) => {
        req.flash("error", "Something went wrong")
        // console.log(`Error: ${err}`);
        res.status(400).redirect("/campgrounds");
    });
});

//edit comment route
router.get("/:comment_id/edit", checkCommentOwnership, (req, res) => {
    let id = req.params.id;
    let commentId = req.params.comment_id;
    Comment.findById({_id: commentId}).then((foundComment) => {
        res.render("comments/edit", {campground_id: id, comment: foundComment});
    }).catch((err) => {
        // console.log(`Error trying to get the comment ${err}`);
        res.redirect("back");
    })
});
//comment update
router.put("/:comment_id", checkCommentOwnership, (req, res) => {
    let id = req.params.id;
    let commentId = req.params.comment_id;
    let comment = req.body.comment;
    Comment.findByIdAndUpdate({_id: commentId}, comment).then((updatedComment) => {
        res.redirect(`/campgrounds/${id}`);
    }).catch((err) => {
        res.redirect("back");
    });
});
//comment delete
router.delete("/:comment_id", checkCommentOwnership, (req,res) => {
    let commentId = req.params.comment_id;
    Comment.findByIdAndDelete({_id: commentId}).then((deletedComment) => {
        req.flash("success", "Comment deleted");
        res.redirect(`/campgrounds/${id}`);
    }).catch((err) => {
        res.redirect("back");
    });
});

module.exports = router;