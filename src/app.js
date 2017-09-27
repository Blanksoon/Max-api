var config = require('./config')()
app = require('express')()
mongoose = require('mongoose')
cors = require('cors')
Vod = require('./models/vod')
User = require('./models/user')
Order = require('./models/order')
bodyParser = require('body-parser')

mongoose.connect('mongodb://localhost/max_api', {
  useMongoClient: true,
})
//console.log('secret', config.secret)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.set('secret', config.secret)
app.set('tokenLifetime', config.tokenLifetime)

var routes = require('./config/route')
routes(app)

app.listen(config.port, function() {
  console.log('Express server listening on port ' + config.port)
})
