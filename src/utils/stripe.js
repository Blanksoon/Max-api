import env from '../config/env'
import { resolve } from 'url'
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
          //console.log('nnnnnnnnnnnnnnnnnnn', err)
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
        currency: 'sgd',
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
        currency: 'sgd',
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

export function subscibeCreditCard(customerId, planId, sourceId) {
  return new Promise((resolve, reject) => {
    stripe.subscriptions.create(
      {
        customer: customerId,
        source: sourceId,
        items: [
          {
            plan: planId,
          },
        ],
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

export function retrieveCustomer(customerId) {
  return new Promise((resolve, reject) => {
    stripe.customers.retrieve(req.body.customer, function(err, source) {
      if (err) {
        reject(err)
      } else {
        resolve(source)
      }
    })
  })
}

export function cancelSubscribe(planId) {
  return new Promise((resolve, reject) => {
    stripe.subscriptions.del(planId, function(err, confirmation) {
      if (err) {
        reject(err)
      } else {
        resolve(confirmation)
      }
    })
  })
}

// export function checkStatusCreditcard(sources, creditcard) {
//   return new Promise((resolve, reject) => {
//     let i = 0
//     const status = false
//     while (i < customer.sources.data.length) {
//       if (
//         sources[i].last4 === creditcard.last4 &&
//         sources[i].exp_month === creditcard.exp_month &&
//         sources[i].exp_year === creditcard.exp_year
//       ) {
//         if (i === 0) {
//           return resolve({
//             message: 'ready',
//             data: {},
//           })
//         } else {
//           return resolve({
//             message: 'unready',
//             data: sources[i],
//           })
//         }
//       } else {
//         if (i === customer.sources.data.length - 1) {
//           return resolve({
//             message: 'nocredit',
//             data: {},
//           })
//         }
//         i++
//       }
//     }
//   })
// }

// export function checkDefaultSource(customerId, creditcard) {
//   return new Promise(async (resolve, reject) => {
//     const customer = await retrieveCustomer(customerId)
//     console.log('11111', customer)
//     const sources = customer.data.sources.data
//     const statusCreditcard = await checkStatusCreditcard(sources, creditcard)
//     resolve(statusCreditcard)
//   })
// }

// export function updateDefaultSource(customerId, sourceId) {
//   return new Promise((resolve, reject) => {
//     stripe.customers.update(
//       customerId,
//       {
//         default_source: sourceId,
//       },
//       function(err, source) {
//         if (err) {
//           reject(err)
//         } else {
//           resolve(source)
//         }
//       }
//     )
//   })
// }
