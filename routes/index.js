var express = require("express");
var router = express.Router();

/* GET home page. */


router.get("/", function (req, res, next) {
  res.clearCookie("exclude_keyword");
  res.clearCookie("main_keyword");
  res.render("index", { title: "Express" });
});



module.exports = router;
