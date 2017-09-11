'use strict';

var mongoose = require('mongoose'),
  Vod = mongoose.model('Vod');

var defaultSuccessMessage = 'success';

function setPaginationParams(params) {

  var paginationParams = {
    limit : parseInt(params.limit),
    offset : parseInt(params.offset)
  };

  return paginationParams;
}

function setQueryParams(params) {

  var queryParams = {};

  if(params.search)
    queryParams['title'] = new RegExp(params.search, "i");

  return queryParams;
}

function setData(data) {

  var output = [];

  data.forEach(function(record) {
    var newData = {
      id          : record._id,
      title       : record.title,
      duration    : record.duration,
      on_air_date : record.on_air_date,
      video_url   : record.video_url,
      long_url    : record.long_url
    };

    output.push(newData);
  });

  return output;
}

exports.search = function(req, res) {

  var queryParams = setQueryParams(req.query);
  var paginationParams = setPaginationParams(req.query);

  Vod.count(queryParams).exec(function(err, count) {
     paginationParams.total_records = count;
  });

  Vod.find(queryParams, function(err, vod) {

    var output = {
      status : {
        code : 400,
        success : false,
        message : ''
      },
      data : {
        pagination : paginationParams,
        records : []
      }
    }

    if (err) {
      output.status.message = err.message;
    }
    else {
      output.status.code = 200;
      output.status.success = true;
      output.status.message = defaultSuccessMessage;
      output.data.records = setData(vod);
    }

    res.json(output);
  });

};

exports.create = function(req, res) {

  var new_vod = new Vod(req.body);

  new_vod.save(function(err, vod) {

    var output = {
      status : {
        code : 400,
        success : false,
        message : ''
      },
      data : []
    }

    if (err) {
      output.status.message = err.message;
    }
    else {
      output.status.code = 200;
      output.status.success = true;
      output.status.message = defaultSuccessMessage;
      output.data = setData([vod]);
    }

    res.json(output);
  });

};

exports.get = function(req, res) {

  Vod.findById(req.params.vodId, function(err, vod) {

    var output = {
      status : {
        code : 400,
        success : false,
        message : ''
      },
      data : []
    }

    if (err) {
      output.status.message = err.message;
    }
    else {
      output.status.code = 200;
      output.status.success = true;
      output.status.message = defaultSuccessMessage;
      output.data = setData([vod]);
    }

    res.json(output);
  });

};

exports.update = function(req, res) {

  Vod.findOneAndUpdate({_id: req.params.vodId}, req.body, {new: true}, function(err, vod) {

    var output = {
      status : {
        code : 400,
        success : false,
        message : ''
      },
      data : []
    }

    if (err) {
      output.status.message = err.message;
    }
    else {
      output.status.code = 200;
      output.status.success = true;
      output.status.message = defaultSuccessMessage;
      output.data = setData([vod]);
    }

    res.json(output);
  });

};

exports.delete = function(req, res) {

  Vod.remove({
    _id: req.params.vodId
  }, function(err, vod) {

    var output = {
      status : {
        code : 400,
        success : false,
        message : ''
      },
      data : {
        id: req.params.vodId
      }
    }

    if (err) {
      output.status.message = err.message;
    }
    else {
      output.status.code = 200;
      output.status.success = true;
      output.status.message = defaultSuccessMessage;
    }

    res.json(output);
  });

};
