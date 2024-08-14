const tourModel = require("../Models/tourModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = factory.getAll(tourModel);
exports.getTour = factory.getOne(tourModel, { path: "reviews" });
exports.createTour = factory.createOne(tourModel);
exports.updateTour = factory.updateOne(tourModel);
exports.deleteTour = factory.deleteOne(tourModel);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await tourModel.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        totalTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
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

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await tourModel.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

//tours-within/:distance/center/:latlong/unit/:unit
//tours-within//233/34.115228,-118.132447/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latLong, unit } = req.params;
  const [lat, long] = latLong.split(",");

  const radius = unit === "mi" ? distance / 3663.2 : distance / 6378.1;
  console.log(lat, long, radius);
  if (!lat || !long) {
    next(new AppError("Please provide in the format lat, long", 400));
  }
  const tourResults = await tourModel.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  });
  res.status(200).json({
    status: "success",
    results: tourResults.length,
    data: {
      data: tourResults,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latLong, unit } = req.params;
  const [lat, long] = latLong.split(",");
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !long) {
    next(new AppError("Please provide in the format lat, long", 400));
  }

  const distance = await tourModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "point",
          coordinates: [long * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: distance,
  });
});
