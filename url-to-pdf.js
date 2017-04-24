const Chrome = require('chrome-remote-interface')
const path = require('path')
const spawn = require('child_process').spawn
const CHROME_PORT = 9222

spawn(path.resolve(__dirname, 'chrome/headless_shell'), ['--no-sandbox', `--remote-debugging-port=${CHROME_PORT}`])

module.exports = ({url, delay = 500}) => {
    console.log('in', url, delay)
    return new Promise((resolve) => {
        Chrome.New({port:CHROME_PORT}).then(() => 
            Chrome((chromeInstance) => {
                const { Page, Runtime } = chromeInstance;
                Page.enable().then(()=> Page.navigate({url}))
                Page.loadEventFired(() => setTimeout(() => {
                Page.printToPDF().then((v) => {
                    resolve(v)
                    chromeInstance.close()
                })
                },delay))
            })
        )
    })
}