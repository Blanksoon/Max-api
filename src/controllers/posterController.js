import fs from 'fs'
import multer from 'multer'
import env from '../config/env'
import moment from 'moment'

const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Poster = mongoose.model('Posters')

const checkUserCms = (username, password) => {
  let i = 0
  const content = fs.readFileSync(env.ADMINPATH)
  let users = JSON.parse(content)
  while (i < users.length) {
    if (users[i].username === username && users[i].password === password) {
      return true
    }
    i++
  }
  return false
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
        if (checkUserCms(decoded.data.email, decoded.data.password)) {
          resolve(decoded)
        }
        reject('User not found')
      }
    })
  })
}

exports.addPosters = async function(req, res) {
  //console.log('req.body.data: ', req.body.data)
  const token = req.body.token
  let posterEn = req.body.data.posterEn
  let posterTh = req.body.data.posterTh
  if (req.body.data.posterEn !== undefined && req.body.data.posterEn !== null) {
    if (req.body.data.posterEn.substring(0, 4) !== 'http') {
      posterEn = env.IMAGEURL + req.body.data.posterEn
    }
  }
  if (req.body.data.posterTh !== undefined && req.body.data.posterTh !== null) {
    if (req.body.data.posterTh.substring(0, 4) !== 'http') {
      posterTh = env.IMAGEURL + req.body.data.posterTh
    }
  }
  if (req.body.data.posterTh !== undefined) {
    req.body.data.posterTh = posterTh
  } else {
    req.body.data.posterTh = null
  }
  if (req.body.data.posterEn !== undefined) {
    req.body.data.posterEn = posterEn
  } else {
    req.body.data.posterEn = null
  }
  req.body.data.createDate = Date.now()
  try {
    const decodeToken = await readJwt(token)
    const posters = await Poster.findOneAndUpdate(
      { _id: '5ab0e275b6f2e41a98ffea88' },
      req.body.data,
      {
        new: true,
      }
    )
    res.status(200).send(posters)
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

exports.findPoster = async function(req, res) {
  const token = req.query.token
  try {
    //const decodeToken = await readJwt(token)
    const result = await Poster.find({})
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch poster',
      },
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: error,
      },
    })
  }
}
