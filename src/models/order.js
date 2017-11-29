import mongoose from 'mongoose'
import orderId from 'order-id'
import env from '../config/env'

const Schema = mongoose.Schema
const idGenerator = orderId(env.ORDER_ID_SECRET)

var OrderSchema = new Schema({
  orderId: {
    type: String,
    default: idGenerator.generate,
    required: 'orderId is required',
  },
  productId: {
    type: String,
    required: 'productId is required',
  },
  productName: {
    type: String,
    required: 'productName is required',
  },
  userId: {
    type: String,
    required: 'userId is required',
  },
  email: {
    type: String,
    required: 'email is required',
  },
  price: {
    type: Number,
    required: 'price is required',
  },
  purchaseDate: {
    type: Date,
    required: 'purchaseDate',
  },
  platform: {
    type: String,
    required: 'platform is required',
  },
  cancelDate: {
    type: Date,
    default: null,
  },
  expiredDate: {
    type: Date,
    required: 'expiredDate is required',
    //default: null,
  },
  status: {
    type: String, // possible value is 'created', 'approved', 'cancelled'
    required: 'status is required',
  },
  paypal: {
    payerId: String,
    paymentId: String,
    tokenSubscribe: String,
    SubscribtionId: String,
  },
  paymentIos: {
    transactionId: String,
  },
  versionKey: false,
})

module.exports = mongoose.model('Order', OrderSchema)
