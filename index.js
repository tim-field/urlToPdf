const urlToPdf = require('./url-to-pdf')

exports.handler = (event, context, callback) => {
  const {url, delay} = event

  urlToPdf({url, delay}).then((res) => callback(null, {
    statusCode: '200',
    body: res
  })).catch((err) => {
    console.error(err)
    res.status(500).send(err)
  })
}