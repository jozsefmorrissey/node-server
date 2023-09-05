
const Line2d = require('./objects/line');
const LineMeasurement2d = require('./objects/line-measurement');
const Vertex2d = require('./objects/vertex');
const Polygon2d = require('./objects/polygon');
const CustomEvent = require('../../custom-event');

class HoverObject2d {
  constructor(lineOrVertex, tolerance, target) {
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
  constructor(panZ) {
    let hoverObjects = [];
    let instance = this;
    let clickHolding = false;
    let dragging = false;
    let id = String.random(3);

    this.objects = () => hoverObjects;
    this.targets = () => this.objects().map(ho => ho.target())
                    .filter(t => !(t instanceof Vertex2d) || t.equals(lastHovered) || t.equals(this.clicked()));
    this.clear = () => hoverObjects = [] || true;
    this.add = (object, tolerance, target) => {
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
      if (pos === undefined) return lastHovered;
      let hoverObjs = this.objects();
      if (filter instanceof Function) hoverObjs = hoverObjs.filter(filter);
      const vertex = pos instanceof Vertex2d ? pos : new Vertex2d(pos);
      let hoveringObj = null;
      for (let index = 0; index < hoverObjs.length; index++) {
        const hoverObj = hoverObjs[index];
        const distance = hoverObj.hovering(vertex);
        if (distance) {
          const target = hoverObj.target();
          if (hoveringObj === null || distance < hoveringObj.distance) {
            hoveringObj = {target, distance};
          }
        }
      }

      const hov = hoveringObj && hoveringObj.target;;
      if (hov !== lastHovered) {
        console.log(id, hov, vertex.toString());
      }
      lastHovered = hov;
      return lastHovered;
    }

    if (panZ) {
      const clickEvent = new CustomEvent('click');
      const dragEvent = new CustomEvent('dragging');
      const hoverEvent = new CustomEvent('hover');
      const hoverOutEvent = new CustomEvent('hoverOut');
      let active = true;

      this.on = {};
      this.on.click = clickEvent.on;
      this.on.hover = hoverEvent.on;
      this.on.hoverOut = hoverOutEvent.on;
      this.on.drag = dragEvent.on;
      this.disable = () => active = false;
      this.enable = () => active = true;

      let stackLimit = 10;
      let hoverStack = new Array(stackLimit).fill(null);
      let clickStack = new Array(stackLimit).fill(null);
      this.hovered = (startIndex, toIndex) => {
        if (startIndex === undefined && toIndex === undefined) {
          return hoverStack[0];
        }
        return hoverStack.slice(startIndex, toIndex);
      }
      this.clicked = (startIndex, toIndex) => {
        if (startIndex === undefined && toIndex === undefined) {
          return clickStack[0];
        }
        return clickStack.slice(startIndex, toIndex);
      }

      panZ.onMove((event) => {
        if (!active) return;
        const vertex = new Vertex2d(event.imageX, event.imageY);
        const hovering = instance.hovering(vertex);
        if (clickHolding && hovering) {
          return dragEvent.trigger(hovering);
        }
        const hovered = this.hovered();
        if (hovering !== hovered) {
          if (hovered) {
            hoverOutEvent.trigger(hovered);
          }
          hoverStack = [hovering].concat(hoverStack);
          hoverStack.splice(stackLimit);
          if (hovering) {
            hoverEvent.trigger(hovering);
          }
        }
      });
      panZ.onClick((event) => {
        if (!active) return;
        const vertex = new Vertex2d(event.imageX, event.imageY);
        const hovering = instance.hovering(vertex);
        clickStack = [hovering].concat(clickStack);
        clickStack.splice(stackLimit);
        clickEvent.trigger(hovering);
      });
      panZ.onMouseup((event) => {
        clickHolding = false;
      });
      panZ.onMousedown((event) => {
        clickHolding = true;
      });


    }

  }
}

HoverMap2d.Object = HoverObject2d;
module.exports = HoverMap2d;
