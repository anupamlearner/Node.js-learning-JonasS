const express = require("express");
const router = express.Router();

const tourController = require("../Controllers/v2tourController");
const authController = require("../Controllers/authController");
const reviewRouter = require("./../Routes/reviewRoutes");
// router.param("id", tourController.checkId);
// router.param("id", tourController.checkBody);

// ------------------------------------------------
// Mount the review router as a child router
//POST /tour/234as9du9/reviews
//GET /tour/234as9du9/reviews
router.use("/:tourId/reviews", reviewRouter);
// ------------------------------------------------

// Top 5 Affordable tours
router
  .route("/top-5-budget")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
//  Routes
router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour) // Route to get a specific tour
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  ) // Route to update a specific tour
  .delete(
    // Middleware to ensure user is authenticated and retrieve user information
    authController.protect,
    // Specify who gets to delete stuff
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour // Route handler to delete a tour
  );

module.exports = router;
