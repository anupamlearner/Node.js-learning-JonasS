const express = require("express");

// -------------------------------------------------------
// NOTE: useful in scenarios where you have nested routers
// and need to access parameters from the parent router within
// the child router.
const router = express.Router({ mergeParams: true });
// -------------------------------------------------------

const reviewController = require("./../Controllers/reviewController");
const authController = require("./../Controllers/authController");

router.use(authController.protect);

//  Routes
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  )
  .delete(
    // Specify who gets to delete stuff
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview
  );

module.exports = router;
