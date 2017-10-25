var moment = require('moment')
var Dates = new Date()
Dates = Date.now()
console.log(Dates)
console.log('Date: ', moment(Dates).format('YYYY-MM-d HH:mm:ss '))

var tokeninwww =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtaXR0ZXIiOnsiZG9tYWluIjpudWxsLCJfZXZlbnRzIjp7fSwiX2V2ZW50c0NvdW50IjowfSwiZW1pdHRlZCI6e30sImVuZGVkIjpmYWxzZX0sImlhdCI6MTUwODkwNzMwNywiZXhwIjoxNTMzOTA3MzA3fQ.T8RQZuEf2C4HkE02aTphcoxq5g6xDlPysj2twDl_p0k'
var tokeninlocal =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9fdiI6MCwiZW1haWwiOiJmYXJtMTc3MUBnbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYSQxMCRIY3h3d3dVbERaOGlZT1pxWFZDZkIuU2dpd2pkUWpaTU1IQjJZWkFZOVpSbWFQWlc5aFJHLiIsIl9pZCI6IjU5ZjAxYWE0OTVlNDBkMjI0OWEyNWUxMiIsInN0YXR1cyI6ImluYWN0aXZlIiwiZmJfaW5mbyI6bnVsbH0sImlhdCI6MTUwODkwNzY4NCwiZXhwIjoxNTMzOTA3Njg0fQ.h33PYbHaBv6hRFVw5RpWW-dmJ3IV3LBMn6cacHTQRnM'

var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
console.log('re: ', !re.test('farm@.com'))
