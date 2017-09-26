var config = {
  local: {
    secret: 'examplesecretkey',
    tokenLifetime: 5000 * 5000,
    mode: 'local',
    port: 3001,
  },
  staging: {
    secret: 'examplesecretkey',
    tokenLifetime: 60 * 60,
    mode: 'staging',
    port: 4000,
  },
  production: {
    secret: 'examplesecretkey',
    tokenLifetime: 5000 * 5000,
    mode: 'production',
    port: 5000,
  },
}
module.exports = function(mode) {
  return config[mode || process.argv[2] || 'local'] || config.local
}
