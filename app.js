var config = require('./src/config')
app = require('express')()
mongoose = require('mongoose')
cors = require('cors')
Vod = require('./src/models/vod')
User = require('./src/models/user')
Order = require('./src/models/order')
Live = require('./src/models/live')
Subscribe = require('./src/models/subscribe')
bodyParser = require('body-parser')
express = require('express')
//'mongodb://mmt:maxworldchampion2016@localhost/max_api_phase2',
//'mongodb://mmt:maxworldchampion2016@beta.maxmuaythai.com/max_api_phase2',
mongoose.connect(process.env.MONGO_CONNS, {
  useMongoClient: true,
})
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.set('secret', process.env.JWT_SECRET)
app.set('tokenLifetime', process.env.JWT_TOKEN_LIFETIME)
app.use(express.static('./public'))

var routes = require('./src/config/route')
routes(app)

app.listen(process.env.SERVER_PORT, function() {
  console.log('Express server listening on port ' + process.env.SERVER_PORT)
})
