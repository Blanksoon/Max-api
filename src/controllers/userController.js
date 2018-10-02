import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import env from '../config/env'
import User from '../models/user'
import Order from '../models/order'
import moment from 'moment'
import { model, mongo } from 'mongoose'
import fs from 'fs'
import xl from 'excel4node'

const defaultSuccessMessage = 'success'
const defaultErrorMessage = 'data_not_found'
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt-nodejs')
const log = console.log
const socialAuthen = []

//function
socialAuthen['local'] = async function(providerData, output) {
  var code = ''
  var user = await User.find({ email: providerData.email }).exec()
  var password = bcrypt.hashSync(providerData.password)
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  // Not a valid email
  if (!re.test(providerData.email)) {
    //if false do it
    output.status.message = 'email is invalid'
    return 400
  } else {
    // Email is valid
    // Email does not exist in db
    if (Object.keys(user).length == 0) {
      var createObject = {
        email: providerData.email,
        password: password,
        status: 'inactive',
      }
      var new_user = new User(createObject)
      var statusUser = await createUser(new_user, 'local', output)
      return statusUser
    } else {
      // Email already exist
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
        data: {},
      }
    }
    if (response.id != facebookData.id || response.name != facebookData.name) {
      return {
        status: {
          code: 400,
          success: false,
          message: 'token is invalid',
        },
        data: {},
      }
    }
  } catch (err) {
    return {
      status: {
        code: 400,
        success: false,
        message: err.message,
      },
      data: {},
    }
  }

  try {
    var token = ''
    //var name = facebookData.name.split(/[ ]+/)
    //console.log('facebookData', facebookData)
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
        name: facebookData.first_name,
        lastname: facebookData.last_name,
        gender: facebookData.gender,
        //country: facebookData.locale,
        createDate: Date.now(),
      }
      var new_user = new User(createObject)
      checkNewUser = new User(createObject)
      try {
        user = await new_user.save()
        if (env.PROMOTION === 'on') {
          await promotionForNewCustomer(user)
        }
        //console.log('user', user)
      } catch (err) {
        return {
          status: {
            code: 400,
            success: false,
            message: err.message,
          },
          data: {},
        }
      }
      token = await jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: env.JWT_TOKEN_LIFETIME,
      })
    } else {
      if (user.country == null) {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { country: facebookData.locale } }
        )
      }
      if (user.gender == null) {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { gender: facebookData.gender } }
        )
      }
      if (user.name == null) {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { name: facebookData.first_name } }
        )
      }
      if (user.lastname == null) {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { lastname: facebookData.last_name } }
        )
      }
      if (user.status == 'inactive') {
        await User.updateMany(
          { email: facebookData.email },
          { $set: { status: 'active' } }
        )
      }
    }

    // if (Object.keys(checkNewUser).length != 0) {
    //   var transporter = nodemailer.createTransport({
    //     host: 'smtp.sparkpostmail.com',
    //     port: 587,
    //     //service: 'Gmail',
    //     auth: {
    //       user: 'SMTP_Injection', // Your email id
    //       pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
    //     },
    //   })
    //   var mailOptions = {
    //     from: '<no-reply@maxmuaythai.com>', // sender address
    //     to: `${checkNewUser.email}`, // list of receivers
    //     subject: 'Promotion code for Max Muay Thai', // Subject line
    //     text:
    //       'Your promotion code for watch live and video in Max Muay Thai: ' +
    //       'MWC2016',
    //     // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    //   }
    //   var statuEmail = await transporter
    //     .sendMail(mailOptions)
    //     .then(function(info) {
    //       data = {
    //         status: {
    //           code: 200,
    //           success: true,
    //           message: defaultSuccessMessage,
    //         },
    //         data: {
    //           token: token,
    //           email: facebookData.email,
    //         },
    //       }
    //       return data
    //     })
    //     .catch(function(err) {
    //       return {
    //         status: {
    //           code: 400,
    //           success: false,
    //           message: `can't send email`,
    //         },
    //         data: {},
    //       }
    //     })
    //   return statuEmail
    // } else {
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
  } catch (err) {
    return {
      status: {
        code: 400,
        success: false,
        message: err.message,
      },
      data: {},
    }
  }
}

const readJwtCms = token => {
  return new Promise((resolve, reject) => {
    const error = {
      statusJwt: '',
      err: '',
    }
    jwt.verify(token, env.JWT_SECRET, async function(err, decoded) {
      if (err) {
        error.statusJwt = 'Failed to authenticate token.'
        error.err = err
        reject(error.statusJwt)
      } else {
        if (checkUserCms(decoded.data.email, decoded.data.password)) {
          resolve(decoded)
        }
        reject('User not found')
      }
    })
  })
}

const checkUserCms = (username, password) => {
  let i = 0
  const content = fs.readFileSync(env.ADMINPATH)
  let users = JSON.parse(content)
  while (i < users.length) {
    if (users[i].username === username && users[i].password === password) {
      return true
    }
    i++
  }
  return false
}

const sendEmailPromotion = (text, email, subject) => {
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
      to: `${email}`, // list of receivers
      subject: `${subject}`, // Subject line
      text: `${text}`,
    }
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('error', error)
        output.status.code = '400'
        output.status.success = false
        output.status.message = 'Cannot send email'
        output.data = {}
        resolve('false')
      } else {
        console.log('send promotion email success', info)
        resolve('success')
      }
    })
  })
}

const promotionForNewCustomer = customer => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = customer
      //console.log('user', user)
      const packageOrder = await Order.findOne({ userId: user._id })
      //console.log('packageOrder', packageOrder)
      if (packageOrder !== null) {
        //console.log('1')
        return resolve('have order')
      }
      const today = Date.now()
      const expiredDate = moment(today)
        .add(1, 'month')
        .format('MMMM DD YYYY H:mm:ss')
      const expireDateIso = moment(today).add(1, 'month')
      const newOrder = new Order({
        productId: '5a5c2ed0e356edd4d27f88ab',
        productName: 'package lives and vods',
        userId: user._id,
        email: user.email,
        price: '0',
        purchaseDate: new Date(),
        platform: 'creditcard',
        expiredDate: expiredDate,
        status: 'approved',
        orderType: 'free',
      })
      const expiredDateText = moment(expireDateIso).format('DD MMMM YYYY')
      await newOrder.save()
      //console.log(expiredDateText)
      const result = await sendEmailPromotion(
        `This's promotion for new our customer, you can watch lives and vods until ${expiredDateText}`,
        user.email,
        'watch live and vod for free 1 month'
      )
      if (result === 'success') {
        return resolve('success')
      } else {
        throw 'error'
      }
    } catch (error) {
      console.log(error)
      return resolve('error')
    }
  })
}

const emailWithOnlyText = (text, output, subject) => {
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
    }
    transporter.sendMail(mailOptions, function(error, info) {
      //console.log('info', info)
      if (error) {
        console.log('error', error)
        output.status.code = '400'
        output.status.success = false
        output.status.message = 'Cannot send email'
        output.data = {}
        resolve('false')
      } else {
        console.log('send email success')
        resolve('success')
      }
    })
  })
}

const email = (text, output, subject, link, line1, MessageOnButton) => {
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
      //text: `${text}`,
      html:
        `<p>Hello ` +
        output.data.email +
        `</p>
              <p>` +
        line1 +
        `</p>
              <a href=` +
        link +
        `>
              <button 
              style="
              background-color: #B81111;
              border: 1px solid #B81111;
              color: #FFFFFF;
              padding: 8px 10%;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-weight: 700;
              "
              >` +
        MessageOnButton +
        `</button>
              </a>`, // You can choose to send an HTML body instead
    }
    transporter.sendMail(mailOptions, function(error, info) {
      //console.log('info', info)
      if (error) {
        console.log('error', error)
        output.status.code = '400'
        output.status.success = false
        output.status.message = 'Cannot send email'
        output.data = {}
        resolve('false')
      } else {
        console.log('send active email success', info)
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
    await jwt.verify(token, env.JWT_SECRET, function(err, decoded) {
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

const activateUser = (query, output) => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate(query, { $set: { status: 'active' } })
      .then(function(user) {
        resolve(user)
      })
      .catch(function(err) {
        resolve('false')
      })
  })
}

const changePasswordUser = (query, output, text, subject, newPassword) => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate(query, { $set: { password: newPassword } })
      .then(async function(user) {
        output.data = query
        await emailWithOnlyText(text, output, subject)
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
      newUser.createDate = Date.now()
      const user = await newUser.save()
      //console.log('user', user)
      const token = jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: parseInt(env.JWT_TOKEN_LIFETIME),
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

const exportExcel = customer => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a new instance of a Workbook class
      var wb = new xl.Workbook()

      // Add Worksheets to the workbook
      var ws = wb.addWorksheet('Sheet 1')
      var ws2 = wb.addWorksheet('Sheet 2')

      // Create a reusable style
      var style = wb.createStyle({
        font: {
          color: '#FF0800',
          size: 12,
        },
        numberFormat: '$#,##0.00; ($#,##0.00); -',
      })

      // Set value of cell A1 to 100 as a number type styled with paramaters of style
      ws.cell(1, 1)
        .number(100)
        .style(style)

      // Set value of cell B1 to 300 as a number type styled with paramaters of style
      ws.cell(1, 2)
        .number(200)
        .style(style)

      // Set value of cell C1 to a formula styled with paramaters of style
      ws.cell(1, 3)
        .formula('A1 + B1')
        .style(style)

      // Set value of cell A2 to 'string' styled with paramaters of style
      ws.cell(2, 1)
        .string('string')
        .style(style)

      // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
      ws.cell(3, 1)
        .bool(true)
        .style(style)
        .style({ font: { size: 14 } })
      wb.write('Excel.xlsx')
      resolve('success')
    } catch (error) {
      console.log('error: ', error)
      resolve(error)
    }
  })
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
      var token = jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: parseInt(env.JWT_TOKEN_LIFETIME),
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
      var token = jwt.sign({ data: user }, env.JWT_SECRET, {
        expiresIn: parseInt(env.JWT_TOKEN_LIFETIME),
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
    host: 'smtp.sparkpostmail.com',
    port: 587,
    auth: {
      user: 'SMTP_Injection', // Your email id
      pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
    },
  })

  var text = 'Hello world from'
  var mailOptions = {
    from: `<${req.body.userEmail.email}>`, // sender address
    to: 'contact@maxmuaythai.com', // list of receivers
    subject: 'Question from customer', // Subject line
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
    if (response != 400) {
      //console.log('token in email', output.data.token)
      res.json(output)
      text =
        'Activate Account please enter link ' +
        env.FRONTEND_URL +
        '/verify?token=' +
        output.data.token
      const link = `${env.FRONTEND_URL}/verify?token=${output.data.token}`
      const line1 = `Thank you for your register. please activate your account`
      const MessageOnButton = `Activate Now`
      await email(text, output, subject, link, line1, MessageOnButton)
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
      //message_th: 'มีข้อผิดพลาด',
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
          //output.status.message_th = 'คุณยังไม่ได้ทำการยืนยันตัวตน'
        } else {
          var token = jwt.sign({ data: user }, env.JWT_SECRET, {
            expiresIn: parseInt(env.JWT_TOKEN_LIFETIME),
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
        //output.status.message_th = 'รหัสผ่านไม่ถูกต้อง'
      }
    } else {
      output.status.code = 400
      output.status.success = false
      output.status.message = 'Email is invalid'
      //output.status.message_th = 'อีเมล์ไม่ถูกต้อง'
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
  statusToken = await verifyToken(token, req)
  if (statusToken.status == 'authorize') {
    query = { email: statusToken.email }
    const user = await activateUser(query, output)
    if (user === 'false') {
      output.status.message = `can't find customer`
      return res.json(output)
    }
    let result = ''
    if (env.PROMOTION === 'on') {
      result = await promotionForNewCustomer(user)
    } else {
      result = 'success'
    }
    if (result === 'success') {
      return res.json(output)
    } else if (result === 'have order') {
      output.status.message = `you have order`
      return res.json(output)
    } else {
      output.status.message = `can't assign promotin into customer`
      return res.json(output)
    }
  } else {
    //console.log('unauthorize')
    output.status.message = 'unauthorized your token'
    return res.json(output)
  }
}

exports.fbLogin = async function(req, res) {
  //console.log('hi')
  var providerName = req.body.provider_name
  var providerData = req.body.provider_data
  var j = JSON.stringify(req.body)
  //console.log('j', j)
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
  try {
    var statusToken = await verifyToken(token, req)
  } catch (error) {
    res.status.send({
      status: {
        code: 500,
        success: false,
        message: `can't verify token`,
      },
      data: [],
    })
  }
  //console.log('statusToken', statusToken)
  if (bcrypt.compareSync(`${password}`, `${statusToken.password}`)) {
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
          env.FRONTEND_URL +
          '/changePassword?token=' +
          token
        const link = `${env.FRONTEND_URL}/changePassword?token=${token}`
        const line1 = `You can change your password from`
        const MessageOnButton = `Change Password`
        const statusEmail = await email(
          text,
          output,
          subject,
          link,
          line1,
          MessageOnButton
        )
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
      country: 1,
      gender: 1,
      name: 1,
      lastname: 1,
      date_birth: 1,
    }
  )
    .then(function(user) {
      if (Object.keys(user).length != 0) {
        if (user[0].date_birth === null) {
          output.data = user[0]
        } else {
          const a = moment(user[0].date_birth).format('YYYY-MM-DDTHH:MM:SS')
          const outputUser = {
            _id: user[0]._id,
            email: user[0].email,
            country: user[0].country,
            date_birth: a,
            gender: user[0].gender,
            lastname: user[0].lastname,
            name: user[0].name,
          }
          output.data = outputUser
        }
        output.status.code = 200
        output.status.success = true
        output.status.message = 'success'
      } else {
        output.status.message = 'user not found'
      }
    })
    .catch(function(err) {
      console.log('err', err)
      output.status.message = err
    })
  //console.log('output', output)
  return res.json(output)
}

exports.updateUser = async function(req, res) {
  //console.log('hi', req.body)
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
  const birthDay = moment(user.date_birth).format('YYYY-MM-DDTHH:MM:SS')
  const userData = {
    _id: user._id,
    email: user.email,
    name: user.name,
    lastname: user.lastname,
    gender: user.gender,
    country: user.country,
    date_birth: birthDay,
  }
  //console.log('user', userData)
  output.status.code = 200
  output.status.success = true
  output.status.message = 'successful to update profile'
  output.data = userData
  res.send(output)
}

exports.wechat = async function(req, res) {
  //console.log(req)
  res.send(req.query.echostr)
}

exports.testSendEmail = async function(req, res) {
  var transporter = nodemailer.createTransport({
    host: 'smtp.sparkpostmail.com',
    port: 587,
    auth: {
      user: 'SMTP_Injection', // Your email id
      pass: '7d8a0c8c8bd72b3745065171f7cffb7c85990c6e', // Your password
    },
  })
  var mailOptions = {
    from: `<no-reply@maxmuaythai.com>`, // sender address
    to: 'farm1771@gmail.com', // list of receivers
    subject: 'test send html', // Subject line
    //text: 'test',

    html: `<p>Hello farm1771@gmail.com,</p>
           <p>Thank you for your register</p>
           <p>Please Activate Account</p>
           <a href="http://www.google.com/">
           <button 
           style="
            background-color: #B81111;
            border: 1px solid #B81111;
            color: #FFFFFF;
            padding: 8px 10%;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-weight: 700;
           "
           >Activate</button>
           </a>`, // You can choose to send an HTML body instead
  }
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error)
      res.json({ yo: 'error' })
    } else {
      //console.log('Message sent: ' + info.response)
      res.json({ yo: 'success' })
    }
  })
}

exports.cmsLogin = async function(req, res) {
  //console.log('email: ', req.body)
  // if (
  //   req.body.email === 'admin@email.com' &&
  //   req.body.password === 'maxadmin2016'
  // ) {
  if (checkUserCms(req.body.email, req.body.password)) {
    var token = jwt.sign({ data: req.body }, env.JWT_SECRET, {
      expiresIn: parseInt(env.JWT_TOKEN_LIFETIME),
    })
    res.status(200).send({
      token: token,
      email: req.body.email,
    })
  } else {
    res.status(500).send({
      code: 500,
      message: 'email or password is invalid',
    })
  }
}

exports.usersInCms = async function(req, res) {
  const token = req.query.token
  const limit = parseInt(req.query.limit)
  const index = parseInt(req.query.offset)
  try {
    const decodeToken = await readJwtCms(token)
    const data = await User.find({})
    const result = await User.find({})
      .limit(limit)
      .skip(index)
    const dataResult = result.map(item => ({
      ...item['_doc'],
      //onAirDate: moment(item['_doc'].onAirDate).format('DD/MM/YYYY'),
      //promoUrl: item['_doc'].promoUrl.substring(41, 49),
    }))
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch lives',
      },
      data: dataResult,
      dataLength: data.length,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.updateDeviceToken = async function(req, res) {
  const token = req.body.token
  const deviceToken = req.body.deviceToken
  try {
    const data = await verifyToken(token)
    const user = await User.findOneAndUpdate(
      { email: data.email },
      { deviceToken: deviceToken }
    )
    res.status(200).send({ email: user.email, deviceToken: user.deviceToken })
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.userExportExcel = async function(req, res) {
  const token = req.query.token
  try {
    const decodeToken = await readJwtCms(token)
    const wb = new xl.Workbook()
    const ws = wb.addWorksheet('Sheet 1')
    let i = 0
    let row = 2
    const user = await User.find({})
    // console.log('user: ', user.length)
    const headerStyle = wb.createStyle({
      font: {
        color: '#FF0800',
        size: 16,
      },
    })

    ws.cell(1, 1)
      .string('Email')
      .style(headerStyle)
    ws.cell(1, 2)
      .string('Name')
      .style(headerStyle)
    ws.cell(1, 3)
      .string('Lastname')
      .style(headerStyle)
    ws.cell(1, 4)
      .string('Status')
      .style(headerStyle)
    ws.cell(1, 5)
      .string('Country')
      .style(headerStyle)
    ws.cell(1, 6)
      .string('BirthDate')
      .style(headerStyle)
    ws.cell(1, 7)
      .string('Gender')
      .style(headerStyle)
    ws.cell(1, 8)
      .string('Fb-FistName')
      .style(headerStyle)
    ws.cell(1, 9)
      .string('Fb-LastName')
      .style(headerStyle)
    ws.cell(1, 10)
      .string('Fb-Locale')
      .style(headerStyle)
    ws.cell(1, 11)
      .string('Fb-gender')
      .style(headerStyle)
    ws.cell(1, 12)
      .string('Fb-email')
      .style(headerStyle)
    ws.cell(1, 13)
      .string('Fb-name')
      .style(headerStyle)
    ws.cell(1, 14)
      .string('createDate')
      .style(headerStyle)

    while (i < user.length) {
      ws.cell(row, 1).string(`${user[i].email}`)
      ws.cell(row, 2).string(`${user[i].name}`)
      ws.cell(row, 3).string(`${user[i].lastname}`)
      ws.cell(row, 4).string(`${user[i].status}`)
      ws.cell(row, 5).string(`${user[i].country}`)
      ws.cell(row, 6).string(`${user[i].date_birth}`)
      ws.cell(row, 7).string(`${user[i].gender}`)
      if (user[i].fb_info !== null) {
        ws.cell(row, 8).string(`${user[i].fb_info.name}`)
        ws.cell(row, 9).string(`${user[i].fb_info.last_name}`)
        ws.cell(row, 10).string(`${user[i].fb_info.locale}`)
        ws.cell(row, 11).string(`${user[i].fb_info.gender}`)
        ws.cell(row, 12).string(`${user[i].fb_info.email}`)
        ws.cell(row, 13).string(`${user[i].fb_info.name}`)
      }
      ws.cell(row, 14).string(`${user[i].createDate}`)
      row++
      i++
    }
    wb.write('ExcelFile.xlsx', res)
  } catch (err) {
    console.log('err: ', err)
  }
}
