const reviewModel = require("./../Models/reviewModel");
const factory = require("./handlerFactory");

exports.getAllReviews = factory.getAll(reviewModel);

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReview = factory.getOne(reviewModel);
exports.createReview = factory.createOne(reviewModel);
exports.updateReview = factory.updateOne(reviewModel);
exports.deleteReview = factory.deleteOne(reviewModel);
