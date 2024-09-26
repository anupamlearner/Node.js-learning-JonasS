const express = require("express");
const router = express.Router();

const viewsController = require("../Controllers/viewsController");

router.get("/", viewsController.getOverview);

router.get("/tour", viewsController.getTour);

module.exports = router;
