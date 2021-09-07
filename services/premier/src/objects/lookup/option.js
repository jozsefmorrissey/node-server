
const Lookup = require('../lookup.js');

class Option extends Lookup {
  constructor(name, cost) {
    super(name, cost);
    this.getSet('cost');
    this.cost(cost);
    let input;

    // TODO: MOVE!
    this.input = () => {
      const Input = require('../../../../../public/js/utils/input/input');
      if (input === undefined) {
        input = new Input({
          label: name,
          name: this.id(),
          type: 'checkbox',
          default: false,
          validation: [true, false],
          format: (bool) => bool ? Option.get(name) : undefined,
          targetAttr: 'checked'
        });

      }
      return input;
    };
  }
}

module.exports = Option;
