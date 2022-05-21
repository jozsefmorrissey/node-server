
const shell = require('shelljs');

const dataDir = './services/slideshow/public/image/';

const convertToUrl = (fileLoc) => {
  const url = "/slideshow/" + fileLoc.replace(slideshowDirectory(''), '');
  return url;
}

function slideshowDirectory(folder) {
  return `${global.DATA_DIRECTORY}/slideshow/${folder}`;
}

function endpoints(app, prefix) {
  app.get(prefix + '/:folder', function(req,res,next) {
    const output = shell.find(`${slideshowDirectory(req.params.folder)}/*`).stdout;
    const list = output ? output.trim().split('\n') : [];
    const title = `<title>${req.params.folder}</title>`;
    const scripts = `<script src='/slideshow/js/slideshow.js'></script>
                      <script src='/js/utils/dom-utils.js'></script>`;
    let imageHtml = "";
    list.forEach((fileLoc, index) => {
      const altText = fileLoc.replace(/.*\/(.*)\.[^.]*$/, '$1');
      imageHtml += `<img hidden index='${index}' src='${convertToUrl(fileLoc)}' alt-text='${altText}'/>`;
    });
    const body = `<div style='text-align:center'>${imageHtml}</div>`;
    const html = `<html><head>${title}${scripts}</head>${body}`;
    res.send(html);
  });
  app.get(prefix + '/:folder/imageName', function(req, res, next) {
    res.sendFile(`${slideshowDirectory(req.params.folder)}/${imageName}`);
  });
}

exports.endpoints = endpoints;
