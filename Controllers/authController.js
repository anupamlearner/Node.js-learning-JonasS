const { promisify } = require("util");

const userModel = require("./../Models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const crypto = require("crypto");

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
  const foundUser = await userModel.findOne({ email }).select("+password");

  if (
    !foundUser ||
    !(await foundUser.correctPassword(password, foundUser.password))
  ) {
    return next(new AppError("Incorrect email or password", 401)); // Corrected the position of the status code
  }
  // If all ok, send token to the client
  const token = signToken(foundUser._id);
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

  // 3) Check if user still exists
  const foundUser = await userModel.findById(decoded.id);
  if (!foundUser) {
    return next(
      new AppError("The user belonging to this token does not exist", 401)
    );
  }

  // 4) Check if the user changed password after JWT was issued
  if (foundUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }
  // 5) Grant access to protectd route
  req.user = foundUser;
  next();
});

//---------------------------------
// This middleware restricts access based on user roles.
// It takes role arguments and checks if the current user has any of those roles.

/*
//------------------ Method 1 without closure
exports.restrictTo = (req, res, next) => {
  // Hardcoding roles directly into the function
  const allowedRoles = ["admin", "lead-guide"];
  
  // Check if the current user's role matches any of the allowed roles
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError("Not permitted", 403));
  }
  
  // If the user's role matches one of the allowed roles, grant access
  next();
};

*/

//------------------ Method 2 with closure
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // The allowedRoles parameter is an array containing the "allowed roles",
    //like ["admin", "lead-guide"]. Defined in //tourRouter.js//
    //The roles are passed from the previous middleware in the chain.

    // Check if the current user's role matches any of the allowed roles.
    // If the user's role is not in the roles array, access is denied.
    if (!allowedRoles.includes(req.user.role)) {
      // If access is denied, it returns an error to the client with a status code of 403 (Forbidden).
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    // If the user's role matches one of the allowed roles, access is granted.
    // It moves to the next middleware or route handler in the chain.
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POST email
  const foundUser = await userModel.findOne({ email: req.body.email });
  if (!foundUser) {
    return next(new AppError("User not found", 404));
  }

  // Generate the random RESET token
  const resetToken = foundUser.createPasswordResetToken();
  await foundUser.save({ validateBeforeSave: false });

  // Send it to user's Email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password, submit a PATCH request with your new password & password-confirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: req.body.email,
      subject: "Your password reset token for 10min",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    (foundUser.passwordResetToken = undefined),
      (foundUser.passwordResetTokenExpires = undefined);
    await foundUser.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const foundUser = await userModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // 2 If token has not expired and there is a user, set the new password
  if (!foundUser) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // 3 Update changedPasswordAt property in the DB
  foundUser.password = req.body.password;
  foundUser.passwordConfirm = req.body.passwordConfirm;
  foundUser.passwordResetToken = undefined;
  foundUser.passwordResetTokenExpires = undefined;
  await foundUser.save();

  // Log the user in , send JWT
  const token = signToken(foundUser._id);
  res.status(200).json({
    status: "success",
    token,
  });
});
