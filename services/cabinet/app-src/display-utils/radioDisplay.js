class RadioDisplay {
  constructor(radioClass, groupAttr) {
    const selector = (attrVal) => {
      return groupAttr ? `.${radioClass}[${groupAttr}="${attrVal}"]` : `.${radioClass}`;
    }

    const infoBar = new InformationBar();

    function path () {
      let path = '';
      const info = downInfo(`.${radioClass}.open`, `.${radioClass}.close`, document.body);
      info.matches.forEach((obj) => {
        const header = obj.node.children[0];
        if (header && header.getBoundingClientRect().y < 8) {
          path += `${header.innerText}=>`
        }
      });
      return path;
    }

    matchRun('scroll', `*`, (target, event) => {
      infoBar.update(path());
    });

    matchRun('click', `.${radioClass}`, (target, event) => {
      const attrVal = target.getAttribute(groupAttr);
      const hidden = target.children[1].hidden;
      const targetHeader = target.children[0];
      const targetBody = target.children[1];
      targetBody.hidden = !hidden;
      if (hidden) {
        addClass(targetHeader, 'active');
        swapClass(target, 'open', 'close');
        const siblings = document.querySelectorAll(selector(attrVal));
        for (let index = 0; index < siblings.length; index += 1) {
          if (siblings[index] !== target) {
            const sibHeader = siblings[index].children[0];
            const sibBody = siblings[index].children[1];
            swapClass(siblings[index], 'close', 'open');
            sibBody.hidden = true;
            removeClass(sibHeader, 'active');
          }
        }
      } else {
        swapClass(target, 'close', 'open');
        removeClass(targetHeader, 'active');
      }
      infoBar.update(path());
    });
  }
}
