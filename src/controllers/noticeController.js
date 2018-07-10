import fs from 'fs'
import multer from 'multer'
import env from '../config/env'
import moment from 'moment'
import User from '../models/user'
import Order from '../models/order'

const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Notice = mongoose.model('Notifications')

function findUserInNotice(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({ _id: userId })
      resolve(user)
    } catch (err) {
      console.log('err: ', err)
      reject(false)
    }
  })
}

const checkUser = async username => {
  try {
    const user = await User.findOne({ email: username })
    //console.log('user: ', user)
    return true
  } catch (err) {
    console.log('err: ', err)
    return false
  }
}

const readJwt = token => {
  return new Promise((resolve, reject) => {
    const error = {
      statusJwt: '',
      err: '',
    }
    jwt.verify(token, env.JWT_SECRET, async function(err, decoded) {
      if (err) {
        error.statusJwt = 'Failed to authenticate token.'
        error.err = err
        reject(error.statusJwt)
      } else {
        if (checkUser(decoded.data.email)) {
          resolve(decoded)
        }
        reject('User not found')
      }
    })
  })
}

const verifyToken = (token, req, output) => {
  var query = {}
  return new Promise(async (resolve, reject) => {
    await jwt.verify(token, env.JWT_SECRET, function(err, decoded) {
      if (err) {
        resolve(undefined)
      } else {
        //console.log('decoded.data.email', decoded.data.email)
        if (
          decoded.data.email == undefined ||
          decoded.data.email == 'undefined'
        ) {
          //console.log('fisofjo')
          query = {
            email: decoded.data[0].email,
            password: decoded.data[0].password,
            status: 'authorize',
          }
          resolve(query)
        } else {
          //console.log('hiiiii')
          query = {
            email: decoded.data.email,
            password: decoded.data.password,
            status: 'authorize',
          }
          resolve(query)
        }
      }
    })
  })
}

exports.addNotice = async function(req, res) {
  const token = req.body.token
  const userId = req.body.userId
  if (token != '2nabEXSyRndKwgxwejdAjpCjt8zHxJ4pqPjJy6uh') {
    res.status(200).send({
      status: {
        code: 200,
        success: false,
        message: 'token is invalid',
      },
    })
  } else {
    let data = {
      notificationTopicEn: req.body.notificationTopicEn,
      notificationContentEn: req.body.notificationContentEn,
      notificationTopicTh: req.body.notificationTopicTh,
      notificationContentTh: req.body.notificationContentTh,
      notificationDate: Date.now(),
      isRead: req.body.isRead,
      isActive: req.body.isActive,
      isSent: req.body.isSent,
      messageCode: req.body.messageCode,
      userId: userId,
      notificationType: req.body.notificationType,
    }
    try {
      //const decodeToken = await readJwt(token)
      //data.userId = decodeToken.data._id
      const newNotice = new Notice(data)
      await newNotice.save()
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'success add notice',
        },
        data: newNotice,
      })
    } catch (error) {
      console.log('error: ', error)
      res.status(500).send({
        status: {
          code: 500,
          success: true,
          message: error,
        },
      })
    }
  }
}

exports.updateIsRead = async function(req, res) {
  const token = req.body.token
  const isRead = req.body.isRead
  const id = req.body.id
  try {
    if (isRead === undefined) {
      throw 'isRead is undefind'
    }
    const decodeToken = await readJwt(token)
    const noticeData = await Notice.findOneAndUpdate(
      { _id: id },
      { isRead: isRead },
      { new: true }
    )
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success update notice',
      },
      data: noticeData,
    })
  } catch (error) {
    console.log('error: ', error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.updateIsActive = async function(req, res) {
  const token = req.body.token
  const isActive = req.body.isActive
  const id = req.body.id
  try {
    if (isActive === undefined) {
      throw 'isActive is undefind'
    }
    const decodeToken = await readJwt(token)
    const noticeData = await Notice.findOneAndUpdate(
      { _id: id },
      { isActive: isActive },
      { new: true }
    )
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success update isActive',
      },
      data: noticeData,
    })
  } catch (error) {
    console.log('error: ', error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.findByUser = async function(req, res) {
  const token = req.query.token
  try {
    const decodeToken = await readJwt(token)
    const noticeData = await Notice.find({
      userId: decodeToken.data._id,
      isActive: 1,
    }).sort({
      notificationDate: -1,
    })
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch by user',
      },
      data: noticeData,
    })
  } catch (error) {
    console.log('error: ', error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.findAllUser = async function(req, res) {
  const token = req.query.token
  if (token != '2nabEXSyRndKwgxwejdAjpCjt8zHxJ4pqPjJy6uh') {
    res.status(200).send({
      status: {
        code: 200,
        success: false,
        message: 'token is invalid',
      },
    })
  } else {
    try {
      //const decodeToken = await readJwt(token)
      const noticeData = await User.find({})
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'success fetch all user',
        },
        data: noticeData,
      })
    } catch (error) {
      console.log('error: ', error)
      res.status(500).send({
        status: {
          code: 500,
          success: true,
          message: error,
        },
      })
    }
  }
}

exports.findUserByProductId = async function(req, res) {
  const token = req.query.token
  const productId = req.query.productId
  if (token != '2nabEXSyRndKwgxwejdAjpCjt8zHxJ4pqPjJy6uh') {
    res.status(200).send({
      status: {
        code: 200,
        success: false,
        message: 'token is invalid',
      },
    })
  } else {
    try {
      const outputData = []
      const today = Date.now()
      const noticeData = await Order.find({
        productId: productId,
        status: 'approved',
        expiredDate: { $gte: today },
      })
      let userData = {}
      let i = 0
      let n = 0
      while (i < noticeData.length) {
        userData = await findUserInNotice(noticeData[i].userId)
        // if (userData !== null) {
        //   console.log('userData.deviceToken ', userData.deviceToken)
        // if (userData.deviceToken === undefined) {
        //   outputData[i] = {
        //     userId: userData._id,
        //     notificationToken: null,
        //     email: noticeData[i].email,
        //   }
        // } else {
        outputData[i] = {
          userId: userData._id,
          notificationToken: userData.deviceToken,
          email: noticeData[i].email,
        }
        //}
        // n++
        //}
        i++
      }
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'success fetch order by product',
        },
        data: outputData,
      })
    } catch (error) {
      console.log('error: ', error)
      res.status(500).send({
        status: {
          code: 500,
          success: true,
          message: error,
        },
      })
    }
  }
}

exports.updateDeviceToken = async function(req, res) {
  const token = req.body.token
  const deviceToken = req.body.deviceToken
  try {
    const decoded = await verifyToken(token, req)
    if (decoded === undefined) {
      res.status(200).send({
        status: {
          code: 200,
          success: false,
          message: 'token is invalid',
        },
      })
    } else {
      const user = await User.findOne({ email: decoded.email }, { email: 1 })
      user.deviceToken = deviceToken

      await user.save()
      res.status(200).send({
        status: {
          code: 200,
          success: true,
          message: 'update device token success',
          data: user,
        },
      })
    }
  } catch (err) {
    console.log(err)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: err,
      },
    })
  }
}
