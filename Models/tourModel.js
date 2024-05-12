const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  // Schema Definitions --------------------------------
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
      trim: true,
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a max group size"],
      trim: true,
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Values must be either easy, medium or difficult",
      },
      trim: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      trim: true,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Must specify price for tour"],
      trim: true,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
      trim: true,
    },
    description: {
      type: String,
      trim: [true, "A tour must have a description"],
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
      trim: true,
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      // select false hides this from the output
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      // NOTE: GeoJSON---------------------------------------------------------------
      //GeoJSON is a format for storing geographic points and polygons.
      //MongoDB has excellent support for geospatial queries on GeoJSON objects.
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      // In GeoJSON strangely we have longitude 1st and latitude 2nd.
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },

  // Schema Options --------------------------------
  //------------------------------------------------
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

const tourModel = mongoose.model("Tour", tourSchema);

module.exports = tourModel;
