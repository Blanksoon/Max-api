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
  const imgUrl = env.IMAGEURL + req.body.imageUrl
  req.body.imageUrl = imgUrl
  const news = new News(req.body)
  const result = await news.save()
  console.log('2222', result)
  res.status(200).send(result)
}

exports.findMaxNews = async function(req, res) {
  try {
    const result = await News.find({})
    //console.log('result', result.length)
    res.status(200).send({
      status: {
        code: 200,
        success: true,
        message: 'success fetch maxnews',
      },
      data: result,
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
