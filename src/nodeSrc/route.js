var app = require('express')();
var bodyParser = require('body-parser')

var port = process.env.PORT || 7777;

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/vods', function (req, res) {
    res.send({
        status : {
            code : 200,
            status : true,
            message : "get_success"
        },
        input : {
            data : req.query
        },
        data : {
            records : [
                {
                    id : "exampleMongoId",
                    title : "video1",
                    onAirDate : "2012-11-04 14:55:45",
                    duration : 10.40,
                    videoUrl : "example.com",
                    longUrl : "example.com"
                },
                {
                    id : "exampleMongoId",
                    title : "video2",
                    onAirDate : "2012-11-04 14:55:45",
                    duration : 5.00,
                    videoUrl : "example.com",
                    longUrl : "example.com"
                }
            ],
            next : {
                url : "page=2&limit=4"
            }
        }
    });
});

app.listen(port, function() {
    console.log('Starting node.js on port ' + port);
});