import jwt from 'jsonwebtoken'
import Live from '../models/live'
import Order from '../models/order'
import { createPayment, executePayment } from '../utils/paypal'
import braintree from 'braintree'

const readJwt = (token, req) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, req.app.get('secret'), async function(error, decoded) {
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

exports.createAndSettledPayment = async function(req, res) {
  const token = req.query.token
  let defaultErrorMessage = 'data_not_found'
  try {
    const decode = await readJwt(token, req)
    const userId = decode.data._id
    const email = decode.data.email
    const liveId = req.body.liveId
    const output = {
      status: {
        code: 400,
        success: false,
        message: defaultErrorMessage,
      },
      data: {},
    }
    // Verified the product exists
    const live = await Live.findOne({ _id: liveId })
    if (live) {
      // Expire 1 day after live date
      const expiredDate = new Date(live.liveToDate)
      expiredDate.setDate(expiredDate.getDate() + 1)
      // const order = new Order({
      //   productId: live.id,
      //   productName: live.title_en,
      //   userId,
      //   email,
      //   price: live.price,
      //   purchaseDate: new Date(),
      //   platform: req.body.platform,
      //   expiredDate: expiredDate,
      //   status: 'created',
      // })
      //const saved = await order.save()
      var nonceFromTheClient = req.body.paymentMethodNonce
      let gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: 'hcd2xp39kgttcpsm',
        publicKey: 'snd9fsqtb8rwbrbt',
        privateKey: '9eda331084fe0007bdbda77a783bebf6',
      })
      gateway.transaction.sale(
        {
          amount: live.price,
          paymentMethodNonce: nonceFromTheClient,
          options: {
            submitForSettlement: true,
          },
        },
        function(err, transactionResult) {
          console.log('error1time', transactionResult.errors)
          //console.log('success', transactionResult)
          //let deepErrors = transactionResult.errors.deepErrors()
          // for (let i in deepErrors) {
          //   if (deepErrors.hasOwnProperty(i)) {
          //     console.log('attribute', deepErrors[i].attribute)
          //     console.log('code', deepErrors[i].code)
          //     console.log('message', deepErrors[i].message)
          //   }
          // }
          if (transactionResult.errors != undefined) {
            output.status.message =
              'Cannot use a payment_method_nonce more than once.'
            res.status(200).send(output)
          } else {
            gateway.testing.settle(
              transactionResult.transaction.id,
              async function(err, settleResult) {
                console.log('success', settleResult.transaction.status)
                if (settleResult.transaction.status == 'settled') {
                  console.log('hi')
                  const order = new Order({
                    productId: live.id,
                    productName: live.title_en,
                    userId,
                    email,
                    price: live.price,
                    purchaseDate: new Date(),
                    platform: req.body.platform,
                    expiredDate: expiredDate,
                    status: 'approved',
                  })
                  const saved = await order.save()
                  output.status.code = 200
                  output.status.success = true
                  output.status.message = 'thank you for purchase'
                  res.status(200).send(settleResult)
                } else {
                  const order = new Order({
                    productId: live.id,
                    productName: live.title_en,
                    userId,
                    email,
                    price: live.price,
                    purchaseDate: new Date(),
                    platform: req.body.platform,
                    expiredDate: expiredDate,
                    status: 'cancel',
                  })
                  const saved = await order.save()
                  console.log('hello')
                  output.status.message = err
                  res.status(200).json(output)
                }
              }
            )
          }
        }
      )
    } else {
      output.status.code = 404
      output.status.message = 'Target live not found'
      res.status(200).send(output)
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
