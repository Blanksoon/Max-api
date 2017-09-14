'use strict';

var jwt = require('jsonwebtoken');

var verifyToken = function verifyToken(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, req.app.get('secret'), function(err, decoded) {      
        if (err) {
          return res.json({ status :{ code:403, success: false, message: 'Failed to authenticate token.' },data : []});    
        } else {
          req.decoded = decoded;    
          next();
        }
      });
  
    } else {
      return res.json({
        status : {
          code : 403,
          success: false, 
          message: 'No token provided.'
        },
        data : []
      });
    }
}

module.exports = function(app) {

  

  var middleware = [verifyToken];
  var vod = require('../controllers/vodController');
  var user = require('../controllers/userController');

  app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // vod Routes
  app.route('/vods')
    .get(vod.search)
    .post(middleware,vod.create);

  app.route('/vods/:vodId')
    .get(vod.get)
    .put(middleware,vod.update)
    .delete(middleware,vod.delete);

  // User Routes
  app.route('/users')
    .get(middleware,user.search)
    .post(user.create);
  
  app.route('/users/:userId')
    .get(middleware,user.get)
    .put(middleware,user.update)
    .delete(middleware,user.delete);

  // Login and Validate Token Routes
  app.route('/login')
    .post(user.login)

  app.route('/social_login')
    .post(user.socialLogin)

};