import braintree from 'braintree'
import env from './env'

export const braintreeEnv = () => {
  if (env.BRAINTREE_ENV === 'PRODUCTION') {
    return braintree.Environment.Production
  }
  return braintree.Environment.Sandbox
}
