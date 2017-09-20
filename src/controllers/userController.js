'use strict'

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  jwt = require('jsonwebtoken'),
  fetch = require('node-fetch')

var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'

function genNextQueryParams(params) {
  var nextQueryParams = ''

  Object.keys(params).forEach(function(key) {
    if (key == 'offset')
      nextQueryParams +=
        'offset=' + (parseInt(params.offset) + parseInt(params.limit)) + '&'
    else nextQueryParams += key + '=' + params[key] + '&'
  })

  return nextQueryParams
}

function setPaginationParams(params) {
  var paginationParams = {
    limit: parseInt(params.limit),
    offset: parseInt(params.offset),
    next_query_param: genNextQueryParams(params),
  }

  return paginationParams
}

function setQueryParams(params) {
  var queryParams = {}

  if (params.search) queryParams.email = new RegExp(params.search, 'i')

  return queryParams
}

function setData(data) {
  var output = []

  data.forEach(function(record) {
    var newData = {
      id: record._id,
      email: record.email,
    }

    output.push(newData)
  })

  return output
}

exports.login = function(req, res) {
  var queryParams = {
    email: req.body.email,
    password: req.body.password,
  }

  User.findOne(queryParams, function(err, user) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: defaultErrorMessage,
      },
      data: [],
    }

    if (err) {
      output.status.message = err.message
    } else if (user) {
      var token = jwt.sign({ data: user }, req.app.get('secret'), {
        expiresIn: req.app.get('tokenLifetime'),
      })
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = {
        token: token,
      }
    }

    res.json(output)
  })
}

exports.search = function(req, res) {
  var queryParams = setQueryParams(req.query)
  var paginationParams = setPaginationParams(req.query)

  User.count(queryParams).exec(function(err, count) {
    paginationParams.total_records = count
  })

  User.find(queryParams, function(err, user) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: defaultErrorMessage,
      },
      data: {
        pagination: paginationParams,
        records: [],
      },
    }

    if (err) {
      output.status.message = err.message
    } else if (user) {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data.records = setData(user)
    }

    res.json(output)
  })
    .limit(paginationParams.limit)
    .skip(paginationParams.offset)
}

exports.create = function(req, res) {
  var createObject = req.body

  var new_user = new User(req.body)

  new_user.save(function(err, user) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: '',
      },
      data: [],
    }

    if (err) {
      output.status.message = err.message
    } else {
      var token = jwt.sign({ data: user }, req.app.get('secret'), {
        expiresIn: req.app.get('tokenLifetime'),
      })
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = {
        token: token,
      }
    }

    res.json(output)
  })
}

exports.get = function(req, res) {
  User.findById(req.params.userId, function(err, user) {
    var output = {
      status: {
        code: 400,
        success: false,
        message: defaultErrorMessage,
      },
      data: [],
    }

    if (err) {
      output.status.message = err.message
    } else if (user) {
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = setData([user])
    }

    res.json(output)
  })
}

exports.update = function(req, res) {
  var updateObject = req.body

  User.findOneAndUpdate(
    { _id: req.params.userId },
    updateObject,
    { new: true },
    function(err, user) {
      var output = {
        status: {
          code: 400,
          success: false,
          message: defaultErrorMessage,
        },
        data: [],
      }

      if (err) {
        output.status.message = err.message
      } else if (user) {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
        output.data = setData([user])
      }

      res.json(output)
    }
  )
}

exports.delete = function(req, res) {
  User.remove(
    {
      _id: req.params.userId,
    },
    function(err, user) {
      var output = {
        status: {
          code: 400,
          success: false,
          message: defaultErrorMessage,
        },
        data: {
          id: req.params.userId,
        },
      }

      if (err) {
        output.status.message = err.message
      } else if (user) {
        output.status.code = 200
        output.status.success = true
        output.status.message = defaultSuccessMessage
      }

      res.json(output)
    }
  )
}

var socialAuthen = []

socialAuthen['facebook'] = async function(app, providerData) {
  let facebookData = providerData
  console.log('hi', facebookData)
  var response = {}
  try {
    response = await fetch(
      'https://graph.facebook.com/me?access_token=' + facebookData.accessToken
    ).then(response => response.json())
    if (response.error) {
      return {
        status: {
          code: 400,
          success: false,
          message: response.error.message,
        },
        data: [],
      }
    }
    if (response.id != facebookData.id || response.name != facebookData.name) {
      return {
        status: {
          code: 400,
          success: false,
          message: 'token is invalid',
        },
        data: [],
      }
    }
  } catch (err) {
    return {
      status: {
        code: 400,
        success: false,
        message: err.message,
      },
      data: [],
    }
  }

  try {
    var user = await User.findOneAndUpdate(
      { email: facebookData.email },
      { fb_info: facebookData },
      { new: true }
    ).exec()
    if (!user) {
      var createObject = {
        email: facebookData.email,
        password: Date.now(),
        fb_info: facebookData,
      }
      var new_user = new User(createObject)
      try {
        user = await new_user.save()
      } catch (err) {
        return {
          status: {
            code: 400,
            success: false,
            message: err.message,
          },
          data: [],
        }
      }
    }
    return {
      status: {
        code: 400,
        success: true,
        message: defaultSuccessMessage,
      },
      data: {
        token: await jwt.sign({ data: user }, app.get('secret'), {
          expiresIn: app.get('tokenLifetime'),
        }),
      },
    }
  } catch (err) {
    return {
      status: {
        code: 400,
        success: false,
        message: err.message,
      },
      data: [],
    }
  }
}

exports.socialLogin = async function(req, res) {
  var providerName = req.body.provider_name
  var providerData = req.body.provider_data
  //console.log('hi', req)

  if (!socialAuthen[providerName])
    res.json({
      status: {
        code: 400,
        success: false,
        message: providerName + ' is not support',
      },
      data: [],
    })
  else {
    var response = await socialAuthen[providerName](req.app, providerData)
    res.json(response)
  }
}
