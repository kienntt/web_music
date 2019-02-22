var express = require('express');
var router = express.Router();
var elasticsearch = require("elasticsearch");
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
/* GET users listing. */
router.post('/byresult', function (req, res, next) {
    var old_main_keyword = req.cookies['main_keyword'];
    var old_exclude_keyword = req.cookies['exclude_keyword'];
    let include = req.body.main_keyword.split(";");
    let exclude = req.body.exclude_keyword.split(";");
    include = include.concat(old_main_keyword);
    exclude = exclude.concat(old_exclude_keyword);
    console.log(include);
    /* ket noi elasticsearch */
    var client = new elasticsearch.Client({
        host: "http://192.168.1.210:9200",
        log: "trace"
    });

    var query = '{"query": { "bool": { "should": { "bool": { "must": [], "must_not": [] } } } }}';
    query = JSON.parse(query);
    for (let i = 0; i < include.length; i++) {
        query['query']['bool']['should']['bool']['must'].push({ "match_phrase_prefix": { "lyrics": include[i] } });
    }
    for (let i = 0; i < exclude.length; i++) {
        query['query']['bool']['should']['bool']['must_not'].push({ "match_phrase": { "lyrics": exclude[i] } });
    }

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
                response.hits.hits.forEach(function (hit) {
                    data.push(hit);
                });
                res.cookie('main_keyword', include, { expires: new Date(Date.now() + 900000), httpOnly: true })
                res.cookie('exclude_keyword', exclude, { expires: new Date(Date.now() + 900000), httpOnly: true })
                res.render("search/result", { data: data });
            }
        }
    );
    // var data= elas.search(include,exclude);
    // console.log(data);
    // if(data!=''){
    //     res.cookie('main_keyword',include,{ expires: new Date(Date.now() + 900000), httpOnly: true })
    //     res.cookie('exclude_keyword',exclude,{ expires: new Date(Date.now() + 900000), httpOnly: true })
    //     res.render("search/result", { data: data });
    // }
    // else{
    //     res.send("Error!");
    // }
}

);

module.exports = router;