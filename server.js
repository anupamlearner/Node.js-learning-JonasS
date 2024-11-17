const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception! 💥 Shutting down...");
  console.log(err.name, " -- due to -- ", err.message);

  process.exit(1);
});

dotenv.config({ path: "./.env" });
const app = require("./app");

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

console.log("The environment is --->", app.get("env"));

// Start Server
const port = process.env.PORT || 7000;
const server = app.listen(port, () => {
  console.log(`Server started @ PORT ${port} ...`);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhadled Refection 💥 Shutting down...");
  console.log(err.name, " -- due to -- ", err.message);
  server.close(() => {
    process.exit(1);
  });
});
