const mongoose = require("mongoose");
const tourModel = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: "string",
      required: [true, "Review name cannot be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tour",
    select: "name",
  }).populate({
    path: "user",
    select: "name photo",
  });

  next();
}); */

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

// Assign a function to the "statics" object of our reviewSchema
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  console.log(tourId.toString());
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "tour",
        nRatings: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(stats);
  // save the statics to the current tour
  await tourModel.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRatings,
    ratingsAverage: stats[0].avgRating,
  });
};

// call the "calcAverageRatings" fxn after a new review has been created
reviewSchema.post("save", function name() {
  // "this" points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete

const reviewModel = mongoose.model("Review", reviewSchema);

module.exports = reviewModel;
