const Listing = require("./models/listing");
const Review = require("./models/review");
const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError");
const { listingSchema,reviewSchema } = require("./schema");

module.exports.isLoggedIn = (req,res,next) =>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","you must login first to create listing");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ExpressError(400, "Invalid listing id"));
    }

    let listing = await Listing.findById(id);
    if (!listing) {
        return next(new ExpressError(404, "Listing not found"));
    }

    if (!res.locals.currUser) {
        req.flash("error", "You must login first");
        return res.redirect("/login");
    }

    if (!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of the listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
module.exports.isReviewAuthor = async (req, res, next) => {
    let {id , reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return next(new ExpressError(400, "Invalid review id"));
    }

    let review = await Review.findById(reviewId);
    if (!review) {
        return next(new ExpressError(404, "Review not found"));
    }

    if (!res.locals.currUser) {
        req.flash("error", "You must login first");
        return res.redirect("/login");
    }

    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error","You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Middleware for listing validation
module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Middleware for review validation
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};