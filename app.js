const express = require("express"); // Importing express library
const morgan = require("morgan"); // Importing morgan library for logging
const rateLimit = require("express-rate-limit"); // Importing rate-limiting middleware
const helmet = require("helmet"); // Importing helmet for security headers
const mongoSanitize = require("express-mongo-sanitize"); // Importing mongo-sanitize for data sanitization
const xss = require("xss-clean"); // Importing xss-clean for preventing XSS attacks
const hpp = require("hpp"); // Importing hpp for preventing parameter pollution
const path = require("path"); // Importing path module

const errorHandler = require("./Controllers/errorController"); // Importing error handling controller
const AppError = require("./utils/appError"); // Importing custom error class
const tourRouter = require("./Routes/tourRoutes"); // Importing tour routes
const userRouter = require("./Routes/userRoutes"); // Importing user routes
const reviewRouter = require("./Routes/reviewRoutes"); // Importing review routes
const viewRouter = require("./Routes/viewRoutes"); // Importing view routes

const app = express(); // Creating express application

// app.set(settingName, value) --- Configures a setting for Express

// Set up Pug as the template engine for rendering views
app.set("view engine", "pug");
// Specify the directory where the view files (Pug templates) are located
app.set("views", path.join(__dirname, "Views"));

// Serving static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Set Security HTTP Header
app.use(helmet({ xssFilter: true })); // Applying helmet middleware for security headers

// Set request rate limiting
const requestLimiter = rateLimit({
  max: 100, // Maximum allowed requests
  windowMs: 60 * 60 * 1000, // Time window for maximum requests
  message: "Too many requests from this IP, please try again in an hour", // Error message for exceeding limit
});
app.use("/api", requestLimiter); // Applying rate limiting middleware for all routes under '/api'

// Development Logging
if (process.env.NODE_ENV === "development") {
  // Check if environment is development
  app.use(morgan("dev")); // Use morgan middleware for logging in development environment
}

// Body Parser Middleware: parsing request data into JSON format
app.use(express.json()); // Parsing JSON request bodies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "difficulty",
      "duration",
      "maxGroupSize",
      "price",
      "ratingsAverage",
      "ratingsQuantity",
    ],
  })
);

// Middleware to add request time to request object
app.use((req, res, next) => {
  // Adding request time to request object
  req.requestTime = new Date().toISOString();
  next(); // Move to the next middleware
});

//------------------------------------------
// Routes (mounting routers)
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter); // Using tour routes
app.use("/api/v1/users", userRouter); // Using user routes
app.use("/api/v1/reviews", reviewRouter); // Using review routes

// Handling unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404)); // Creating and passing error to next middleware
});

app.use(errorHandler); // Global error handling middleware
module.exports = app; // Exporting the express application
