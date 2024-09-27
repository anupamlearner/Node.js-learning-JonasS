const tourModel = require("../Models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get all tour data from collection
  const allTours = await tourModel.find();
  //  2) Build template

  //  3) Render template using tour data from step 1

  res.status(200).render("overview", {
    title: "All Tours",
    allTours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  //1) Get data, for requested tour including REVIEWS & GUIDES
  const tour = await tourModel.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  //2) Build template

  //3) Render template using the data from step 1)

  res.status(200).render("tour", {
    title: tour.name,
    tour,
  });
});
