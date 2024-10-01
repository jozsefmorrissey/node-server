const Property = require('../property');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const IMPERIAL_US = Measurement.units()[1];

const ov = (trueOfalse) => (Boolean.is(trueOfalse) ? trueOfalse : defs.fls.value()) ?
                            defs.ovfls.value() : defs.ovfrd.value()

const defs = {};

const imp = (code, desc, value) => new Property(code, desc, {value, notMetric: IMPERIAL_US});

//   Cabinet
defs.style = new Property('style', 'Cabinet Style', {value: 'Overlay'});
defs.fls = new Property('fls', 'Frameless', {value: true});
defs.dsc = imp('dsc', 'Default Scribe', 1/4);
defs.tid = imp('tid', 'Top Inset Depth', 1/2);
defs.rvibr = imp('rvibr', 'Reveal Inside Bottom Rail', 1/8);
defs.ddg = imp('ddg', 'Reveal Dual Door', 1/16);
defs.tkbw = imp('tkbw', 'Toe Kick Backer Width', 1/2);
defs.tkd = imp('tkd', 'Toe Kick Depth', 4);
defs.tkh = imp('tkh', 'Toe Kick Height', 4);
defs.pbt = imp('pbt', 'Panel Back Thickness', 1/2);
defs.iph = imp('iph', 'Ideal Handle Height', 42);
defs.brr = imp('brr', 'Bottom Rail Reveal', 1/8);
defs.showRight = new Property('showRight', 'Show Right', {value: {type: 'None', endStyle: 'No'}});
defs.ddd = imp('ddd', 'Default Dado Depth', .25);
defs.crh = imp('crh', 'Crown Height', 3.5);


//   Overlay
defs.ovfls = imp('ovfls', 'Overlay Frameless', 11/32);
defs.ovfrd = imp('ovfrd', 'Overlay Framed', 1/2);
defs.ov = new Property('ov', 'Overlay', {value: ov});

//   Reveal
defs.r = imp('r', 'Reveal', 1/8);
defs.rvr = imp('rvr', 'Reveal Right', 1/8);
defs.rvl = imp('rvl', 'Reveal Left', 1/8);
defs.rvt = imp('rvt', 'Reveal Top', 1/2);
defs.rvb = imp('rvb', 'Reveal Bottom', 0);

//   Inset
defs.is = imp('is', 'Spacing', 3/32);

// Cabinet.AngledBackCorner
defs.rbo = imp('bo', 'Back Offset From Corner', 24);
defs.lbo = imp('lbo', 'Left Back Offset From Corner', 24);
defs.rbo = imp('rbo', 'Right Back Offset From Corner', 24);

// Cabinet.Lshaped
defs.lw = imp('lw', 'Distance from Front to Back on the Left', 24);
defs.rw = imp('rw', 'Distance from Front to Back on the Right', 24);

//   Panel
defs.pt34 = imp('pt34', 'Panel Width ~3/4', .75);
defs.pt12 = imp('pt12', 'Panel Width ~1/2', .5);
defs.pt14 = imp('pt14', 'Panel Width ~1/4', .25);
defs.pt18 = imp('pt18', 'Panel Width ~1/8', .125);
defs.vpt = imp('vpt', 'Void Panel Thickness', .75);

const fullExtGuidDepths = (val) => new Property(`dbdepths${val}`, `Drawer Box Depths ${val}`, {value: {
  approx: new Property(`dbdepths${val}max`, `Drawer Box Depths ${val} maximum`, {value: val, notMetric: IMPERIAL_US}),
  clearance: new Property(`dbdepths${val}max`, `Drawer Box Depths ${val} maximum`, {value: .25, notMetric: IMPERIAL_US}),
  max: new Property(`dbdepths${val}max`, `Drawer Box Depths ${val} maximum`, {value: val + 2.75, notMetric: IMPERIAL_US}),
  min: new Property(`dbdepths${val}min`, `Drawer Box Depths ${val} minimum`, {value: val + .25, notMetric: IMPERIAL_US})
}});

//   Guides
defs.dbtos = new Property('dbtos', 'Drawer Box Top Offset', .5*2.54);
defs.dbsos = new Property('dbsos', 'Drawer Box Side Offest', 3*2.54/8);
defs.dbbos = new Property('dbbos', 'Drawer Box Bottom Offset', 2.54/2);
defs.dbn = new Property('dbn', 'Bottom Notched', {value: true});
defs.dbid = imp('dbid', 'Bottom Inset Depth', 1/8);
defs.dbdepths = new Property('dbdepths', 'Drawer Box Depths', {value: [
  fullExtGuidDepths(9), fullExtGuidDepths(12), fullExtGuidDepths(15),
  fullExtGuidDepths(18), fullExtGuidDepths(21), fullExtGuidDepths(24),
  fullExtGuidDepths(27)
]});

//   DoorAndFront
defs.daffrw = imp('daffrw', 'Door and front frame rail width', '2 3/8');
defs.dafip = new Property('dafip', 'Door and front inset panel', {value: null});

//   Door

//   DrawerBox
defs.dbst = imp('dbst', 'Side Thickness', 5/8);
defs.dbbt = imp('dbbt', 'Box Bottom Thickness', 1/4);

//   DrawerFront
defs.mfdfd = imp('mfdfd', 'Minimum Framed Drawer Front Height', 6)

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

// Divider
defs.dpt = new Property('dpt', 'Divider Panel Thickness', {value: 'pt34'});
defs.dfw = imp('dfw', 'Divider Frame Width', 1.5);
defs.dft = imp('dft', 'Divider Frame Thickness', .75);
defs.dpw = imp('dpw', 'Divider Partial Width', 4);
defs.sc = new Property('sc', 'Scribe', {value: 'dsc'});

// Material
impM = (type) => (value) => imp(`linw.${type}`, `Linear Width ${type}`, value);
impSh = impM('Shelve');
impFr = impM('Frame');
defs.munit = new Property('munit', 'Material Units',
      {value: {Panel: 'SQ',
               Shelve: 'LIN',
               Frame: 'LIN',
               DrawerBox: 'CUBIC',
               Door: 'CUBIC',
               DrawerFront: 'CUBIC',
               Guides: {unit: 'SET', attribute: 'demensions.z'}
      }});
defs.linw = new Property('linw', 'Linear Widths',
     {value: {Shelve: [impSh(12), impSh(24), impSh(48)],
              Frame: [impFr(1.5), impFr(2.5), impFr(4.5), impFr(8)]}});


module.exports = defs;
