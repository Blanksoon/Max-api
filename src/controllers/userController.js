import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import env from '../config/env'
import User from '../models/user'

const defaultSuccessMessage = 'success'
const defaultErrorMessage = 'data_not_found'
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt-nodejs')
const log = console.log
//const stagingUrl = 'http://159.203.140.5:8080/verify?token='
const socialAuthen = []
const stagingUrl = require('../config/url')

//function
socialAuthen['local'] = async function(providerData, output) {
  //console.log('provideData', providerData)
  var code = ''
  var user = await User.find({ email: providerData.email }).exec()
  //console.log('user', user)
  var password = bcrypt.hashSync(providerData.password)
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  //re.test(providerData.email)
  if (!re.test(providerData.email)) {
    //if false do it
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
      var statusUser = await createUser(new_user, 'local', output)
      // console.log('coddddeeeeeeee', output)
      // console.log('statusUser', statusUser)
      return statusUser
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
    var name = facebookData.name.split(/[ ]+/)
    var user = await User.findOneAndUpdate(
      { email: facebookData.email },
      { fb_info: facebookData },
      { new: true }
    ).exec()
    if (!user) {
      //console.log('hi')
      var password = Date.now()
      // console.log('facebookData', facebookData)
      //console.log('name', name)
      var createObject = {
        email: facebookData.email,
        password: bcrypt.hashSync(password), //if error is meaning this
        fb_info: facebookData,
        name: name[0],
        lastname: name[1],
        gender: facebookData.gender,
        //country: facebookData.locale,
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
      token = await jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: env.JWT_TOKEN_LIFETIME,
      })
    } else {
      if (user.country == 'undefined') {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { country: facebookData.locale } }
        )
      }
      if (user.gender == 'undefined') {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { gender: facebookData.gender } }
        )
      }
      if (user.name == 'undefined') {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { name: name[0] } }
        )
      }
      if (user.lastname == 'undefined') {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { lastname: name[1] } }
        )
      }
      if (user.status == 'inactive') {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { status: 'active' } }
        )
      }
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
      token = await jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: env.JWT_TOKEN_LIFETIME,
      })
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

const email = (text, output, subject) => {
  return new Promise((resolve, reject) => {
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
      to: `${output.data.email}`, // list of receivers
      subject: `${subject}`, // Subject line
      text: `${text}`,
      // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    }
    transporter.sendMail(mailOptions, function(error, info) {
      //console.log('senemail', output)
      if (error) {
        //console.log('error', error)
        output.status.code = '400'
        output.status.success = false
        output.status.message = 'Cannot send email'
        output.data = {}
        resolve('false')
      } else {
        //console.log('hhiiiiiii')
        resolve('success')
      }
    })
  })
}

const checkAuthen = (providerName, output) => {
  if (socialAuthen[providerName] == undefined) {
    //console.log('hi')
    output.status.message = providerName + ' is not support'
    return false
  } else {
    return true
  }
}

const verifyToken = (token, req, output) => {
  var query = {}
  return new Promise(async (resolve, reject) => {
    await jwt.verify(token, req.app.get('secret'), function(err, decoded) {
      if (err) {
        output.status.code = 403
        output.status.message = 'Failed to authenticate token.'
        query = {
          email: '',
          status: 'unauthorized',
        }
        resolve(query)
      } else {
        //console.log('decoded.data.email', decoded.data.email)
        if (
          decoded.data.email == undefined ||
          decoded.data.email == 'undefined'
        ) {
          //console.log('fisofjo')
          query = {
            email: decoded.data[0].email,
            password: decoded.data[0].password,
            status: 'authorize',
          }
          resolve(query)
        } else {
          //console.log('hiiiii')
          query = {
            email: decoded.data.email,
            password: decoded.data.password,
            status: 'authorize',
          }
          resolve(query)
        }
      }
    })
  })
}

const activateUser = (query, output, text, subject) => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate(query, { $set: { status: 'active' } })
      .then(async function(user) {
        text =
          'Your promotion code for watch live and video in Max Muay Thai: MWC2016'
        output.data = query
        await email(text, output, subject)
        output.status.code = 200
        output.status.success = true
        output.status.message = 'active email is success'
        resolve('success')
      })
      .catch(function(err) {
        console.log(err)
        resolve('false')
      })
  })
}

const changePasswordUser = (query, output, text, subject, newPassword) => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate(query, { $set: { password: newPassword } })
      .then(async function(user) {
        output.data = query
        await email(text, output, subject)
        output.status.code = 200
        output.status.success = true
        output.status.message = 'successful to change password'
        resolve('success')
      })
      .catch(function(err) {
        console.log(err)
        resolve('false')
      })
  })
}

const createUser = (newUser, type, output) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log('create User')
      const user = await newUser.save()
      //console.log('user', user)
      const token = jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: env.JWT_TOKEN_LIFETIME,
      })
      // console.log('token', token)
      output.status.code = 200
      output.status.success = true
      output.status.message = defaultSuccessMessage
      output.data = {
        token: token,
        email: newUser.email,
      }
      // console.log('pooooo', output.status.code)
      resolve(output.status.code)
    } catch (err) {
      log('err', err)
      resolve(err)
    }
  })
}

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

//controllers
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

exports.localRegister = async function(req, res) {
  console.log('localRegister!!!')
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var providerName = req.body.provider_name
  var providerData = req.body.provider_data
  var response = ''
  var text = ''
  var j = JSON.stringify(req.body)
  var subject = 'Please verify your email'

  var auth = checkAuthen(providerName, output)
  if (auth == false) {
    return res.json(output)
  } else {
    response = await socialAuthen[providerName](providerData, output)
    //console.log('token when register', output.data.token)
    console.log(stagingUrl)
    if (response != 400) {
      //console.log('token in email', output.data.token)
      ;(text =
        'Activate Account please enter link' +
        stagingUrl +
        '/verify?token=' +
        output.data.token),
        await email(text, output, subject)
      return res.json(output)
    } else {
      return res.json(output)
    }
  }
}

exports.localLogin = async function(req, res) {
  var queryParams = {
    email: req.body.provider_data.email,
  }

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
  var decode = {}
  var query = {}
  var statusToken = ''
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: {},
  }
  var text = ''
  var subject = 'Promotion code for Max Muay Thai'
  statusToken = await verifyToken(token, req)
  if (statusToken.status == 'authorize') {
    query = { email: statusToken.email }
    await activateUser(query, output, text, subject)
    return res.json(output)
  } else {
    output.status.message = 'unauthorized your token'
    return res.json(output)
  }
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

    //console.log('response', response)
    return res.json(response)
  }
}

exports.checkOldPassword = async function(req, res) {
  var token = req.query.token
  var password = req.body.password
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var statusToken = await verifyToken(token, req)
  if (bcrypt.compareSync(password, statusToken.password)) {
    output.status.code = 200
    output.status.success = true
    output.status.message = 'your password is verify'
  } else {
    output.status.message = `your password isn't verify`
  }
  return res.json(output)
}

exports.changePassword = async function(req, res) {
  var token = req.query.token
  var password = req.body.password
  var query = {}
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var statusToken = {}
  var newPassword = bcrypt.hashSync(password)
  var text = 'Successful change password you can login with new password'
  var subject = 'Sucessful to change password'
  var statusToken = await verifyToken(token, req)
  //console.log('statusToken', statusToken)
  var statusPassword = ''
  if (statusToken.status == 'authorize') {
    query = { email: statusToken.email }
    statusPassword = await changePasswordUser(
      query,
      output,
      text,
      subject,
      newPassword
    )
    output.data = {}
    if (statusPassword == 'success') {
      return res.json(output)
    } else {
      output.status.message = 'error'
      return res.json(output)
    }
  } else {
    output.status.message = 'unauthorized your token'
    return res.json(output)
  }
}

exports.forgotPassword = async function(req, res) {
  var userEmail = req.body.email
  var query = {}
  var output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  var text = ''
  var subject = 'Forgot you password Max Muay Thai'
  await User.find({ email: userEmail })
    .then(async function(user) {
      if (Object.keys(user).length != 0) {
        const token = jwt.sign({ data: user }, env.JWT_SECRET, {
          expiresIn: env.JWT_TOKEN_LIFETIME,
        })
        output.data = { email: userEmail }
        text =
          'Change your password from ' +
          stagingUrl +
          '/changePassword?token=' +
          token
        const statusEmail = await email(text, output, subject)
        if (statusEmail === 'success') {
          output.status.code = 200
          output.status.success = true
          output.status.message =
            'Please check your email for change your password'
        }
      } else {
        output.status.message = 'Email is invalid'
      }
    })
    .catch(function(err) {
      console.log(err)
      output.status.message = err
    })
  return res.json(output)
}

exports.profileUser = async function(req, res) {
  const output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  const token = req.query.token
  const emailUser = await verifyToken(token, req, output)
  //console.log('emailUser', emailUser)
  await User.find(
    { email: emailUser.email },
    {
      email: 1,
      password: 1,
      country: 1,
      gender: 1,
      name: 1,
      lastname: 1,
      date_birth: 1,
    }
  )
    .then(function(user) {
      if (Object.keys(user).length != 0) {
        output.status.code = 200
        output.status.success = true
        output.status.message = 'success'
        output.data = user[0]
      } else {
        output.status.message = 'user not found'
      }
    })
    .catch(function(err) {
      console.log('err', err)
      output.status.message = err
    })
  //console.log('output', output)
  return res.send(output)
}

exports.updateUser = async function(req, res) {
  console.log('hi', req.body)
  const output = {
    status: {
      code: 400,
      success: false,
      message: defaultErrorMessage,
    },
    data: [],
  }
  const token = req.query.token
  const decoded = await verifyToken(token, req)
  //console.log('decoded', decoded)
  const user = await User.findOneAndUpdate(
    { email: decoded.email },
    {
      name: req.body.name,
      lastname: req.body.lastname,
      country: req.body.country,
      gender: req.body.gender,
      date_birth: req.body.birthDay,
    },
    { new: true }
  )
  //console.log('user', user)
  output.status.code = 200
  output.status.success = true
  output.status.message = 'successful to update profile'
  res.send(output)
}
