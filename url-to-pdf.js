const Chrome = require('chrome-remote-interface')
const path = require('path')
const spawn = require('child_process').spawn
const CHROME_PORT = 9222

spawn(path.resolve(__dirname, 'chrome/headless_shell'), ['--no-sandbox', '--disable-gpu', `--remote-debugging-port=${CHROME_PORT}`])

function tryQuery(DOM, docId, query, maxTries = 120) {
  return new Promise((resolve, reject) =>
    DOM.querySelector({nodeId: docId, selector: query})
    .then(({nodeId}) => {
      if (nodeId) {
        resolve(nodeId)
      }
      else {
        resolve(delay(500).then(() => tryQuery(DOM, docId, query, maxTries-1)))
      }
      if (maxTries < 1) {
        reject(new Error('Can\'t find query selector: ',query))
      }
    })
  )
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function printPDF(Page) {
  // console.log('printing!')
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

module.exports = ({url, delay = 500, search = null}) => new Promise((resolve, reject) =>
  Chrome.New({ port:CHROME_PORT })
  .then(() => Chrome((chromeInstance) => {
    const {Page, DOM} = chromeInstance
    Page.enable()
    .then(() => Page.navigate({url}))
    .then(() => onLoad(Page, parseInt(delay,10)))
    .then(() => onFound(DOM, search))
    .then(() => printPDF(Page))
    .then((pdf) => {
      chromeInstance.close()
      resolve(pdf)
    })
    .catch((err) => {
      chromeInstance.close()
      reject(err)
    })
  }
  ))
)
