
const Collection = require('../../../../public/js/utils/collections/collection');

class DrawerList {
  constructor() {
    const instance = this;
    const list = [];
    const byId = {};
    const uniqueId = String.random();
    this.uniqueId = () => uniqueId;


    this.add = (drawerBox) => {
      list.push(drawerBox);
      byId[drawerBox.id()];
    }

    const collectionMembers = ['style', 'finishing', 'sides', 'bottom', 'route', 'branding', 'notch', 'scoop'];
    this.collection = (drawerBox) =>
        Collection.create(collectionMembers, list);

  }
}

module.exports = DrawerList;
class Lookup {
  constructor(id) {
    id = id || String.random();
    console.log('creating lookup: ', id)
    this.getSet('id');
    this.id = () => id;
    const cxtr = this.constructor;
    if(cxtr.selectList === Lookup.selectList) {
      cxtr.get = (id) => Lookup.get(cxtr.name, id);
      Lookup.byId[cxtr.name] = {};
      cxtr.selectList = () => Lookup.selectList(cxtr.name);
    }
    if (Lookup.register[cxtr.name] === undefined)
      Lookup.register[cxtr.name] = {};
    Lookup.register[cxtr.name][id] = this;
    Lookup.byId[cxtr.name][id] = this;
    this.toString = () => this.id();
  }
}

Lookup.register = {};
Lookup.byId = {};
Lookup.get = (cxtrName, id) =>
    Lookup.byId[cxtrName][id];
Lookup.selectList = (className) => {
  return Object.keys(Lookup.register[className]);
}

module.exports = Lookup;

const DrawerList = require('./drawer-list');

class OrderInfo {
  constructor() {
    this.defaultGetterValue = () => '';
    Function.getSet.apply(this, ['jobName', 'todaysDate', 'dueDate', 'companyName',
    'shippingAddress', 'billingAddress', 'phone', 'fax', 'salesRep', 'email',
    'shipVia', 'invoiceNumber', 'poNumber']);

    const drawerList = new DrawerList();
    this.todaysDate(new Date().toISOString().split('T')[0]);

    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    this.dueDate(twoWeeks.toISOString().split('T')[0]);

    this.invoiceNumber(String.random());

    const drawerMap = {};
    this.drawerList = () => drawerList;

  }
}

module.exports = OrderInfo;

const Lookup = require('../lookup.js');


class BottomMaterial extends Lookup {
  constructor (name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

// TODO: MOVE!
BottomMaterial.select = function () {
  const Select = require('../../../../../public/js/utils/input/styles/select');
  const list = [];
  for (let index = 0; index < arguments.length; index += 1) {
    const bm = arguments[index];
    list.push(bm.id());
  }
  return new Select({
    label: 'Bottom',
    name: 'bottom',
    format: BottomMaterial.get,
    list
  });
}

module.exports = BottomMaterial;

const Lookup = require('../lookup.js');

class BoxMaterial extends Lookup {
  constructor (name, multiplier, tallMultiplier) {
    super(name);
    this.getSet('multiplier', 'tallMultiplier');
    this.multiplier(multiplier);
    this.tallMultiplier(tallMultiplier);
  }
}

module.exports = BoxMaterial;

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

const Lookup = require('../lookup.js');

class PerBoxCost extends Lookup {
  constructor(name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

module.exports = PerBoxCost;

const Lookup = require('../lookup.js');

class Style extends Lookup {
  constructor (name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

module.exports = Style;
