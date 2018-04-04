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
import {
  createCustomer,
  createTransaction,
  chargeTransactionAlipay,
  chargeTransaction,
  createSource,
  retrieveSource,
  checkDefaultSource,
  subscibeCreditCard,
  updateDefaultSource,
  cancelSubscribe,
  createSourceSubscribe,
  createNeworderSubscribe,
} from '../utils/stripe'

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
//stripe
exports.payPerViewCreditCard = async function(req, res) {
  //console.log('token', req.query.token)
  //console.log('liveId', req.query.liveId)
  //console.log('sourceId', req.query.sourceId)
  const token = req.query.token
  const liveId = req.query.liveId
  const sourceId = req.query.sourceId
  try {
    const decode = await decryptJwt(token, req)
    //console.log('111111111', liveId)
    const live = await checkStatusLive(liveId)
    const userId = decode.data._id
    const email = decode.data.email
    // Check customerid stripe
    const user = await User.findOne({ _id: userId })
    //console.log('sourceId', sourceId)
    if (user.stripe.customerId === undefined) {
      // user has no customerid in stripe
      const stripeUser = await createCustomer(email)
      user.stripe.customerId = stripeUser.id
      await user.save()
    }
    const transaction = await createTransaction(
      user.stripe.customerId,
      sourceId
    )
    const expiredDate = new Date(live.liveToDate)
    expiredDate.setDate(expiredDate.getDate() + 1)
    const newOrder = new Order({
      productId: live.id,
      productName: live.title_en,
      userId,
      email,
      price: live.price,
      purchaseDate: new Date(),
      platform: 'creditcard',
      expiredDate: expiredDate,
      status: 'created',
    })
    const order = await newOrder.save()
    // let price = 0
    // if (live.price === 1.99) {
    //   price = 298
    // } else if (live.price === 4.99) {
    //   price = 698
    // } else {
    //   price = 1498
    // }
    const successTransaction = await chargeTransaction(
      transaction.id,
      user.stripe.customerId,
      live.price * 100,
      live.title_en
    )
    if (successTransaction.status === 'succeeded') {
      order.stripe.paymentId = successTransaction.id
      order.status = 'approved'
      await order.save()
      const expiredDateText = moment(order.expiredDate).format('DD MMMM YYYY')
      await sendEmail(
        `Thank you for purchase ${
          order.productName
        }, you can watch until ${expiredDateText}`,
        order.email,
        'Thank you for purchase Max Muay Thai'
      )
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'success for purchase',
        },
        data: {
          url: env.FRONTEND_URL + '/getticket',
        },
      })
    } else {
      res.status(200).send({
        status: {
          code: 500,
          success: true,
          message: successTransaction.status,
        },
        data: {
          url: env.FRONTEND_URL + '/error',
        },
      })
    }
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

exports.payPerViewPackageCreditCard = async function(req, res) {
  //console.log('token', req.query.token)
  //console.log('packageId', req.query.packageId)
  //console.log('sourceId', req.query.sourceId)
  const token = req.query.token
  const packageId = req.query.packageId
  const sourceId = req.query.sourceId
  try {
    const decode = await decryptJwt(token, req)
    const packageProduct = await checkStatusPackage(packageId)
    const userId = decode.data._id
    const email = decode.data.email
    // Check customerid stripe
    const user = await User.findOne({ _id: userId })
    if (user.stripe.customerId === undefined) {
      // user has no customerid in stripe
      const stripeUser = await createCustomer(email)
      user.stripe.customerId = stripeUser.id
      await user.save()
    }
    const transaction = await createTransaction(
      user.stripe.customerId,
      sourceId
    )
    const today = Date.now()
    const expiredDate = moment(today)
      .add(1, 'month')
      .format('MMMM DD YYYY H:mm:ss')
    const newOrder = new Order({
      productId: packageProduct.id,
      productName: packageProduct.title_en,
      userId,
      email,
      price: packageProduct.price,
      purchaseDate: new Date(),
      platform: 'creditcard',
      expiredDate: expiredDate,
      status: 'created',
    })
    const order = await newOrder.save()

    const successTransaction = await chargeTransaction(
      transaction.id,
      user.stripe.customerId,
      packageProduct.price * 100,
      packageProduct.title_en
    )
    if (successTransaction.status === 'succeeded') {
      order.stripe.paymentId = successTransaction.id
      order.status = 'approved'
      await order.save()
      const expiredDateText = moment(order.expiredDate).format('DD MMMM YYYY')
      await sendEmail(
        `Thank you for purchase ${
          order.productName
        }, you can watch until ${expiredDateText}`,
        order.email,
        'Thank you for purchase Max Muay Thai'
      )
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'success for purchase',
        },
        data: {
          url: env.FRONTEND_URL + '/getticket',
        },
      })
    } else {
      res.status(200).send({
        status: {
          code: 500,
          success: true,
          message: successTransaction.status,
        },
        data: {
          url: env.FRONTEND_URL + '/error',
        },
      })
    }
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

exports.payPerViewPackageAlipay = async function(req, res) {
  //console.log('token', req.query.token)
  //console.log('liveId', req.query.liveId)
  //console.log('sourceId', req.query.sourceId)
  const token = req.query.token
  const packageId = req.query.packageId
  let price = 0
  try {
    const decode = await decryptJwt(token, req)
    //console.log('111111111', liveId)
    const packageProduct = await checkStatusPackage(packageId)
    if (packageProduct.price === 1.99) {
      price = 298
    } else if (packageProduct.price === 4.99) {
      price = 698
    } else {
      price = 1498
    }
    const sourceId = await createSource(price)
    //console.log('ccccccccccccc', sourceId)
    const userId = decode.data._id
    const email = decode.data.email
    // Check customerid stripe
    const user = await User.findOne({ _id: userId })
    //console.log('sourceId', sourceId)
    if (user.stripe.customerId === undefined) {
      // user has no customerid in stripe
      const stripeUser = await createCustomer(email)
      user.stripe.customerId = stripeUser.id
      await user.save()
    }
    const transaction = await createTransaction(
      user.stripe.customerId,
      sourceId.id
    )
    const today = Date.now()
    const expiredDate = moment(today)
      .add(1, 'month')
      .format('MMMM DD YYYY H:mm:ss')
    const newOrder = new Order({
      productId: packageProduct.id,
      productName: packageProduct.title_en,
      userId,
      email,
      price: packageProduct.price,
      purchaseDate: new Date(),
      platform: 'alipay',
      expiredDate: expiredDate,
      status: 'created',
      stripe: {
        paymentId: transaction.id,
      },
    })
    const order = await newOrder.save()
    //console.log('123', transaction.redirect.url)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'pay by alipay success',
      },
      data: {
        url: transaction.redirect.url,
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

exports.payPerViewAlipay = async function(req, res) {
  //console.log('token', req.query.token)
  //console.log('liveId', req.query.liveId)
  //console.log('sourceId', req.query.sourceId)
  const token = req.query.token
  const liveId = req.query.liveId
  let price = 0
  try {
    const decode = await decryptJwt(token, req)
    //console.log('111111111', liveId)
    const live = await checkStatusLive(liveId)
    if (live.price === 1.99) {
      price = 298
    } else if (live.price === 4.99) {
      price = 698
    } else {
      price = 1498
    }
    const sourceId = await createSource(price)
    //console.log('ccccccccccccc', sourceId)
    const userId = decode.data._id
    const email = decode.data.email
    // Check customerid stripe
    const user = await User.findOne({ _id: userId })
    //console.log('sourceId', sourceId)
    if (user.stripe.customerId === undefined) {
      // user has no customerid in stripe
      const stripeUser = await createCustomer(email)
      user.stripe.customerId = stripeUser.id
      await user.save()
    }
    const transaction = await createTransaction(
      user.stripe.customerId,
      sourceId.id
    )
    const expiredDate = new Date(live.liveToDate)
    expiredDate.setDate(expiredDate.getDate() + 1)
    const newOrder = new Order({
      productId: live.id,
      productName: live.title_en,
      userId,
      email,
      price: live.price,
      purchaseDate: new Date(),
      platform: 'alipay',
      expiredDate: expiredDate,
      status: 'created',
      stripe: {
        paymentId: transaction.id,
      },
    })
    const order = await newOrder.save()
    // const successTransaction = await chargeTransaction(
    //   transaction.id,
    //   user.stripe.customerId,
    //   live.price * 100
    // )
    // if (successTransaction.status === 'succeeded') {
    //   order.stripe.paymentId = successTransaction.id
    //   order.status = 'approved'
    //   await order.save()
    //   res.send({
    //     url: env.FRONTEND_URL + '/getticket',
    //   })
    // } else {
    //   res.send({
    //     url: env.FRONTEND_URL + '/error',
    //   })
    // }
    //console.log('123', transaction.redirect.url)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'pay by alipay success',
      },
      data: {
        url: transaction.redirect.url,
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

exports.confirmTransaction = async function(req, res) {
  //console.log(req.query)
  try {
    const stautsTransaction = await retrieveSource(req.query.source)
    if (stautsTransaction.status === 'chargeable') {
      // console.log('id', stautsTransaction.id)
      // console.log('customer', stautsTransaction.customer)
      // console.log('amount', stautsTransaction.amount)
      const beforeChargeOrder = await Order.findOne({
        'stripe.paymentId': stautsTransaction.id,
      })
      let desc = ''
      if (beforeChargeOrder.productName !== undefined) {
        desc = beforeChargeOrder.productName
      } else {
        desc = beforeChargeOrder.title_en
      }
      const transaction = await chargeTransactionAlipay(
        stautsTransaction.id,
        stautsTransaction.customer,
        stautsTransaction.amount,
        desc
      )
      if (transaction.status === 'succeeded') {
        const order = await Order.findOne({
          'stripe.paymentId': stautsTransaction.id,
        })
        order.stripe.paymentId = transaction.id
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
    } else {
      //console.log('3')
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

exports.subCreditCard = async function(req, res) {
  // const token = req.query.token
  // const subscribeId = req.query.subscribeId
  // const creditcard = req.body.creditcard
  // const sourceId = req.query.sourceId
  // try {
  //   const decode = await decryptJwt(token, req)
  //   const subscribe = await checkStatusSubscribe(subscribeId)
  //   const userId = decode.data._id
  //   const email = decode.data.email
  //   // Check customerid stripe
  //   const user = await User.findOne({ _id: userId })
  //   //console.log('sourceId', sourceId)
  //   if (user.stripe.customerId === undefined) {
  //     // user has no customerid in stripe
  //     const stripeUser = await createCustomer(email)
  //     user.stripe.customerId = stripeUser.id
  //     await user.save()
  //   }
  //   const defaultSource = await checkDefaultSource(
  //     user.stripe.customerId,
  //     creditcard
  //   )
  //   if (defaultSource.message === 'ready') {
  //     const transaction = await subscibePlan(
  //       user.stripe.customerId,
  //       subscribe.stripe.planId
  //     )
  //     if (transaction.status === 'active') {
  //       const expiredDate = transaction.current_period_end
  //       const newOrder = new Order({
  //         productId: subscribe.id,
  //         productName: subscribe.title_en,
  //         userId,
  //         email,
  //         price: subscribe.price,
  //         purchaseDate: new Date(),
  //         platform: 'creditcard',
  //         expiredDate: expiredDate,
  //         status: 'approved',
  //         stripe: {
  //           paymentId: transaction.id,
  //         },
  //       })
  //       res.send({
  //         url: env.FRONTEND_URL + '/getticket',
  //       })
  //     } else {
  //       res.send({
  //         url: env.FRONTEND_URL + '/error',
  //       })
  //     }
  //   } else if (defaultSource.message === 'unready') {
  //     const source = await updateDefaultSource(
  //       user.stripe.customerId,
  //       defaultSource.data.id
  //     ) //check
  //     const transaction = await subscibePlan(
  //       user.stripe.customerId,
  //       subscribe.stripe.planId
  //     )
  //     if (transaction.status === 'active') {
  //       const expiredDate = transaction.current_period_end
  //       const newOrder = new Order({
  //         productId: subscribe.id,
  //         productName: subscribe.title_en,
  //         userId,
  //         email,
  //         price: subscribe.price,
  //         purchaseDate: new Date(),
  //         platform: 'creditcard',
  //         expiredDate: expiredDate,
  //         status: 'approved',
  //         stripe: {
  //           paymentId: transaction.id,
  //         },
  //       })
  //       res.send({
  //         url: env.FRONTEND_URL + '/getticket',
  //       })
  //     } else {
  //       res.send({
  //         url: env.FRONTEND_URL + '/error',
  //       })
  //     }
  //   } else {
  //     const Transaction = await createTransaction(
  //       user.stripe.customerId,
  //       sourceId
  //     )
  //   }
  // const transaction = await createTransaction(
  //   user.stripe.customerId,
  //   sourceId.id
  // )
  // const expiredDate = new Date(live.liveToDate)
  // expiredDate.setDate(expiredDate.getDate() + 1)
  // const newOrder = new Order({
  //   productId: live.id,
  //   productName: live.title_en,
  //   userId,
  //   email,
  //   price: live.price,
  //   purchaseDate: new Date(),
  //   platform: 'alipay',
  //   expiredDate: expiredDate,
  //   status: 'created',
  //   stripe: {
  //     paymentId: transaction.id,
  //   },
  // })
  // const order = await newOrder.save()
  // const successTransaction = await chargeTransaction(
  //   transaction.id,
  //   user.stripe.customerId,
  //   live.price * 100
  // )
  // if (successTransaction.status === 'succeeded') {
  //   order.stripe.paymentId = successTransaction.id
  //   order.status = 'approved'
  //   await order.save()
  //   res.send({
  //     url: env.FRONTEND_URL + '/getticket',
  //   })
  // } else {
  //   res.send({
  //     url: env.FRONTEND_URL + '/error',
  //   })
  // }
  //res.status(200).send({ url: transaction.redirect.url })
  // } catch (error) {
  //   res.status(200).send({
  //     status: {
  //       code: error.code || 500,
  //       success: false,
  //       message: error.message,
  //     },
  //     data: [],
  //   })
  // }
} //not use

exports.subscribeCreditCard = async function(req, res) {
  const token = req.query.token
  const subscribeId = req.query.subscribeId
  const sourceId = req.query.sourceId
  try {
    const decode = await decryptJwt(token, req)
    const subscribe = await checkStatusSubscribe(subscribeId)
    const userId = decode.data._id
    const email = decode.data.email
    // Check customerid stripe
    const user = await User.findOne({ _id: userId })
    //console.log('sourceId', sourceId)
    if (user.stripe.customerId === undefined) {
      // user has no customerid in stripe
      const stripeUser = await createCustomer(email)
      user.stripe.customerId = stripeUser.id
      await user.save()
    }
    //console.log('subscribe', subscribe)
    const transaction = await subscibeCreditCard(
      user.stripe.customerId,
      subscribe.stripePlanId.planId,
      sourceId
    )
    const expiredDate = new Date(transaction.current_period_end * 1000)
    //console.log('expiredDate', expiredDate)
    //console.log('transaction.current.time', transaction.current_period_end)
    //console.log('expiredDate', expiredDate)
    //console.log('moment', moment(expiredDate).format('MMMM Do YYYY, h:mm:ss a'))
    const newOrder = new Order({
      productId: subscribe.id,
      productName: subscribe.title_en,
      userId,
      email,
      price: subscribe.price,
      purchaseDate: new Date(),
      platform: 'creditcard',
      expiredDate: expiredDate,
      status: 'approved',
      stripe: {
        paymentId: transaction.id,
      },
    })
    const order = await newOrder.save()
    // const expiredDateText = moment(order.expiredDate).format('DD MMMM YYYY')
    // await sendEmail(
    //   `Thank you for purchase ${
    //     order.productName
    //   }, you can watch until ${expiredDateText}`,
    //   order.email,
    //   'Thank you for purchase Max Muay Thai'
    // )
    //console.log('2000000000000')
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success for subscribe credit card',
      },
      data: {
        //data: transaction,
        url: env.FRONTEND_URL + '/getticket',
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

exports.subscribeAlipay = async function(req, res) {
  const token = req.query.token
  const subscribeId = req.query.subscribeId
  try {
    const decode = await decryptJwt(token, req)
    const subscribe = await checkStatusSubscribe(subscribeId)
    const userId = decode.data._id
    const email = decode.data.email
    // Check customerid stripe
    const user = await User.findOne({ _id: userId })
    //console.log('sourceId', sourceId)
    if (user.stripe.customerId === undefined) {
      // user has no customerid in stripe
      const stripeUser = await createCustomer(email)
      user.stripe.customerId = stripeUser.id
      await user.save()
    }
    const sourceId = await createSourceSubscribe(subscribe.price * 100)
    // const transaction = await createTransaction(
    //   user.stripe.customerId,
    //   sourceId.id
    // )
    //console.log('subscribe', subscribe)
    //const source = await createSourceSubscribe(subscribe.price * 100)
    //console.log('1111111111', source)
    // const transaction = await subscibeCreditCard(
    //   user.stripe.customerId,
    //   subscribe.stripePlanId.planId,
    //   source.id
    // )
    // console.log('2222222222', transaction)
    // const expiredDate = new Date(transaction.current_period_end * 1000)
    //console.log('expiredDate', expiredDate)
    //console.log('moment', moment(expiredDate).format('MMMM Do YYYY, h:mm:ss a'))
    // const newOrder = new Order({
    //   productId: subscribe.id,
    //   productName: subscribe.title_en,
    //   userId,
    //   email,
    //   price: subscribe.price,
    //   purchaseDate: new Date(),
    //   platform: 'alipay',
    //   expiredDate: new Date(),
    //   status: 'create',
    //   stripe: {
    //     paymentId: transaction.id,
    //   },
    // })
    // const order = await newOrder.save()
    res.send({
      //data: transaction,
      url: sourceId.redirect.url,
    })
  } catch (error) {
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

exports.confirmSubscribeAlipay = async function(req, res) {
  //console.log(req)
  //console.log('body', req.body)
  //console.log('query', req.query)
  //console.log('params', req.params)
  res.status(200).send('hi')
}

exports.cancelSubscribeTion = async function(req, res) {
  //console.log('hi', req.query.orderId)
  const orderId = req.query.orderId
  try {
    const order = await queryOrder(orderId)
    const subsrcibe = await cancelSubscribe(order.stripe.paymentId)
    //console.log(subsrcibe)
    order.cancelDate = Date.now()
    order.status = 'cancelled'
    await order.save()
    //console.log('hhhhhh')
    await sendEmail(
      `Your order id is ${order.orderId}. it was cancel successful.`,
      order.email,
      `Success for cancel ${order.productName} Max Muay Thai`
    )
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success for cancel subscribe',
      },
      data: [],
    })
    //res.send(subsrcibe)
  } catch (error) {
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

exports.stripeWebhookHandler = async function(req, res) {
  const payload = req.body
  // console.log('body.......', req.body.data.object.lines.data.id)
  // console.log('params......', req.params)
  // console.log('query......', req.query)
  fs.writeFileSync('./stripewebhook.txt', JSON.stringify(payload), {
    flag: 'a',
  })
  if (req.body.type === 'invoice.payment_succeeded') {
    try {
      //console.log('hi', req.body)
      // console.log(
      //   'body.......',
      //   new Date(req.body.data.object.period_end * 1000)
      // )
      const newOrder = await createNeworderSubscribe(
        req.body.data.object.subscription
      )
      res.status(200).send('hi')
    } catch (err) {
      res.status(200).send(err)
      console.log('error in webhook', err)
    }
  }
  res.status(200).send(payload)
}
