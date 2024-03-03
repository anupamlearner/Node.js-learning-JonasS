const express = require("express");
const userModel = require("./../Models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const userResults = await userModel.find();
  res.status(200).json({
    status: "success",
    data: userResults,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "Error",
    message: "This route is not yet defined",
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "Error",
    message: "This route is not yet defined",
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "Error",
    message: "This route is not yet defined",
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "Error",
    message: "This route is not yet defined",
  });
};
