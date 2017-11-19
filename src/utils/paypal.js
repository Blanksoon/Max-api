const paypal = require('paypal-rest-sdk')
const env = require('../config/env')

exports.configure = function(config) {
  paypal.configure({
    mode: config.mode,
    client_id: config.client_id,
    client_secret: config.client_secret,
  })
}
exports.createPayment = function(config) {
  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: 'one time maxmuay thai live',
              price: '1.99',
              currency: 'USD',
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: 'USD',
          total: '1.99',
        },
        description: 'Purchase 1 time access to maxmuaythai live',
      },
    ],
  }
}
