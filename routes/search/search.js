var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var Promise = require("bluebird");
var byresult = require("./byresult");
/* GET users listing. */
var elastic = require('../../model/testsong')
router.post("/", urlencodedParser, function (req, res) {
  if (!req.body) {
    //noi dung request trong
    return res.redirect("/");
  } else {
    let include = req.body.main_keyword.split(";");
    let exclude = req.body.exclude_keyword.split(";");
    let array_include_cookie = [];
    let array_exclude_cookie = [];
    array_exclude_cookie.push(exclude);
    array_include_cookie.push(include);
    include = [...new Set(include)];
    exclude = [...new Set(exclude)];
    /* ket noi elasticsearch */
    // var client = new elasticsearch.Client({
    //   host: "http://192.168.1.210:9200",
    //   log: "trace"
    // });
    var query =
      '{"from" : 0, "size" : 10,"query": { "bool": { "should": { "bool": { "must": [], "must_not": [] } } } }}';
    query = JSON.parse(query);
    for (let i = 0; i < include.length; i++) {
      if (include[i].trim() !== "") {
        query["query"]["bool"]["should"]["bool"]["must"].push({
          match_phrase_prefix: { lyrics: include[i] }
        });
      }
    }
    for (let i = 0; i < exclude.length; i++) {
      if (exclude[i].trim() !== "") {
        query["query"]["bool"]["should"]["bool"]["must_not"].push({
          match_phrase_prefix: { lyrics: exclude[i] }
        });
      }
    }
    let size = 5;
    query["from"] = 0;
    query["size"] = size;

    var data = [];
    var total_song = [];
    var total = 0;
    var numPage = 0;
    let show_include = include.filter(item => item.trim() !== "");
    let show_exclude = exclude.filter(item => item.trim() !== "");

    var promise = new Promise(function (resolve, reject) {
      elastic.searchSong(query).then(function (result) {
        total = result.hits.total;
        numPage = Math.ceil(total / size);
        result.hits.hits.forEach(function (hit) {
          data.push(hit);
          resolve(data);
        }).catch(err => {
          console.log("search error: " + error);
          res.send("Error!");
        });
      });
    });
    promise.then(function (data) {
      query["from"] = 0;
      query["size"] = 10000;
      elastic.searchSong(query).then(function (result) {
        result.hits.hits.forEach(function (hit) {
          total_song.push(hit);
        });
        if (total != 0) {
          res.cookie("main_keyword", array_include_cookie, {
            expires: new Date(Date.now() + 900000),
            httpOnly: true
          });
          res.cookie("exclude_keyword", array_exclude_cookie, {
            expires: new Date(Date.now() + 900000),
            httpOnly: true
          });
        }
        res.render("search/result", {
          data: data,
          show_include: show_include,
          show_exclude: show_exclude,
          pages: numPage,
          current: 1,
          total: total,
          total_song: total_song
        });
      }).catch(err => {
        console.log("search error: " + error);
        res.send("Error!");
      });
    });

    // var promise = new Promise(function (resolve, reject) {
    //   client.search(
    //     {
    //       index: "testsong",
    //       body: query
    //     },
    //     function (error, response, status) {
    //       if (error) {
    //         console.log("search error: " + error);
    //         res.send("Error!");
    //         res.send("total");
    //       } else {
    //         total = response.hits.total;
    //         numPage = Math.ceil(total / 2);
    //         response.hits.hits.forEach(function (hit) {
    //           data.push(hit);
    //         });
    //         resolve(data);
    //       }
    //     }
    //   );


    // });

    // promise.then(function (data) {
    //   query["from"] = 0;
    //   query["size"] = 10000;

    //   client.search(
    //     {
    //       index: "testsong",
    //       body: query
    //     },
    //     function (error, responsessss, status) {
    //       if (error) {
    //         console.log("search error: " + error);
    //         res.send("Error!");
    //         res.send("total");
    //       } else {
    //         responsessss.hits.hits.forEach(function (hit) {
    //           total_song.push(hit);
    //         });
    //         if (total != 0) {
    //           res.cookie("main_keyword", array_include_cookie, {
    //             expires: new Date(Date.now() + 900000),
    //             httpOnly: true
    //           });
    //           res.cookie("exclude_keyword", array_exclude_cookie, {
    //             expires: new Date(Date.now() + 900000),
    //             httpOnly: true
    //           });
    //         }

    //         res.render("search/result", {
    //           data: data,
    //           show_include: show_include,
    //           show_exclude: show_exclude,
    //           pages: numPage,
    //           current: 1,
    //           total: total,
    //           total_song: total_song
    //         });
    //       }

    //     }
    //   );
    // }).catch(function (err) {
    //   console.log(err);
    // });



  }
});


router.use("/byresult", byresult);

module.exports = router;
