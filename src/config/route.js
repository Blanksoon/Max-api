'use strict';
module.exports = function(app) {
  var vod = require('../controllers/vodController');
  var user = require('../controllers/userController');

  // vod Routes
  app.route('/vods')
    .get(vod.search)
    .post(vod.create);

  app.route('/vods/:vodId')
    .get(vod.get)
    .put(vod.update)
    .delete(vod.delete);

  // User Routes
  app.route('/users')
    .get(user.search)
    .post(user.create);
  
  app.route('/users/:userId')
    .get(user.get)
    .put(user.update)
    .delete(user.delete);

  // Login and Validate Token Routes
  app.route('/login')
    .post(user.login)

};