import fs from 'fs'
import multer from 'multer'
import env from '../config/env'

const mongoose = require('mongoose')
const News = mongoose.model('News')

exports.uploadImageMaxNews = async function(req, res) {
  console.log(req.file)
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
  console.log('body: ', req.body)
  const imgUrl =
    'https://storage.maxmuaythai.com/images/NEWS/' + req.body.imageUrl
  req.body.imageUrl = imgUrl
  const news = new News(req.body)
  news.save(function(err, order) {
    if (err) {
      console.log('err: ', err)
    } else {
      console.log('order: ', order)
    }
  })
  res.status(200).send('hello')
}
