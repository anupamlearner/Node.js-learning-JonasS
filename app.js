const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const globalErrorHandler = require("./Controllers/errorController");
const AppError = require("./utils/appError");
const tourRouter = require("./Routes/tourRoutes");
const userRouter = require("./Routes/userRoutes");

const app = express();

// Global Middlewares
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "too many requests from this IP, please try again in an hour",
});
app.use("/api", limiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// Routes ------------------------------
app.use("/api/v1/tours", tourRouter); //This is a middleware
app.use("/api/v1/users", userRouter); //This is a middleware

// Unhandled routers
app.all("*", (req, res, next) => {
  // const err = new Error(`Cannot find \< ${req.originalUrl} \> on this server`);
  // err.status = "fail";
  // err.statusCode = 404;
  next(new AppError(`Cannot find \< ${req.originalUrl} \> on this server`));
});

app.use(globalErrorHandler);
module.exports = app;
