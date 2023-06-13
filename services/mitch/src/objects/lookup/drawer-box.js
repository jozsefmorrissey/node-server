
const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator');
const Lookup = require('../lookup.js');
const Option = require('./option.js');

class DrawerBox extends Lookup {
  constructor (values) {
    super();
    values = values || {};
    Function.getSet.apply(this, ['style', 'finishing', 'sides', 'bottom',
        'quantity', 'notes', 'height', 'width', 'depth', 'options']);
    this.style(values.style);
    this.finishing(values.finishing);
    this.sides(values.sides);
    this.bottom(values.bottom);
    this.quantity(values.quantity);
    this.notes(values.notes);

    this.height(DrawerBox.eval(values.height));
    this.width(DrawerBox.eval(values.width));
    this.depth(DrawerBox.eval(values.depth));
    const setters = {height: this.height, width: this.width, depth: this.depth};
    const sizeFormatter = (attr) => (value) => {
      if (value !== undefined) setters[attr](value);
      return DrawerBox.eval(setters[attr]());
    }

    this.height = sizeFormatter('height');
    this.width = sizeFormatter('width');
    this.depth = sizeFormatter('depth');

    this.heightPrint = () => DrawerBox.simplify(this.height());
    this.widthPrint = () => DrawerBox.simplify(this.width());
    this.depthPrint = () => DrawerBox.simplify(this.depth());

    this.route = () => values['Radius Top Edge After Assembly'] !== undefined;
    this.branding = () => values['Branding Inside of Box'] !== undefined;
    this.notch = () => values['Notch & Drill w/1/2" Inset Bottom for Under Mount Slides'] !== undefined;
    this.scoop = () => values['Standard Scoop'] !== undefined;

    this.index = () => DrawerBox.index(this);
    let options = [];
    this.options = (ops) => {
      if (Array.isArray(ops)) options = ops.filter((val) => val instanceof Option);
      return JSON.clone(options);
    }
    Object.values(values).forEach((value) => {
      if (value instanceof Option) {
        options.push(value);
      }
    });
    this.cost = (quantity) => {
      quantity = quantity > 0 ? quantity : this.quantity();
      let optionCost = 0;
      options.forEach((option) => optionCost += option.cost());
      const radius = this.route() ? this.route().cost() : 0;
      const width = this.width();
      const height = this.height();
      const depth = this.depth();
      if (!Number.isNaN(width + height + depth)) {
        const sides = this.sides();
        const multiplier = height <= 8 ? sides.multiplier() : sides.tallMultiplier();
        const drawerSides = (width + depth) * 2 * height / 144 * multiplier;
        const drawerBottom = width * height / 144 * this.bottom().cost();
        const style = this.style().cost();
        let cost = drawerSides + drawerBottom + this.finishing().cost() + optionCost + style;
        cost *= Number.parseInt(quantity);
        return StringMathEvaluator.round(cost, '1/100');
      }
      return NaN;
    }
    this.each = () => this.cost(1);
  }
}

DrawerBox.idMap = {};
DrawerBox.resetCount = () => {
  DrawerBox.count = 1;
  DrawerBox.idMap = {};
}
DrawerBox.index = (drawer) => {
  const idMap = DrawerBox.idMap;
  const unqId = drawer.id();
  if (!idMap[unqId]) idMap[unqId] = DrawerBox.count++;
  return idMap[unqId];
}
DrawerBox.eval = new StringMathEvaluator().eval;
DrawerBox.simplify = (value) => {
  const decimal = DrawerBox.eval(value);
  return StringMathEvaluator.toFraction(decimal, '1/16');
}

module.exports = DrawerBox;
