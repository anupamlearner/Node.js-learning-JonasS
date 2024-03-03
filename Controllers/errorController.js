// Global Error handling middleware

const AppError = require("./../utils/appError");

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/"([^"]*)"/)[0];
  console.log("Duplicate names");
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const customErrors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${customErrors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid Token. Please login again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please login again", 401);

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    source: "Global Error Handler",
    error: err,
    message: {
      message: err.message,
    },
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  // Operational known error, send message to client
  if (err.isOperationalError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: {
        message: err.message,
      },
    });

    // Programming or other unknown errorL dont't leak error details
  } else {
    // Log error
    console.error("Error 💥", err);

    // Send generic message
    res.status(500).json({
      status: "error",
      message: "Somethng went very wrong",
    });
  }
};

//
//
//
//
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendDevError(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.create(err);
    if (error.name === "CastError") error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendProdError(error, res);
  }
};
