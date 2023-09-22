
const PanZoomClick = require('pan-zoom-click');
const FunctionCache = require('../../services/function-cache.js');
const HoverMap2d = require('hover-map');
const HoverObject2d = HoverMap2d.Object;

const Vertex2d = require('./objects/vertex');
const Line2d = require('./objects/line');
const LineMeasurement2d = require('./objects/line-measurement');
const Polygon2d = require('./objects/polygon');
const Draw2D = require('draw');

FunctionCache.on('pan-zoom', 500);

class PanZoomClickMeasure extends PanZoomClick {
  constructor(canvas, draw, getHoverMap) {
    const draw2d = new Draw2D(canvas);
    let measEnabled = false;
    let measurementLines = [];
    const measurmentHoverMap = new HoverMap2d();
    const measurements = () => measurementLines;

    let lastClicked = null;
    measurements.lastClicked = () => lastClicked;

    const addLine = (objs, line) => {
      objs[line.toString()] = new HoverObject2d(line);
      objs[line.startVertex().toString()] = new HoverObject2d(line.startVertex(), 15);
      objs[line.endVertex().toString()] = new HoverObject2d(line.endVertex(), 15);
    }


    measurements.enabled = () => measEnabled;
    measurements.enable = () => {
      measEnabled = true;
      this.eventsDisabled();
    }

    measurements.disable = () => {
      measEnabled = false;
      this.eventsEnabled();
      measurementLines = [];
    }
    measurements.deleteAll = () => measurementLines.deleteAll();

    measurements.objects = new FunctionCache(() => {
      measurmentHoverMap.clear()
      const targets = getHoverMap().objects().map((ho) => ho.target());
      const objs = {};
      for (let index = 0; index <  targets.length; index++) {
        let obj = targets[index];
        if (obj.object instanceof Function) obj = obj.object();
        if (obj instanceof Vertex2d) {
          objs[obj.toString()] = new HoverObject2d(obj, 15);
        } else if(obj instanceof Line2d) {
          addLine(objs, obj);
        } else if (obj instanceof Polygon2d)
          obj.lines().forEach(l => addLine(objs, l));
      }
      const list = Object.values(objs);
      list.sort(HoverObject2d.sort);
      measurmentHoverMap.add(list);
      return list;
    }, null, 'pan-zoom');

    function drawMeasurements () {
      const objects = measurements.objects();
      const objs = objects.map(o => o.target());

      const lastMove = instance.lastMove();
      const vertex = new Vertex2d(lastMove.imageX, lastMove.imageY);
      const hovering = measurmentHoverMap.hovering(vertex);

      const color = 'black';
      const width = .2;
      draw2d(measurementLines);

      const filter = obj => obj === hovering || obj === measurements.lastClicked() ? 'highlight' : 'normal';
      const split = objs.filterSplit(filter, 'highlight', 'normal');

      for (let index = 0; index < split.highlight.length; index++) {
        const obj = split.highlight[index];
        draw2d(obj, 'blue', width * 4 );
      }
      for (let index = 0; index < split.normal.length; index++) {
        const obj = split.normal[index];
        draw2d(obj, color, width);
      }
    }

    const measDraw = () => measurements.enabled() ? drawMeasurements() : draw();
    super(canvas, measDraw, getHoverMap);
    const instance = this;
    this.hoverMap = () => measurements.enabled() ? measurmentHoverMap : getHoverMap();

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
        measurementLines.push(new LineMeasurement2d(lastTwo[0]));
        lastClicked = null;
      } else {
        const line = new LineMeasurement2d(Line2d.between(lastTwo[0], lastTwo[1]));
        if (line) measurementLines.push(line);
        lastClicked = null;
      }
    }

    this.on.click(measurementManager);
    this.measurements = measurements;
  }
}

module.exports = PanZoomClickMeasure;
