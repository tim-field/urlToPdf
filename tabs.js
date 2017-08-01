const spawn = require('child_process').spawn
const path = require('path')
const CDP = require('chrome-remote-interface');
// const p = spawn(path.resolve(__dirname, 'chrome/headless_shell'), ['--no-sandbox', '--disable-gpu', '--remote-debugging-port=9222'])
//const p = spawn('google-chrome', ['--headless', '--disable-gpu', '--remote-debugging-port=9222'])

async function doInNewContext(action) {
    // connect to the DevTools special target
    const browser = await CDP({target: 'ws://localhost:9222/devtools/browser'});
    // create a new context
    const {Target} = browser;
    const {browserContextId} = await Target.createBrowserContext();
    const {targetId} = await Target.createTarget({
        url: 'about:blank',
        browserContextId
    });
    // connct to the new context
    const client = await CDP({target: targetId});
    // perform user actions on it
    try {
        await action(client);
    } finally {
        // cleanup
        await Target.closeTarget({targetId});
        await browser.close();
    }
}

// this basically is the usual example
async function example(client) {
    // extract domains
    const {Network, Page} = client;
    // setup handlers
    Network.requestWillBeSent((params) => {
        console.log(params.request.url);
    });
    // enable events then start!
    await Promise.all([Network.enable(), Page.enable()]);
    await Page.navigate({url: 'https://www.github.com'});
    await Page.loadEventFired();
}

doInNewContext(example);
