var express = require("express");
var router = express.Router();
var elasticsearch = require("elasticsearch");
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/", function(req, res) {
  var data = JSON.stringify(req.body);

  console.log(data);
});

router.post("/search", urlencodedParser, function(req, res) {
  if (!req.body) {
    //noi dung request trong
    return res.redirect("/");
  } else {
    let include = req.body.keyword;
    let exclude = req.body.not_keyword;
    

    /* ket noi elasticsearch */
    var client = new elasticsearch.Client({
      host: "http://192.168.1.210:9200",
      log: "trace"
    });

    client.search(
      {
        index: "songtest",
        body: {
          query: {
            bool: {
              should: {
                bool: {
                  must: {
                    match_phrase_prefix: {
                      "lyrics": include
                    }
                  },
                  must_not: {
                    match_phrase: {
                      "lyrics": exclude
                    }
                  }
                }
              }
            }
          }
        }
      },
      function(error, response, status) {
        if (error) {
          console.log("search error: " + error);
          res.send("Error!");
        } else {
          let data = [];
          response.hits.hits.forEach(function(hit) {
            data.push(hit);
          });
          res.render("search/result", { data: data });
        }
      }
    );
  }
});

module.exports = router;
