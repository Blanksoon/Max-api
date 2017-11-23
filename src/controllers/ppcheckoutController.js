import jwt from 'jsonwebtoken'
import env from '../config/env'
import Live from '../models/live'
import Order from '../models/order'
import { createPayment, executePayment } from '../utils/paypal'
import braintree from 'braintree'

const readJwt = (token, req) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, async function(error, decoded) {
      if (error) {
        reject({
          code: 401,
          message: error.message,
        })
      }
      resolve(decoded)
    })
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
      res.redirect(approvalUrl)
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
        if (payment.state === 'approved') {
          order.status = 'approved'
          order.paypal = {
            payerId,
            paymentId,
          }
          await order.save()
          res.redirect('http://www.maxmuaythai.com')
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
  console.log('cancel')
}

exports.BraintreeToken = async function(req, res) {
  let clientToken
  let gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: 'hcd2xp39kgttcpsm',
    publicKey: 'snd9fsqtb8rwbrbt',
    privateKey: '9eda331084fe0007bdbda77a783bebf6',
  })

  await gateway.clientToken.generate({}).then(function(response) {
    console.log('response', response)
    clientToken = response.clientToken
  })
  console.log('clientToken', clientToken)
  res.send(clientToken)
}
