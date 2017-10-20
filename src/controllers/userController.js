'use strict'

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  jwt = require('jsonwebtoken'),
  fetch = require('node-fetch')

var defaultSuccessMessage = 'success'
var defaultErrorMessage = 'data_not_found'
var nodemailer = require('nodemailer')
var bcrypt = require('bcrypt-nodejs')

const log = console.log

var output = {
  status: {
    code: 400,
    success: false,
    message: defaultErrorMessage,
  },
  data: [],
}
var order = '' // status order
var json = {} // output
var outputvods = {} // data vod and error
var token = '' //token

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

const createUser = (newUser, type) => {
  new Promise(async (resolve, reject) => {
    console.log('create User')
    try {
      const user = await newUser.save()
      const token = await jwt.sign({ data: user }, app.get('secret'), {
        expiresIn: app.get('tokenLifetime'),
      })
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = {
        token: token,
        email: user.email,
      }
      resolve(output.status.code)
    } catch (err) {
      log('err', err)
      if (type == 'local') {
        output.status.message = 'You already register'
      } else {
        output.status.message = err.message
      }
      resolve(output.status.code)
    }
  })
}

var socialAuthen = []
socialAuthen['local'] = async function(providerData) {
  //console.log('provideData', providerData)
  var code = ''
  var user = await User.find({ email: providerData.email }).exec()
  //console.log('user', user)
  var password = bcrypt.hashSync(providerData.password)
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  re.test(providerData.email)
  if (!re) {
    output.status.message = 'email is invalid'
    return 400
  } else {
    if (Object.keys(user).length == 0) {
      var createObject = {
        email: providerData.email,
        password: password,
        status: 'inactive',
      }
      var new_user = new User(createObject)
      const user = await createUser(new_user, 'local')
      console.log('coddddeeeeeeee')
      return user
    } else {
      output.status.message = 'You already register'
      return 400
    }
  }
}

socialAuthen['facebook'] = async function(providerData) {
  let facebookData = providerData
  var response = {}
  var checkNewUser = {}
  var data = {}
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
    var token = ''
    var user = await User.findOneAndUpdate(
      { email: facebookData.email },
      { fb_info: facebookData },
      { new: true }
    ).exec()
    if (!user) {
      var password = Date.now()
      var createObject = {
        email: facebookData.email,
        password: bcrypt.hashSync(password), //if error is meaning this
        fb_info: facebookData,
      }
      var new_user = new User(createObject)
      checkNewUser = new User(createObject)
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
      token = await jwt.sign({ data: user }, app.get('secret'), {
        expiresIn: app.get('tokenLifetime'),
      })
    }

    if (Object.keys(checkNewUser).length != 0) {
      var transporter = nodemailer.createTransport({
        host: 'smtp.sparkpostmail.com',
        port: 587,
        //service: 'Gmail',
        auth: {
          user: 'SMTP_Injection', // Your email id
          pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
        },
      })
      var mailOptions = {
        from: '<no-reply@maxmuaythai.com>', // sender address
        to: `${checkNewUser.email}`, // list of receivers
        subject: 'Promotion code for Max Muay Thai', // Subject line
        text:
          'Your promotion code for watch live and video in Max Muay Thai: ' +
          'MWC2016',
        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
      }
      var statuEmail = await transporter
        .sendMail(mailOptions)
        .then(function(info) {
          data = {
            status: {
              code: 200,
              success: true,
              message: defaultSuccessMessage,
            },
            data: {
              token: token,
              email: facebookData.email,
            },
          }
          return data
        })
        .catch(function(err) {
          return {
            status: {
              code: 400,
              success: false,
              message: `can't send email`,
            },
            data: {},
          }
        })
      return statuEmail
    } else {
      return {
        status: {
          code: 200,
          success: true,
          message: defaultSuccessMessage,
        },
        data: {
          token: token,
          email: facebookData.email,
        },
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
}

exports.sendEmail = function(req, res) {
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'topscores@gmail.com', // Your email id
      pass: 'pr0visi0n', // Your password
    },
  })

  var text = 'Hello world from'
  var mailOptions = {
    from: '<farm1771@gmail.com>', // sender address
    to: 'topscores@gmail.com', // list of receivers
    subject: 'Email Example', // Subject line
    text:
      'From E-mail: ' +
      req.body.userEmail.email +
      '\n' +
      'Message: ' +
      req.body.userEmail.message, //, // plaintext body
    // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
  }
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      //console.log(error)
      res.json({ yo: 'error' })
    } else {
      //console.log('Message sent: ' + info.response)
      res.json({ yo: 'success' })
    }
  })
}

const email = response => {
  //console.log('response', response)
  new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      host: 'smtp.sparkpostmail.com',
      port: 587,
      auth: {
        user: 'SMTP_Injection', // Your email id
        pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
      },
    })
    var mailOptions = {
      from: '<no-reply@maxmuaythai.com>', // sender address
      to: `${response.data.email}`, // list of receivers
      subject: 'Please verify your email', // Subject line
      text:
        'Activate Account please enter link ' +
        'https://www.maxmuaythai.com/verify?token=' +
        response.data.token,
      // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    }
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        output.status.message = 'Cannot send email'
        resolve('false')
      } else {
        console.log('hhiiiiiii')
        resolve('success')
      }
    })
  })
}

const checkAuthen = providerName => {
  if (socialAuthen[providerName] == undefined) {
    //console.log('hi')
    output.status.message = providerName + ' is not support'
    return false
  } else {
    return true
  }
}

exports.localRegister = async function(req, res) {
  var providerName = req.body.provider_name
  var providerData = req.body.provider_data
  var response = ''
  var j = JSON.stringify(req.body)
  var auth = checkAuthen(providerName)
  if (auth == false) {
    return res.json(output)
  } else {
    response = await socialAuthen[providerName](providerData)
    //console.log(response)
    if (response != 400) {
      //console.log('jg')
      await email(output)
      return res.json(output)
    } else {
      return res.json(output)
    }
  }
}

//console.log(response)
// //console.log('aaaaaa', response.data.token)
// var transporter = nodemailer.createTransport({
//   host: 'smtp.sparkpostmail.com',
//   port: 587,
//   //service: 'Gmail',
//   auth: {
//     user: 'SMTP_Injection', // Your email id
//     pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
//   },
// })
// var mailOptions = {
//   from: '<no-reply@maxmuaythai.com>', // sender address
//   to: `${response.data.email}`, // list of receivers
//   subject: 'Please verify your email', // Subject line
//   text:
//     'Activate Account please enter link ' +
//     'https://www.maxmuaythai.com/verify?token=' +
//     response.data.token,
//   // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
// }
// transporter.sendMail(mailOptions, function(error, info) {
//   if (error) {
//     //console.log(error)
//     response.status.code = 400
//     response.status.success = false
//     response.status.message = 'Cannot send email'
//     response.data = {}
//     return res.json(response)
//   } else {
//     //console.log('Message sent: ' + info.response)
//     //res.json({ yo: 'success' })
//     return res.json(response)
//   }
// })

exports.localLogin = async function(req, res) {
  var password = bcrypt.hashSync(req.body.provider_data.password)

  var queryParams = {
    email: req.body.provider_data.email,
  }
  //console.log('queryParams', queryParams)
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  User.findOne(queryParams, function(err, user) {
    if (err) {
      console.log(err)
      output.status.message = err
    } else if (user) {
      if (bcrypt.compareSync(req.body.provider_data.password, user.password)) {
        if (user.status == 'inactive') {
          output.status.message = 'You are not activate'
        } else {
          var token = jwt.sign({ data: user }, req.app.get('secret'), {
            expiresIn: req.app.get('tokenLifetime'),
          })
          output.status.code = 200
          output.status.success = true
          output.status.message = defaultSuccessMessage
          output.data = {
            email: user.email,
            token: token,
          }
        }
      } else {
        output.status.code = 400
        output.status.success = false
        output.status.message = 'Password is invalid'
      }
    } else {
      output.status.code = 400
      output.status.success = false
      output.status.message = 'Email is invalid'
    }
    return res.json(output)
  })
}

exports.activateLocalUser = async function(req, res) {
  var token = req.query.token
  //console.log('token', token)
  jwt.verify(token, req.app.get('secret'), function(err, decoded) {
    if (err) {
      return res.json({
        status: {
          code: 403,
          success: false,
          message: 'Failed to authenticate token.',
        },
        data: [],
      })
    } else {
      decoded = decoded
      var queryParams = {
        email: decoded.data.email,
      }
      User.findOneAndUpdate(
        queryParams,
        { $set: { status: 'active' } },
        function(err, user) {
          if (err) {
            return res.send(err)
          } else {
            var transporter = nodemailer.createTransport({
              host: 'smtp.sparkpostmail.com',
              port: 587,
              //service: 'Gmail',
              auth: {
                user: 'SMTP_Injection', // Your email id
                pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
              },
            })
            var mailOptions = {
              from: '<no-reply@maxmuaythai.com>', // sender address
              to: `${user.email}`, // list of receivers
              subject: 'Promotion code for Max Muay Thai', // Subject line
              text:
                'Your promotion code for watch live and video in Max Muay Thai: ' +
                'MWC2016',
              // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
            }
            transporter.sendMail(mailOptions, function(error, info) {
              if (error) {
                //console.log(error)
                response.status.code = 400
                response.status.success = false
                response.status.message = 'Cannot send email'
                response.data = {}
                return res.json(response)
              } else {
                return res.send({
                  status: {
                    code: 200,
                    success: true,
                    message: 'active email is success',
                  },
                  data: [],
                })
              }
            })
          }
        }
      )
    }
  })
}

exports.fbLogin = async function(req, res) {
  var providerName = req.body.provider_name
  var providerData = req.body.provider_data
  //var j = JSON.stringify(req.body)
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
    var response = await socialAuthen[providerName](providerData)

    console.log('response', response)
    return res.json(response)
  }
}
