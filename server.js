const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const urlToPdf = require('./url-to-pdf')
const PORT = 3005

app.use(bodyParser.json())

// Just to demonstrate the app working fetch on root of the app causes the PDF to be generated.
app.post('/', (req, res) => {
  const {url, delay, search} = req.body
  urlToPdf({url, delay, search}).then((data) => {
    res.status(200).send(data)
  }).catch((err) => {
    console.error(err)
    res.status(500).send(err)
  })
});

app.listen(PORT, () => console.log(`PDF Generation server listening on port ${PORT}`))
