const reviewModel = require("./../Models/reviewModel");
const APIFeatures = require("./../utils/v2APIFeatures");
const catchAsync = require("./../utils/catchAsync");
const appError = require("./../utils/appError");

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // Execute Query
  const reviewQueryHandler = new APIFeatures(reviewModel.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviewResults = await reviewQueryHandler.execute();

  // Check if data is empty
  if (
    !reviewResults ||
    (Array.isArray(reviewResults) && reviewResults.length === 0)
  ) {
    return res.status(200).json({
      status: "failed",
      message: "No data found",
    });
  }
  // Send Response
  res.status(200).json({
    status: "success",
    results: reviewResults.length,
    data: {
      reviews: reviewResults,
    },
  });
});

// Get a specific review by its ID
exports.getReview = catchAsync(async (req, res, next) => {
  // Find a review in the database by its ID
  const reviewResults = await reviewModel.findById(req.params.id);

  if (!reviewResults) {
    return next(new AppError("No review found with that ID", 404));
  }
  // Send a successful response with the review result
  res.status(200).json({
    status: "Success",
    results: reviewResults.length,
    data: {
      review: reviewResults,
    },
  });
});

// Create a new review based on the provided data
exports.createReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReviewData = await reviewModel.create(req.body);
  // Send a successful response with the new review data
  res.status(201).json({
    status: "Success",
    data: {
      review: newReviewData,
    },
  });
});
