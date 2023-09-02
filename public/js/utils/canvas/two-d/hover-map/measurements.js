const HoverMap2d = require('../hover-map');
const Vertex2d = require('../objects/vertex');
const Line2d = require('../objects/line');
const LineMeasurement2d = require('../objects/line-measurement');
const Polygon2d = require('../objects/polygon');
const FunctionCache = require('../../../services/function-cache.js');

FunctionCache.on('hover-map', 500);

const HoverObject2d = HoverMap2d.Object;

class MeasurementHoverMap2d extends HoverMap2d {
  constructor(panZ) {
    super(panZ);
    const parentObjects = this.objects;
    const instance = this;

    let lastClicked = null;
    this.lastClicked = () => lastClicked;

    const addLine = (objs, line) => {
      objs[line.toString()] = new HoverObject2d(line);
      objs[line.startVertex().toString()] = new HoverObject2d(line.startVertex());
      objs[line.endVertex().toString()] = new HoverObject2d(line.endVertex());
    }


    let measEnabled = false;
    let measurementLines = [];
    this.measurements = () => measurementLines;
    this.measurements.enabled = () => measEnabled;
    this.measurements.enable = () => {
      measEnabled = true;
    }

    this.measurements.disable = () => {
      measEnabled = false;
      measurementLines = [];
    }
    this.measurements.deleteAll = () => measurementLines.deleteAll();

    let measurements = true;
    function measurementManager() {
      if (!measEnabled) return;
      const lastTwo = instance.clicked(0,2);
      const nadaClick0 = lastTwo[0] === null;
      const nadaClick1 = lastTwo[1] === null;
      if (nadaClick0 && nadaClick1) {
        console.log('do nothing');
      } else if (nadaClick0) {
        lastClicked = null;
      } else if (nadaClick1 || lastClicked === null) {
        lastClicked = lastTwo[0];
      } else if (lastTwo[0] instanceof Line2d && lastTwo[0] === lastTwo[1]) {
        measurementLines.push(new LineMeasurement2d(lastTwo[0].measurement()));
        lastClicked = null;
      } else {
        const line = new LineMeasurement2d(Line2d.between(lastTwo[0], lastTwo[1]));
        if (line) measurementLines.push(line);
        lastClicked = null;
      }
    }
    this.on.click(measurementManager);

    this.objects = new FunctionCache(() => {
      const pObjs = parentObjects();
      if(!this.measurements.enabled()) return pObjs;
      const targets = pObjs.map((ho) => ho.target());
      const objs = {};
      for (let index = 0; index <  targets.length; index++) {
        const obj = targets[index];
        if (obj instanceof Vertex2d) {
          objs[obj.toString()](new HoverObject2d(obj));
        } else if(obj instanceof Line2d) {
          addLine(objs, obj);
        } else if (obj instanceof Polygon2d)
          obj.lines().forEach(l => addLine(objs, l));
      }
      const list = Object.values(objs);
      list.sort(HoverObject2d.sort);
      return list;
    }, this, 'hover-map');
  }
}

module.exports = MeasurementHoverMap2d;
