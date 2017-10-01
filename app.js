var config = require('./src/config')()
app = require('express')()
mongoose = require('mongoose')
cors = require('cors')
Vod = require('./src/models/vod')
User = require('./src/models/user')
Order = require('./src/models/order')
Live = require('./src/models/live')
bodyParser = require('body-parser')
express = require('express')

mongoose.connect('mongodb://localhost/max_api', {
  useMongoClient: true,
})
//console.log('secret', config.secret)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.set('secret', config.secret)
app.set('tokenLifetime', config.tokenLifetime)
app.use(express.static('./public'))
// app.use('/static', express.static('public'))
// app.use(express.static('/static/images' + '/static'))
// app.use('/img',express.static(path.join(__dirname, 'public/images')));
//app.use(express.static('./static'))

var routes = require('./src/config/route')
routes(app)

app.listen(config.port, function() {
  console.log('Express server listening on port ' + config.port)
})
