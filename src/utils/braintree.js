import braintree from 'braintree'
import { braintreeEnv } from '../config/braintree'
import env from '../config/env'

let gateway = braintree.connect({
  environment: braintreeEnv(),
  merchantId: env.MERCHANTID,
  publicKey: env.PUBLICKEY,
  privateKey: env.PRIVATEKEY,
})

export function creatAndSettledPayment(live, nonceFromTheClient) {
  return new Promise((resolve, reject) => {
    gateway.transaction.sale(
      {
        amount: live.price,
        paymentMethodNonce: nonceFromTheClient,
        options: {
          submitForSettlement: true,
        },
      },
      function(err, transactionResult) {
        if (transactionResult.errors != undefined) {
          console.log('transactionResult.errors', transactionResult.errors)
          reject({
            message: 'Cannot use a payment_method_nonce more than once.',
          })
        } else {
          gateway.testing.settle(transactionResult.transaction.id, function(
            err,
            settleResult
          ) {
            if (settleResult.transaction.status === 'settled') {
              resolve(settleResult.transaction.id)
            } else {
              console.log('err', err)
              resolve(`can't process this transaction`)
            }
          })
        }
      }
    )
  })
}

export function cancelPayment(paymentId) {
  return new Promise((resolve, reject) => {
    gateway.transaction.refund(paymentId, async function(err, result) {
      if (err) {
        reject({ message: err })
      } else {
        if (result.errors != undefined) {
          const deepErrors = result.errors.deepErrors()
          for (var i in deepErrors) {
            if (deepErrors.hasOwnProperty(i)) {
              let message = deepErrors[i].message
            }
          }
          reject({
            message: message,
          })
        } else {
          // console.log(
          //   'decode.data._id',
          //   decode.data._id,
          //   'productId',
          //   productId
          // )
          await Order.findOneAndUpdate(
            {
              userId: decode.data._id,
              expiredDate: { $gte: today },
              productId: productId,
              status: 'approved',
            },
            {
              status: 'cancelled',
              paypal: {
                paymentId: result.transaction.id,
              },
              cancelDate: today,
            }
          )
          output.status.code = 200
          output.status.success = true
          output.status.message = 'cancelled transection success'
          res.status(200).send(output)
        }
      }
    })
  })
}
