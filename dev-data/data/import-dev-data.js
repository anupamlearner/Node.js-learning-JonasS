const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const tourModel = require("./../../Models/tourModel");
const reviewModel = require("./../../Models/reviewModel");
const userModel = require("./../../Models/userModel");

dotenv.config({ path: `${__dirname}/../../.env` });

const app = require("./../../app");

const DB = process.env.MDB.replace("<password>", process.env.MDB_PASS);
mongoose
  .connect(
    DB

    //,{
    //useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: true,}
  )
  .then(() => console.log("----> DB Connection Successful"));

console.log("The environment is--->", app.get("env"));

//   Read JSON File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// Import Data into DB
const importData = async () => {
  try {
    await tourModel.create(tours);
    await userModel.create(users, { validateBeforeSave: false });
    await reviewModel.create(reviews);
    console.log("Data successfully loaded");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// Delete all Data from collection
const deleteData = async () => {
  try {
    await tourModel.deleteMany();
    await userModel.deleteMany();
    await reviewModel.deleteMany();
    console.log("data successfully deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}

console.log(process.argv);
