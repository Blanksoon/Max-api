const env = require('./src/config/env')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

// Global import
mongoose = require('mongoose')
Vod = require('./src/models/vod')
User = require('./src/models/user')
Order = require('./src/models/order')
Live = require('./src/models/live')
Subscribe = require('./src/models/subscribe')

// Config depedencies
mongoose.connect(env.MONGO_CONNS, {
  useMongoClient: true,
})

// Application specific variables
app.set('secret', env.JWT_SECRET)
app.set('tokenLifetime', env.JWT_TOKEN_LIFETIME)

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('./public'))

// Config routes
var routes = require('./src/config/route')
routes(app)

app.listen(env.SERVER_PORT, function() {
  console.log('Express server listening on port ' + env.SERVER_PORT)
})
