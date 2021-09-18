

const Property = require('./property');

const assemProps = {
  Cabinet: {
    global: {},
    instance: {
      OR_Style: {
        Overlay: {
          ov: new Property('ov', 'Overlay', 1/2)
        },
        FullOverlay: {
          rvt: new Property('trv', 'Top Reveal', 1/2),
          rvb: new Property('brv', 'Bottom', 0),
          rvl: new Property('lrv', 'Left', 1/16),
          rvr: new Property('rrv', 'Right', 1/16),
          r: new Property('r', 'Reveal', 1/8)
        },
        Inset: {
          i: new Property('i', 'Inset', 3/32)
        }
      },
      Frame: {
        Scribe: {
          frorr: new Property('frorr', 'Right', 3/8),
          frorl: new Property('frorl', 'Left', 3/8),
        },
        Reveal: {
          rvbr: new Property('ibrr', 'Reveal Inside Bottom Rail', 1/8),
          rvdd: new Property('rvdd', 'Reveal Dual Door', 1/16)
        },
        frw: new Property('frw', 'Frame Rail Width', 1.5),
        frt: new Property('frt', 'Frame Rail Thickness', 25/32),
      },
      'Toe Kick': {
        tkbw: new Property('tkbw', 'Toe Kick Backer Width', 1/2),
        tkd: new Property('tkd', 'Toe Kick Depth', 4),
        tkh: new Property('tkh', 'Toe Kick Height', 4),
      },
      Panel: {
        pbt: new Property('pbt', 'Panel Back Thickness', 1/2),

      },
      iph: new Property('iph', 'Ideal Handle Height', 42)
    }
  },
  Guides: {
    global: {
      tos: new Property('tos', 'Top Offset', 1/2),
    },
    instance: {
      sos: new Property('sos', 'Side Offest', 3/16),
      bos: new Property('bos', 'Bottom Offset', 1/2)
    }
  }
}

function assemProperties(clazz) {
  clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
  return assemProps[clazz] || {global: {}, instance: {}};
}

assemProperties.list = () => Object.keys(assemProps);

module.exports = assemProperties;
