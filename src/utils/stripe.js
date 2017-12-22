import env from '../config/env'
// import stripe from 'stripe'
// stripe(env.KEYSECRET)
const stripe = require('stripe')(env.KEYSECRET)

export function createCustomer(email) {
  return new Promise((resolve, reject) => {
    stripe.customers.create({ email: email }, function(err, customer) {
      if (err) {
        reject(err)
      } else {
        resolve(customer)
      }
    })
  })
}

export function createTransaction(customerId, sourceId) {
  return new Promise((resolve, reject) => {
    stripe.customers.createSource(
      customerId,
      {
        source: sourceId,
      },
      function(err, source) {
        if (err) {
          console.log('nnnnnnnnnnnnnnnnnnn', err)
          reject(err)
        } else {
          resolve(source)
        }
      }
    )
  })
}

export function chargeTransaction(sourceId, customerId, amount) {
  return new Promise((resolve, reject) => {
    stripe.charges.create(
      {
        amount: amount,
        description: 'Max muay thai',
        currency: 'usd',
        source: sourceId,
        customer: customerId,
      },
      function(err, source) {
        if (err) {
          reject(err)
        } else {
          resolve(source)
        }
      }
    )
  })
}

export function createSource(amount) {
  return new Promise((resolve, reject) => {
    stripe.sources.create(
      {
        type: 'alipay',
        amount: amount,
        currency: 'usd',
        owner: {
          email: 'maxmuaythai@gmail.com',
        },
        redirect: {
          return_url: env.SERVER_URL + '/stripe/confirm-transaction',
        },
      },
      function(err, source) {
        if (err) {
          reject(err)
        } else {
          resolve(source)
        }
      }
    )
  })
}

export function retrieveSource(sourceId) {
  return new Promise((resolve, reject) => {
    stripe.sources.retrieve(sourceId, function(err, source) {
      if (err) {
        reject(err)
      } else {
        resolve(source)
      }
    })
  })
}
