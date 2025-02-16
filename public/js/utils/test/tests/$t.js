const Test = require('../test.js').Test;
const Request = require('../../request.js');
const $t = require('../../$t.js');

Test.add('$t',(ts) => {
  Request.get('/template/urls', (urls) => {
    let processed = 0;
    urls.forEach(url => {
      Request.get(url, (html) => {
        const id = url.replace(/.*\/templates\/(.*).html/, '$1');
        console.log(id);
        const template = new $t(html, id);
        console.log(html);
        console.log(template.compiled());
        console.log(urls.length, processed);
        if (++processed === urls.length) {
          ts.success();
        }
      })
    })
  });
});
