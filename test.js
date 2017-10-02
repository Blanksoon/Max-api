var moment = require('moment')
var Dates = new Date()
Dates = Date.now()

console.log('Date: ', moment(Dates).format('YYYY-MM-d HH:mm:ss '))
