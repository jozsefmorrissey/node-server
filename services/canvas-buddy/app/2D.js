
const du = require('../../../public/js/utils/dom-utils');
const panZoom = require('../../../public/js/utils/canvas/two-d/pan-zoom-click-measure');
const Draw2D = require('../../../public/js/utils/canvas/two-d/draw.js');
const Circle2d = require('../../../public/js/utils/canvas/two-d/objects/circle.js');
const Ellipse2d = require('../../../public/js/utils/canvas/two-d/objects/ellipse.js');
const Vertex2d = require('../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Line2d = require('../../../public/js/utils/canvas/two-d/objects/line.js');
const HoverMap = require('../../../public/js/utils/canvas/two-d/hover-map.js');
const PopUp = require('../../../public/js/utils/display/pop-up');
const SlideShow = require('./slide-show');

const inputSel = du.id('input-measurement-selector');
const inputUnit = () => du.find.down('input[type="radio"]:checked', inputSel).value;

class Context {
  constructor(lines, draw) {
    let verts = [];
    let hoverMap = new HoverMap();
    const popUp = new PopUp({resize: false});
    let active = false;

    this.hoverMap = () => hoverMap;

    function drawObject(obj) {
      const target = obj.target();
      if (target instanceof Vertex2d) {
        draw.circle(new Circle2d(1, target), color(target), 0, color(target));
      } else if (target instanceof Line2d) {
        draw.line(target, color(target),  .5);
      } else {
        draw(target, color(target));
      }
    }


    let colors = {};
    function color(lineOvert, color) {
      const key = lineOvert.toString();
      if (color) {
        colors[key] = color;
      }
      return colors[key];
    }

      this.draw = () => {
        verts = [];
        hoverMap.objects().forEach(obj => drawObject(obj));
      }

      const metricLines = [];
      const addObject = (obj, color, addMetricLine) => {
        colors[obj.toString()] = color;
        if (addMetricLine) metricLines.push(color + obj.toString());
        hoverMap.add(obj);
      }

      const colorVertReg = new RegExp(`([a-z]{2,}|)(${Vertex2d.regex.mls()})`);
      function pullVertices(line) {
        const matches = line.match(colorVertReg.g());
        if (matches === null) return;
        matches.forEach(m => {
          const {color, string} = colorVertReg.object(m, 'color', 'string');
          addObject(Vertex2d.fromString(string, inputUnit()), color);
          line = line.replace(m, string);
        });
      }

      const cxtrs = [Circle2d, Ellipse2d, Polygon2d, Line2d, Vertex2d];
      const colorObjReg = /^([a-z]{2,}|)(.*)$/;
      function addAppropriateObject(line) {
        pullVertices(line);
        const {color, string} = colorObjReg.object(line, 'color', 'string');
        const obj = cxtrs.map(cxtr => cxtr.fromString(string, inputUnit())).find(o=>o);
        if (obj instanceof Ellipse2d) addObject(obj.center(), color) &
            obj.axisPoints().forEach(p => addObject(p, color));
        else pullVertices(line);
        addObject(obj, color, true);
      }

      lines.forEach((line) =>  {
        line = line.trim();
        if (line) addAppropriateObject(line);
      });
  }
}
// [(1,.1),(2.2,88888.2),(.000003,3)],[(4445654.345,4),(-5,-5)],(6,7),[(4,4),(5,5)]
const canvas = du.find('#two-d-display>canvas');
const height = du.convertCssUnit('8.5in');
let scale, context;
canvas.height = height;
canvas.width = height;
draw = new Draw2D(canvas, true);

function display(contx) {
  if (contx instanceof Context) context = contx;
  draw.clear();
  context && context.draw();
}

panZ = new panZoom(canvas, display, () => context && context.hoverMap());
panZ.disable.move()
draw.circle(new Circle2d(2, new Vertex2d(10,10)), null, 'green');
panZ.centerOn(0, 0);

function buildModel(lines) {
  return new Context(lines, draw);
}

let firstCall = true;
let lines;
function parse(newLines, sc) {
  lines = newLines;
  context = new Context(newLines, draw);
  display(context);
  if (firstCall) {
    firstCall = false;
    const measurements = du.param.get('measurements');
    if (measurements) {
      du.id('measurement-checkbox').click();
      panZ.measurements.add.all(measurements.split(':')
              .map(str => Line2d.fromString(str, true)));
    }
  }
}

du.on.match('change', 'input[name="line-disp-type-2d"]', (elem) => {
  draw.line.indicateDirection = elem.value === 'VECTOR';
  parse(lines);
});


const clickStack = [];
const lastClicked = () => clickStack[clickStack.length - 1];

const centerOnVertices = () => {
    if (verts.length === 0) return;
    const minMax = Math.minMax(verts, ['x', 'y'])
    const x = (minMax.x.max - minMax.x.min)/2;
    const y = (minMax.y.max - minMax.y.min)/-2;
    const center = new Vertex2d(x, y);
    panZ.centerOn(center.x, center.y);
};

const share = (params) => {
  params.measurements = panZ.measurements().map(m => m.line().toString()).join(':').replace(/\s{1,}/g, '');
}


module.exports = {
  oft: (on_off_toggle) => {
    if (on_off_toggle === true) active = true;
    if (on_off_toggle === false) active = false;
    if (on_off_toggle === null) active = !active;
    panZ.oft(active);
    return active
  },
  measure: (tOf) => panZ.measurements[tOf ? 'enable' : 'disable'](),
  parse, share,
  slideShow: new SlideShow(buildModel, display),
  initialValue: '//Point\n\tpurple(50,25)' +
    '\n\n// Line\n\tred[(20,20),(5,88.2)]\n\tblue[(90,80),(70,20)]' +
    '\n\n// Polygon\n\tred[(0,0),(100,0),(100,100),(50,50),(0,100)]' +
    '\n\n// Circle\n\tgreen50r(50,50)45=>315' +
    '\n\n// Ellipse\n\tblack(50,25)r(50,50)15=>275@45'
}
