const { promisify } = require("util");

const userModel = require("./../Models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await userModel.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    user: newUser,
  });
});

// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
//   // Check if email exists && password exists
//   if (!email || !password) {
//     return next(new AppError("Please provide email and password", 400));
//   }
//   // Check if user exists && password is correct
//   const user = await userModel.findOne({ email }).select("+password");

//   if (!user || !(await user.correctPassword(password, user.password))) {
//     return next(new AppError("Incorrect email or password"), 401);
//   }
//   // If all ok, send token to the client
//   const token = signToken(user._id);
//   res.status(200).json({
//     status: "success",
//     token,
//   });
// });

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // Check if email exists && password exists
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // Check if user exists && password is correct
  const userResult = await userModel.findOne({ email }).select("+password");

  if (
    !userResult ||
    !(await userResult.correctPassword(password, userResult.password))
  ) {
    return next(new AppError("Incorrect email or password", 401)); // Corrected the position of the status code
  }
  // If all ok, send token to the client
  const token = signToken(userResult._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get token and check if it exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please login to get access.", 401)
    );
  }
  // 2) Verification of the token

  // NOTE: The brackets surrounding promisify(jwt.verify) might appear unusual

  // this syntax is used to convert jwt.verify into a Promise-based function,then
  // immediately invoke the function returned by promisify with the provided args.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3) Check if user still exists
  const currentUSer = await userModel.findById(decoded.id);
  if (!currentUSer) {
    return next(
      new AppError("The user belonging to this token does not exist", 401)
    );
  }

  // 4) Check if the user changed password after JWT was issued
  if (currentUSer.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }
  // 5) Grant access to protectd route
  req.user = currentUSer;
  next();
});

//---------------------------------
// This middleware restricts access based on user roles.
// It takes role arguments and checks if the current user has any of those roles.

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // The roles parameter is an array containing the allowed roles, like ["admin", "lead-guide"].
    // The roles are passed from the previous middleware in the chain.

    // Check if the current user's role matches any of the allowed roles.
    // If the user's role is not in the roles array, access is denied.
    if (!roles.includes(req.user.role)) {
      // If access is denied, it returns an error to the client with a status code of 403 (Forbidden).
      return next(new AppError("Not permitted", 403));
    }

    // If the user's role matches one of the allowed roles, access is granted.
    // It moves to the next middleware or route handler in the chain.
    next();
  };
};
