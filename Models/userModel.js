const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// const catchAsync = require("./../utils/catchAsync");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name"],
    trim: true,
    maxLength: [40, "Name must have less or equal then 40 characters"],
    minLength: [1, "Name must have more or equal then 1 character"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "A user must have an email"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "A user must have a password"],
    minLength: [8, "Password must have at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on "CREATE" and "SAVE"
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});

// ---- middlewares --------------//
userSchema.pre("save", async function (next) {
  // Only runs this function if password was actually changed
  if (!this.isModified("password")) return next();
  // Hash the password with 12 salt rounds
  this.password = await bcrypt.hash(this.password, 12);
  // Delete confirm password field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
// ---- middlewares --------------//

// INSTANCE METHOD
// Method to check if the provided password (sample) matches the stored hashed password (real)
// It uses bcrypt.compare to securely compare the passwords
userSchema.methods.correctPassword = async function (sample, real) {
  // Compare the sample password with the real hashed password and return the result
  return await bcrypt.compare(sample, real);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // Returns true if the password was changed after the JWT token was issued.
    //Earlier is less time, later is greater time.
    return JWTTimeStamp < changedTimeStamp;
  }
  // If the password was never changed, return false
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
