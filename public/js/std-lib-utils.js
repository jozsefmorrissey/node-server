function STD_LIB_UTILS () {
  function replaceWithin(regex, substitution, startStr, endStr, escapeChar) {
    startStr = startStr || "\"";
    endStr = endStr || "\"";
    escapeChar = escapeChar || "\\";
    inBlock = false;
    newStr = '';
    let dirtyStr = '';
    let escapes = [];
    for (let index = 0; index < this.length; index += 1) {
      let char = this[index];

      if (inBlock) {
        dirtyStr += char;
      } else {
        newStr += char;
      }

      if (!inBlock &&
            (index < startStr.length || !escapes[index - startStr.length]) &&
            this.substring(index - startStr.length + 1, index + 1) === startStr) {
        inBlock = true;
      } else if (inBlock &&
            (index < endStr.length || !escapes[index - endStr.length]) &&
            this.substring(index - endStr.length + 1, index + 1) === endStr) {
        inBlock = false;
        newStr += dirtyStr.replace(new RegExp(regex, 'g'), substitution);
        dirtyStr = '';
      }

      if (char === escapeChar && !escapes[index - 1]) {
        escapes[index] = true;
      } else {
        escapes[index] = false;
      }
    }
    return newStr;
  }

  function parseMultiline(str, spacesPerTab) {
    spacesPerTab = spacesPerTab || 2;
    var tab = Array(spacesPerTab).fill(" ").join("");
    str = str.replaceWithin(tab, "\\t");
    str = str.replaceWithin("\t", "\\t");
    return JSON.parse(str.replaceWithin("\n", "\\n"));
  }

  function stringifyMultiline(jsonObj, spacesPerTab) {
    var str = JSON.stringify(jsonObj);
    spacesPerTab = spacesPerTab || 2;
    var tab = Array(spacesPerTab).fill(" ").join("");
    str = str.replaceWithin("\\\\t", tab);
    return str.replaceWithin("\\\\n", "\n");
  }

  JSON.parseMultiline = parseMultiline;
  JSON.stringifyMultiline = stringifyMultiline

  String.prototype.replaceWithin = replaceWithin;
}

STD_LIB_UTILS();
