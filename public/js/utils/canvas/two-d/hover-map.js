
const Line2d = require('./objects/line');
const Vertex2d = require('./objects/vertex');
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
      return vertexHovered(lov, hoverVertex);
    }
  }
}

class HoverMap2d {
  constructor(panZ) {
    let hoverObjects = [];
    let instance = this;

    this.clear = () => hoverObjects = [] || true;
    this.add = (object, tolerance, target) => {
      const hovObj = new HoverObject2d(object, tolerance, target);
      if (object instanceof Line2d) {
        hoverObjects.push(hovObj);
      } else {
        hoverObjects = [hovObj].concat(hoverObjects);
      }
    }
    this.hovering = (x, y) => {
      const vertex = x instanceof Vertex2d ? x : new Vertex2d(x, y);
      let hoveringObj = null;
      for (let index = 0; index < hoverObjects.length; index++) {
        const hoverObj = hoverObjects[index];
        const distance = hoverObj.hovering(vertex);
        if (distance) {
          const target = hoverObj.target();
          if (hoveringObj === null || distance < hoveringObj.distance) {
            hoveringObj = {target, distance};
          }
        }
      }

      return hoveringObj && hoveringObj.target;
    }

    if (panZ) {
      const clickEvent = new CustomEvent('click');
      const hoverEvent = new CustomEvent('hover');
      const hoverOutEvent = new CustomEvent('hoverOut');
      let active = true;

      this.on = {};
      this.on.click = clickEvent.on;
      this.on.hover = hoverEvent.on;
      this.on.hoverOut = hoverOutEvent.on;
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
        const vertex = new Vertex2d(event.imageX, -1*event.imageY);
        const hovering = instance.hovering(event.imageX, -1*event.imageY);
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
        const vertex = new Vertex2d(event.imageX, -1*event.imageY);
        const hovering = instance.hovering(event.imageX, -1*event.imageY);
        clickStack = [hovering].concat(clickStack);
        clickStack.splice(stackLimit);
        clickEvent.trigger(hovering);
      });
    }

  }
}

HoverMap2d.HoverObject2d = HoverObject2d;
module.exports = HoverMap2d;
