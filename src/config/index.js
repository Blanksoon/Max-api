const dotenv = require('dotenv')
const targetEnv = process.env.NODE_ENV || 'dev'
console.log('Target environment: ' + targetEnv)
dotenv.config({
  path: './.env.' + targetEnv,
})
