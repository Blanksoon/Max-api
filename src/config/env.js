const fs = require('fs')
const dotenv = require('dotenv')
const targetEnv = process.env.NODE_ENV || 'dev'
console.log('Target environment: ' + targetEnv)
const env = dotenv.parse(fs.readFileSync('./.env.' + targetEnv))
module.exports = env
