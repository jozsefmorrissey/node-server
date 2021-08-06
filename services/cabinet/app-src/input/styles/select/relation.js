class RelationInput {
  constructor(name, searchFunc) {
    if (RelationInput.relationsObjs[name] !== undefined) throw new Error('Relation Inputs must have a unique name.');
    this.eval = function(list, value) {
      let minDiff = Number.MAX_SAFE_INTEGER;
      let winner;

      if (!Array.isArray(list)) return undefined;
      for(let index = 0; index < list.length; index += 1) {
        const evalVal = this.constructor.evaluator.eval(list[index]);
        const diff =  searchFunc(value, evalVal);
        if (diff >= 0 && diff < minDiff) {
          minDiff = diff;
          winner = index;
        }
      }
      return winner;
    };
    RelationInput.relationsObjs[RelationInput.toPascalCase(name)] = this;
    RelationInput.relations.push(name);
    RelationInput.relations
        .sort((a, b) => a.length > b.length ? 1 : -1);
  }
}

RelationInput.relationsObjs = {};
RelationInput.relations = [];
RelationInput.toPascalCase = (str) => new String(str).replace(/ /g, '_').toUpperCase();

RelationInput.evaluator = new StringMathEvaluator(Math);
RelationInput.eval = (name, list, value) => {
  const relation = RelationInput.relationsObjs[RelationInput.toPascalCase(name)];
  return relation ? relation.eval(list, value) : undefined;
}

new RelationInput('Equal', (a, b) => a !== b ? -1 : 0);
new RelationInput('Greater Than', (a, b) => a >= b ? -1 : b - a);
new RelationInput('Greater Than Or Equal', (a, b) => a > b ? -1 : b - a);
new RelationInput('Less Than', (a, b) => a <= b ? -1 : a - b);
new RelationInput('Less Than Or Equal', (a, b) => a < b ? -1 : a - b);

RelationInput.selector = new Select({name: 'relation',
                            value: 'Equal',
                            list: RelationInput.relations,
                            label: 'Auto Select Relation'});
