class RadioDisplay {
  constructor(radioClass, groupAttr) {
    const selector = (attrVal) => {
      return groupAttr ? `.${radioClass}[${groupAttr}="${attrVal}"]` : `.${radioClass}`;
    }

    matchRun('click', `.${radioClass}`, (target, event) => {
      const attrVal = target.getAttribute(groupAttr);
      const hidden = target.children[1].hidden;
      target.children[1].hidden = !hidden;
      if (hidden) {
        const siblings = document.querySelectorAll(selector(attrVal));
        for (let index = 0; index < siblings.length; index += 1) {
          if (siblings[index] !== target) siblings[index].children[1].hidden = true;
        }
      }
    });
  }
}
