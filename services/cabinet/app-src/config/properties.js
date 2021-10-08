

const Property = require('./property');

const h = new Property('h', 'height', 0);
const w = new Property('w', 'width', 0);
const d = new Property('d', 'depth', 0);
const t = new Property('t', 'thickness', 0);
const l = new Property('l', 'length', 0);



const assemProps = {
  Overlay: [
    new Property('ov', 'Overlay', 1/2)
  ],
  FullOverlay: [
    new Property('r', 'Reveal', 1/8),
    new Property('rvt', 'Reveal Top', 1/2),
    new Property('rvb', 'Reveal Bottom', 0),
    new Property('rvl', 'Reveal Left', 1/16),
    new Property('rvr', 'Reveal Right', 1/16)
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
    new Property('tos', 'Top Offset', 1/2),
    new Property('sos', 'Side Offest', 3/16),
    new Property('bos', 'Bottom Offset', 1/2)
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
    h.clone(), w.clone(1.5), t.clone(3/4)
  ],
  Handle: [
    l.clone(), w.clone(),
    new Property('c2c', 'Center To Center', 1/2),
    new Property('proj', 'Projection', 3/16),
  ],
  Hinge: {
  }
}

function assemProperties(clazz) {
  clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
  return assemProps[clazz] || {};
}

assemProperties.list = () => Object.keys(assemProps);

module.exports = assemProperties;
