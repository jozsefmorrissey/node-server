
const fs = require('fs');
const shell = require('shelljs');

const pssst = require('../pssst/pssst.js');
let vidDir = require('./public/json/info-directory.json');
const reqTopics = require('./public/json/requested-topics.json');
let displayVidDir;

function setDisplayVidDir() {
  displayVidDir = [];
  for (let index = 0; index < vidDir.length; index += 1) {
    const cfg = vidDir[index];
    const dspCfg = {};
    const title = cfg.Title;
    if (cfg.Link) {
      dspCfg.Title = `@[${title}](${cfg.Link})`
    } else {
      dspCfg.Title = `${title} [Vote(${reqTopics[title] ? reqTopics[title].votes : 0})](/info-directory/request/${title})`;
    }
    dspCfg.Description = cfg.Description;
    dspCfg.type = cfg.type;
    displayVidDir.push(dspCfg);
  }
}

function buildPopUp() {
  const topics = Object.keys(reqTopics);
  const data = [];
  for (let index = 0; index < topics.length; index += 1) {
    const Topic = topics[index];
    const Votes = reqTopics[Topic].votes;
    const description = reqTopics.description;
    data.push({ Topic: `[${Topic}](/info-directory/request/${Topic})`, Votes });
  }
  return `<pop-down id="request-topics">
              <utility-filter id='request-topics'>${JSON.stringify(data)}</utility-filter>
          </pop-down>`;
}

function buildHtml(cfg, edit, errorMsg) {
  errorMsg = errorMsg || '';
  return `
  <html>
    <head>
      <script src="/js/utility-filter.js"></script>
      <script src="/js/pop-up.js" tag-name='pop-down'></script>
      <script src="/pssst/js/pssst-client.js"></script>
      <script src="/info-directory/js/info-directory-client.js"></script>
      <link rel="stylesheet" href="/pssst/css/pssst-client.css">
      <link rel="stylesheet" href="/info-directory/css/info-directory.css">
    </head>
    <body>
      <div id='main-body'>
        <div class='error-msg'>${errorMsg}</div>
        <a onclick="POP_UP.open('request-topics')" href='#'>Request/UpVote topics</a>
        <utility-filter id='info-directory-utf' save='vdc.save()' edit='${edit}' hidden>
          ${JSON.stringify(cfg)}
        </utility-filter>
      </div>
      <div>
        <div id='pin-prompt'></div>
      </div>
      ${buildPopUp()}
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

function vote(topic) {
  if (reqTopics[topic]) {
    reqTopics[topic].votes += 1;
  } else {
    reqTopics[topic] = {};
    reqTopics[topic].votes = 1;
  }
  fs.writeFileSync('./services/info-directory/public/json/requested-topics.json',
      JSON.stringify(reqTopics, null, 2));
  setDisplayVidDir();
}

function getAdminUrl() {
  return "/" + shell.exec('pst value info-directory url', {silent: true}).trim()
}

function getEditUrl() {
  return '/info-directory/edit?token=' +
      shell.exec('pst value info-directory token', {silent:true}).trim();
}

function endpoints(app, prefix) {
  app.get(prefix + '/home', function (req, res) {
    const html = buildHtml(displayVidDir, false, req.query.error);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get(prefix + '/edit', function (req, res) {
    const html = buildHtml(vidDir, true, req.query.error);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.post(prefix + "/update", function(req, res){
    const group = 'info-directory';
    const token = req.body.token;
    const pstPin = req.body.pstPin;
    res.setHeader('Content-Type', 'text/json');
    pssst.exicuteCmd(undefined, {body: { group, token, pstPin }});
    setId(req.body.vidDir);
    fs.writeFileSync('./services/info-directory/public/json/info-directory.json',
        JSON.stringify(req.body.vidDir, null, 2));
    vidDir = req.body.vidDir;
    setDisplayVidDir();
    res.send("Success");
  });

  app.get(prefix + "/go/:title", function (req, res) {
    const title = req.params.title;
    let found;
    for (let index = 0; index < vidDir.length; index += 1) {
      const item = vidDir[index];
      if (item.Title === title) {
        found = item;
      }
    }
    if (found) {
      if (found.Link) {
        res.redirect(found.Link);
      } else {
        vote(found.Title);
        res.redirect('/info-directory/home?error=\'' + title + '\' video title still needs to be created. Check back after a few days/weeks to see if its been uploaded');
      }
    } else {
      res.redirect('/info-directory/home?error=\'' + title + '\' video has not been defined: Try searching through our other titles to find what your looking for.');
    }
  });

  console.log(prefix + getAdminUrl());

  app.get(prefix + getAdminUrl(), function (req, res) {
      res.send('<a target="blank" href="' + getEditUrl() + '">Edit</a>');
  });

  app.get(prefix + "/request/:topic", function (req, res) {
    vote(topic);
    res.redirect('/info-directory/home');
  });
}

setDisplayVidDir();
exports.endpoints = endpoints;
