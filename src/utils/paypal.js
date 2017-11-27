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
      return_url: `${env.SERVER_IP}:${env.SERVER_PORT}/ppcheckout/${
        order.orderId
      }/success`,
      cancel_url: `${env.SERVER_IP}:${env.SERVER_PORT}/ppcheckout/${
        order.orderId
      }/cancel`,
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
        //console.log(billingAgreement);
        for (var index = 0; index < billingAgreement.links.length; index++) {
          if (billingAgreement.links[index].rel === 'approval_url') {
            var approval_url = billingAgreement.links[index].href
            console.log(
              'For approving subscription via Paypal, first redirect user to'
            )
            resolve(approval_url)
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
        console.log(error)
        reject(error)
      } else {
        console.log('Billing Agreement Execute Response')
        console.log(JSON.stringify(billingAgreement))
        resolve(JSON.stringify(billingAgreement))
        //res.send(JSON.stringify(billingAgreement))
      }
    })
  })
}
