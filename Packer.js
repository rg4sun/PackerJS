/*
 * Packer.js v0.1.0
 * Author: Maxwell
 *
 * PackerJS will pack index.js, index.css into index.html generating an all-in-one static html file
 * You can modify your code logic in index.js, index.css, and use PackerJS to pack them into one integrated html file
 *
 * NOTE: PLEASE DO NOT REMOVE template.html as it's the target injection file for PackerJS to generate index.html
 *
 * Usage: node Packer.js
 * Output: index.html
 *
 */

const fs = require('fs')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

const TEMPLATE_PATH = './template.html'
const TARGETs = {
  css: './index.css',
  js: './index.js'
}
const INTEGRATED_HTML = './index.html'

function handleFile(fpath, carrier = null) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fpath, 'utf8', (err, data) => {
      if (err) return reject(err)
      resolve([data, carrier])
    })
  })
}

handleFile(TEMPLATE_PATH)
  .then(
    templateHTML => {
      // console.log(templateHTML)
      const vDOM = new JSDOM(templateHTML)

      return Promise.all([handleFile(TARGETs.css, vDOM), handleFile(TARGETs.js, vDOM)])
    },
    err => {
      console.err(
        err,
        '\nOops, An error occurred ↑, please check whether template.html has been incorrectly modified or missing!'
      )
    }
  )
  .then(([cssResultArr, jsResultArr]) => {
    let [cssData, vDOM] = cssResultArr
    let [jsData] = jsResultArr
    const { document } = vDOM.window

    // HINT: @import in css will casue bug,need to be removed
    let outerCssImports = cssData.match(/@import.*?;/g)
    let outerCsslinks = []
    outerCssImports.forEach(item => {
      let tmp = item.match(/\(.*?\)/g)[0]
      tmp = tmp.split(')')[0].slice(1)
      let tmp1 = tmp.split("'")
      let tmp2 = tmp.split('"')
      let result
      if (tmp1.length > 1) {
        result = tmp1[1].split('"').length > 1 ? tmp1[1].split('"')[1] : tmp1[1]
      } else if (tmp2.lenght > 1) {
        result = tmp2[1].split("'").length > 1 ? tmp2[1].split("'")[1] : tmp2[1]
      } else {
        result = tmp
      }
      // outerCsslinks.push(`<link href="${result}" rel="stylesheet">`)
      outerCsslinks.push(result)
    })

    const headNode = document.querySelector('head')

    outerCsslinks.forEach(item => {
      const linkNode = document.createElement('link')
      linkNode.href = item
      linkNode.setAttribute('rel', 'stylesheet')
      // headNode.insertBefore(cssInjecter, new JSDOM(item))
      // headNode.insertBefore(styleNode, linkNode) // err, dont know why
      headNode.appendChild(linkNode)
    })

    // remove @import lines in index.css data
    cssData = cssData.replace(/@import.*?;/g, '').trim()

    // HINT: linksheet must before index.css, so now css-injecter point is create here
    // const cssInjecter = document.querySelector('#css-injecter')
    const cssInjecter = document.createElement('style')
    cssInjecter.setAttribute('id', '#css-injecter')
    cssInjecter.innerHTML = cssData

    headNode.appendChild(cssInjecter)

    const jsInjecter = document.querySelector('#indexjs-injecter')
    jsInjecter.innerHTML = jsData

    let temp_data = document.querySelector('html').outerHTML
    // console.log(temp_data)
    let DOCTYPE = '<!DOCTYPE html>'
    temp_data = DOCTYPE + temp_data

    fs.writeFile(INTEGRATED_HTML, temp_data, 'utf-8', err => {
      if (err) return console.log(err)
      console.log('DONE')
    })
  })
