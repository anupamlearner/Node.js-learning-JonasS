const express = require("express");
const router = express.Router();

const reviewController = require("./../Controllers/reviewController");
const authController = require("./../Controllers/authController");

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
