var express = require('express');
var router = express.Router();
var elasticsearch = require("elasticsearch");
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
/* GET users listing. */
router.get('/byresult/:id', function (req, res, next) {
    
    var old_main_keyword = req.cookies['main_keyword'];
    var old_exclude_keyword = req.cookies['exclude_keyword'];
    let include = [];
    let exclude = [];
    include = include.concat(old_main_keyword);
    exclude = exclude.concat(old_exclude_keyword);
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
        query['query']['bool']['should']['bool']['must'].push({ "match_phrase_prefix": { "lyrics": include[i] } });
    }
    for (let i = 0; i < exclude.length; i++) {
        query['query']['bool']['should']['bool']['must_not'].push({ "match_phrase_prefix": { "lyrics": exclude[i] } });
    }
    let show_include = include.filter(item => item.trim() !== "");
    let show_exclude = exclude.filter(item => item.trim() !== "");
    //set from current page 
    var size = 2;
    var current = req.params.id;
    query['from'] = (current-1)*size;
    query['size'] = size;   
    var data = [];
    var total_song = [];

    var total = 0;
    var numPage = 0;
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
                total = response.hits.total;
                numPage = Math.ceil(total / size);
                response.hits.hits.forEach(function (hit) {
                    data.push(hit);
                });
            }
        }
    );delete query['from']; delete query['size'];
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
                response.hits.hits.forEach(function (hit) {
                    total_song.push(hit);
                });
                res.cookie('main_keyword', include, { expires: new Date(Date.now() + 900000), httpOnly: true })
                res.cookie('exclude_keyword', exclude, { expires: new Date(Date.now() + 900000), httpOnly: true })
                res.render("search/result", { data: data ,show_include, show_exclude, pages: numPage , current: current, total:total, total_song:total_song});
            }
        }
    );
});
router.post('/byresult', function (req, res, next) {
    var old_main_keyword = req.cookies['main_keyword'];
    var old_exclude_keyword = req.cookies['exclude_keyword'];
    let include=[];
    let exclude=[];
    include = req.body.main_keyword.split(";");
    exclude = req.body.exclude_keyword.split(";");
    if(old_main_keyword!=undefined)
    {
        include = include.concat(old_main_keyword);
        exclude = exclude.concat(old_exclude_keyword);
    }   
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

    let show_include = include.filter(item => item.trim() !== "");
    let show_exclude = exclude.filter(item => item.trim() !== "");

    var size = 2;
    query['size'] = size;
    var data = [];
    var total = 0;
    var numPage = 0;
    var total_song = [];
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
                total = response.hits.total;
                numPage = Math.ceil(total / 2);
                response.hits.hits.forEach(function (hit) {
                    data.push(hit);
                });
            }
        }
    );
    delete query['from']; delete query['size'];
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
                response.hits.hits.forEach(function (hit) {
                    total_song.push(hit);
                });
                res.cookie('main_keyword', include, { expires: new Date(Date.now() + 900000), httpOnly: true })
                res.cookie('exclude_keyword', exclude, { expires: new Date(Date.now() + 900000), httpOnly: true })
                res.render("search/result", { data: data, show_include: show_include, show_exclude: show_exclude, pages: numPage, current: 1, total: total, total_song:total_song});
            }
        }
    );
}

);

module.exports = router;