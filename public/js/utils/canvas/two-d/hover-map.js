
const Line2d = require('./objects/line');
const LineMeasurement2d = require('./objects/line-measurement');
const Vertex2d = require('./objects/vertex');
const Polygon2d = require('./objects/polygon');
const CustomEvent = require('../../custom-event');

class HoverObject2d {
  constructor(lineOrVertex, tolerance, target) {
    if (lineOrVertex instanceof HoverObject2d) return lineOrVertex;
    tolerance ||= 2;
    const toleranceFunction = (typeof tolerance) === 'function';
    const targetFunction = (typeof lineOrVertex) === 'function';
    function getTolerence() {
      if (toleranceFunction) return tolerance();
      return tolerance;
    }
    function vertexHovered(targetVertex, hoverVertex) {
      if(targetVertex.distance(hoverVertex) < getTolerence())
        return targetVertex.distance(hoverVertex);
    }

    function lineHovered(targetLine, hoverVertex) {
      const tol = getTolerence();
      const hv = hoverVertex;
      const sv = targetLine.startVertex();
      const ev = targetLine.endVertex();
      let toleranceAcceptible = false;
      if (targetLine.isVertical()) {
        toleranceAcceptible = Math.abs(sv.x() - hv.x()) < tol &&
              ((sv.y() > hv.y() && ev.y() < hv.y()) ||
              (sv.y() < hv.y() && ev.y() > hv.y()));
      } else if (targetLine.isHorizontal()) {
        toleranceAcceptible = Math.abs(sv.y() - hv.y()) < tol &&
              ((sv.x() > hv.x() && ev.x() < hv.x()) ||
              (sv.x() < hv.x() && ev.x() > hv.x()));
      } else if (Math.abs(sv.y() - ev.y()) < Math.abs(sv.x() - ev.x())) {
        const yValue = targetLine.y(hv.x());
        toleranceAcceptible = yValue + tol > hv.y() && yValue - tol < hv.y();
      } else {
        const xValue = targetLine.x(hv.y());
        toleranceAcceptible = xValue + tol > hv.x() && xValue - tol < hv.x();
      }

      if (toleranceAcceptible) {
        const closestPoint = targetLine.closestPointOnLine(hoverVertex);
        if (targetLine.withinSegmentBounds(closestPoint)) {
          return closestPoint.distance(hoverVertex) + .1;
        }
      }
      return false;
    }

    this.target = () => target || lineOrVertex;
    this.distance = (from) => lineOrVertex.distance(from);

    this.hovering = (hoverVertex) => {
      const lov = targetFunction ? lineOrVertex() : lineOrVertex;
      if (lov instanceof Line2d)
        return lineHovered(lov, hoverVertex);
      else if (lov instanceof Vertex2d)
        return vertexHovered(lov, hoverVertex);
      else if (lov instanceof Polygon2d)
        return lov.isWithin(hoverVertex);
      else
        console.error('unkown hover object', lov);
    }
  }
}

const typeValue = (t) => t instanceof Vertex2d ? 0 : (t instanceof Line2d ? 1 : 3)
HoverObject2d.sort = (obj1, obj2) => typeValue(obj1.target()) - typeValue(obj1.target());

class HoverMap2d {
  constructor() {
    let hoverObjects = [];
    let instance = this;
    let dragging = false;
    let clickHolding = false;
    let id = String.random(3);

    this.id = () => id;filter
    this.objects = () => hoverObjects;
    this.targets = () => this.objects().map(ho => ho.target())
                    .filter(t => !(t instanceof Vertex2d) || t.equals(lastHovered) || t.equals(this.clicked()));
    this.clear = () => hoverObjects = [] || true;
    this.add = (object, tolerance, target) => {
      if (Array.isArray(object)) {
        object.forEach(o => this.add(o));
        return;
      }
      const hovObj = new HoverObject2d(object, tolerance, target);
      if (object instanceof Vertex2d) {
        hoverObjects = [hovObj].concat(hoverObjects);
      } else {
        hoverObjects.push(hovObj);
      }
      hoverObjects.sort(HoverObject2d.sort);
    }

    let lastHovered;
    this.hovering = (pos, filter) => {
      if (clickHolding || pos === undefined) return lastHovered;
      let hoverObjs = this.objects();
      if (filter instanceof Function) hoverObjs = hoverObjs.filter(filter);
      const vertex = pos instanceof Vertex2d ? pos : new Vertex2d(pos);
      let hoveringObj = null;
      for (let index = 0; index < hoverObjs.length; index++) {
        const hoverObj = hoverObjs[index];
        const distance = hoverObj.hovering(vertex);
        if (distance || distance === 0) {
          const target = hoverObj.target();
          if (hoveringObj === null || distance < hoveringObj.distance) {
            hoveringObj = {target, distance};
            break;
          }
        }
      }

      const hov = hoveringObj && hoveringObj.target;;
      lastHovered = hov;
      return lastHovered;
    }

    this.closest = (pos, filter) => {
      if (clickHolding || pos === undefined) return lastHovered;
      let objs = this.objects();
      if (filter instanceof Function) objs = objs.filter(filter);
      const vertex = pos instanceof Vertex2d ? pos : new Vertex2d(pos);
      let closestObj = null;
      for (let index = 0; index < objs.length; index++) {
        const obj = objs[index];
        const distance = obj.distance(vertex);
        if (distance) {
          const target = obj.target();
          if (closestObj === null || distance < closestObj.distance) {
            closestObj = {target, distance};
          }
        }
      }



      return closestObj && closestObj.target;;
    }

  }
}

HoverMap2d.Object = HoverObject2d;
module.exports = HoverMap2d;
