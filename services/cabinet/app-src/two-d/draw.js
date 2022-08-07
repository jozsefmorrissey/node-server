

class Draw2D {
  constructor(canvas) {
    const ctx = canvas.getContext('2d');

    this.canvas = () => canvas;
    this.ctx = () => ctx;
    this.beginPath = () => ctx.beginPath();
    this.moveTo = () => ctx.moveTo();

    this.line = (line, color, width) => {
      if (line === undefined) return;
      color = color ||  'black';
      width = width || 10;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.moveTo(line.startVertex().x(), line.startVertex().y());
      ctx.lineTo(line.endVertex().x(), line.endVertex().y());
      ctx.stroke();
    }

    this.square = (square, color) => {
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

    this.circle = (circle, lineColor, fillColor, lineWidth) => {
      const center = circle.center();
      ctx.beginPath();
      ctx.lineWidth = lineWidth || 2;
      ctx.strokeStyle = lineColor || 'black';
      ctx.fillStyle = fillColor || 'white';
      ctx.arc(center.x(),center.y(), circle.radius(),0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
    }
  }
}

module.exports = Draw2D;
