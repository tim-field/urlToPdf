const Chrome = require('chrome-remote-interface')
const path = require('path')
const onExit = require('signal-exit')
const spawn = require('child_process').spawn
const CHROME_PORT = 9222

const p = spawn(path.resolve(__dirname, 'chrome/headless_shell'), ['--no-sandbox', '--disable-gpu', `--remote-debugging-port=${CHROME_PORT}`])

onExit((code, signal) => {
  console.log('killing now', code, signal)
  p.kill(signal)
})

function tryQuery(DOM, docId, query, maxTries = 100) {
  console.log('tryQuery', query, maxTries)
  return new Promise((resolve, reject) =>
    DOM.querySelector({nodeId: docId, selector: query})
    .then(({nodeId}) => {
      if (nodeId) {
        resolve(nodeId)
      }
      else {
        if (maxTries < 1) {
          reject(new Error('Can\'t find query selector: ', query))
        } else {
          resolve(delay(500).then(() => tryQuery(DOM, docId, query, maxTries - 1)))
        }
      }
    })
  )
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function printPDF(Page) {
  console.log('printing!')
  return new Promise((resolve) => Page.printToPDF().then(resolve))
}

function onLoad(Page, delayTime) {
  return new Promise((resolve) =>
    Page.loadEventFired(() => {
      if(delayTime) {
        return delay(delayTime).then(resolve)
      }
      return resolve()
    })
  );
}

function onFound(DOM, search) {
  return new Promise((resolve) => {
    if(search) {
      return DOM.getDocument()
      .then((doc) => tryQuery(DOM, doc.root.nodeId, search))
      .then(resolve)
    } else {
      return resolve()
    }
  })
}

function connect(count = 0) {
    console.log(`Connection attempt ${count}`)
    const maxTries = 150;
    return new Promise((resolve, reject) => {
      Chrome({port: CHROME_PORT}).then(resolve)
      .catch((err) => {
        if(count < maxTries) {
          console.log('Busy... retry in 1sec');
          resolve(delay(1000).then(() => connect(count+1)))
        } else {
          console.log('Failed, no more retry');
          reject(err)
        }
      })
    })
}

function urlToPdf({url, delay: delayTime = 500, search = null}) {
  return new Promise((resolve, reject) =>
    connect()
    .then((chromeInstance) => {
      const {Page, DOM} = chromeInstance
      Page.enable()
      .then(() => Page.navigate({url}))
      .then(() => onLoad(Page))
      .then(() => onFound(DOM, search))
      .then(() => delayTime ? delay(parseInt(delayTime,10)) : Promise.resolve())
      .then(() => printPDF(Page))
      .then((pdf) => {
        chromeInstance.close()
        .then(resolve(pdf))
      })
      .catch((err) => {
        chromeInstance.close()
        .then(reject(err))
      })
    })
  )
}

module.exports = urlToPdf
