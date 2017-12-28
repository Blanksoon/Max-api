import fs from 'fs'
import jwt from 'jsonwebtoken'
import env from '../config/env'
import Live from '../models/live'
import Order from '../models/order'
import Subscribe from '../models/subscribe'
import User from '../models/user'
import moment from 'moment'
import {
  createPayment,
  executePayment,
  billingPlan,
  createBilling,
  excuteBilling,
  createWebhook,
  listWebhook,
  deleteWebhook,
  cancelBilling,
  findTransactions,
  createNeworderSubscribe,
} from '../utils/paypal'
import { creatAndSettledPayment, cancelPayment } from '../utils/braintree'
import braintree from 'braintree'
import { braintreeEnv } from '../config/braintree'
import { randomBytes } from 'crypto'

const readJwt = (token, req) => {
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

const readJwtBraintree = (token, req) => {
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

const createCustomerBraintree = (nonceFromTheClient, gateway, email) => {
  console.log('createCustomerBraintree')
  return new Promise((resolve, reject) => {
    gateway.customer.create(
      {
        //firstname: email,
        email: email,
        paymentMethodNonce: nonceFromTheClient,
      },
      function(err, result) {
        if (err) {
          console.log('1', err)
          reject('hi')
        } else if (result.success) {
          console.log('2', result.success)
          console.log('3', result.customer.id)
          console.log('4', result.customer.paymentMethods[0].token)
          resolve(result.customer.paymentMethods[0].token)
        } else {
          console.log(result)
          reject(result)
        }
        // result.success
        // true

        // result.customer.id
        // e.g 160923

        // result.customer.paymentMethods[0].token
        // e.g f28wm
      }
    )
  })
}

exports.createPayment = async function(req, res) {
  const token = req.query.token
  try {
    const decode = await readJwt(token, req)
    const userId = decode.data._id
    const email = decode.data.email
    const liveId = req.params.liveId

    // Verified the product exists
    const live = await Live.findOne({ _id: liveId })
    if (live) {
      // Expire 1 day after live date
      const expiredDate = new Date(live.liveToDate)
      expiredDate.setDate(expiredDate.getDate() + 1)
      const order = new Order({
        productId: live.id,
        productName: live.title_en,
        userId,
        email,
        price: live.price,
        purchaseDate: new Date(),
        platform: 'paypal',
        expiredDate: expiredDate,
        status: 'created',
      })
      const saved = await order.save()
      const approvalUrl = await createPayment(saved)
      res.send({ approvalUrl: approvalUrl })
    } else {
      throw {
        code: 404,
        message: 'Target live not found',
      }
    }
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

exports.executePayment = async function(req, res) {
  const payerId = req.query.PayerID
  const paymentId = req.query.paymentId
  const orderId = req.params.orderId

  if (typeof orderId === 'undefined') {
    res.status(200).send({
      status: {
        code: 400,
        success: false,
        message: 'Missing orderId',
      },
      data: [],
    })
  }
  const order = await Order.findOne({
    orderId: orderId,
  })
  try {
    if (order) {
      try {
        const payment = await executePayment(payerId, paymentId, order.price)
        console.log('payment', payment)
        if (payment.state === 'approved') {
          order.status = 'approved'
          order.paypal = {
            payerId,
            paymentId,
          }
          await order.save()
          res.redirect(`${env.FRONTEND_URL}/getticket`)
        }
      } catch (error) {
        order.status = 'error'
        await order.save()
        throw error.response
      }
    } else {
      throw {
        code: 404,
        message: 'order not found',
      }
    }
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

exports.cancelPayment = async function(req, res) {
  const orderId = req.params.orderId
  if (typeof orderId === 'undefined') {
    res.status(200).send({
      status: {
        code: 400,
        success: false,
        message: 'Missing orderId',
      },
      data: [],
    })
  }
  const order = await Order.findOne({
    orderId: orderId,
  })
  try {
    if (order) {
      order.status = 'canceled'
      await order.save()
      res.redirect(`${env.FRONTEND_URL}`)
    }
  } catch (error) {
    console.log(error)
    res.redirect(`${env.FRONTEND_URL}`)
  }
}

exports.billingPlans = async function(req, res) {
  var billingPlanAttributes = {
    description: 'Watch unlimited lives and vods for 1 months : 9.99$',
    merchant_preferences: {
      auto_bill_amount: 'yes',
      cancel_url: env.SERVER_URL + '/subscribe/cancel',
      initial_fail_amount_action: 'continue',
      max_fail_attempts: '1',
      return_url: env.SERVER_URL + '/subscribe/success',
    },
    name: 'Monthly',
    payment_definitions: [
      {
        amount: {
          currency: 'USD',
          value: '9.99',
        },
        cycles: '0',
        frequency: 'MONTH',
        frequency_interval: '1',
        name: '1 month subscription',
        type: 'REGULAR',
      },
    ],
    type: 'INFINITE',
  }
  try {
    const billingState = await billingPlan(billingPlanAttributes)
    console.log('bill', billingState)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'Billing plan status: ' + billingState,
      },
      data: [],
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
  // paypal.billingPlan.create(billingPlanAttributes, async function(
  //   error,
  //   billingPlan
  // ) {
  //   try {
  //     if (error) {
  //       console.log(error)
  //       throw error
  //     } else {
  //       console.log('Create Billing Plan Response')
  //       console.log(billingPlan)
  //       try {
  //         await activateBillingPlan(billingPlan.id)
  //       } catch (error) {
  //         throw error
  //       }
  //     }
  //   } catch (error) {
  //     res.status(200).send({
  //       status: {
  //         code: error.code || 500,
  //         success: false,
  //         message: error.message,
  //       },
  //       data: [],
  //     })
  //   }
  // })
}

exports.subscribe = async function(req, res) {
  //console.log('hi')
  const token = req.query.token
  const output = {
    status: {
      code: 400,
      success: false,
      message: '',
    },
    data: {},
  }
  try {
    const decode = await readJwt(token, req)
    const productId = req.params.subscribeId
    let userId = decode.data._id
    const email = decode.data.email
    const isoDate = new Date()
    let today = new Date()
    today = Date.now()
    let greaterThanToday = moment(today).add(5, 'minute')
    isoDate.setSeconds(isoDate.getSeconds() + 4)
    isoDate.toISOString().slice(0, 19) + 'Z'
    const subscribeProduct = await Subscribe.findOne({ _id: productId })
    //const expiredDate = new Date(live.liveToDate)
    let expiredDate = moment(today)
      .add(1, 'M')
      .calendar()
    // expiredDate = moment(expiredDate)
    //   .subtract(1, 'days')
    //   .calendar()
    if (typeof token === 'undefined' || token === '') {
      throw {
        message: 'token is undefiend',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      if (subscribeProduct) {
        let billingId = ''
        const order = new Order({
          productId: subscribeProduct._id,
          productName: subscribeProduct.title_en,
          userId,
          email,
          price: subscribeProduct.price,
          purchaseDate: today,
          platform: 'paypal',
          expiredDate: expiredDate,
          paypal: {
            payerId: null,
            paymentId: null,
            tokenSubscribe: null,
          },
          status: 'created',
        })
        // console.log('sssssssssss', env.BILLINGPLAN)
        if (env.BILLINGPLAN === 'billingPlanStaging') {
          billingId = subscribeProduct.billingPlanStaging.billingPlanId
        } else if (env.BILLINGPLAN === 'billingPlanProd') {
          billingId = subscribeProduct.billingPlanProd.billingPlanId
        } else {
          billingId = subscribeProduct.billingPlanDev.billingPlanId
        }
        //console.log('billingId', billingId)
        const billingAgreementAttributes = {
          name: subscribeProduct.title_en,
          description: subscribeProduct.description,
          start_date: greaterThanToday,
          plan: {
            id: billingId,
          },
          payer: {
            payment_method: 'paypal',
          },
        }
        const billingAgreement = await createBilling(billingAgreementAttributes)
        //console.log('11111111111111111111', billingAgreement)
        //console.log('22222222222222222222', billingAgreement.plan)
        const billangUrl = billingAgreement.links[0].href
        const n = billingAgreement.links[0].href.indexOf('token=')
        const str = 'token='
        const tokenSubscribes = billangUrl.substr(n + str.length)
        // console.log('token', tokenSubscribes)
        // console.log('userId', userId)
        // console.log('subscribeProduct._id', subscribeProduct._id)
        // console.log('expiredDate', expiredDate)
        const saved = await order.save()
        await Order.findOneAndUpdate(
          {
            userId: userId,
            productId: subscribeProduct._id,
            expiredDate: { $gte: today },
            status: 'created',
          },
          {
            'paypal.payerId': null,
            'paypal.paymentId': null,
            'paypal.tokenSubscribe': tokenSubscribes,
          }
        )
        res.status(200).send({ approvalUrl: billingAgreement.links[0].href })
      } else {
        throw {
          message: 'target subscribe not found',
        }
      }
    }
  } catch (error) {
    //console.log('error', error.response)
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

exports.successSubscribe = async function(req, res) {
  const paymentToken = req.query.token
  //console.log('token', paymentToken)
  //const orderId = req.params.orderId
  //console.log('hi')
  const order = await Order.findOne({
    'paypal.tokenSubscribe': paymentToken,
  })
  //console.log('order', order)
  try {
    if (order) {
      try {
        const result = await excuteBilling(paymentToken)
        //console.log('result', result.plan)
        if (result.state === 'Active') {
          order.status = 'approved'
          order.paypal = {
            tokenSubscribe: result.id,
            paymentId: result.id,
            payerId: result.payer.payer_info.payer_id,
            testOrder: result,
          }
          //console.log('jjjjjj', result.agreement_details)
          //order.expiredDate = result.agreement_details.next_billing_date
          await order.save()
          //console.log('hiz')
          // res.status(200).send({
          //   status: {
          //     code: 200,
          //     success: true,
          //     message: 'thank you for purchase',
          //   },
          //   data: [],
          // })
          res.redirect(`${env.FRONTEND_URL}`)
        }
      } catch (error) {
        order.status = 'error'
        await order.save()
        throw error.response
      }
    } else {
      throw {
        code: 404,
        message: 'order not found',
      }
    }
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

exports.cancelSubscribe = async function(req, res) {
  // await findTransactions()
  // res.sendStatus(200)
  const orderId = req.params.orderId
  try {
    const order = await Order.findOne({ orderId: orderId })
    if (orderId === undefined || orderId === '') {
      throw {
        message: 'orderId not found',
      }
    }
    if (order) {
      console.log('paymentId', order.paypal)
      const data = await cancelBilling(order.paypal.paymentId)
      console.log(data)
      if (data === 'success') {
        order.cancelDate = Date.now()
        order.status = 'cancel'
        await order.save()
        res.status(200).send({
          status: {
            code: 200,
            success: true,
            message: 'success for cancel subscribe',
          },
          data: [],
        })
      } else {
        throw {
          data,
        }
      }
    } else {
      throw {
        message: 'target order not found',
      }
    }
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

exports.getSelfSubscribe = async function(req, res) {
  const paymentId = req.query.paymentId
  try {
    const order = await findTransactions(paymentId)
    res.status(200).send(order)
  } catch (error) {
    res.status(200).send(error)
  }
}

// Web hook
exports.createWebhook = async function(req, res) {
  const eventTypes = [
    { name: 'PAYMENT.SALE.COMPLETED' },
    { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
  ]
  try {
    const webhook = await createWebhook(eventTypes)
    console.log(webhook)
    res.status(200).send(webhook)
  } catch (error) {
    console.log(error)
  }
}
exports.listWebhook = async function(req, res) {
  try {
    const webhook = await listWebhook()
    console.log(webhook)
    res.status(200).send(webhook)
  } catch (error) {
    console.log(error)
  }
}
exports.deleteWebhook = async function(req, res) {
  const webhookId = req.params.webhookId
  try {
    const webhook = await deleteWebhook(webhookId)
    console.log(webhook)
    res.status(200).send(webhook)
  } catch (error) {
    console.log(error)
  }
}
exports.webhookHandler = async function(req, res) {
  const payload = req.body
  fs.writeFileSync('./webhook.txt', JSON.stringify(payload), { flag: 'a' })
  if (req.body.event_type === 'PAYMENT.SALE.COMPLETED') {
    try {
      const newOrder = await createNeworderSubscribe(
        req.body.resource.billing_agreement_id
      )
    } catch (err) {
      console.log('error in webhook', err)
    }
  }
  res.status(200).send(payload)
}
exports.stripeWebhookHandler = async function(req, res) {
  const payload = req.body
  // console.log('body.......', req.body)
  // console.log('params......', req.params)
  // console.log('query......', req.query)
  fs.writeFileSync('./stripewebhook.txt', JSON.stringify(payload), {
    flag: 'a',
  })
  res.status(200).send(payload)
}

//braintree
exports.subscribeBraintree = async function(req, res) {
  const token = req.query.token
  const productId = req.body.productId
  try {
    const decode = await readJwt(token, req)
    const userId = decode.data._id
    const email = decode.data.email
    let nonceFromTheClient = req.body.nonceFromTheClient
    let gateway = braintree.connect({
      environment: braintreeEnv(),
      merchantId: env.MERCHANTID,
      publicKey: env.PUBLICKEY,
      privateKey: env.PRIVATEKEY,
    })
    let today = new Date()
    today = Date.now()
    const expiredDate = moment(today)
      .add(30, 'day')
      .calendar()
    if (typeof token === 'undefined' || token === '') {
      throw {
        message: 'token is undefiend',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      const customer = await User.findOne({ _id: decode.data._id })
      if (customer) {
        //if (customer.braintree.paymentMethod === undefined) {
        const user = await createCustomerBraintree(
          nonceFromTheClient,
          gateway,
          customer.email
        )
        // customer.braintree.paymentMethod = user
        // await customer.save()
        const subscribeProduct = await Subscribe.findOne({ _id: productId })
        if (subscribeProduct) {
          let order = new Order({
            productId: subscribeProduct._id,
            productName: subscribeProduct.title_en,
            userId,
            email,
            price: subscribeProduct.price,
            purchaseDate: today,
            platform: 'paypal',
            expiredDate: expiredDate,
            paypal: {
              payerId: null,
              paymentId: null,
              tokenSubscribe: null,
            },
            status: 'created',
          })
          const saved = await order.save()
          gateway.subscription.create(
            {
              paymentMethodToken: user,
              planId: subscribeProduct.billingPlanIdBraintree,
            },
            async function(error, result) {
              if (error) {
                console.log('error', error)
                throw error
              } else {
                order.paypal.tokenSubscribe = result.subscription.id
                order.paypal.payerId =
                  result.subscription.transactions[0].customer.id
                order.paypal.paymentId = result.subscription.transactions[0].id
                order.status = 'approved'
                await order.save()
                res.status(200).send({
                  status: {
                    code: 200,
                    success: true,
                    message: 'thank you for your subscribtion',
                  },
                  data: [],
                })
              }
            }
          )
        } else {
          throw {
            message: 'target subscribe not found',
          }
        }
      } else {
        throw {
          message: 'user not found',
        }
      }
    }
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
exports.cancelSubscribeBraintree = async function(req, res) {
  const token = req.query.token
  const orderId = req.body.orderId
  let gateway = braintree.connect({
    environment: braintreeEnv(),
    merchantId: env.MERCHANTID,
    publicKey: env.PUBLICKEY,
    privateKey: env.PRIVATEKEY,
  })
  try {
    const decode = await readJwtBraintree(token, req)
    let today = new Date()
    today = Date.now()
    if (typeof token == 'undefined' || token == '') {
      throw {
        message: 'token not found',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      const order = await Order.findOne({
        orderId: orderId,
      })
      gateway.subscription.cancel(order.paypal.SubscribtionId, async function(
        err,
        result
      ) {
        if (err) {
          throw {
            error: err,
          }
        } else {
          order.status = 'cancelled'
          order.cancelDate = today
          await order.save()
          res.status(200).send({
            status: {
              code: 200,
              success: true,
              message: 'cancelled subscribetion success',
            },
            data: [],
          })
        }
      })
    }
  } catch (error) {
    console.log('error', error)
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
exports.braintreeToken = async function(req, res) {
  const token = req.query.token
  const output = {
    status: {
      code: 400,
      success: false,
      message: '',
    },
    data: {},
  }
  const decode = await readJwtBraintree(token, req)
  if (typeof token === 'undefined' || token === '') {
    output.status.message = 'token is undefiend'
    res.send(output)
  } else if (decode.code == 401) {
    output.status.message = decode.message
    res.send(output)
  } else {
    let clientToken
    let gateway = braintree.connect({
      environment: braintreeEnv(),
      merchantId: env.MERCHANTID,
      publicKey: env.PUBLICKEY,
      privateKey: env.PRIVATEKEY,
    })

    await gateway.clientToken
      .generate({ merchantAccountId: 'maxmuaythai' })
      .then(function(response) {
        clientToken = response.clientToken
      })
    output.status.code = 200
    output.status.success = true
    output.status.message = 'succes'
    output.data = {
      clientToken: clientToken,
    }
    res.send(output)
  }
}
exports.createAndSettledPayment = async function(req, res) {
  const token = req.query.token
  const liveId = req.body.liveId
  const nonceFromTheClient = req.body.paymentMethodNonce
  try {
    if (token === undefined || token === '') {
      throw {
        message: 'token is undefiend',
      }
    } else {
      const decode = await readJwtBraintree(token, req) //if error reject error.message
      const userId = decode.data._id
      const email = decode.data.email
      // Verified the product exists
      const live = await Live.findOne({ _id: liveId })
      if (live) {
        // Expire 1 day after live date
        const expiredDate = new Date(live.liveToDate)
        expiredDate.setDate(expiredDate.getDate() + 1)
        const order = new Order({
          productId: live.id,
          productName: live.title_en,
          userId,
          email,
          price: live.price,
          purchaseDate: new Date(),
          platform: req.body.platform,
          expiredDate: expiredDate,
          status: null,
        })
        const resultTransaction = await creatAndSettledPayment(
          live,
          nonceFromTheClient
        )
        if (resultTransaction === `can't process this transaction`) {
          order.status = 'error'
          await order.save()
          throw {
            message: `can't process this transaction`,
          }
        } else {
          order.paypal.paymentId = resultTransaction
          order.status = 'approved'
          await order.save()
          res.status(200).send({
            status: {
              code: 200,
              success: true,
              message: 'thank you for purchase',
            },
            data: order,
          })
        }
      } else {
        throw {
          code: 404,
          message: 'Target live not found',
        }
      }
    }
  } catch (error) {
    console.log('error', error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error.message,
      },
      data: [],
    })
  }
} //refactor already
exports.cancelReleasePayment = async function(req, res) {
  const token = req.query.token
  const orderId = req.body.orderId
  const today = Date.now()
  try {
    if (token === undefined || token === '') {
      throw {
        message: 'token is undefiend',
      }
    } else {
      const decode = await readJwtBraintree(token, req) //if error reject error.message
      const resultOrder = await Order.findOne({
        orderId: orderId,
      })
      if (resultOrder === null) {
        throw {
          message: 'order not found',
        }
      }
      const paymentId = await cancelPayment(resultOrder.paypal.paymentId) // if error reject error.message
      await Order.findOneAndUpdate(
        {
          orderId: orderId,
        },
        {
          status: 'cancelled',
          paypal: {
            paymentId: paymentId,
          },
          cancelDate: today,
        }
      )
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'cancelled transection success',
        },
        data: [],
      })
    }
  } catch (error) {
    console.log('error', error)
    res.status(200).send({
      status: {
        code: error.code || 500,
        success: false,
        message: error.message,
      },
      data: [],
    })
  }
} //refactor already

//ios
exports.createPaymentIos = async function(req, res) {
  console.log('ffffff')
  const token = req.query.token
  const transactionId = req.body.transactionId
  try {
    const decode = await readJwt(token, req)
    const userId = decode.data._id
    const email = decode.data.email
    const liveId = req.body.liveId

    // Verified the product exists
    const live = await Live.findOne({ _id: liveId })
    if (typeof token == 'undefined' || token == '') {
      throw {
        message: 'token is undefiend',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      if (live) {
        const transactionOrder = await Order.findOne({
          'paymentIos.transactionId': transactionId,
        })
        if (transactionOrder != null) {
          throw {
            code: 200,
            message: 'your transaction has already',
          }
        }
        // Expire 1 day after live date
        const expiredDate = new Date(live.liveToDate)
        expiredDate.setDate(expiredDate.getDate() + 1)
        const order = new Order({
          productId: live.id,
          productName: live.title_en,
          userId,
          email,
          price: live.price,
          purchaseDate: new Date(),
          platform: 'ios',
          expiredDate: expiredDate,
          status: 'approved',
          paymentIos: {
            transactionId: transactionId,
          },
        })
        const saved = await order.save()
        res.send({
          status: {
            code: 200,
            success: true,
            message: 'Thank you for purchase',
          },
          data: saved,
        })
      } else {
        throw {
          code: 404,
          message: 'Target live not found',
        }
      }
    }
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
exports.cancelPaymentIos = async function(req, res) {
  const token = req.query.token
  const orderId = req.body.orderId
  try {
    const decode = await readJwtBraintree(token, req)
    let today = new Date()
    today = Date.now()
    if (typeof token == 'undefined' || token == '') {
      throw {
        message: 'token is undefiend',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      const result = await Order.findOne({
        orderId: orderId,
      })
      result.status = 'cancelled'
      const saved = await result.save()
      result.cancelDate = Date.now()
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'cancel live success',
        },
        data: saved,
      })
    }
  } catch (error) {
    console.log('error', error)
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
exports.subscribeIos = async function(req, res) {
  const token = req.query.token
  const productId = req.body.productId
  const transactionDate = req.body.transactionDate
  try {
    const decode = await readJwt(token, req)
    const userId = decode.data._id
    const email = decode.data.email
    let transactionId = req.body.transactionId
    let today = new Date()
    today = Date.now()
    const expiredDate = moment(today)
      .add(30, 'day')
      .calendar()
    if (typeof token === 'undefined' || token === '') {
      throw {
        message: 'token is undefiend',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      const customer = await User.findOne({ _id: decode.data._id })
      if (customer) {
        const transactionOrder = await Order.findOne({
          'paymentIos.transactionId': transactionId,
        })
        if (transactionOrder != null) {
          throw {
            code: 200,
            message: 'your transaction has already',
          }
        }
        const subscribeProduct = await Subscribe.findOne({ _id: productId })
        if (subscribeProduct) {
          let order = new Order({
            productId: subscribeProduct._id,
            productName: subscribeProduct.title_en,
            userId,
            email,
            price: subscribeProduct.price,
            purchaseDate: today,
            platform: 'ios',
            expiredDate: expiredDate,
            status: 'approved',
            paymentIos: {
              transactionId: transactionId,
            },
          })
          const saved = await order.save()
          res.status(200).send({
            status: {
              code: 200,
              success: true,
              message: 'thank you for your subscribtion',
            },
            data: saved,
          })
        } else {
          throw {
            message: 'target subscribe not found',
          }
        }
      } else {
        throw {
          message: 'user not found',
        }
      }
    }
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
exports.cancelSubscribeIos = async function(req, res) {
  const token = req.query.token
  const orderId = req.body.orderId
  try {
    const decode = await readJwtBraintree(token, req)
    let today = new Date()
    today = Date.now()
    if (typeof token == 'undefined' || token == '') {
      throw {
        message: 'token is undefiend',
      }
    } else if (decode.code == 401) {
      throw {
        message: decode.message,
      }
    } else {
      const result = await Order.findOne({
        orderId: orderId,
      })
      result.status = 'cancelled'
      result.cancelDate = Date.now()
      const saved = await result.save()
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'cancel live success',
        },
        data: saved,
      })
    }
  } catch (error) {
    console.log('error', error)
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
