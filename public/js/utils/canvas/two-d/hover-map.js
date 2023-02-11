
const Line2d = require('./objects/line')
class HoverMap2d {
  constructor(lineOrVertex, tolerance) {
    tolerance ||= 2;
    const toleranceFunction = (typeof tolerance) === 'function';
    const targetFunction = (typeof lineOrVertex) === 'function';
    function getTolerence() {
      if (toleranceFunction) return tolerance();
      return tolerance;
    }
    function vertexHovered(targetVertex, hoverVertex) {
      return targetVertex.distance(hoverVertex) < getTolerence();
    }

    function lineHovered(targetLine, hoverVertex) {
      const tol = getTolerence();
      const hv = hoverVertex;
      const sv = targetLine.startVertex();
      const ev = targetLine.endVertex();
      if (targetLine.isVertical()) {
        return Math.abs(sv.x() - hv.x()) < tol &&
              ((sv.y() > hv.y() && ev.y() < hv.y()) ||
              (sv.y() < hv.y() && ev.y() > hv.y()));
      } else if (targetLine.isHorizontal()) {
        return Math.abs(sv.y() - hv.y()) < tol &&
              ((sv.x() > hv.x() && ev.x() < hv.x()) ||
              (sv.x() < hv.x() && ev.x() > hv.x()));
      } else if (Math.abs(sv.y() - ev.y()) < Math.abs(sv.x() - ev.x())) {
        const yValue = targetLine.y(hv.x());
        return yValue + tol > hv.y() && yValue - tol < hv.y();
      } else {
        const xValue = targetLine.x(hv.y());
        return xValue + tol > hv.x() && xValue - tol < hv.x();
      }
    }

    this.target = () => lineOrVertex;

    this.hovering = (hoverVertex) => {
      const lov = targetFunction ? lineOrVertex() : lineOrVertex;
      if (lov instanceof Line2d)
        return lineHovered(lov, hoverVertex);
      return vertexHovered(lov, hoverVertex);
    }
  }
}

module.exports = HoverMap2d;
