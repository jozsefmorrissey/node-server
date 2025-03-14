
HashMap = function (hashMap) {
  const add = (hash, build, ...args) =>
        this[hash] = (hashMap && hashMap[hash] ?
          hashMap[hash] :
          build(...args));

  this.property('add', add, false, false, false);
}
