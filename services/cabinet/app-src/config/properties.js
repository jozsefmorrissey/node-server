

const Property = require('./property');
const CoverStartPoints = require('../globals/CONSTANTS.js').CoverStartPoints;

const assemProps = {
  Cabinet: {
    global: {},
    instance: {
      Frame: {
        Scribe: {
          frorr: new Property('frorr', 'Right'),
          frorl: new Property('frorl', 'Left'),
        },
        Reveal: {
          brr: new Property('brr', 'Inside Bottom'),
          Cover: {
            trv: new Property('trv', 'Top'),
            brv: new Property('brv', 'Bottom'),
            lrv: new Property('lrv', 'Left'),
            rrv: new Property('rrv', 'Right'),
            r: new Property('r', 'Reveal')
          }
        },
        frw: new Property('frw', 'Frame Rail Width'),
        frt: new Property('frt', 'Frame Rail Thickness'),
      },
      'Toe Kick': {
        tkbw: new Property('tkbw', 'Toe Kick Backer Width'),
        tkd: new Property('tkd', 'Toe Kick Depth'),
        tkh: new Property('tkh', 'Toe Kick Height'),
      },
      Panel: {
        pbt: new Property('pbt', 'Panel Back Thickness'),

      },
      iph: new Property('iph', 'Ideal Handle Height'),
      csp: new Property('csp', 'Cover Start Point', undefined,
          {values: Object.keys(CoverStartPoints)})
    }
  },
  Guides: {
    global: {
      tos: new Property('tos', 'Top Offset'),
    },
    instance: {
      sos: new Property('sos', 'Side Offest'),
      bos: new Property('bos', 'Bottom Offset')
    }
  }
}

function assemProperties(clazz) {
  return assemProps[clazz] || {global: {}, instance: {}};
}



// const DEFAULT_PROPS = {
//   pwt34: {name: 'Plywood 3/4 Thickness', value: 25/32},
//   pwt12: {name: 'Plywood 1/2 Thickness', value: 1/2},
//   pwt14: {name: 'Plywood 1/4 Thickness', value: 1/4},
//   frw: {name: 'Frame Rail Width', value: 1.5},
//   frorr: {name: 'Frame Rail Outside Reveal Right', value: 1 / 8},
//   frorl: {name: 'Frame Rail Outside Reveal Left', value: 1 / 8},
//   frt: {name: 'Frame Rail Thickness', value: 3/4},
//   tkbw: {name: 'Toe Kick Backer Width', value: 1/2},
//   tkd: {name: 'Toe Kick Depth', value: 3},
//   tkh: {name: 'Toe Kick Height', value: 3},
//   pbt: {name: 'Panel Back Thickness', value: 1/2},
//   brr: {name: 'Bottom Rail Reveal', value: 1/8},
//   iph: {name: 'Ideal Handle Height', value: 42},
//   trv: {name: 'Top Reveal', value: 1},
//   brv: {name: 'Bottom Reveal', value: 1},
//   lrv: {name: 'Left Reveal', value: 1},
//   rrv: {name: 'Right Reveal', value: 1},
//   r: {name: 'Reveal', value: 1/2},
//   Plywood: {name: 'Plywood', value: 'SoftMapel'},
//   wood: {name: 'Wood', value: 'SoftMapel'},
//   glass: {name: 'glass', value: 'Flat'},
//   csp: {name: 'Cover Start Point', value: CoverStartPoints.OUTSIDE_RAIL, options: Object.keys(CoverStartPoints)}
// };
// function properties(name, values) {
//   if (values === undefined) {
//     const props = properties.list[name] || properties.list['Half Overlay'];
//     return JSON.parse(JSON.stringify(props));
//   }
//
//   const props = JSON.parse(JSON.stringify(DEFAULT_PROPS));
//   const overwrites = JSON.parse(JSON.stringify(values));
//   if (name !== undefined) properties.list[name] = props;
//   Object.keys(overwrites).forEach((key) => props[key] = overwrites[key]);
//
// }
// properties.list = {};
//
//
// properties('Half Overlay', {});
// const CONSTANTS = properties('Half Overlay');
//
// properties('Full Overlay', {
//   trv: {name: 'Top Reveal', value: 1/16},
//   brv: {name: 'Bottom Reveal', value: 1/16},
//   lrv: {name: 'Left Reveal', value: 1/16},
//   rrv: {name: 'Right Reveal', value: 1/16},
//   r: {name: 'Reveal', value: 1/16},
//   fs: {name: 'Face Spacing', value: 1/16},
// });
//
// properties('Inset', {
//   trv: {name: 'Top Reveal', value: -1/16},
//   brv: {name: 'Bottom Reveal', value: -1/16},
//   lrv: {name: 'Left Reveal', value: -1/16},
//   rrv: {name: 'Right Reveal', value: -1/16},
//   r: {name: 'Reveal', value: -1/16},
//   csp: {name: 'Cover Start Point', value: CoverStartPoints.INSIDE_RAIL, CoverStartPoints}
// });
