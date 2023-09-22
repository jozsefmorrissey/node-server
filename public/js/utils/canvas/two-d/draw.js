
const Circle2d = require('./objects/circle');
const Line2d = require('./objects/line');
const Vertex2d = require('./objects/vertex');
const ToleranceMap = require('../../tolerance-map.js');
const du = require('../../dom-utils.js');
const tol = .1;
let vertLocTolMap;

class Draw2d {
  constructor(canvasOselector, invertY) {
    const yCoef = invertY ? -1 : 1;
    let takenLocations;
    let coloredLocations;

    function canvas() {
      if (typeof canvasOid === 'string') return du.find(canvasOselector);
      return canvasOselector;
    }
    const ctx = () => canvas().getContext('2d');

    function draw(object, color, width) {
      if (object === undefined) return;
      if (Array.isArray(object)) {
        takenLocations = [];
        vertLocTolMap = new ToleranceMap({x: tol, y: tol});
        for (let index = 0; index < object.length; index += 1)
          draw(object[index], color, width);
        return;
      }

      if (object instanceof Vertex2d) draw.vertex(object, color, width);
      else if (object instanceof Line2d) draw.line(object, color, width);
      else if (object instanceof Circle2d) draw.circle(object, color, width);
      else {
        let constructorId = object.constructor.name;
        if (constructorId !== 'SnapLocation2d')
          constructorId = constructorId.replace(/^(Snap).*$/, '$1');

        switch (constructorId) {
          case 'Plane2d':
          draw.plane(object, color, width);
          break;
          case 'Polygon2d':
          draw.polygon(object, color, width);
          break;
          case 'Square2d':
          draw.square(object, color, width);
          break;
          case 'LineMeasurement2d':
          draw.measurement(object, color, width);
          break;
          case 'Snap':
          draw.snap(object, color, width);
          break;
          case 'SnapLocation2d':
          draw.snapLocation(object, color, width);
          break;
          default:
          console.error(`Cannot Draw '${object.constructor.name}'`);
        }
      }
    }

    draw.canvas = canvas;
    draw.ctx = ctx;
    draw.beginPath = () => ctx().beginPath();
    draw.moveTo = () => ctx().moveTo();

    draw.clear = () => {
      ctx().save();
      ctx().setTransform(1, 0, 0, 1, 0, 0);
      ctx().clearRect(0, 0, canvas().width, canvas().height);
      ctx().restore();
    }
    const colors = [
      'indianred', 'gray', 'fuchsia', 'lime', 'black', 'lightsalmon', 'red',
      'maroon', 'yellow', 'olive', 'lightcoral', 'green', 'aqua', 'white',
      'teal', 'darksalmon', 'blue', 'navy', 'salmon', 'silver', 'purple'
    ];
    let colorIndex = 0;

    let rMultiplier = 1;
    function identifyVertices(line) {
      vertLocTolMap.add(line.startVertex());
      vertLocTolMap.add(line.endVertex());
      const svHits = vertLocTolMap.matches(line.startVertex()).length;
      const evHits = vertLocTolMap.matches(line.endVertex()).length;
      const svRadius = Math.pow(.5,  1 + ((svHits - 1) * .75));
      const evRadius = Math.pow(.5,  1 + ((evHits - 1) * .75));

      const vertId = 13*(line.startVertex().x() + line.endVertex().x() + 13*(line.startVertex().y() + line.endVertex().y()));
      const ccolor = colors[Math.floor(line.length() + vertId) % colors.length];

      draw.circle(new Circle2d(svRadius * rMultiplier, line.startVertex()), null, ccolor, .01);
      draw.circle(new Circle2d(evRadius * rMultiplier, line.endVertex()), null, ccolor, .01);
    }

    const midpointFlag = (point, radians) => {
      ctx().moveTo(point.x(), yCoef * point.y());
      const ev = Line2d.startAndTheta(point, radians, 15).endVertex();
      ctx().lineTo(ev.x(), yCoef * ev.y());
    }
    function midpointFlags(line) {
      midpointFlag(line.midpoint(), Math.toRadians(line.degrees() - 135));
      midpointFlag(line.midpoint(), Math.toRadians(line.degrees() + 135));
    }

    draw.vertex = (vertex, color, width) => {
      draw.circle(new Circle2d(2, vertex), color, width);
    }

    draw.line = (line, color, width, indicateDirection) => {
      if (line === undefined) return;
      color = color ||  'black';
      width = width || 10;
      ctx().beginPath();
      ctx().strokeStyle = color;
      ctx().lineWidth = width;
      ctx().moveTo(line.startVertex().x(), yCoef * line.startVertex().y());
      ctx().lineTo(line.endVertex().x(), yCoef * line.endVertex().y());
      if (Draw2d.debug.showFlags) midpointFlags(line);
      ctx().stroke();
      // identifyVertices(line);

      if (indicateDirection) {
        const chevLine = line.copy();
        chevLine.length(width * 5);
        draw.chevron(line.midpoint(), chevLine, color, width/2);
      }
    }

    // point is the tip of the chevron
    // line is the direction the chevron points allong with length of legs
    // angle is the angle between legs
    draw.chevron = (point, line, color, width, angle) => {
      color = color ||  'black';
      width = width || 10;
      let rads = Number.isFinite(angle) ? Math.toRadians(angle)/2 : 2.5;
      const leg1 = line.copy();
      leg1.rotate(rads);
      leg1.translate(new Line2d(leg1.startVertex(), point));
      const leg2 = line.copy();
      leg2.rotate(-rads);
      leg2.translate(new Line2d(leg2.startVertex(), point));
      draw.line(leg1, color, width);
      draw.line(leg2, color, width);
    }

    draw.plane = (plane, color, width) => {
      if (plane === undefined) return;
      color = color ||  'black';
      width = width || .1;
      plane.getLines().forEach((line) => draw.line(line, color, width));
    }

    draw.polygon = (poly, color, width) => {
      if (poly === undefined) return;
      color = color ||  'black';
      width = width || 1;
      poly.center();
      poly.lines().forEach((line) => draw.line(line, color, width));
      // if ((typeof poly.getTextInfo) === 'function') {
      //   ctx().save();
      //   const info = poly.getTextInfo();
      //   ctx().translate(info.center.x(), yCoef * info.center.y());
      //   ctx().rotate(info.radians);
      //   ctx().beginPath();
      //   ctx().lineWidth = 4;
      //   ctx().strokeStyle = color;
      //   ctx().fillStyle =  color;
      //   const text = info.limit === undefined ? info.text : (info.text || '').substring(0, info.limit);
      //   ctx().fillText(text, info.x, yCoef * info.y, info.maxWidth);
      //   ctx().stroke()
      //   ctx().restore();
      // }
    }

    draw.square = (square, color, text) => {
      ctx().save();
      ctx().beginPath();
      ctx().lineWidth = 2;
      ctx().strokeStyle = 'black';
      ctx().fillStyle = color;

      const center = square.center();
      ctx().translate(center.x(), yCoef * center.y());
      ctx().rotate(square.radians());
      ctx().rect(square.offsetX(true), square.offsetY(true), square.width(), square.height());
      ctx().stroke();
      ctx().fill();

      if (text) {
        ctx().beginPath();
        ctx().lineWidth = 4;
        ctx().strokeStyle = 'black';
        ctx().fillStyle =  'black';
        ctx().fillText(text, 0, square.height() / 4, square.width());
        ctx().stroke()
      }

      ctx().restore();
    }

    draw.circle = (circle, lineColor, fillColor, lineWidth) => {
      const center = circle.center();
      ctx().beginPath();
      ctx().lineWidth = Number.isFinite(lineWidth) ? lineWidth : 2;
      ctx().strokeStyle = lineColor || 'black';
      ctx().fillStyle = fillColor || 'white';
      ctx().arc(center.x(),yCoef * center.y(), circle.radius(),0, 2*Math.PI);
      ctx().stroke();
      ctx().fill();
    }

    draw.text = (text, point, props) => {
      props ||= {};
      point = new Vertex2d(point);
      text = '' + text;
      const ctx = draw.ctx();

      ctx.save();
      ctx.lineWidth = 0;
      const textLength = text.length;
      ctx.translate(point.x(), yCoef * point.y());
      let radians = props.radians || 0;
      if (yCoef === -1) radians += Math.PI/2;
      ctx.rotate(props.radians);
      ctx.beginPath();
      ctx.fillStyle = props.fillColor || "white";
      ctx.strokeStyle = props.fillColor || 'white';
      ctx.rect((textLength * -3)/14, -4/15, (textLength * 6)/14, 8/15);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.font = `${props.size || '3px'} ${props.font || 'Arial'}`;
      ctx.lineWidth = .2;
      ctx.strokeStyle = props.color || 'black';
      ctx.fillStyle =  props.color || 'black';
      ctx.fillText(text, props.x || 0, yCoef * (props.y || 0), props.maxWidth);
      ctx.stroke()
      ctx.restore();
    }

    const blank = 4;
    const hblank = blank/2;
    function drawMeasurementLabel(line, measurement) {
      if (measurement === undefined) return;
      const ctx = draw.ctx();
      const midpoint = line.midpoint();

      ctx.save();
      ctx.lineWidth = 0;
      const length = measurement.display();
      const textLength = length.length;
      ctx.translate(midpoint.x(), yCoef * midpoint.y());
      ctx.rotate(line.radians());
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.strokeStyle = 'white';
      ctx.rect((textLength * -3)/14, -4/15, (textLength * 6)/14, 8/15);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.font = '3px Arial';//(Math.abs((Math.log(Math.floor(line.length() * 10)))) || .1) + "px Arial";
      ctx.lineWidth = .2;
      ctx.strokeStyle = 'black';
      ctx.fillStyle =  'black';
      ctx.fillText(length, 0, 0);
      ctx.stroke()
      ctx.restore();
    }

    draw.measurement = (measurement, color, textWidth) => {
      const measurementColor = color || 'grey';
      const measurementLineWidth = '.1';
      const lines = measurement.I(1, takenLocations);
      try {
        const winner = lines.midpointClear();
        if (winner === undefined) return;
        draw.beginPath();
        draw.line(winner.startLine, measurementColor, measurementLineWidth, true);
        draw.line(winner.endLine, measurementColor, measurementLineWidth, true);
        draw.line(winner, measurementColor, measurementLineWidth, true);
        drawMeasurementLabel(winner, measurement);
      } catch (e) {
        console.error('Measurement render error:', e);
      }
    }

    function snapLocColor(snapLoc) {
      const locIdentifier = snapLoc.location().replace(/(.{1,}?)[0-9]{1,}(.*)/, '$1$2');
      switch (locIdentifier) {
        case "right": return 'red';
        case "rightcenter": return 'pink';
        case "left": return '#b57edc';
        case "leftcenter": return 'lavender';
        case "back": return 'gray';
        case "backcenter": return 'yellow';
        default: return "grey"
      }
    }

    draw.snapLocation = (location, color, radius) => {
      location.center();
      const c = snapLocColor(location);
      draw.circle(location.circle(radius), 'black', c);
    }

    draw.snap = (snap, color, width) => {
      draw(snap.object(), color, width);
      const textInfo = snap.getTextInfo();
      textInfo.color = color || textInfo.color;
      draw.text(textInfo.text.substring(0,10), textInfo.center, textInfo);
      if (Draw2d.debug.showNormals) draw(snap.object().normals());
    }

    return draw;
  }
}

Draw2d.debug = {};
module.exports = Draw2d;
