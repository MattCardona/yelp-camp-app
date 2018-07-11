const express = require("express");
const router = express.Router();
const {Campground} = require("../models/campground.js");
const {Comment} = require("../models/comment.js");
const {isLoggedIn, checkCampgroundOwnership} = require("../middleware");

const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

router.get("/", (req,res) => {
    let noMatch;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({name: regex}).then((campgrounds) => {
            if(campgrounds.length < 1){
                noMatch = "No campgrounds match that query, please try again.";
            }
            res.status(200).render("campgrounds/index", {campsites: campgrounds, page: "campgrounds", noMatch: noMatch});
        }, (err) => {
            // console.log(`Unable to get ${err}`);
            res.status(400);
        }).catch((error) => {
            // console.log(`Error in catch ${error}`);
            res.status(400);
        })
    }else{
        Campground.find({}).then((campgrounds) => {
            res.status(200).render("campgrounds/index", {campsites: campgrounds, page: "campgrounds", noMatch: noMatch});
        }, (err) => {
            // console.log(`Unable to get ${err}`);
            res.status(400);
        }).catch((error) => {
            // console.log(`Error in catch ${error}`);
            res.status(400);
        })
    }
});
//add new campground to database
router.post("/", isLoggedIn, (req,res) => {
    let name = req.body.name;
    let image = req.body.image;
    let description = req.body.description;
    let price = req.body.price;
    let author = {
        id: req.user._id,
        username: req.user.username
    };
    let newCampground = new Campground({name: name, image: image, description: description, author: author, price: price});
    newCampground.save().then((doc) => {
        // console.log(`You added ${JSON.stringify(doc, undefined, 2)}`);
    }, (err) => {
        // console.log(`Unable to save to database ${err}`);
        res.status(400);
    });
    res.status(200).redirect("/campgrounds");
});

router.get("/new", isLoggedIn, (req,res) => {
    res.status(200).render("campgrounds/new.ejs");
});

router.get("/:id", (req,res) => {
    let id = req.params.id;
    Campground.findById({_id: id}).populate("comments").exec().then((fulldoc) => {
            if(!fulldoc){
                req.flash("error", "Campground not found");
                res.status(400).redirect("/campgrounds");
            }else{
            res.status(200).render("campgrounds/show", {campground: fulldoc});
            }
        }).catch((err) => {
            // console.log(`Unable to get ${err}`);
            req.flash("error", "Campground not found");
            res.status(400).redirect("/campgrounds");
        });
});

//Edit campground route
router.get("/:id/edit", checkCampgroundOwnership, (req, res) => {
    let id = req.params.id;
    Campground.findById({_id: id}).then((fulldoc) => {
            res.status(200).render("campgrounds/edit", {campground: fulldoc});
        }).catch((err) => {
            // console.log(`Unable to get ${err}`);
            req.flash("error", "Campground not found");
            res.status(400).redirect("/campgrounds");
        });
});

//Update campground route
router.put("/:id", checkCampgroundOwnership, (req, res) => {
    let id = req.params.id;
    Campground.findByIdAndUpdate({_id: id}, req.body.campground).then((updatedCamp) => {
        // console.log(JSON.stringify(updatedCamp, undefined, 2));
        res.redirect(`/campgrounds/${id}`);
    }).catch((err) => {
        // console.log(`Error with update to campground ${err}`);
        res.redirect("/campgrounds");
    });
});

//Destroy Campground route
router.delete("/:id", checkCampgroundOwnership, (req, res) => {
    let id = req.params.id;
    Campground.findByIdAndDelete({_id: id}).then((doc) => {
        // console.log(JSON.stringify(doc, undefined, 2));
        res.redirect("/campgrounds");
    }).catch((err) => {
        // console.log(`Error with delete to campground ${err}`);
        res.redirect("/campgrounds");
    });

});



module.exports = router;