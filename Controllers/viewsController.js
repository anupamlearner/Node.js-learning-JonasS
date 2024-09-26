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

exports.getTour = (req, res) => {
  res.status(200).render("tour", {
    title: "The Forest Hiker",
  });
};
