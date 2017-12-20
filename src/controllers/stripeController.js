import jwt from 'jsonwebtoken'
import env from '../config/env'
import Live from '../models/live'
import Order from '../models/order'
import Subscribe from '../models/subscribe'
import User from '../models/user'
import moment from 'moment'
import {
  createCustomer,
  createTransaction,
  chargeTransaction,
} from '../utils/stripe'

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

// const createOrder = (live, userId, email) => {
//   return new Promise(async (resolve, reject) => {
//     console.log('888888888')
//     const expiredDate = new Date(live.liveToDate)
//     expiredDate.setDate(expiredDate.getDate() + 1)
//     const newOrder = new Order({
//       productId: live.id,
//       productName: live.title_en,
//       userId,
//       email,
//       price: live.price,
//       purchaseDate: new Date(),
//       platform: 'creditcard',
//       expiredDate: expiredDate,
//       status: 'created',
//     })
//     console.log('fjfjfjfjfjfjfjfj')
//     await newOrder.save().then(function(order) {
//       resolve(order)
//     })
// console.log('order', order)
// resolve(order)
//   })
// }

exports.payPerViewCreditCard = async function(req, res) {
  //console.log('token', req.query.token)
  console.log('liveId', req.query.liveId)
  console.log('sourceId', req.query.sourceId)
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
    const successTransaction = await chargeTransaction(
      transaction.id,
      user.stripe.customerId,
      live.price * 100
    )
    if (successTransaction.status === 'succeeded') {
      order.stripe.paymentId = successTransaction.id
      order.status = 'approved'
      await order.save()
      res.send({
        url: env.FRONTEND_URL + '/getticket',
      })
    } else {
      res.send({
        url: env.FRONTEND_URL + '/error',
      })
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
