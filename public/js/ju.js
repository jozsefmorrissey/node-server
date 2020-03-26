function ju () {
    var self = this;
    this.string = {};

  /**
   * Replaces only within the startStr and endStr exclusively.
   * @str - string to preform replacement on.
   * @regex - RegExp expression used to identify what should be replaced.
   * @substitution - substitution string to be applied to RegExp matches.
   * @startStr - start of replaceable section exclusive.
   * @endStr - end of replaceable section exclusive.
   * @escapeChar - character to be used to escape start/end strings.
  **/
  this.string.replaceWithin = function (str, regex, substitution, startStr, endStr, escapeChar) {
    if ((typeof str) !== 'string') throw new Error('str must be of type string.');
    startStr = startStr || "\"";
    endStr = endStr || "\"";
    escapeChar = escapeChar || "\\";
    inBlock = false;
    newStr = '';
    origEnding = '';
    let dirtyStr = '';
    let escapes = [];
    let entered;
    for (let index = 0; index < str.length; index += 1) {
      let char = str[index];
      exited = false;

      if (inBlock &&
           (index < endStr.length || !escapes[index - endStr.length]) &&
           str.substring(index, index + endStr.length) === endStr) {
        inBlock = false;
        exited = true;
        newStr += dirtyStr.replace(new RegExp(regex, 'g'), substitution);
        dirtyStr = '';
        origEnding = '';
      }

      if (inBlock) {
        dirtyStr += char;
        origEnding += char;
      } else {
        newStr += char;
      }

      if (!inBlock && !exited &&
            (index < str.length - startStr.length || !escapes[index - startStr.length]) &&
            str.substring(index - startStr.length + 1, index + 1) === startStr) {
        inBlock = true;
      }

      if (char === escapeChar && !escapes[index - 1]) {
        escapes[index] = true;
      } else {
        escapes[index] = false;
      }
    }
    return newStr + origEnding;
}

  /**
   *  Parses a JSON string with new actual newline characters within its strings.
   *  Example var multiline = ju.string.parseMultiline(`{ "str": "
                                      this will parse properly
                                       "}`)
   **/
  this.string.parseMultiline = function (str) {
    return JSON.parse(self.string.replaceWithin(str, "\n", "\\n"));
  }

  /**
   *  Parses a string representing an object and returns the object.
   *  Format [key1]=[value1][seperator][key2]=[value2][seperator]...
   **/
  this.string.parseSeperator = function (str, seperator, isRegex) {
    if ((typeof str) !== 'string') {
      return {};
    }
    if (isRegex !== true) {
      seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
    }
    var keyValues = str.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
    var json = {};
    for (let index = 0; index < keyValues.length; index += 1) {
      var split = keyValues[index].match(new RegExp('(.*?)=(.*?)(' + seperator + '|$)'));
      if (split) {
        json[split[1]] = split[2];
      }
    }
    return json;
  }

  /**
   *  Returns an object from a strndard cookie string.
   **/
  this.string.parseCookie = function (str) {
    return self.string.parseSeperator(str, ';');
  }

  this.domElem = {};

  /**
   *  Builds a list of elements whos ids match the given regular expression.
   **/
  this.domElem.getElementByIdReg = function (domElem, regex) {
    if (domElem === undefined || (typeof domElem.getElementsByTagName) !== 'function') {
      return new Error('domElem must have function getElementsByTagName defined');
    }
    var all = domElem.getElementsByTagName("*");
    return self.array.getByKeyReg(all, 'id', regex);
  }

  this.array = {};

  /**
   *  Builds list of elements who's key->values match the regular expression.
   **/
  this.array.getByKeyReg = function (array, key, regex) {
    if (!Array.isArray(array)) throw new Error('array must be an Array.');
    var matches = [];
    for (var i=0, max=array.length; i < max; i++) {
      var elem = array[i];
      if (elem[key] && elem[key].match(regex)) {
        matches.push(elem);
      }
    }
    return matches;
  }

  /**
   *  Builds objects corresponding to the regex breakDown of the keys values.
   *  Example: ju.array.regexObj([{str: 'val1:val2:val3',} {str: 'val4:val5:val6'}],
                        'str', /(.*?):(.*?):(.*)/, 'first', 'second', 'third');
      will return
              [{first: 'val1', second: 'val2', third: 'val3'},
                first: 'val4', second: 'val5', third: 'val6']
   **/
  this.array.regexObj = function (array, key, regex) {
    if (!Array.isArray(array)) throw new Error('array must be an Array.');
    var retArray = [];
    for (var index = 0; index < array.length; index += 1) {
      var target = array[index];
      if (target[key]) {
        var match = target[key].replace(/\n/g, '  ').match(regex);
        if (match) {
          var obj = {};
          for (let aIndex = 2; aIndex < arguments.length; aIndex += 1) {
            var matchKey = arguments[aIndex];
            obj[matchKey] = match[aIndex - 2].trim();
          }
          retArray.push(obj);
        }
      }
    }
    return retArray;
  }

  /**
   *  Returns elements that match the regExp, numbers work.
   **/
  this.array.matches = function (array, regExp) {
    var matches = [];
    for (var index = 0; index < array.length; index += 1) {
      var elem = new String(array[index]);
      var match = elem.match(regExp);
      if (match) {
        if (arguments.length > 2) {
          var obj = {};
          for (var aIndex = 2; aIndex < arguments.length; aIndex += 1) {
              if ((typeof arguments[aIndex]) === 'string' ) {
                obj[arguments[aIndex]] = match[aIndex - 1];
              }
          }
          matches.push(obj);
        } else {
          matches.push(array[index]);
        }
      }
    }
    return matches;
  }

  this.object = {};

  /**
   *  Converts and object to a string.
   *  Format: [key1]=[value1][seperator][key2]=[value2][seperator]...
   **/
  this.object.asString = function (obj, seperator) {
    var str = "";
    var keys = Object.keys(obj);
    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      str += key + "=" + obj[key] + seperator;
    }
    return str;
  }

  this.object.stringifyMultiline = function (obj, spacesPerTab) {
    var str = JSON.stringify(obj);
    return self.string.replaceWithin(str, "\\\\n", "\n");
  }

  function path (obj, value) {
    var curr = obj;
    var path = "object";
    var isGet = value === undefined;
    for (var index = 2; index < arguments.length; index += 1) {
      var attr = arguments[index];
      if (attr === 'value') {
        throw 'Paths cannot contain the word value... sorry but values go where value is';
      }
      path += '.' + attr;
      if (curr[attr] !== undefined && (typeof curr[attr]) !== 'object') {
        if (isGet) {
          return undefined;
        }
        throw path + ' = \'' + curr[attr] + '\' - pathObjects should only have values located at paths terminating with and only containing a single reference of the keyword "value"';
      } else {
        if (curr[attr] === undefined) {
          if (isGet) {
            return undefined;
          }
          curr[attr] = {};
        }
        curr = curr[attr];
      }
    }
    if (isGet) {
      return curr.value;
    } else {
      curr.value = value;
    }
  }

  this.object.getPath = function (obj) {
    var args = [obj, undefined].concat(Array.prototype.slice.apply(arguments, [1]));
    return path.apply(undefined, args);
  }

  this.object.setPath = function (obj, value) {
    var args = [obj, value].concat(Array.prototype.slice.apply(arguments, [1]));
    return path.apply(undefined, args);
  }

  function optionalArgs (template, target, optionals) {
    var breakDown = template.match(/^(.*?)([0-9]*|)$/);
    var type = breakDown[1];
    var argIndex = breakDown[2];
    if (target) {
      if(type === 'object') {
        args = [target, optionals[argIndex - 1]].concat(optionals);
        return self.object.matches.apply(undefined, args);
      } else {
        return type === (typeof target);
      }
    } else {
      return true;
    }
  }

  /**
   *  Can confirm whether an object fits indicated template.
   *  Template Example {string: '', object: {array: [{number: 3, optional: 'object1'}]}}
   *    optional: format - [type][argument index for template - 2]
   *    objects: all non optional elements should be represented.
   *    arrays: first element will define the template for all elements.
   **/

  this.object.matches = function (obj, template) {
    if (((typeof obj) !== (typeof template)) ||
          (Array.isArray(obj) && !Array.isArray(template)) ||
          (Array.isArray(template) && !Array.isArray(obj))) {
      return false;
    }
    var optionals = Array.prototype.slice.call(arguments, 2);
    if (Array.isArray(template)) {
      for (let index = 0; index < obj.length; index += 1) {
        var args = [obj[index], template[0]].concat(optionals);
        if ((typeof template[0]) === 'object') {
          if (!self.object.matches.apply(undefined, args)) {
            return false;
          }
        } else if ((typeof template[index]) !== (typeof template[key])) {
            return false;
        }
      }
    } else if ((typeof obj) === 'object') {
      var keys = Object.keys(template);
      for (let index = 0; index < keys.length; index += 1) {
        var key = keys[index];
        var target = obj[key];
        var args = [target, template[key]].concat(optionals);
        if ((typeof template[key]) === 'string' && template[key].length > 0) {
          if (!optionalArgs(template[key], target, optionals)) {
            return false;
          }
        } else if ((typeof target) === 'object' && !self.object.matches.apply(undefined, args)) {
          return false;
        } else if ((typeof target) !== (typeof template[key])) {
          return false;
        }
      }
    }
    return true;
  }

  this.validateTypes = function() {
    var undef = [];
    for (var index = 0; index < arguments.length; index += 2) {
      if ((typeof arguments[index]) !== arguments[index + 1]) {
        undef.push(index);
      }
    }
    if (undef.length > 0) {
      var e = new Error();
      console.log(e.stack.split('\n')[1] + ' - requires indexes ' + undef + ' to have strict typing');
      throw new Error();
    }
    return true;
  }
}


ju = new ju();

try {
  var htmlD = HTMLDocument;
  ju.isBrowser = true;
} catch (e) {
  ju.isBrowser = false;
}

if (!ju.isBrowser) {
  exports.ju = ju;
}
