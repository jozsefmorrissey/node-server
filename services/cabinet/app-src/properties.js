const DEFAULT_PROPS = {
  pwt34: {name: 'Plywood 3/4 Thickness', value: 25/32},
  pwt12: {name: 'Plywood 1/2 Thickness', value: 1/2},
  pwt14: {name: 'Plywood 1/4 Thickness', value: 1/4},
  frw: {name: 'Frame Rail Width', value: 1.5},
  frorr: {name: 'Frame Rail Outside Reveal Right', value: 1 / 8},
  frorl: {name: 'Frame Rail Outside Reveal Left', value: 1 / 8},
  frt: {name: 'Frame Rail Thickness', value: 3/4},
  tkbw: {name: 'Toe Kick Backer Width', value: 1/2},
  tkd: {name: 'Toe Kick Depth', value: 3},
  tkh: {name: 'Toe Kick Height', value: 3},
  pbt: {name: 'Panel Back Thickness', value: 1/2},
  brr: {name: 'Bottom Rail Reveal', value: 1/8},

  iph: {name: 'Ideal Pull Height', value: 42},
  trv: {name: 'Top Reveal', value: 1/2},
  brv: {name: 'Bottom Reveal', value: 1/4},
  lrv: {name: 'Left Reveal', value: 1/2},
  rrv: {name: 'Right Reveal', value: 1/2},
  fs: {name: 'Face Spacing', value: 1/8},
  is: {name: 'Inset Spacing', value: 1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},
  Plywood: {name: 'Plywood', value: 'SoftMapel'},
  wood: {name: 'Wood', value: 'SoftMapel'},
  glass: {name: 'glass', value: 'Flat'}
};

function properties(name, values) {
  if (values === undefined) {
    const props = properties.list[name] || properties.list['Half Overlay'];
    return JSON.parse(JSON.stringify(props));
  }

  const props = JSON.parse(JSON.stringify(DEFAULT_PROPS));
  const overwrites = JSON.parse(JSON.stringify(values));
  if (name !== undefined) properties.list[name] = props;
  Object.keys(overwrites).forEach((key) => props[key] = overwrites[key]);

}
properties.list = {};


properties('Half Overlay', {});
const CONSTANTS = properties('Half Overlay');

properties('Full Overlay', {
  trv: {name: 'Top Reveal', value: 1/16},
  brv: {name: 'Bottom Reveal', value: 1/16},
  lrv: {name: 'Left Reveal', value: 1/16},
  rrv: {name: 'Right Reveal', value: 1/16},
  fs: {name: 'Face Spacing', value: 1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},
});

properties('Inset', {
  trv: {name: 'Top Reveal', value: -1/16},
  brv: {name: 'Bottom Reveal', value: -1/16},
  lrv: {name: 'Left Reveal', value: -1/16},
  rrv: {name: 'Right Reveal', value: -1/16},
  fs: {name: 'Face Spacing', value: -1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},
});
