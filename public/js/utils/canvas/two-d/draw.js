
const Circle2d = require('./objects/circle');
const Line2d = require('./objects/line');
const Vertex2d = require('./objects/vertex');
const Polygon2d = require('./objects/polygon');
const Parimeters2d = require('./maps/parimeters');
const Vector3D = require('../../../../../services/cabinet/app-src/three-d/objects/vector.js');
const Layer = require('../../../../../services/cabinet/app-src/three-d/objects/layer.js');
const ToleranceMap = require('../../tolerance-map.js');
const du = require('../../dom-utils.js');

const tol = .1;
let vertLocTolMap;

class Draw2d {
  constructor(canvasOselector) {
    let ctx, takenLocations, coloredLocations;

    let canvas = canvasOselector;
    function CANVAS() {
      if (typeof canvasOselector === 'string') canvas = du.find(canvasOselector);
      return canvas;
    }

    const CTX = () => ctx ? ctx : (ctx = canvas.getContext('2d'));

    function draw(object, color, width) {
      if (object === undefined) return;
      if (object instanceof CSG) return draw.csg(object, color, width);
      const func = cxtrFuncMap[object.constructor.name] ||
                      cxtrFuncMap[object.constructor.name.replace(/^(Snap).*$/, '$1')];
      if (func) func(object, color, width);
      else console.error(`Cannot Draw '${object.constructor.name}'`);
    }

    draw.toDataURL = () => CANVAS().toDataURL();

    let scale = {x: 1, y: 1};
    draw.scale = (x, y) => {
      if (x) {
        y ||= x;
        CTX().scale(1/scale.x, 1/scale.y);
        CTX().scale(x,y);
        scale = {x, y};
      }
      return scale;
    }
    draw.width = () => canvas.width/scale.x;
    draw.height = () => canvas.height/scale.y;

    const topLeft = {x: 0, y: 0};
    draw.topLeft = () => ({x: topLeft.x/scale.x, y: topLeft.y/scale.y});
    draw.center = (center) => {
      CANVAS();
      const tl = draw.topLeft();
      const x = (2*tl.x + draw.width())/2;
      const y = (2*tl.y + draw.height())/2;
      const currentCenter = {x,y};
      if (!center) return currentCenter;
      const trans = {x: currentCenter.x - center.x,
                      y: currentCenter.y - center.y};
      draw.translate(trans.x, trans.y);
      return draw.center();
    }

    draw.position = (center, demensions) => {
      const scale = Math.min(draw.width()/demensions.x, draw.height()/demensions.y)*.98;
      draw.scale(scale, scale);
      draw.center(center);
    }

    draw.translate = (x, y) => {
      CTX().translate(x,y);
      topLeft.x -= x*scale.x; topLeft.y -= y*scale.y;
    }

    draw.corners = () => {
      const tl = draw.topLeft();
      const minX = tl.x;
      const minY = tl.y;
      const maxX = tl.x + draw.width();
      const maxY = tl.y + draw.height();
      return [{x: minX, y: minY}, {x: minX, y: maxY},
              {x: maxX, y: maxY}, {x: maxX, y: minY}]
    }

    draw.beginPath = () => CTX().beginPath();
    draw.moveTo = (...args) => CTX().moveTo(...args);

    draw.clear = () => {
      const ctx = CTX();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, CANVAS().width, CANVAS().height);
      ctx.restore();
    }
    const colors = [
      'indianred', 'gray', 'fuchsia', 'lime', 'black', 'lightsalmon', 'red',
      'maroon', 'yellow', 'olive', 'lightcoral', 'green', 'aqua', 'white',
      'teal', 'darksalmon', 'blue', 'navy', 'salmon', 'silver', 'purple'
    ];
    let colorIndex = 0;

    let rMultiplier = 1;
    function identifyVertices(line) {
      vertLocTolMap.add(line[0]);
      vertLocTolMap.add(line[1]);
      const svHits = vertLocTolMap.matches(line[0]).length;
      const evHits = vertLocTolMap.matches(line[1]).length;
      const svRadius = Math.pow(.5,  1 + ((svHits - 1) * .75));
      const evRadius = Math.pow(.5,  1 + ((evHits - 1) * .75));

      const vertId = 13*(line$1 + line[1].x + 13*(line[0].y + line[1].y));
      const ccolor = colors[Math.floor(line.length() + vertId) % colors.length];

      draw.circle(new Circle2d(svRadius * rMultiplier, line[0]), null, ccolor, .01);
      draw.circle(new Circle2d(evRadius * rMultiplier, line[1]), null, ccolor, .01);
    }

    const midpointFlag = (point, radians) => {
      CTX().moveTo(point.x, point.y);
      const ev = Line2d.startAndTheta(point, radians, 15)[1];
      CTX().lineTo(ev.x, ev.y);
    }

    draw.object = (obj, color, width) => {
      draw.vertex(obj, color, width);
    }
    draw.array = (obj, color, width) => {
      if (obj.length === 0) return;
      takenLocations = [];
      vertLocTolMap = new ToleranceMap({x: tol, y: tol});
      for (let index = 0; index < obj.length; index += 1)
        draw(obj[index], color, width);
    }

    draw.vertex = (vertex, color, width) => {
      draw.circle(new Circle2d(width || 1, vertex), color, width);
    }

    draw.line = (line, color, width, indicateDirection) => {
      line = new Line2d(line);
      if (line === undefined) return;
      if (indicateDirection === undefined) indicateDirection = line.indicateDirection;
      color = color ||  'black';
      width = width || 10;
      const ctx = CTX();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      const sv = line[0]; const ev = line[1];
      ctx.moveTo(sv.x, sv.y);
      ctx.lineTo(ev.x, ev.y);
      ctx.stroke();
      // identifyVertices(line);

      if (indicateDirection) {
        const chevLine = line.copy();
        chevLine.length(width * 5);
        const midPoint = Math.midrange([sv, ev], ['x', 'y'])
        draw.chevron(midPoint, chevLine, color, width/2);
      }
    }

    // point is the tip of the chevron
    // line is the direction the chevron points allong with length of legs
    // angle is the angle between legs
    draw.chevron = (point, line, color, width, angle) => {
      line = new Line2d(line[0], line[1]);
      color = color ||  'black';
      width = width || 10;
      let rads = Number.isFinite(angle) ? Math.toRadians(angle)/2 : 2.5;
      const leg1 = line.copy();
      leg1.rotate(rads);
      leg1.translate(new Line2d(leg1[0], point));
      const leg2 = line.copy();
      leg2.rotate(-rads);
      leg2.translate(new Line2d(leg2[0], point));
      draw.line(leg1, color, width);
      draw.line(leg2, color, width);
    }

    draw.polygon = (poly, color, width, fillColor) => {
      if (poly === undefined) return;
      color = color ||  'black';
      width = width || 1;
      let lines;
      if (Array.isArray(poly)) lines = poly.map((v,i) => [v, poly[(i+1)%poly.length]])
      else lines = poly.lines();
      const ctx = CTX();
      let region = new Path2D();
      const verts = [new Vertex2d(lines[0][0].x, lines[0][0].y)];
      region.moveTo(lines[0][0].x, lines[0][0].y);
      lines.slice(0).forEach(l => region.lineTo(l[1].x, l[1].y));
      lines.slice(0).forEach(l => verts.push(new Vertex2d(l[1].x, l[1].y)));
      region.closePath();
      ctx.lineWidth = width;
      ctx.stroke(region);
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill(region, 'evenodd');
      }
    }

    draw.layer = (layer, color, width, fillColor) => {
      if (Math.roundTo(layer.normal().dot(Vector3D.k), .00001) === 0) return;
      let objs;
      const polys = layer.polygons();
      if (layer.polygons().length === 1) objs = polys;
      else {
        const lines = layer.to2D();
        objs = new Parimeters2d(lines, false).polygons();
      }
      objs.forEach(p => draw.polygon(p, null, 1, 'white'));
    }

    draw.csg = (csg, color, width, fillColor) => {
      const layers = Layer.fromCSG(csg);
      layers.sort((a,b) => a.center().z - b.center().z);
      for (let index = 0; index < layers.length; index++) {
        const layer = layers[index];
        if (Math.roundTo(layer.normal().dot(Vector3D.k), .00001) !== 0) {
          let objs;
          const polys = layer.polygons();
          if (layer.polygons().length === 1) objs = polys;
          else {
            const lines = layer.to2D();
            objs = new Parimeters2d(lines, false).polygons();
          }
          objs.forEach(p => draw.polygon(p, null, .1, 'white'));
        }
      }
      // const slices = csg.slice(.03, 'x', 'y');
      // const ctx = CTX();
      // slices.forEach(slice =>
      //   slice.polygons.forEach(p => draw.polygon(p, null, .1, 'white')));
    }

    draw.square = (square, color, text) => {
      const ctx = CTX();
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.fillStyle = color;

      const center = square.center();
      ctx.translate(center.x, center.y);
      ctx.rotate(square.radians());
      ctx.rect(square.offsetX(true), square.offsetY(true), square.width(), square.height());
      ctx.stroke();
      ctx.fill();

      if (!CANVAS().simple && text) {
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.fillStyle =  'black';
        ctx.fillText(text, 0, square.height() / 4, square.width());
        ctx.stroke()
      }

      ctx.restore();
    }

    draw.circle = (circle, lineColor, lineWidth, fillColor) => {
      const center = circle.center();
      const ctx = CTX();
      ctx.beginPath();
      ctx.lineWidth = Number.isFinite(lineWidth) ? lineWidth : 2;
      ctx.strokeStyle = lineColor || 'black';
      ctx.fillStyle = fillColor || 'white';
      ctx.arc(center.x, center.y, circle.radius(),0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
    }

    function measureText(text) {
      const mt = CTX().measureText(text);
      return {
        width: mt.width,
        height: mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent,
        outerWidth: mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight,
        outerHeight: mt.fontBoundingBoxAscent + mt.fontBoundingBoxDescent
      }
    }
    draw.measureText = measureText;

    function getLocationPoint(textSize, point, props) {
      point = new Vertex2d(point).clone();
      if ((typeof props.location) === 'string') {
        const loc = props.location.toLowerCase();
        const xOffsetLine = new Line2d([[0,0], [textSize.outerWidth/2, 0]]).rotate(props.radians);
        const yOffsetLine = new Line2d([[0,0], [0,textSize.outerHeight/2]]).rotate(props.radians);
        if (loc.indexOf('right') !== -1) point.translate(xOffsetLine.run(), xOffsetLine.rise());
        else if (loc.indexOf('left') !== -1) point.translate(-xOffsetLine.run(), -xOffsetLine.rise());
        if (loc.indexOf('top') !== -1) point.translate(-yOffsetLine.run(), -yOffsetLine.rise());
        else if (loc.indexOf('bottom') !== -1) point.translate(yOffsetLine.run(), yOffsetLine.rise());
      };
      return point;
    }

    draw.text = (text, point, props) => {
      if (text === undefined) return;
      props ||= {};
      text = '' + text;
      const ctx = CTX();

      ctx.save();
      ctx.lineWidth = 0;
      const textLength = text.length;
      const textOffset = new Vertex2d(textLength * 6, 6);
      let radians = props.radians || 0;

      ctx.beginPath();
      ctx.font = `${props.size || '12px'} ${props.font || 'Arial'}`;
      ctx.lineWidth = .2;
      const textSize = measureText(text);
      point = getLocationPoint(textSize, point, props);
      ctx.translate(point.x, point.y);
      ctx.rotate(props.radians);
      if (props.fillColor) {
        ctx.fillStyle = props.fillColor || "white";
        ctx.strokeStyle = props.fillColor || 'white';
        const box = {x: textSize.outerWidth, y: textSize.outerHeight*1.1};
        ctx.fillRect(box.x/-2, box.y/-2, box.x, box.y);
      }
      ctx.strokeStyle = props.color || 'black';
      ctx.fillStyle =  props.color || 'black';

      const mirrorX = props.mirror && (props.mirror.x || props.mirror === 'x');
      const mirrorY = props.mirror && (props.mirror.y || props.mirror === 'y');
      if (mirrorX && mirrorY) ctx.scale(-1,-1);
      else if (mirrorX) ctx.scale(1, -1);
      else if (mirrorY) ctx.scale(-1, 1);

      // TODO: Cant figure out why satic drawings require this but panz drawings do not.
      if (draw.staticOffset) ctx.fillText(text, textSize.width/-2, textSize.height/2, props.maxWidth);
      else ctx.fillText(text, 0, 0, props.maxWidth);
      ctx.stroke()
      ctx.restore();
    }

    const blank = 4;
    const hblank = blank/2;
    function drawMeasurementLabel(line, measurement) {
      if (measurement === undefined) return;
      const ctx = CTX();
      const midpoint = line.midpoint();
      const radians = line.radians();

      draw.text(measurement.display(), midpoint, {radians})
    }

    draw.measurement = (measurement, color, textWidth) => {
      const measurementColor = color || 'grey';
      const measurementLineWidth = '.1';
      try {
        const lines = measurement.I(1, takenLocations);
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

    draw.measurement.angle = (angle, color, textWidth) => {
      const bisector = angle.bisector(2.54*20);
      const labelPoint = bisector[1];
      draw.text(angle.degrees() + String.fromCharCode(248), labelPoint);
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
      draw.circle(location.circle(radius), 'black', 1, c);
    }

    draw.snap = (snap, color, width) => {
      draw(snap.object(), color, width);
      const textInfo = snap.getTextInfo();
      textInfo.color = color || textInfo.color;
      draw.text(textInfo.text.substring(0,10), textInfo.center, textInfo);
      if (Draw2d.debug.showNormals || CANVAS().simple) draw(snap.object().normals());
    }

    const cxtrFuncMap = { Object: draw.object, Array: draw.array,
      Vertex2d: draw.vertex, Line2d: draw.line, Circle2d: draw.circle, Corner: draw.vertex,
      Polygon2d: draw.polygon, Square2d: draw.square, LineMeasurement2d: draw.measurement,
      Snap: draw.snap, SnapLocation2d: draw.snapLocation, Layer: draw.layer,
      AngleMeasurement2d: draw.measurement.angle
    }

    return draw;
  }
}

Draw2d.debug = {};
module.exports = Draw2d;
