var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: "http://192.168.1.210:9200"
  });

var indexName = "testsong";


function searchSong(query) {  
    return client.search(
        {
          index: indexName,
          body: query
        }
      );
}
exports.searchSong = searchSong;