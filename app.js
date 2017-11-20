const env = require('./src/config/env')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

// Global import
const mongoose = require('mongoose')
const Vod = require('./src/models/vod')
const User = require('./src/models/user')
const Order = require('./src/models/order')
const Live = require('./src/models/live')
const Subscribe = require('./src/models/subscribe')
const paypal = require('./src/utils/paypal')

// Config depedencies
mongoose.Promise = global.Promise
mongoose.connect(env.MONGO_CONNS, {
  useMongoClient: true,
})
paypal.configure({
  mode: env.PAYPAL_MODE,
  client_id: env.PAYPAL_CLIENT_ID,
  client_secret: env.PAYPAL_CLIENT_SECRET,
})

// Application specific variables
app.set('secret', env.JWT_SECRET)
// app.set('tokenLifetime', env.JWT_TOKEN_LIFETIME)
app.set('tokenLifetime', parseInt(env.JWT_TOKEN_LIFETIME))

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
