


const InformationBar = require('./information-bar.js');
const du = require('../../../../public/js/utils/dom-utils.js');

class RadioDisplay {
  constructor(radioClass, groupAttr) {
    const selector = (attrVal) => {
      return groupAttr ? `.${radioClass}[${groupAttr}="${attrVal}"]` : `.${radioClass}`;
    }

    const infoBar = new InformationBar();

    function path () {
      let path = '';
      const info = du.find.downInfo(`.${radioClass}.open`, document.body, null, `.${radioClass}.close`);
      info.matches.forEach((obj) => {
        const header = obj.node.children[0];
        if (header && header.getBoundingClientRect().y < 8) {
          path += `${header.innerText}=>`
        }
      });
      return path;
    }

    du.on.match('scroll', `*`, (target, event) => {
      infoBar.update(path());
    });

    du.on.match('click', `.${radioClass} > .expand-header`, (targetHeader, event) => {
      const target = targetHeader.parentElement;
      const attrVal = target.getAttribute(groupAttr);
      const targetBody = target.children[1];
      const hidden = targetBody.hidden;
      targetBody.hidden = !hidden;
      if (hidden) {
        du.class.add(targetHeader, 'active');
        du.class.swap(target, 'open', 'close');
        const siblings = document.querySelectorAll(selector(attrVal));
        for (let index = 0; index < siblings.length; index += 1) {
          if (siblings[index] !== target) {
            const sibHeader = siblings[index].children[0];
            const sibBody = siblings[index].children[1];
            du.class.swap(siblings[index], 'close', 'open');
            sibBody.hidden = true;
            du.class.remove(sibHeader, 'active');
          }
        }
      } else {
        du.class.swap(target, 'close', 'open');
        du.class.remove(targetHeader, 'active');
      }
      infoBar.update(path());
    });
  }
}
module.exports = RadioDisplay