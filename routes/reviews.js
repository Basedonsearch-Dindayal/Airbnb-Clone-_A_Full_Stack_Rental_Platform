const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

// Create Review Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.renderNewReview));

// Delete Review Route
router.route("/:reviewId")
    .delete(isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;
