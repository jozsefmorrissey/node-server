

const Property = require('./property');

const h = new Property('h', 'height', null);
const w = new Property('w', 'width', null);
const d = new Property('d', 'depth', null);
const t = new Property('t', 'thickness', null);
const l = new Property('l', 'length', null);



const assemProps = {
  UNIT: [
    new Property('IUS', 'Imperial (US)'),
    new Property('M', 'Metric')
  ],
  Overlay: [
    new Property('ov', 'Overlay', 1/2)
  ],
  Reveal: [
    new Property('r', 'Reveal', 1/8),
    new Property('rvt', 'Reveal Top', 1/2),
    new Property('rvb', 'Reveal Bottom', 0)
  ],
  Inset: [
    new Property('is', 'Spacing', 3/32)
  ],
  Cabinet: [
      h.clone(), w.clone(), d.clone(),
      new Property('sr', 'Scribe Right', 3/8),
      new Property('sl', 'Scribe Left', 3/8),
      new Property('rvibr', 'Reveal Inside Bottom Rail', 1/8),
      new Property('rvdd', 'Reveal Dual Door', 1/16),
      new Property('tkbw', 'Toe Kick Backer Width', 1/2),
      new Property('tkd', 'Toe Kick Depth', 4),
      new Property('tkh', 'Toe Kick Height', 4),
      new Property('pbt', 'Panel Back Thickness', 1/2),
      new Property('iph', 'Ideal Handle Height', 42)
  ],
  Panel: [
    h.clone(), w.clone(), t.clone()
  ],
  Guides: [
    l.clone(),
    new Property('dbtos', 'Drawer Box Top Offset', 1/2),
    new Property('dbsos', 'Drawer Box Side Offest', 3/16),
    new Property('dbbos', 'Drawer Box Bottom Offset', 1/2)
  ],
  Door: [
    h.clone(), w.clone(), t.clone()
  ],
  DrawerBox: [
    h.clone(), w.clone(), d.clone(),
    new Property('dbst', 'Side Thickness', 5/8),
    new Property('dbbt', 'Box Bottom Thickness', 1/4)
  ],
  DrawerFront: [
    h.clone(), w.clone(), t.clone()
  ],
  Frame: [
    h.clone(), w.clone(), t.clone()
  ],
  Handle: [
    l.clone(), w.clone(),
    new Property('c2c', 'Center To Center', null),
    new Property('proj', 'Projection', null),
  ],
  Hinge: [
    new Property('maxtab', 'Max Spacing from bore to edge of door', null),
    new Property('maxol', 'Max Door Overlay', null),
    new Property('mintab', 'Minimum Spacing from bore to edge of door', null),
    new Property('minol', 'Minimum Door Overlay', null)
  ]
}
assemProps.UNIT._IS_RADIO = true;

function assemProperties(clazz, filter) {
  clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
  props = assemProps[clazz] || [];
  if ((typeof filter) != 'function') return props;
  props = props.filter(filter);
  return props;
}

assemProperties.list = () => Object.keys(assemProps);

module.exports = assemProperties;
