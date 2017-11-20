import jwt from 'jsonwebtoken'
import Live from '../models/live'
import Order from '../models/order'
import { createPayment } from '../utils/paypal'

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
  const orderId = req.body.orderId
  try {
    const payment = paypal
  } catch (error) {
    const order = Order.find({
      orderId,
    })
    order.status = 'error'
    order.save()
  }
}

exports.cancelPayment = async function(req, res) {
  console.log('cancel')
}
