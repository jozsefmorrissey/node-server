function JSST() {
  function getValue(suffix, data, currData) {
    try {
      var evalStr;
      if (suffix.trim().indexOf('.') != 0) {
        currData = "data." + suffix.trim();
      } else {
        evalStr = "currData" + suffix.trim();
      }
      return eval(evalStr);
    } catch (e) {
      console.error("'" + evalStr + "' Failed to evaluate to a variable")
    }
  }

  var varReg = /\$\{.*\}/g;
  function replaceVarReferences(str, data, currData) {
    var matches = str.match(varReg);
    for (let index = 0; matches && index < matches.length; index += 1) {
      var match = matches[index];
      var suffix = match.substring(2, match.length - 1);
      if (index === matches.indexOf(match)) {
        var value = getValue(suffix, data, currData) || '';
        var replaceReg = new RegExp("\\$\\{" + suffix + "\}", 'g');
        str = str.replace(replaceReg, value);
      }
    }
    return str;
  }

  function iterateArray(parent, template, data, currData) {
    var pNode = template.parentNode;
    template.setAttribute("jsst", "");
    for (var index = 0; index < currData.length; index += 1) {
      if (index !== currData.length - 1) {
        var clone = template.cloneNode(true);
        pNode.insertBefore(clone, template);
        render(parent, clone, data, currData[index]);
      } else {
        render(parent, template, data, currData[currData.length - 1]);
      }
    }
  }

  function iterateObject(parent, template, data, currData) {

  }

  var attrReg = /(.*?)="(.*)"/;
  function resolve(parent, template, data, currData) {
    var attrs = template.attributes;
    for (var index = 0; index < attrs.length; index += 1) {
      var attr = attrs[index];
      if (attr.name != 'jsst') {
        var cleanValue = replaceVarReferences(attr.value, data, currData);
        template.setAttribute(attr.name, cleanValue);
      }
    }

    var children = template.children
    for (var index = 0; index < children.length; index += 1) {
      var child = children[index];
      render(parent, child, data, currData);
    }

    template.innerHTML = replaceVarReferences(template.innerHTML, data, currData);
  }

  function render(parent, template, data, currData) {
    if (template.getAttribute('jsst-rendered') !== 'true') {
      var suffix = template.getAttribute('jsst');
      if (suffix) {
        currData = getValue(suffix, data, currData);

        if ((typeof currData) !== 'object') {
          console.error('\'' + suffix + '\' is not an array or an object');
        } else {
          if (Array.isArray(currData)) {
            iterateArray(parent, template, data, currData);
          } else {
            iterateObject(parent, template, data, currData);
          }
        }
      } else {
        resolve(parent, template, data, currData);
      }
      template.setAttribute('jsst-rendered', 'true');
    }
    return template.innerHTML;
  }

  function hideAllDataElems(jssts) {
    for (var index = 0; index < jssts.length; index += 1) {
      jssts[index].querySelector('jsst-data').style = 'display: none;';
    }
  }

  function triggerEvent(name) {
    var event; // The custom event that will be created
    if(document.createEvent){
        event = document.createEvent("HTMLEvents");
        event.initEvent(name, true, true);
        event.eventName = name;
        window.dispatchEvent(event);
    } else {
        event = document.createEventObject();
        event.eventName = name;
        event.eventType = name;
        window.fireEvent("on" + event.eventType, event);
    }
  }

  function build() {
    var jssts = document.querySelectorAll('jsst');
    hideAllDataElems(jssts);
    for (var index = 0; index < jssts.length; index += 1) {
      var jsst = jssts[index];
      var template = jsst.querySelector('jsst-template');
      var dataElem = jsst.querySelector('jsst-data');
      var data = ju.string.parseMultiline(dataElem.innerText);
      if (Array.isArray(data)) {
        iterateArray(null, template, data, data);
      } else {
        render(null, template, data, data);
      }
    }
    triggerEvent('jsst-rendered');
  }

  function loaded() {
    console.log('built');
  }

  window.addEventListener('load', build);
  window.addEventListener('jsst-rendered', loaded);
}

JSST();
