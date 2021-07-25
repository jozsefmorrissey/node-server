class RelationInput extends Select {
  constructor(name, sortFunc) {
    super({name: name, value: name, list: RelationInput.relations, label: 'Auto Select Relation'});
    if (RelationInput.relationsObjs[name] !== undefined) throw new Error('Relation Inputs must have a unique name.');
    this.eval = function(list) {
      evalList = [];

      if (!Array.isArray(list)) return undefined;
      for(let index = 0; index < list.length; index += 1) {
        evalList[index] = this.constructor.eval(list[index]);
      }
      list.sort(sortFunc);
      return list[0];
    };
    RelationInput.relationsObjs[name] = this;
    RelationInput.relations.push(name);
    RelationInput.relations
        .sort((a, b) => a.length > b.length ? 1 : -1);
  }
}

RelationInput.relationsObjs = {};
RelationInput.relations = [];

RelationInput.eval = new StringMathEvaluator(Math);

new RelationInput('Equal', (a, b) => a === b ? -1 : 1);
new RelationInput('Less Than', (a, b) => a < b ? -1 : 1);
new RelationInput('Greater Than', (a, b) => a > b ? -1 : 1);
new RelationInput('Less Than Or Equal', (a, b) => a <= b ? -1 : 1);
RelationInput = new RelationInput('Greater Than Or Equal', (a, b) => a >= b ? -1 : 1);
