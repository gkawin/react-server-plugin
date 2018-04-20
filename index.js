require('jsdom-global')()
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const express = require('express')
const app = express()
app.use(express.static('dist'))
app.use('/json', express.static('json'))

function ReactServerHTMLPlugin (options) {
  this.options = Object.assign({
    template: 'index.html',
    url: 'http://localhost:3000/'
  }, options)
}

ReactServerHTMLPlugin.prototype.apply = function (compiler) {
  const self = this

  compiler.plugin('emit', async (compilation) => {
    const templateSource = compilation.assets[self.options.template]
    if (!templateSource) {
      return
    }

    const virtualConsole = new jsdom.VirtualConsole()
    virtualConsole.on('error', (err) => { console.log(err) })
    virtualConsole.on('info', (info) => { console.log("===== sys info ==== ", info)})

    const server = await app.listen(3000)
    const html = await templateSource.source()
    const dom = new JSDOM(html, {
      url: self.options.url,
      runScripts: 'dangerously',
      resources: 'usable',
      virtualConsole
    })

    const originalDom = new JSDOM(html)
    dom.window.document.addEventListener('DOMContentLoaded', (ev) => {
      originalDom.window.document.querySelector('#app').innerHTML = dom.window.document.querySelector('#app').innerHTML

      const html = originalDom.serialize()
      console.log(html)
      compilation.assets[self.options.template] = {
        source: () => html,
        size: () => html.length
      }
      server.close()
    }, false)
  })
}

module.exports = ReactServerHTMLPlugin
