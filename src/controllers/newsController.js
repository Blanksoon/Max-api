import fs from 'fs'
import multer from 'multer'
import env from '../config/env'
import moment from 'moment'

const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const News = mongoose.model('News')

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
      }
      resolve(decoded)
    })
  })
}

exports.uploadImageMaxNews = async function(req, res) {
  //console.log(req.file)
  const file = env.PATHIMAGEMAXNEWS + '/' + req.file.originalname
  //console.log('file: ', file)
  fs.rename(req.file.path, file, function(err) {
    if (err) {
      console.log(err)
      res.send(500)
    } else {
      res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
      })
    }
  })
}

exports.addMaxNews = async function(req, res) {
  const token = req.body.token
  const imgUrl = env.IMAGEURL + req.body.data.imageUrl
  req.body.data.imageUrl = imgUrl
  try {
    const decodeToken = await readJwt(token)
    const news = new News(req.body.data)
    const result = await news.save()
    //console.log('2222', result)
    res.status(200).send(result)
  } catch (error) {
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.findMaxNews = async function(req, res) {
  try {
    const result = await News.find({}).sort({ createDate: -1 })
    //console.log('result', result)
    const data = result.map(item => ({
      ...item['_doc'],
      createDate: moment(item['_doc'].createDate).format('DD/MM/YYYY'),
      createDate_en: moment(item['_doc'].createDate).format(
        'ddd. MMM Do, YYYY'
      ),
      createDate_th: moment(item['_doc'].createDate)
        .locale('th')
        .format('ddd. MMM Do, YYYY'),
    }))
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch maxnews',
      },
      data: data,
      dataLength: result.length,
    })
  } catch (error) {
    console.log(error)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'error',
      },
    })
  }
}

exports.findOneMaxNewsCms = async function(req, res) {
  const token = req.query.token
  const newsId = req.params.newsId
  let news = {}
  try {
    const decodeToken = await readJwt(token)
    news = await News.findOne({ _id: newsId })
    console.log('news: ', news)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch news',
      },
      data: news,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.deleteNewsCms = async function(req, res) {
  const token = req.body.token
  try {
    const decodeToken = await readJwt(token)
    const news = await News.findOneAndRemove({ _id: req.body.data.id })
    res.status(200).send({ status: 'success' })
  } catch (error) {
    res.status(500).send({
      status: {
        code: 500,
        success: false,
        message: error,
      },
    })
  }
}

exports.updateNewsCms = async function(req, res) {
  const token = req.body.token
  const data = req.body.data
  console.log('data.imageUrl: ', req.body)
  let news = {}
  if (data.imageUrl.substring(0, 4) !== 'http') {
    data.imageUrl = env.IMAGEURL + data.imageUrl
  }
  //console.log('data: ', data)
  try {
    const decodeToken = await readJwt(token)
    news = await News.findOneAndUpdate({ _id: data._id }, data, { new: true })
    res.status(200).send(news)
  } catch (error) {
    console.log(error)
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

exports.findMaxNewsCms = async function(req, res) {
  const token = req.query.token
  try {
    const decodeToken = await readJwt(token)
    const result = await News.find({})
    //console.log('result', result)
    const data = result.map(item => ({
      ...item['_doc'],
      createDate: moment(item['_doc'].createDate).format('DD/MM/YYYY'),
      createDate_en: moment(item['_doc'].createDate).format(
        'ddd. MMM Do, YYYY'
      ),
      createDate_th: moment(item['_doc'].createDate)
        .locale('th')
        .format('ddd. MMM Do, YYYY'),
    }))
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch maxnews',
      },
      data: data,
      dataLength: result.length,
    })
  } catch (error) {
    res.status(500).send({
      status: {
        code: 500,
        success: true,
        message: error,
      },
    })
  }
}

// exports.filterMaxNewsCms = async function(req, res){
// }
