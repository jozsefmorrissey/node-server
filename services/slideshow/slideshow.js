
const shell = require('shelljs');

const dataDir = './services/slideshow/public/image/';

const convertToUrl = (fileLoc) => {
  const url = "/slideshow/" + fileLoc.replace(slideshowDirectory(''), '');
  return url;
}

const controls = `<div id='controls-cnt' hidden><div id='controls'>
  Current Time Interval: <span id='interval-cnt'></span> Seconds<br>
  Next: &#10145;<br>
  Back: &#11013;<br>
  Speed Up: &#11014;<br>
  Slow Down: &#11015;<br>
  Pause: Space<br>
  <button id='download'>Download</button>
</div></div>`;

const css = `<style>
  body {background-color: black}
  #controls {
    background-color: white;
    max-width: 80vw;
    max-height: 75vh;
    padding: 5vh 5vw;
    display: inline-block;
    border-radius: 20pt;
  }

  #description {
    color: white;
    text-align: center;
  }

  #controls-cnt {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    text-align: center;
    background: rgba(0,0,0,0.6);
    padding: 5vh 1vw;
  }
</style>`;
const scripts = `<script src='/slideshow/js/slideshow.js'></script>
                  <script src='/js/utils/dom-utils.js'></script>`;

function slideshowDirectory(folder) {
  return `${global.DATA_DIRECTORY}/slideshow/${folder}`;
}

const imageExtensions = ['jpg', 'png', 'jpeg', 'gif', 'tiff', 'psd', 'pdf', 'eps', 'ai'];
function endpoints(app, prefix) {
  app.get(prefix + '/:folder', function(req,res,next) {
    const fileLoc = slideshowDirectory(req.params.folder);
    console.log(fileLoc);
    const output = shell.find(`${fileLoc}/*`).stdout;
    const list = output ? output.trim().split('\n') : [];
    const title = `<title>${req.params.folder}</title>`;
    let imageHtml = "";
    list.forEach((fileLoc, index) => {
      const ext = fileLoc.replace(/.*\.(.*)/, '$1');
      if (ext && imageExtensions.indexOf(ext) != -1) {
        const altText = fileLoc.replace(/.*\/(.*)\.[^.]*$/, '$1');
        imageHtml += `<img hidden index='${index}' src="${convertToUrl(fileLoc)}" alt-text='${altText}'/>`;
      }
    });
    const body = `<div style='text-align:center'>${imageHtml}</div><div id='description'></div>${controls}`;
    const html = `<html><head>${title}${css}${scripts}</head>${body}`;
    res.send(html);
  });
  app.get(prefix + '/download/:folder', function(req, res, next) {
    res.sendFile(`${slideshowDirectory(req.params.folder)}/Archive.zip`);
  });
  app.get(prefix + '/:folder/:imageName', function(req, res, next) {
    res.sendFile(`${slideshowDirectory(req.params.folder)}/${req.params.imageName}`);
  });
}

exports.endpoints = endpoints;
