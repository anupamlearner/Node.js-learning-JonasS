const tourModel = require("../Models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get all tour data from collection
  const allTours = await tourModel.find();
  //  2) Build template

  //  3) Render template using tour data from step 1

  res.status(200).render("overview", {
    // Pass a fixed title "All Tours" to the template
    title: "All Tours",
    // Pass the 'allTours' array (list of tours) to the template
    allTours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  // I) Get data, for requested tour including REVIEWS & GUIDES
  const tour = await tourModel.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  // II) Build template

  // III) Render template using the data from step I)

  res.status(200).render("tour", {
    // Pass the tour name as a LOCAL VARIABLE 'title' to the template
    title: tour.name,
    // Pass the entire 'tour' object as a LOCAL VARIABLE to the template
    tour,
  });
});
