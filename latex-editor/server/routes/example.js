var express = require("express");
var router = express.Router();

var exampleController = require("../controllers/example");

router.get("/example/one", exampleController.one);

router.post("/example/two", exampleController.two);

module.exports = router;
