
const Circle2d = require('./objects/circle');
const LineMeasurement2d = require('./objects/line-measurement');

class Draw2d {
  constructor(canvas) {
    const ctx = canvas.getContext('2d');

    function draw(object, color, width) {
      if (Array.isArray(object)) {
        for (let index = 0; index < object.length; index += 1)
          draw(object[index], color, width);
        return;
      }
      switch (object.constructor.name) {
        case 'Line2d':
          draw.line(object, color, width);
          break;
        case 'Circle2d':
          draw.circle(object, color, width);
          break;
        case 'Plane2d':
          draw.plane(object, color, width);
          break;
        case 'Polygon2d':
          draw.polygon(object, color, width);
          break;
        case 'Square2d':
          draw.square(object, color, width);
          break;
        default:
          console.error(`Cannot Draw '${object.constructor.name}'`);
      }
    }

    draw.canvas = () => canvas;
    draw.ctx = () => ctx;
    draw.beginPath = () => ctx.beginPath();
    draw.moveTo = () => ctx.moveTo();

    draw.clear = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    draw.line = (line, color, width, doNotMeasure) => {
      if (line === undefined) return;
      color = color ||  'black';
      width = width || 10;
      // draw.circle(new Circle2d(.2, line.startVertex(), null, null, .2));
      // draw.circle(new Circle2d(.2, line.endVertex(), null, null, .2));
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.moveTo(line.startVertex().x(), line.startVertex().y());
      ctx.lineTo(line.endVertex().x(), line.endVertex().y());
      ctx.stroke();
      if (!doNotMeasure)draw.measurement(line, 1);
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
      width = width || .1;
      poly.lines().forEach((line) => draw.line(line, color, width));
    }

    draw.square = (square, color) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.fillStyle = color;

      const center = square.center();
      ctx.translate(center.x(), center.y());
      ctx.rotate(square.radians());
      ctx.rect(square.offsetX(true), square.offsetY(true), square.width(), square.height());
      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'black';
      ctx.fillStyle =  'black';
      const lc = square.leftCenter();
      const fc = square.frontLeft();
      ctx.fillText('HEllo o my gooooooood nesss', 0, square.height() / 4, square.width());
      ctx.stroke()

      ctx.restore();
    }

    draw.circle = (circle, lineColor, fillColor, lineWidth) => {
      const center = circle.center();
      ctx.beginPath();
      ctx.lineWidth = lineWidth || 2;
      ctx.strokeStyle = lineColor || 'black';
      ctx.fillStyle = fillColor || 'white';
      ctx.arc(center.x(),center.y(), circle.radius(),0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
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
      ctx.translate(midpoint.x(), midpoint.y());
      ctx.rotate(line.radians());
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.strokeStyle = 'white';
      ctx.rect((textLength * -3)/14, -4/15, (textLength * 6)/14, 8/15);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.font = "1px Arial";
      ctx.lineWidth = .2;
      ctx.strokeStyle = 'black';
      ctx.fillStyle =  'black';
      ctx.fillText(length, 0, 0);
      ctx.stroke()
      ctx.restore();
    }

    draw.measurement = (line, level) => {
      const center = line.startVertex();
      const measurementColor = 'grey';
      const measurementLineWidth = '.1';
      const measurement = new LineMeasurement2d(line)
      const lines = measurement.I(level);
      try {
        const winner = lines.outer;
        draw.beginPath();
        draw.line(winner.startLine, measurementColor, measurementLineWidth, true);
        draw.line(winner.endLine, measurementColor, measurementLineWidth, true);
        draw.line(winner, measurementColor, measurementLineWidth, true);
        drawMeasurementLabel(winner, measurement);
        return line;
      } catch (e) {
        console.error('Measurement render error:', e);
      }
    }

    return draw;
  }
}

module.exports = Draw2d;
