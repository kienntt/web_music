var express = require("express");
var router = express.Router();
var elasticsearch = require("elasticsearch");
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* GET home page. */

router.get("/", function (req, res, next) {
  res.clearCookie();
  res.render("index", { title: "Express" });

});

router.post("/search", urlencodedParser, function (req, res) {
  if (!req.body) {
    //noi dung request trong
    return res.redirect("/");
  } else {
    
    let include = req.body.main_keyword.split(";");
    let exclude = req.body.exclude_keyword.split(";");
    include = [...new Set(include)];
    exclude = [...new Set(exclude)];
    /* ket noi elasticsearch */
    var client = new elasticsearch.Client({
      host: "http://192.168.1.210:9200",
      log: "trace"
    });

    var query = '{"from" : 0, "size" : 10,"query": { "bool": { "should": { "bool": { "must": [], "must_not": [] } } } }}';
    query = JSON.parse(query);
    for (let i = 0; i < include.length; i++) {
      if(include[i].trim() !== "") {
        query['query']['bool']['should']['bool']['must'].push({ "match_phrase_prefix": { "lyrics": include[i] } });
      }
    }
    for (let i = 0; i < exclude.length; i++) {
      if(exclude[i].trim() !== "") {
        query['query']['bool']['should']['bool']['must_not'].push({ "match_phrase_prefix": { "lyrics": exclude[i] } });
      }
    }
    let size=2;
    query['from'] = 0;
    query['size'] = size;
    console.log(JSON.stringify(query));
    let show_include = include.filter(item => item.trim() !== "");
    let show_exclude = exclude.filter(item => item.trim() !== "");
    client.search(
      {
        index: "songtest",
        body: query
      },
      function (error, response, status) {
        if (error) {
          console.log("search error: " + error);
          res.send("Error!");
        } else {
          let data = [];
          let total = response.hits.total;
          let numPage = Math.ceil(total / 2);
          console.log("page " + numPage);
          response.hits.hits.forEach(function (hit) {
            data.push(hit);
          });
          res.cookie('main_keyword',include,{ expires: new Date(Date.now() + 900000), httpOnly: true })
          res.cookie('exclude_keyword',exclude,{ expires: new Date(Date.now() + 900000), httpOnly: true })
          res.render("search/result", { data: data, show_include, show_exclude, pages: numPage, current: 1 });
        }
      }
    );
  }
});

module.exports = router;
