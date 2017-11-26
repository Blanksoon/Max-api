import md5 from 'md5'
import env from '../config/env'

const cache = {}
const cached = key => {
  return typeof cache[key] !== 'undefined'
}
const expired = key => {
  const now = Date.now()
  const signature = cache[key]
  return signature.expire < now
}
export const jwplayerUrl = path => {
  let signature = ''
  let expire = ''
  // Cache missed
  if (!cached(path) || expired(path)) {
    expire = Date.now() + env.JWPLAYER_EXPIRE
    signature = md5(`${path}:${expire}:${env.JWPLAYER_SECRET}`)
    cache[path] = {
      signature,
      expire,
    }
  } else {
    // Cache hit
    signature = cache[path].signature
    expire = cache[path].expire
  }
  return `https://content.jwplatform.com/${path}?exp=${expire}&sig=${signature}`
}
