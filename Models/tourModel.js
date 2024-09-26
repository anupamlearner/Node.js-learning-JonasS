const mongoose = require("mongoose");
const slugify = require("slugify");

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
    slug: String,
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
      set: (val) => Math.round(val * 10) / 10,
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
      default: Date.now,
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
      // WARNING: In GeoJSON strangely we have longitude 1st and latitude 2nd.
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
        // reference to another model
        //NOTE:
        //When using the --ref-- property in Mongoose schema definitions,
        //it expects the exact name of the model you're referencing.
        //So, if your model is defined with mongoose.model("BillBob", userSchema),
        //you should reference it in other schemas or code using "BillBob".
        /*
        The name inside the mongoose.model() function, 
        which is the first argument, must match exactly when referencing it
         in other parts of your code, such as schema definitions or queries
         */
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

/* ------------------------------------------------------------ */
// INDEXES
// Create a compound index in MongoDB: price ascending, ratingsAverage descending.
tourSchema.index({ price: 1, ratingsAverage: -1 });

// Create a unique index in MongoDB for fast querying by slug.
tourSchema.index({ slug: 1 });

// Create a 2dsphere index in MongoDB for geospatial queries on startLocation.
tourSchema.index({ startLocation: "2dsphere" });

// NOTE: Example of using slugs in URLs:
// A tour with the slug 'sea-surfer' can be accessed via:
// https://example.com/tours/sea-surfer

// Contrast with less friendly example:
// Instead of: https://example.com/tours/a56ha8s71234149shs8d
// Slugs like 'sea-surfer' are user-friendly identifiers improving URL readability.
// MongoDB's unique index on the 'slug' field ensures efficient retrieval of documents based on these identifiers.

/* ------------------------------------------------------------ */

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});
/* --------------------------------- */
// Document Middleware
// Runs before .save() and .create()
/* --------------------------------- */
tourSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

/* 
/ Define a function to fetch a guide object by its ID
async function fetchGuideById(guideId) {
  return await Guide.findById(guideId);
}

// Define the pre-save middleware function
tourSchema.pre('save', async function preSave(next) {
  try {
    // Fetch all potential guide objects using their IDs
    const potentialGuides = await Promise.all(this.guides.map(fetchGuideById));

    // Replace the IDs in the 'guides' array with the fetched guide objects
    this.guides = potentialGuides;

    next();
  } catch (error) {
    next(error);
  }
});
*/

/* --------------------------------- */
// Query Middleware
/* --------------------------------- */
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregation Middleware
/* tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});
 */
//-------------------------------------------------------------------
// This code runs before the aggregation operation starts.
// It allows us to modify the aggregation pipeline
//(a series of stages in MongoDB) before it executes.

tourSchema.pre("aggregate", function (next) {
  // Get the current pipeline (a list of stages)
  // that will be used in the aggregation operation.
  const pipeline = this.pipeline();
  console.log("Original Pipeline:", pipeline);

  // Look for a stage that uses the $geoNear operator,
  // which is used for geo-spatial queries.
  const geoNearStage = pipeline.find(
    (stage) => Object.keys(stage)[0] === "$geoNear"
  );

  if (geoNearStage) {
    // If $geoNear is found, make sure it is the first stage in the pipeline.
    if (pipeline.indexOf(geoNearStage) !== 0) {
      // Remove $geoNear from its current position.
      pipeline.splice(pipeline.indexOf(geoNearStage), 1);
      // Add $geoNear to the beginning of the pipeline.
      pipeline.unshift(geoNearStage);
    }

    // Check if the second stage is not $match.
    if (pipeline[1] && Object.keys(pipeline[1])[0] !== "$match") {
      // Insert $match as the second stage to filter out secret tours.
      pipeline.splice(1, 0, { $match: { secretTour: { $ne: true } } });
    } else if (!pipeline[1]) {
      // If there is no second stage, just add $match at the end.
      pipeline.push({ $match: { secretTour: { $ne: true } } });
    }
  } else {
    // If $geoNear is not present, add $match as the first stage in the pipeline.
    if (pipeline[0] && Object.keys(pipeline[0])[0] !== "$match") {
      // Insert $match at the beginning if it's not already there.
      pipeline.unshift({ $match: { secretTour: { $ne: true } } });
    } else if (!pipeline[0]) {
      // If the pipeline is empty, add $match as the first stage.
      pipeline.unshift({ $match: { secretTour: { $ne: true } } });
    }
  }

  // Update the pipeline with the modified stages.
  this.pipeline(pipeline);
  console.log("Modified Pipeline:", this.pipeline());

  // Proceed with the aggregation operation after modifying the pipeline.
  next();
});

const tourModel = mongoose.model("Tour", tourSchema);

module.exports = tourModel;
