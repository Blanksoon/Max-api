import jwt from 'jsonwebtoken'
import fs from 'fs'
import env from '../config/env'
import Live from '../models/live'
import Package from '../models/package'
import Order from '../models/order'
import Subscribe from '../models/subscribe'
import User from '../models/user'
import nodemailer from 'nodemailer'
import moment from 'moment'
import HummusRecipe from 'hummus-recipe-th'
import hummus from 'hummus'
import { createOrder } from '../utils/wechat'
import { dirname } from 'path'

let y = 0 // use in testPdf2

const sendEmail = (text, email, subject) => {
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
        resolve('success')
      }
    })
  })
}

const decryptJwt = (token, req) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, async function(error, decoded) {
      if (error) {
        reject({
          code: 401,
          message: `can't verify your token`,
        })
      }
      resolve(decoded)
    })
  })
}

const checkStatusLive = liveId => {
  return new Promise(async (resolve, reject) => {
    Live.findOne({ _id: liveId }, function(err, live) {
      if (live) {
        resolve(live)
      } else {
        reject({
          code: 404,
          message: 'Target live not found',
        })
      }
    })
  })
}

const checkStatusPackage = packageId => {
  return new Promise(async (resolve, reject) => {
    Package.findOne({ _id: packageId }, function(err, packageList) {
      if (packageList) {
        resolve(packageList)
      } else {
        reject({
          code: 404,
          message: 'Target package not found',
        })
      }
    })
  })
}

const checkStatusSubscribe = subscribeId => {
  return new Promise(async (resolve, reject) => {
    Subscribe.findOne({ _id: subscribeId }, function(err, subscribe) {
      if (subscribe) {
        resolve(subscribe)
      } else {
        reject({
          code: 404,
          message: 'Target subscribe not found',
        })
      }
    })
  })
}

const queryOrder = orderId => {
  return new Promise(async (resolve, reject) => {
    Order.findOne({ _id: orderId }, function(err, order) {
      if (order) {
        resolve(order)
      } else {
        reject({
          code: 404,
          message: 'order not found',
        })
      }
    })
  })
}

const randomString = len => {
  return new Promise((resolve, reject) => {
    let charSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let randomString = ''
    for (let i = 0; i < len; i++) {
      let randomPoz = Math.floor(Math.random() * charSet.length)
      randomString += charSet.substring(randomPoz, randomPoz + 1)
    }
    resolve(randomString)
  })
}

//wechat
exports.payPerViewWechat = async function(req, res) {
  const token = req.query.token
  const liveId = req.query.liveId
  //console.log(liveId)
  try {
    const decode = await decryptJwt(token, req)
    const live = await checkStatusLive(liveId)
    const userId = decode.data._id
    const email = decode.data.email
    const expiredDate = new Date(live.liveToDate)
    expiredDate.setDate(expiredDate.getDate() + 1)
    const mch_order_no = await randomString(16)
    const nonce_str = await randomString(16)
    let price = 0
    if (live.price === 1.99) {
      price = 7000
    } else if (live.price === 4.99) {
      price = 17500
    } else {
      price = 35000
    }
    const result = await createOrder(mch_order_no, nonce_str, price)
    //console.log('result: ', result)
    if (result.data.err_msg != undefined) {
      throw result.data.err_code
    }
    const newOrder = new Order({
      productId: live.id,
      productName: live.title_en,
      userId,
      email,
      price: live.price,
      purchaseDate: new Date(),
      platform: 'wechat',
      expiredDate: expiredDate,
      wechat: {
        paymentId: result.data.mch_order_no,
      },
      status: 'created',
    })
    const order = await newOrder.save()
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success for purchase',
      },
      data: {
        qrcode: result.data.imgdat,
        switch: 1,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error,
      },
      data: [],
    })
  }
}

exports.confirmTransaction = async function(req, res) {
  console.log(req)
  const payload = req.body
  const queryload = req.query
  try {
    fs.writeFileSync('./req.txt', JSON.stringify(req), {
      flag: 'a',
    })
    fs.writeFileSync('./reqbodywechat.txt', JSON.stringify(payload), {
      flag: 'a',
    })
    fs.writeFileSync('./reqquerywechat.txt', JSON.stringify(queryload), {
      flag: 'a',
    })
    if (req.query.data.result === 'SUCCESS') {
      const order = await Order.findOne({
        'wechat.paymentId': req.query.data.mch_order_no,
      })
      order.status = 'approved'
      const expiredDateText = moment(order.expiredDate).format('DD MMMM YYYY')
      await order.save()
      await sendEmail(
        `Thank you for purchase ${
          order.productName
        }, you can watch until ${expiredDateText}`,
        order.email,
        'Thank you for purchase Max Muay Thai'
      )
      res.redirect(env.FRONTEND_URL + '/getticket')
    } else {
      //console.log('2')
      res.redirect(env.FRONTEND_URL + '/error')
    }
  } catch (err) {
    // res.status(200).send({
    //   status: {
    //     code: error.code || 500,
    //     success: false,
    //     message: error.message,
    //   },
    //   data: [],
    // })
    //console.log('4')
    res.redirect(env.FRONTEND_URL + '/error')
  }
}

exports.payPerViewPackageWechat = async function(req, res) {
  const token = req.query.token
  const packageId = req.query.packageId
  try {
    const decode = await decryptJwt(token, req)
    const packageProduct = await checkStatusPackage(packageId)
    const userId = decode.data._id
    const email = decode.data.email
    const today = Date.now()
    const expiredDate = moment(today)
      .add(1, 'month')
      .format('MMMM DD YYYY H:mm:ss')
    const mch_order_no = await randomString(16)
    const nonce_str = await randomString(16)
    let price = 0
    if (packageProduct.price === 1.99) {
      price = 7000
    } else if (packageProduct.price === 4.99) {
      price = 17500
    } else {
      price = 35000
    }
    const result = await createOrder(mch_order_no, nonce_str, price)
    //console.log('result: ', result)
    if (result.data.err_msg != undefined) {
      throw result.data.err_code
    }
    const newOrder = new Order({
      productId: packageProduct.id,
      productName: packageProduct.title_en,
      userId,
      email,
      price: packageProduct.price,
      purchaseDate: new Date(),
      platform: 'wechat',
      expiredDate: expiredDate,
      wechat: {
        paymentId: result.data.mch_order_no,
      },
      status: 'created',
    })
    const order = await newOrder.save()
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success for purchase',
      },
      data: {
        qrcode: result.data.imgdat,
        switch: 1,
      },
    })
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error.message,
      },
      data: [],
    })
  }
}

exports.testPdf = async function(req, res) {
  try {
    //console.log('1: ', __dirname)
    const pdfDoc = new HummusRecipe(
      `${__dirname}/pdf/test.pdf`,
      `${__dirname}/pdf/output.pdf`
    )
    const a = 'hello how are you'
    pdfDoc
      // edit 1st page
      .editPage(1)
      // part one
      .text('กกกกกก', 85.2, 114.48, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ขขขขขข', 249.6, 114.48, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ฉฉฉฉฉฉ', 450.72, 114.48, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('คคคคคค', 450.72, 132, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('งงงงงงงง', 450.72, 150, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ยยยยยย', 450.72, 167.8, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('จจจจจจ', 80.4, 133, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ดดดดดด', 80.4, 150, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ออออออ', 80.4, 166.8, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('รับชำระ', 112.8, 263.76, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('11111', 268.08, 263.76, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('2222', 350.16, 263.76, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('33333', 432.48, 263.76, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('4444', 522.72, 263.76, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ฝฝฝฝฝฝ', 154.56, 295.5, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('5555', 522.72, 295.5, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      // part two
      .text('มมมมมมม', 90.96, 515.32, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ททททท', 252.96, 515.7, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ฑฑฑฑฑฑ', 464.88, 515.7, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('นนนนนน', 464.88, 533, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บบบบบบบ', 464.88, 550, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ฆฆฆฆฆฆฆ', 464.88, 570, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ลลลลลลล', 90.96, 533, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('พพพพพพพพ', 90.96, 552, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('หหหหหหห', 90.96, 570.04, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('รับชำระ', 102.24, 665.24, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('666666', 253.93, 665.24, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('777777', 351.12, 665.24, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('888888', 432.72, 665.24, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('999999', 526.8, 665.24, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('ชชชชชชช', 163.92, 688.12, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('1717', 526.8, 688.8, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .endPage()
      .endPDF()
    res.status(200).sendFile(`${__dirname}/pdf/output.pdf`)
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error.message,
      },
      data: [],
    })
  }
}

exports.testPdf2 = async function(req, res) {
  //let y = 0
  try {
    //console.log('1: ', __dirname)
    const pdfDoc = new HummusRecipe(
      `${__dirname}/pdf/statement.pdf`,
      `${__dirname}/pdf/statementOutput.pdf`
    )
    const a = 'hello how are you'
    pdfDoc
      // edit 1st page
      .editPage(1)
      // part 1
      .text('เลขที่ : 000000', 475, 29, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('นางสาวใจดี ดีต่อใจ', 69, 80, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('บริษัท ไอทีทีพี จำกัด', 69, 100, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('183 ซอย ลาดพร้าว 71', 69, 120, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('แขวงสะพานสอง เขตวังทองหลาง', 69, 140, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('กรุงเทพมหานคร 10310', 69, 160, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('00-00-00-1234', 350, 65, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('40000', 350, 85, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 400, 85, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('สินเชื่อใจดี', 490, 65, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('28%', 490, 85, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('15/02/2018', 300, 137, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('02/03/2018', 300, 182, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('7,373.25', 440, 182, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 480, 182, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('40,803.44', 440, 137, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 480, 137, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 235, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 235, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 235, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 235, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 235, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 255, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 255, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 255, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 255, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 255, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 275, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 275, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 275, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 275, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 275, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 295, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 295, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 295, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 295, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 295, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
    //part 2
    const baseY = 346.2
    const incrementValue = 11.2
    let i = 0
    while (i < 1) {
      blockTypeA(pdfDoc, baseY, incrementValue)
      blockTypeB(pdfDoc, baseY, incrementValue)
      blockTypeB(pdfDoc, baseY, incrementValue)
      blockTypeC(pdfDoc, baseY, incrementValue)
      i++
    }
    y = 0
    console.log('1. y:', y)
    //part 3
    pdfDoc
      .text('ITTP', 74, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0000001234', 145, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('20,000', 280, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 315, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('นางสาวใจดี ดีต่อใจ', 145, 713, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('20,000', 430, 713, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 460, 713, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .endPage()
      .endPDF()
    res.status(200).sendFile(`${__dirname}/pdf/statementOutput.pdf`)
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error.message,
      },
      data: [],
    })
  }
}

function blockTypeA(pdfDoc, baseY, incrementValue) {
  let outputTypeA = {}
  outputTypeA = pdfDoc
    .text('02/02/2018', 65, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('ชำระเงิน', 148, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('ค่าติดตามทวงถาม', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('200.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('ดอกเบี้ยงวดปัจจุบัน', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('300.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('ค่าติดตามทวงถาม', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('200.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('ดอกเบี้ยงวดปัจจุบัน', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('300.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('รวม', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('500.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  return outputTypeA
}

function blockTypeB(pdfDoc, baseY, incrementValue) {
  let outputTypeB = {}
  outputTypeB = pdfDoc
    .text('ชำระเงิน', 148, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('ค่าติดตามทวงถาม', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('200.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('ดอกเบี้ยงวดปัจจุบัน', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('300.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('รวม', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('500.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  return outputTypeB
}

function blockTypeC(pdfDoc, baseY, incrementValue) {
  let outputTypeC = {}
  outputTypeC = pdfDoc
    .text('02/02/2018', 65, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('สรุปยอด', 148, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('ยอดชั้นต่ำ งวดปัจจุบัน', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('200.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('ยอดชั้นต่ำ งวดปัจจุบัน', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('200.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('ยอดค่าติดตามทวงถาม งวดปัจจุบัน', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('300.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  pdfDoc
    .text('รวม', 215, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
    .text('500.00', 462, baseY + y, {
      //excess amounts
      color: '000000',
      fontSize: 12,
      font: 'THSarabunNew',
    })
  y = y + incrementValue
  return outputTypeC
}

exports.testPdf3 = async function(req, res) {
  var pdfWriter = hummus.createWriterToModify(
    `${__dirname}/pdf/statement.pdf`,
    {
      modifiedFilePath: `${__dirname}/pdf/statementOutput.pdf`,
    }
  )

  var pageModifier = new hummus.PDFPageModifier(pdfWriter, 0, true)
  pageModifier
    .startContext()
    .getContext()
    .cm(0, -1, 1, 0, 0, 0)
    .writeText('Test Text', 2, 2, {
      font: pdfWriter.getFontForFile(`${__dirname}/THSarabunNew.ttf`),
      size: 14,
      colorspace: 'black',
      color: 0x00,
    })

  pageModifier.endContext().writePage()
  pdfWriter.end()
  res.status(200).sendFile(`${__dirname}/pdf/statementOutput.pdf`)
}

exports.testPdf4 = async function(req, res) {
  try {
    const pdfDoc = new HummusRecipe(
      `${__dirname}/pdf/ittp-statement.pdf`,
      `${__dirname}/pdf/ittp-statement-output.pdf`
    )
    const a = 'hello how are you'
    pdfDoc
      // edit 1st page
      .editPage(1)
      // part 1
      .text('เลขที่ : 000000', 475, 29, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('นางสาวใจดี ดีต่อใจ', 69, 75, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('บริษัท ไอทีทีพี จำกัด', 69, 95, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('183 ซอย ลาดพร้าว 71', 69, 115, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('แขวงสะพานสอง เขตวังทองหลาง', 69, 135, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('กรุงเทพมหานคร 10310', 69, 155, {
        color: '000000',
        fontSize: 15,
        font: 'THSarabunNew',
      })
      .text('00-00-00-1234', 350, 60, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('40000', 350, 80, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      // .text('บาท', 400, 85, {
      //   color: '000000',
      //   fontSize: 13,
      //   font: 'THSarabunNew',
      // })
      .text('สินเชื่อใจดี', 490, 60, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('28%', 490, 80, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('15/02/2018', 300, 132, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('02/03/2018', 300, 177, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('7,373.25', 440, 177, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 480, 177, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('40,803.44', 440, 132, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 480, 132, {
        color: 'ffffff',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 227, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 227, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 227, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 227, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 227, {
        //payment received
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 247, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 247, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 247, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 247, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 247, {
        //past due
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 267, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 267, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 267, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 267, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 267, {
        //remaining balance
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 235, 286, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('300.00', 305, 286, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('200.00', 370, 286, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('0.00', 443, 286, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('500.00', 505, 286, {
        //excess amounts
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
    //part 2
    const baseY = 333
    const incrementValue = 11.2
    let i = 0
    while (i < 1) {
      blockTypeA(pdfDoc, baseY, incrementValue)
      blockTypeB(pdfDoc, baseY, incrementValue)
      blockTypeB(pdfDoc, baseY, incrementValue)
      blockTypeC(pdfDoc, baseY, incrementValue)
      i++
    }
    y = 0
    console.log('1. y:', y)
    //part 3
    pdfDoc
      // .text('ITTP', 74, 577, {
      //   color: '000000',
      //   fontSize: 13,
      //   font: 'THSarabunNew',
      // })
      .text('0000001234', 145, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('20,000', 280, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 315, 577, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('นางสาวใจดี ดีต่อใจ', 145, 713, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('20,000', 430, 713, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .text('บาท', 460, 713, {
        color: '000000',
        fontSize: 13,
        font: 'THSarabunNew',
      })
      .endPage()
      .endPDF()
    res.status(200).sendFile(`${__dirname}/pdf/ittp-statement-output.pdf`)
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error.message,
      },
      data: [],
    })
  }
}
