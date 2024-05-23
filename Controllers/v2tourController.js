const tourModel = require("./../Models/tourModel");
const APIFeatures = require("./../utils/v2APIFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // Execute Query
  const tourQueryHandler = new APIFeatures(tourModel.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tourResults = await tourQueryHandler.execute();

  // Check if data is empty
  if (
    !tourResults ||
    (Array.isArray(tourResults) && tourResults.length === 0)
  ) {
    return res.status(200).json({
      status: "failed",
      message: "No data found",
    });
  }

  // Send Response
  res.status(200).json({
    status: "success",
    results: tourResults.length,
    data: {
      tours: tourResults,
    },
  });
});

// Get a specific tour by its ID
exports.getTour = catchAsync(async (req, res, next) => {
  // Find a tour in the database by its ID
  const tourResults = await tourModel
    .findById(req.params.id)
    .populate("reviews");

  if (!tourResults) {
    return next(new AppError("No tour found with that ID", 404));
  }
  // Send a successful response with the tour result
  res.status(200).json({
    status: "Success",
    results: tourResults.length,
    data: { tourResults },
  });
});

// Create a new tour based on the provided data
exports.createTour = catchAsync(async (req, res, next) => {
  const newTourData = await tourModel.create(req.body);
  // Send a successful response with the new tour data
  res.status(201).json({
    status: "Success",
    data: newTourData,
  });
});

// Update a specific tour by its ID with new data
exports.updateTour = catchAsync(async (req, res, next) => {
  // Find and update a tour in the database by its ID with the new data
  const updatedTour = await tourModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedTour) {
    return next(new AppError("No tour found with that ID", 404));
  }
  // Send a successful response with the updated tour data
  res.status(200).json({
    status: "Success",
    data: updatedTour,
  });
});

// Delete a specific tour by its ID

exports.deleteTour = factory.deleteOne(tourModel);

/* exports.deleteTour = catchAsync(async (req, res, next) => {
  // Find and delete a tour in the database by its ID
  const tourResults = await tourModel.findByIdAndDelete(req.params.id);

  if (!tourResults) {
    return next(new AppError("No tour found with that ID", 404));
  }
  // Send a response indicating the successful deletion
  res.status(204).json({
    status: "Deleted",
    data: null,
  });
}); */

// ... (other controller methods)

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await tourModel.aggregate([
    {
      $match: { ratingsAverage: { $gte: 1 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },

        totalTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRaring: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: "EASY" } },
    // },
  ]);

  res.status(200).json({
    status: "Success",
    data: {
      stats,
    },
  });
});
