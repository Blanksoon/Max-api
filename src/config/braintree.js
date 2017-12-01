import braintree from 'braintree'
import env from './env'

export const braintreeEnv = () => {
  console.log('hi', braintree)
  if (env.BRAINTREE_ENV === 'PRODUCTION') {
    return braintree.Environment.Production
  }
  return braintree.Environment.Sandbox
}
