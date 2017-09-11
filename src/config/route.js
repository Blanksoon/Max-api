'use strict';
module.exports = function(app) {
  var vod = require('../controllers/vodController');

  // vod Routes
  app.route('/vods')
    .get(vod.search)
    .post(vod.create);

  app.route('/vods/:vodId')
    .get(vod.get)
    .put(vod.update)
    .delete(vod.delete);
  
};