



class Collection {
  constructor(members) {
    const list = [];
    const instance = this;

    function runForEach(func) {
      let bool = true;
      for (let index = 0; index < members.length; index += 1) {
        bool = func(members[index]) && bool;
      }
      return bool;
    }
    function refMember(name) {
      instance[name] = () => {
        const attrId = list[0][name]();
        return attrId;
      }
    };
    runForEach(refMember);

    this.options = () => list[0].options() || [];
    this.cost = () => {
      let totalCost = 0;
      list.forEach((el) => totalCost += el.cost());
      return totalCost;
    }
    this.belongs = (el) =>
      list.length === 0 ||
        runForEach((member) => el[member]() === list[0][member]());

    this.add = (elem) => {
      if (!this.belongs(elem)) throw new Error ('Cannot add element that does not belong.');
      list.push(elem);
      runForEach(refMember);
    }
    this.list = list;
    this.typeId = () => {
      let typeId = '';
      runForEach((member) => typeId += `:${list[0][member]()}`);
      return typeId;
    }
  }
}

Collection.create = function (members, objs) {
  let collections = {};
  for (let index = 0; index < objs.length; index += 1) {
    let collection = new Collection(members);
    collection.add(objs[index]);
    const typeId = collection.typeId();
    if (collections[typeId] === undefined) {
      collections[typeId] = collection;
    } else {
      collections[typeId].add(objs[index]);
    }
  }
  return Object.values(collections);
}

module.exports = Collection;




