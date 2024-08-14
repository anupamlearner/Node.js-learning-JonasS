const express = require("express");
const router = express.Router();

const tourController = require("../Controllers/tourController");
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

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

router
  .route("/tours-within/:distance/center/:latLong/unit/:unit")
  .get(tourController.getToursWithin);
//tours-within?distance=233&center=-40,45&unit=mi
//tours-within//233/-40,45/unit/mi

router.route("/distance/:latLong/unit/:unit").get(tourController.getDistance);

//  Routes
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    // Middleware to ensure user is authenticated
    authController.protect,
    // Specify who gets to delete stuff
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
