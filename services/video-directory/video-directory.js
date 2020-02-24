
const fs = require('fs');

const pssst = require('../pssst/pssst.js');
let config = require('./config.json');

function buildHtml(token, pstPin) {
  let editor = '';
  if (!(token && pstPin)) {//} && pssst.exicuteCmd("video-directory", token, pstPin)) {
    editor = `
      <script src="/js/short-cut-container.js" run-type='auto'></script>
      <short-cut-container keys='v,d'>

      </short-cut-container>`;
  }
  return `
  <html>
    <head>
      <script src="/js/utility-filter.js" run-type='auto'></script>
      <script src="/video-directory/js/video-directory-client.js" run-type='auto'></script>
      <link rel="stylesheet" href="/pssst/css/pssst-client.css">
    </head>
    <body>
      <div id='main-body'>
        <utility-filter id='video-directory-utf' save='vdc.save()' hidden>
          ${JSON.stringify(config)}
        </utility-filter>
        ${editor}
      </div>
      <div>
        <div id='pin-prompt'></div>
      </div>
    </body>
  </html>`
}

function setId(cfg) {
  for (let index = 0; index < cfg.length; index += 1) {
    const elem = cfg[index];
    if (!elem.id) {
      elem.id = Math.floor(Math.random() * 10000000000000000);
    }
  }
}


function endpoints(app, prefix) {
  app.get(prefix, function (req, res) {
    const html = buildHtml()
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.post(prefix + "/update", function(req, res){
    const group = 'video-directory';
    const token = req.body.token;
    const pstPin = req.body.pstPin;
    res.setHeader('Content-Type', 'text/json');
    pssst.exicuteCmd(group, token, pstPin);
    setId(req.body.config);
    fs.writeFileSync('./services/video-directory/config.json',
        JSON.stringify(req.body.config, null, 2));
    config = req.body.config;
    res.send("Success");
  });
}

exports.endpoints = endpoints;
