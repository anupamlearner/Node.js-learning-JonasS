/*
const tourModel = require("./../Models/tourModel");
const APIFeatures = require("./../utils/v2APIFeatures");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
// Get a specific tour by its ID
exports.getTour = async (req, res) => {
  try {
    // Find a tour in the database by its ID
    const tourResults = await tourModel.findById(req.params.id);

    // Send a successful response with the tour result
    res.status(200).json({
      status: "Success",
      results: tourResults.length,
      data: { tourResults },
    });
  } catch (err) {
    // Handle errors and send a response with an error message
    res.status(404).json({
      status: "Failed",
      message: err,
    });
  }
};

// Create a new tour based on the provided data
exports.createTour = async (req, res) => {
  try {
    // Create a new tour in the database using the provided data
    const newTourData = await tourModel.create(req.body);

    // Send a successful response with the new tour data
    res.status(201).json({
      status: "Success",
      data: { newTourData },
    });
  } catch (err) {
    // Handle errors and send a response with an error message
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};

// Update a specific tour by its ID with new data
exports.updateTour = async (req, res) => {
  try {
    // Find and update a tour in the database by its ID with the new data
    const updatedTour = await tourModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    // Send a successful response with the updated tour data
    res.status(200).json({
      status: "Success",
      data: updatedTour,
    });
  } catch (err) {
    // Handle errors and send a response with an error message
    res.status(400).json({
      status: "Bad request",
      message: err,
    });
  }
};

// Delete a specific tour by its ID
exports.deleteTour = async (req, res) => {
  try {
    // Find and delete a tour in the database by its ID
    const deletedTour = await tourModel.findByIdAndDelete(req.params.id);

    // Send a response indicating the successful deletion
    res.status(204).json({
      status: "Deleted",
      data: deletedTour,
    });
  } catch (err) {
    // Handle errors (if any) and proceed
  }
};

// ... (other controller methods)

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};
*/
