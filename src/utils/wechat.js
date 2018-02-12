import env from '../config/env'
import crypto from 'crypto'
import fs from 'fs'
import ba from 'binascii'
import FormData from 'form-data'
import fetch from 'isomorphic-fetch'

export function createOrder(mch_order_no, nonce_str, price) {
  return new Promise((resolve, reject) => {
    const pem = fs.readFileSync(__dirname + `/private_pkcs1.pem`)
    const key = pem.toString('ascii')
    const buffer =
      `appid=mch21377channel=wechatfee_type=THBimg_type=pngmch_order_no=` +
      mch_order_no +
      `nonce_str=` +
      nonce_str +
      `notify_url=` +
      env.SERVER_URL +
      `/wechat/NativepayApp/pay_notifytotal_fee=` +
      price
    console.log('buffer', buffer)
    const sign = crypto.createSign('sha1WithRSAEncryption')
    sign.update(buffer, 'utf8')
    const sig = sign.sign(key, 'binary')
    const keySign = ba.hexlify(sig)
    console.log('mch_order_no: ', mch_order_no)
    console.log('nonce_str: ', nonce_str)
    console.log('keySign: ', keySign)
    const formData = new FormData()
    formData.append('appid', 'mch21377')
    formData.append('channel', 'wechat')
    formData.append('fee_type', 'THB')
    formData.append('img_type', 'png')
    formData.append('mch_order_no', mch_order_no)
    formData.append('nonce_str', nonce_str)
    formData.append(
      'notify_url',
      env.SERVER_URL + '/wechat/NativepayApp/pay_notify'
    )
    formData.append('total_fee', price)
    formData.append('sign', keySign)
    //console.log('formData: ', formData)
    fetch(`http://api.mch.ksher.net/KsherPay/native_pay`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json()
      })
      .then(function(result) {
        resolve(result)
      })
  })
}
