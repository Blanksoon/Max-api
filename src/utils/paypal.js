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
      return_url: `${env.SERVER_IP}/ppcheckout/${order.orderId}/success`,
      cancel_url: `${env.SERVER_IP}/ppcheckout/${order.orderId}/cancel`,
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
        console.log(payment)
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
export function billingPlan(billingPlanAttributes) {
  return new Promise((resolve, reject) => {
    paypal.billingPlan.create(billingPlanAttributes, async function(
      error,
      billingPlan
    ) {
      try {
        if (error) {
          console.log(error)
          reject(error)
        } else {
          console.log('Create Billing Plan Response')
          console.log(billingPlan)
          try {
            const result = await activateBillingPlan(billingPlan.id)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  })
}
export function activateBillingPlan(billingPlanId) {
  const billing_plan_update_attributes = [
    {
      op: 'replace',
      path: '/',
      value: {
        state: 'ACTIVE',
      },
    },
  ]
  return new Promise((resolve, reject) => {
    paypal.billingPlan.get(billingPlanId, function(error, billingPlan) {
      if (error) {
        console.log(error)
        reject(error)
        //throw error
      } else {
        console.log('Get Billing Plan')
        console.log(JSON.stringify(billingPlan))

        paypal.billingPlan.update(
          billingPlanId,
          billing_plan_update_attributes,
          function(error, response) {
            if (error) {
              console.log(error.response)
              reject(error)
              //throw error
            } else {
              paypal.billingPlan.get(billingPlanId, function(
                error,
                billingPlan
              ) {
                if (error) {
                  console.log(error.response)
                  //throw error
                  reject(error)
                } else {
                  resolve(billingPlan.state)
                  console.log(billingPlan.state)
                }
              })
            }
          }
        )
      }
    })
  })
}
export function createBilling(billingAgreementAttributes) {
  return new Promise((resolve, reject) => {
    paypal.billingAgreement.create(billingAgreementAttributes, function(
      error,
      billingAgreement
    ) {
      if (error) {
        console.log(error)
        reject(error)
      } else {
        console.log('Create Billing Agreement Response')
        console.log('billingAgreement', billingAgreement.links[0].href)
        for (var index = 0; index < billingAgreement.links.length; index++) {
          if (billingAgreement.links[index].rel === 'approval_url') {
            var approval_url = billingAgreement.links[index].href
            console.log(
              'For approving subscription via Paypal, first redirect user to'
            )
            resolve(billingAgreement)
            // console.log('Payment token is')
            // console.log(url.parse(approval_url, true).query.token)
            // See billing_agreements/execute.js to see example for executing agreement
            // after you have payment token
          }
        }
      }
    })
  })
}
export function excuteBilling(paymentToken) {
  //const paymentToken = req.query.token

  //Retrieve payment token appended as a parameter to the redirect_url specified in
  //billing plan was created. It could also be saved in the user session
  //paymentToken = 'EC-2V0782854X675410W'
  return new Promise((resolve, reject) => {
    paypal.billingAgreement.execute(paymentToken, {}, function(
      error,
      billingAgreement
    ) {
      if (error) {
        console.log('hfjfjjffjjf')
        console.log(error)
        reject(error)
      } else {
        console.log('Billing Agreement Execute Response')
        //console.log(JSON.stringify(billingAgreement))
        resolve(billingAgreement)
        //res.send(JSON.stringify(billingAgreement))
      }
    })
  })
}
export function createWebhook(eventTypes) {
  const create_webhook_json = {
    url: 'http://www.google.com', //`${env.SERVER_IP}:${env.SERVER_PORT}/ppcheckout/webhooks-handler`,
    event_types: eventTypes,
  }
  console.log(create_webhook_json)

  /* return new Promise((resolve, reject) => {
    paypal.notification.webhook.del('98K37835PB985114G', function(
      error,
      response
    ) {
      if (error) {
        throw error
      } else {
        console.log('webhook deleted')
        console.log(response.httpStatusCode)
      }
    })
  }) */
  return new Promise((resolve, reject) => {
    paypal.notification.webhook.create(create_webhook_json, function(
      error,
      webhook
    ) {
      if (error) {
        reject(error)
      } else {
        resolve(webhook)
      }
    })
  })
}
export function cancelBilling(billingAgreementId) {
  let cancel_note = {
    note: 'Canceling the agreement',
  }
  return new Promise((resolve, reject) => {
    paypal.billingAgreement.cancel(billingAgreementId, cancel_note, function(
      error,
      response
    ) {
      if (error) {
        console.log('errrr', error)
        reject(error)
      } else {
        console.log('Cancel Billing Agreement Response')
        console.log(response)
        resolve('success')
      }
    })
  })
}
export function findTransactions() {
  var billingAgreementId = 'I-LU134TMXS648'

  var start_date = '2017-11-27'
  var end_date = '2017-11-29'

  paypal.billingAgreement.searchTransactions(
    billingAgreementId,
    start_date,
    end_date,
    function(error, results) {
      if (error) {
        console.log(error)
        throw error
      } else {
        console.log('Billing Agreement Transactions Search Response')
        console.log(results)
      }
    }
  )
}

// "billingPlanStaging" : {
//   "billingPlanId" : "P-4N078115XD64666037V44B2A"
// },
// "billingPlanProd" : {
//   "billingPlanId" : "P-4N078115XD64666037V44B2A"
// },
// "billingPlanDev" : {
//   "billingPlanId" : "P-4N078115XD64666037V44B2A"
// },
// "billingPlanBraintreeStaging" : {
//   "billingPlanIdBraintree" : "qzt2"
// },
// "billingPlanBraintreeProd" : {
//   "billingPlanIdBraintree" : "qzt2"
// },
// "billingPlanBraintreeDev" : {
//   "billingPlanIdBraintree" : "qzt2"
// },
