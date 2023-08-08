const Property = require('../property');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const IMPERIAL_US = Measurement.units()[1];

const defs = {};

defs.h = new Property('h', 'height', null);
defs.w = new Property('w', 'width', null);
defs.d = new Property('d', 'depth', null);
defs.t = new Property('t', 'thickness', null);
defs.l = new Property('l', 'length', null);

//   Overlay
defs.ov = new Property('ov', 'Overlay', {value: 1/4, notMetric: IMPERIAL_US});

//   Reveal
defs.r = new Property('r', 'Reveal', {value: 1/8, notMetric: IMPERIAL_US});
defs.rvr = new Property('rvr', 'Reveal Right', {value: 1/8, notMetric: IMPERIAL_US});
defs.rvl = new Property('rvl', 'Reveal Left', {value: 1/8, notMetric: IMPERIAL_US});
defs.rvt = new Property('rvt', 'Reveal Top', {value: 1/2, notMetric: IMPERIAL_US});
defs.rvb = new Property('rvb', 'Reveal Bottom', {value: 0, notMetric: IMPERIAL_US});

//   Inset
defs.is = new Property('is', 'Spacing', {value: 3/32, notMetric: IMPERIAL_US});

//   Cabinet
defs.sr = new Property('sr', 'Scribe Right', {value: 3/8, notMetric: IMPERIAL_US});
defs.sl = new Property('sl', 'Scribe Left', {value: 3/8, notMetric: IMPERIAL_US});
defs.rvibr = new Property('rvibr', 'Reveal Inside Bottom Rail', {value: 1/8, notMetric: IMPERIAL_US});
defs.rvdd = new Property('rvdd', 'Reveal Dual Door', {value: 1/16, notMetric: IMPERIAL_US});
defs.tkbw = new Property('tkbw', 'Toe Kick Backer Width', {value: 1/2, notMetric: IMPERIAL_US});
defs.tkd = new Property('tkd', 'Toe Kick Depth', {value: 4, notMetric: IMPERIAL_US});
defs.tkh = new Property('tkh', 'Toe Kick Height', {value: 4, notMetric: IMPERIAL_US});
defs.pbt = new Property('pbt', 'Panel Back Thickness', {value: 1/2, notMetric: IMPERIAL_US});
defs.iph = new Property('iph', 'Ideal Handle Height', {value: 42, notMetric: IMPERIAL_US});
defs.brr = new Property('brr', 'Bottom Rail Reveal', {value: 1/8, notMetric: IMPERIAL_US});
defs.frw = new Property('frw', 'Frame Rail Width', {value: 1.5, notMetric: IMPERIAL_US});
defs.frt = new Property('frt', 'Frame Rail Thicness', {value: .75, notMetric: IMPERIAL_US});
defs.bid = new Property('bid', 'Bottom Inset Depth', {value: 0, notMetric: IMPERIAL_US});
defs.tid = new Property('tid', 'Top Inset Depth', {value: 0, notMetric: IMPERIAL_US});

// Cabinet.AngledBackCorner
defs.rbo = new Property('bo', 'Back Offset From Corner', {value: 24, notMetric: IMPERIAL_US});
defs.lbo = new Property('lbo', 'Left Back Offset From Corner', {value: 24, notMetric: IMPERIAL_US});
defs.rbo = new Property('rbo', 'Right Back Offset From Corner', {value: 24, notMetric: IMPERIAL_US});

// Cabinet.Lshaped
defs.lw = new Property('lw', 'Distance from Front to Back on the Left', {value: 24, notMetric: IMPERIAL_US});
defs.rw = new Property('rw', 'Distance from Front to Back on the Right', {value: 24, notMetric: IMPERIAL_US});

//   Panel

//   Guides
defs.dbtos = new Property('dbtos', 'Drawer Box Top Offset', .5*2.54);
defs.dbsos = new Property('dbsos', 'Drawer Box Side Offest', 3*2.54/8);
defs.dbbos = new Property('dbbos', 'Drawer Box Bottom Offset', 2.54/2);

//   DoorAndFront
defs.daffrw = new Property('daffrw', 'Door and front frame rail width', {value: '2 3/8', notMetric: IMPERIAL_US});
defs.dafip = new Property('dafip', 'Door and front inset panel', {value: null});

//   Door

//   DrawerBox
defs.dbst = new Property('dbst', 'Side Thickness', {value: 5/8, notMetric: IMPERIAL_US});
defs.dbbt = new Property('dbbt', 'Box Bottom Thickness', {value: 1/4, notMetric: IMPERIAL_US});
defs.dbid = new Property('dbid', 'Bottom Inset Depth', {value: 1/2, notMetric: IMPERIAL_US});
defs.dbn = new Property('dbn', 'Bottom Notched', {value: true, notMetric: IMPERIAL_US});

//   DrawerFront
defs.mfdfd = new Property('mfdfd', 'Minimum Framed Drawer Front Height', {value: 6, notMetric: IMPERIAL_US})

//   Frame

//   Handle
defs.c2c = new Property('c2c', 'Center To Center', null);
defs.proj = new Property('proj', 'Projection', null);

//   Hinge
defs.maxtab = new Property('maxtab', 'Max Spacing from bore to edge of door', null);
defs.mintab = new Property('mintab', 'Minimum Spacing from bore to edge of door', null);
defs.maxol = new Property('maxol', 'Max Door Overlay', null);
defs.minol = new Property('minol', 'Minimum Door Overlay', null)

//   Opening

module.exports = defs;
