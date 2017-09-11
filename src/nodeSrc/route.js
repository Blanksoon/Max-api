var app = require('express')();
var bodyParser = require('body-parser');

var Vods = require('./model/vods');

var port = process.env.PORT || 7777;

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));

const dateParams = ['month','day','year'];
const dateField = 'onAirDate';

app.get('/vods', function (req, res) {

    var limit = parseInt(req.query.limit) || null;
    var offset = parseInt(req.query.offset) || 0;
    var query = {};

    if(req.query.search){
        query.title = new RegExp(req.query.search, "i");
    }

    dateParams.forEach(function(name) {
        if(req.query.hasOwnProperty(name))
        {
            query[dateField+'.'+name] = req.query[name];
        }
    });

    Vods.find(query)
    .limit(limit)
    .skip(offset)
    .exec(function(err,doc){
        res.send({
            status : {
                code : 200,
                status : true,
                message : "get_success"
            },
            data : {
                records : doc || [],
                next : {
                    url : "offset="+(offset+limit)+"&limit="+limit
                }
            }
        });

    });

});

app.listen(port, function() {
    console.log('Starting node.js on port ' + port);
});