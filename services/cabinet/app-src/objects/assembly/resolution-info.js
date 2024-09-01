
class ResolutionInformation {
  constructor(object, expression, value, evaluation) {
    Object.getSet(this, {object, expression, value, evaluation});

    this.value = (val) => {
      if (val !== undefined) {
        value = val;
        if (Number.isFinite(val)) this.evaluation(val);
      }
      return value;
    }

    this.evaluation = (evaluated) => {
      if (evaluated !== undefined) {
        if (!Number.isFinite(evaluated)) console.warn(`Non finite evaluation being set: '${evaluated}'`);
        evaluation = evaluated;
      }
      return evaluation;
    }
    this.valid = () => value !== undefined;
  }
}

module.exports = ResolutionInformation;
