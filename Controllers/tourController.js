// Import the tour model for database interaction
const tourModel = require("./../Models/tourModel");

// Middleware to set default query parameters for top tours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5"; // Limit the results to 5 tours
  req.query.sort = "-ratingsAverage,price"; // Sort by ratingsAverage in descending order, then by price
  req.query.fields = "name,price,ratingsAverage,summary,difficulty"; // Include only specific fields
  next(); // Move to the next middleware
};

// Get all tours based on provided query parameters
exports.getAllTours = async (req, res) => {
  try {
    // Create a copy of the request query parameters
    const reqQueryObj = { ...req.query };

    // Exclude certain fields from the query parameters
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete reqQueryObj[el]);

    // Convert the query object to a JSON string
    let filterQueryJSON = JSON.stringify(reqQueryObj);

    // Add "$" before certain filters for MongoDB compatibility
    filterQueryJSON = filterQueryJSON.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // Convert the "filterQueryJSON" back to JS format from JSON and then
    // Use the tour model to create a MongoDB query
    let mongooseQuery = tourModel.find(JSON.parse(filterQueryJSON));

    // Apply sorting if specified in the query parameters
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      mongooseQuery = mongooseQuery.sort(sortBy).sort("-createdAt");
    }

    // Apply field limiting if specified in the query parameters
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      mongooseQuery = mongooseQuery.select(fields);
    } else {
      mongooseQuery = mongooseQuery.select("-__v");
    }

    // Apply pagination to the query
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    mongooseQuery = mongooseQuery.skip(skip).limit(limit);

    // Check if a specific page exists based on the total number of tours
    if (req.query.page) {
      const numTours = await tourModel.countDocuments();
      if (skip >= numTours) throw new Error("This page does not exist");
    }

    // Execute the MongoDB query and store the results
    const tourResults = await mongooseQuery;

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

    // Send the successful response with the tour results
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

// Get a specific tour by its ID
exports.getTour = async (req, res) => {
  try {
    // Find a tour in the database by its ID
    const tourResult = await tourModel.findById(req.params.id);

    // Send a successful response with the tour result
    res.status(200).json({
      status: "Success",
      results: tourResult.length,
      data: { tourResult },
    });
  } catch (error) {
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

/* 
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  // use next();
  // otherwise the middeware will be stuck here and cannot move on
  next();
};

// Route Handler Functions
// Get all tours
exports.getAllTours = async (req, res) => {
  try {
    // Build query ----------------------------------------------------
    // ----------------------------------------------------------------

    // ----------------------------------------------------------------
    // 1-A) Filtering -------------------------------------------------
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);
    console.log(
      "\n req.query------>",
      req.query,
      "\n queryObj------->",
      queryObj
    );

    // -----------------------------------------------------------------
    // 1-B) Advanced Filtering -----------------------------------------
    // Here we change the "queryObj" into JSON format
    let queryStr = JSON.stringify(queryObj);

    // Here we add "$" before the following filters
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log("\n queryStr------->", queryStr);

    // {difficulty: "easy", duration: { $gte: 5} }
    // {difficulty: "easy", duration: { gte: 5} }
    // gte, gt, lte, lt

    /* const TOURS = await Tour.find()
    .where("duration")
    .equals(5)
    .where("difficulty")
    .equals("easy"); */

/*----------------------------------------------------------------
    The "Tour.find" will return a query.
    Here the variable "queryStr" is in JSON format.
    Since queries must be sent as Javascript object &
    NOT JSON we parse it back into JS object */
/*
    let query = Tour.find(JSON.parse(queryStr));
    // ----------------------------------------------------------------

    // ----------------------------------------------------------------
    // 2) Sorting -----------------------------------------------------
    if (req.query.sort) {
      // mongoose wil automatically sort the results
      const sortBy = req.query.sort.split(",").join(" ");
      console.log(sortBy);
      query = query.sort(sortBy);
      query = query.sort("-createdAt");
    }

    // ----------------------------------------------------------------
    // 3) Field Limiting-----------------------------------------------
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // ----------------------------------------------------------------
    // 4) pagination --------------------------------------------------
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    // skip = amount of results to skip,
    // limit = amount of results we want in the query
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error("This page does not exist");
    }
    // ----------------------------------------------------------------

    // ----------------------------------------------------------------
    // Execute the query-----------------------------------------------
    const TOURS = await query;
    // ----------------------------------------------------------------

    // Sends the response ---------------------------------------------

    // CHECK IF DATA IS EMPTY
    if (!TOURS || (Array.isArray(TOURS) && TOURS.length === 0)) {
      // Data is empty
      return res.status(200).json({
        status: "failed",
        message: "No data found",
      });
    }

    res.status(200).json({
      status: "Success",
      results: TOURS.length,
      data: { TOURS },
    });
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: err,
    });
  }
};

// ----------------------------------------------------------
// NOTE:
// query.sort().select().skip().limit()
// ---------- Each method returns a new query that we can then
// chain on the next method and then the next method until we
// finally await the query-----------------------------------
// ----------------------------------------------------------

// Get by ID
// -----------------------------------------
exports.getTour = async (req, res) => {
  try {
    const TOUR = await Tour.findById(req.params.id);
    // NOTE: mongoose makes it easier by using findByID
    // under the hood its:
    // Tour.findOne({_id: req.params.id})

    res.status(200).json({
      status: "Success",
      results: TOUR.length,
      data: { TOUR },
    });
  } catch (error) {
    res.status(404).json({
      status: "Failed",
      message: err,
    });
  }
  // const tourEntry = tours.find((el) => el.id === id);
  // res.status(200).json({
  //   status: "Success",
  //   data: {
  //     tourEntry,
  //   },
  // });
};

// POST tour
// -----------------------------------------
exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();

    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: "Success",
      data: { newTour },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};

// PATCH tour
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "Success",
      data: tour,
    });
  } catch (err) {
    res.status(400).json({
      status: "Bad request",
      message: err,
    });
  }
};

// DELETE tour
exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "Deleted",
      data: tour,
    });
  } catch (err) {}
};
 */
