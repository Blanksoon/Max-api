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
