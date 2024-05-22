const express = require("express");

// -------------------------------------------------------
// NOTE: useful in scenarios where you have nested routers
// and need to access parameters from the parent router within
// the child router.
const router = express.Router({ mergeParams: true });
// -------------------------------------------------------

const reviewController = require("./../Controllers/reviewController");
const authController = require("./../Controllers/authController");

//POST /tour/234as9du9/reviews
//POST /reviews

//  Routes
router
  .route("/")
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.createReview
  );

router.route("/:id").get(reviewController.getReview); // Route to get a specific review

module.exports = router;
