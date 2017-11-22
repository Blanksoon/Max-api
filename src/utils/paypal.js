import paypal from 'paypal-rest-sdk'
import env from '../config/env'
import braintree from 'braintree'

const mongoose = require('mongoose')
const Order = mongoose.model('Order')

export function configure(config) {
  paypal.configure({
    mode: config.mode,
    client_id: config.client_id,
    client_secret: config.client_secret,
  })
}
export async function createPayment(order) {
  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: `${env.SERVER_IP}:${env.SERVER_PORT}/ppcheckout/${order.orderId}/success`,
      cancel_url: `${env.SERVER_IP}:${env.SERVER_PORT}/ppcheckout/${order.orderId}/cancel`,
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: order.productName,
              price: order.price,
              currency: 'USD',
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: 'USD',
          total: order.price,
        },
        description: `Purchase 1 time access to ${order.productName}`,
      },
    ],
  }
  return new Promise((resolve, reject) => {
    paypal.payment.create(create_payment_json, function(error, payment) {
      if (error) {
        console.log(error)
        reject(error)
      } else {
        payment.links.forEach(link => {
          if (link.rel === 'approval_url') {
            resolve(link.href)
          }
        })
      }
    })
  })
}
export async function executePayment(payerId, paymentId, price) {
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: price,
        },
      },
    ],
  }
  return new Promise((resolve, reject) => {
    paypal.payment.execute(paymentId, execute_payment_json, function(
      error,
      payment
    ) {
      if (error) {
        error.code = error.httpStatusCode
        reject(error)
      } else {
        resolve(payment)
      }
    })
  })
}
