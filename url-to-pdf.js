const Chrome = require('chrome-remote-interface')
const path = require('path')
const onExit = require('signal-exit')
const spawn = require('child_process').spawn
const CHROME_PORT = 9222

//const p = spawn(path.resolve(__dirname, 'chrome/headless_shell'), ['--no-sandbox', '--disable-gpu', `--remote-debugging-port=${CHROME_PORT}`])
const p = spawn('google-chrome', ['--headless', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${CHROME_PORT}`])

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
  return new Promise((resolve) => Page.printToPDF({
    printBackground: true,
    marginTop: 0.25,
    marginBottom: 0.15,
    marginRight: 0.15,
    marginLeft: 0.15,
    paperWidth: 8.3,
    paperHeight: 11.7,
  }).then(resolve))
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

/**
 * Reference
 * https://github.com/cyrus-and/chrome-remote-interface/wiki/Load-a-URL-in-a-separate-context-(headless-mode-only)
 */
async function doInNewContext(action, params) {
    // connect to the DevTools special target
    const browser = await Chrome({target: `ws://localhost:${CHROME_PORT}/devtools/browser`});
    // create a new context
    const {Target} = browser;
    const {browserContextId} = await Target.createBrowserContext();
    const {targetId} = await Target.createTarget({
        url: 'about:blank',
        browserContextId
    });

    let res = null;
    // connct to the new context
    const client = await Chrome({target: targetId});
    // perform user actions on it
    try {
        res = await action(client, params);
    } finally {
        // cleanup
        await Target.closeTarget({targetId});
        await browser.close();
    }

    return res;
}

async function generatePDF(client, params) {
  const {url, delay: delayTime = 500, search = null} = params
  const {Network, Page, DOM} = client

  console.log(params)

  await Page.enable()
  await Page.navigate({url})
  await Page.loadEventFired()
  await onFound(DOM, search)
  if (delayTime) {
    await delay(parseInt(delayTime,10))
  }

  return printPDF(Page)
}

function urlToPdf(params) {
  return doInNewContext(generatePDF, params)
}

module.exports = urlToPdf
