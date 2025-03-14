const SnapLocation2d = require('../../../../../public/js/utils/canvas/two-d/objects/snap-location.js');
const Snap2d = require('../../../../../public/js/utils/canvas/two-d/objects/snap.js');
const LineMeasurement2d = require('../../../../../public/js/utils/canvas/two-d/objects/line-measurement');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Circle2d = require('../../../../../public/js/utils/canvas/two-d/objects/circle.js');
const Draw = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const Layout2D = require('../../two-d/layout/layout.js');



class DrawLayout extends Draw {
  constructor(canvasOselector, getLayout, staticOffset) {
    super(canvasOselector);
    const parent = this;
    let ctx;
    this.staticOffset = staticOffset;

    let canvas = canvasOselector;
    function CANVAS() {
      if (typeof canvas === 'string') canvas = du.find(canvasOselector);
      ctx = canvas.getContext('2d');
      return canvas;
    }
    const CTX = () => ctx ? ctx : (ctx = CANVAS().getContext('2d'));

    function filter (object) {
      switch (object.constructor.name) {
        case 'Window2D': return draw.window;
        case 'Door2D': return draw.door;
        case 'Wall2D': return draw.wall;
        case 'Corner2d': return draw.corner;
        case 'Layout2D': return draw.layout;
        default: return parent;
      }
    }

    function draw(object, color, width) {
      if (object === undefined) return drawLayout();
      if (Array.isArray(object)) {
        const splitArr = object.filterSplit(filter);
        for (let index = 0; index < splitArr.false.length; index++) {
          parent(splitArr.false[index], color, width);
        }
        for (let index = 0; index < splitArr.true.length; index++) {
          draw(splitArr.true[index], color, width);
        }
        return;
      }
      filter(object)(object, color, width);
    }
    draw.merge(parent);

    let getWindowColor = () => {
      switch (Math.floor(Math.random() * 4)) {
        case 0: return 'red'; case 1: return 'green';
        case 2: return 'yellow'; case 3: return 'pink';
      }
      return 'white';
    }

    draw.window = (window, color, width) => {
      draw.beginPath();
      const wall = window.wall();
      color ||= hovering() === window ? 'green' : 'black';
      const wallStartPoint = wall[0].point();
      const points = window.endpoints2D(wallStartPoint);
      const lookupKey = window.toString();
      const ctx = CTX();
      ctx.moveTo(points.start.x, points.start.y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = color;
      ctx.lineTo(points.end.x, points.end.y);
      ctx.stroke();
    }

    function linearDoor(ctx, sp, ep, door, pocket) {
      ctx.moveTo(sp.x, sp.y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = hovering() === door ? 'green' : 'white';
      ctx.lineTo(ep.x, ep.y);
      ctx.stroke();
      if (pocket) draw.line(new Line2d(sp, ep), null, 1, true);
    }

    function doorDrawingFunc(door) {
      const ctx = CTX();
      ctx.beginPath();
      ctx.strokeStyle = hovering() === door ? 'green' : 'black';
      const hinge = door.hinge();



      if (hinge === 4) linearDoor(ctx, door[0], door[1], door);
      else if (hinge === 5) linearDoor(ctx, door[0], door[1], door, true);
      else if (hinge === 6) linearDoor(ctx, door[1], door[0], door, true);
      else {
        const offset = Math.PI * hinge / 2;
        const initialAngle = (door.wall().radians() + offset) % (2 * Math.PI);
        const endAngle = initialAngle + (Math.PI / 2);

        if (hinge === 0 || hinge === 3) {
          ctx.moveTo(door[1].x, door[1].y);
          ctx.arc(door[1].x, door[1].y, door.width(), initialAngle, endAngle, false);
          ctx.lineTo(door[1].x, door[1].y);
        } else {
          ctx.moveTo(door[0].x, door[0].y);
          ctx.arc(door[0].x, door[0].y, door.width(), endAngle, initialAngle, true);
          ctx.lineTo(door[0].x, door[0].y);
        }

        ctx.fillStyle = 'white';
        ctx.fill();
      }
      ctx.stroke();
    }

    draw.door = (door, color, width) => {
      doorDrawingFunc(door);
    }

    const blank = 40;
    const hblank = blank/2;
    function drawMeasurementValue(line, midpoint, measurement) {
      if (line === undefined) return;
      if (!CPU.usage.low) {
        const hover = hovering();
        if (!hover || (hover.constructor.name !== 'Corner2d' && hover.constructor.name !== 'Wall2D'))
          return;
      }
      midpoint = line.midpoint();
      const radians = line.radians();
      const fillColor = hoverId() === measurement.toString() ? 'green' : "white";
      draw.text(measurement.display(), midpoint, {fillColor, radians})
    }

    const measurementLineMap = {};
    const getMeasurementLine = (vertex1, vertex2) => {
      const lookupKey = `${vertex1} => ${vertex2}`;
      if (measurementLineMap[lookupKey] === undefined) {
        const line = new Line2d(vertex1, vertex2);
        measurementLineMap[lookupKey] = new LineMeasurement2d(line)
        const measurement = new LineMeasurement2d(line, getLayout().center());

      }
      return measurementLineMap[lookupKey];
    }

    let measurementValues = [];
    function measurementValueToDraw(line, midpoint, measurement) {
      measurementValues.push({line, midpoint, measurement});
    }

    function drawMeasurementValues() {
      let values = measurementValues;
      measurementValues = [];
      for (let index = 0; index < values.length; index += 1) {
        let m = values[index];
        drawMeasurementValue(m.line, m.midpoint, m.measurement);
      }
    }

    const hovermap = () => getLayout().hoverMap();
    const hovering = () => hovermap().hovering();
    const hoverId = () => hovering() && hovering().toString();
    const isHovering = (object) => hoverId() === object.toString();

    const measurementLineWidth = 3;
    let measurementIs = {};
    function drawMeasurement(measurement, level, focalVertex)  {
      if (Math.abs(measurement.line().length()) < 1/64) return;
      measurement.layer(level);
      const lookupKey = `${measurement.toString()}-[${level}]`;
      // if (measurementIs[lookupKey] === undefined) {
        measurementIs[lookupKey] = measurement.I();
      // }
      const lines = measurementIs[lookupKey];
      const center = getLayout().vertices(focalVertex, 2, 3);
      const isHov = isHovering(measurement);
      const measurementColor = isHov ? 'green' : 'grey';
      try {
        draw.beginPath();
        const isWithin = getLayout().within(lines.furtherLine().midpoint());
        const line = isWithin ? lines.closerLine() : lines.furtherLine();
        const midpoint = Vertex2d.center(line.startLine[1], line.endLine[1]);
        if (isHov) {
          draw.line(line.startLine, measurementColor, measurementLineWidth);
          draw.line(line.endLine, measurementColor, measurementLineWidth);
          draw.line(line, measurementColor, measurementLineWidth);
        }
        measurementValueToDraw(line, midpoint, measurement);
        return line;
      } catch (e) {
        console.error('Measurement render error:', e);
      }
    }

    function measureOnWall(list, level) {
      const hm = hovermap();
      for (let index = 0; index < list.length; index += 1) {
        let item = list[index];
        const wall = item.wall();
        const points = item.endpoints2D();
        const measureLine1 = item.prevLine.measurement;
        const measureLine2 = item.nextLine.measurement;
        drawMeasurement(measureLine1, level, wall[0])
        drawMeasurement(measureLine2, level, wall[0])
        level += 4;
      }
      return level;
    }

    function includeDetails() {
      return getLayout().hoverMap().layoutHover();
    }

    draw.wall = (wall, color, width) => {
      if (wall[1].isFree()) color = 'red';
      const hovering = isHovering(wall);
      // if (hovering) color = 'green';
      draw.line(wall, color, hovering ? 3 : 1);
      const startpoint = wall[0].point();
      const endpoint = wall[1].point();

      wall.doors().forEach((door) => draw.door(door));
      wall.windows().forEach((window) => draw.window(window));

      let level = 8;
      if (includeDetails()) {
        const vertices = wall.vertices();
        let measLines = {};
        level = measureOnWall(wall.doors(), level);
        level = measureOnWall(wall.windows(), level);
      }
      const measurement = wall.measurment;
      measurement.layer(level);
      drawMeasurement(measurement, null, wall[0]);

      return endpoint;
    }

    function drawAngle(vertex) {
      if (!CPU.usage.low) return;
      const angle = vertex.angle();
      const text = Math.round(angle * 10) / 10;
      let bisector = vertex.bisector(30);
      if (angle > 180) {
        bisector = Line2d.startAndTheta(bisector[0], bisector.radians() - Math.PI, 30);
      }
      if (bisector) {
        const point = bisector[1];
        const radians = bisector.perpendicular().radians();
        draw.text(text, point, {radians, size: 5});
      }
    }

    function vertexColor(vertex) {
      const hoverin = hovering();
      if (hoverin && hoverin.constructor.name === 'Wall2D') {
          if (hoverin[0].toString() === vertex.toString()) return 'blue';
          if (hoverin[1].toString() === vertex.toString()) return 'yellow';
      }
      return isHovering(vertex) ? 'green' : 'white';
    }

    function drawVertex(vertex, color, width) {
      const fillColor = color || vertexColor(vertex);
      const p = vertex.point();
      const hovering = isHovering(vertex);
      const radius = hovering ? 6 : 4;
      const circle = new Circle2d(radius, p);
      draw.circle(circle, 'black', fillColor);
      if (includeDetails()) drawAngle(vertex);
    }
    draw.corner = drawVertex;

    function drawObjects(objects, defaultColor, dontDrawSnapLocs) {
      defaultColor ||= 'black';
      let target;
      let lastPosition = hovermap().lastPosition();
      let hoverin = hovering();
      const snap = hoverin instanceof Snap2d ? hoverin :
                    (hoverin instanceof SnapLocation2d ? hoverin.parent() : undefined);
      const maxDist = snap ? snap.maxRadius() * .5 : 15;
      objects.forEach((obj) => {
        const hovered = hoverin === obj.snap2d.top();
        const color =  hovered ? 'green' : defaultColor;
        draw(obj.snap2d.top(), color);
        if (!CPU.usage.low) return;
        if (!dontDrawSnapLocs) {
          obj.snap2d.top().snapLocations().forEach((snapLoc, i) => {
            const beingHovered = hoverId() === snapLoc.toString();
            const dist = snapLoc.parent().AutoLocationProperties().SNAP_DISPLAY_RADIUS;
            const withinRange = snapLoc.center().distance(lastPosition) < dist;
            const identfied = Snap2d.identfied(snapLoc);
            const snapColor = identfied ? 'red' : (beingHovered ? 'green' :
            (snapLoc.courting() ? 'white' : (snapLoc.pairedWith() ? 'black' : undefined)));
            const hasPartner = snapLoc.courting() || snapLoc.pairedWith();
            const radius = (beingHovered  ? 3 : 1.5);
            if (!beingHovered && withinRange) draw(snapLoc, snapColor, radius);
            if (beingHovered) target = {target: snapLoc, radius, color: snapColor};
          });
        }
      });
      if (target) draw(target.target, target.color, target.radius);
    }

    const drawMeasurements = () => {
      const color = 'black';
      const width = .2;
      const hoverMap = getLayout().hoverMap();
      draw(hoverMap.measurements());

      const objs = hoverMap.targets();
      const filter = obj => obj === hoverMap.hovered()  || obj === hoverMap.lastClicked() ? 'highlight' : 'normal';
      const split = objs.filterSplit(filter, 'highlight', 'normal');

      if (split.highlight) {
        for (let index = 0; index < split.highlight.length; index++) {
          const obj = split.highlight[index];
          draw(obj, 'blue', width * 4 );
        }
      }
      for (let index = 0; index < split.normal.length; index++) {
        const obj = split.normal[index];
        draw(obj, color, width);
      }
    }

    const defaultScale = .8;
    // TODO: maybe I am stupid but i cant get thiss center method to work for any scale....
    function centerAndScaleAppropriatly(layout, scale) {
      layout ||= getLayout();
      scale ||= defaultScale
      const ctx = CTX();
      ctx.save();
      const canvas = CANVAS();
      const layoutDems = layout.demensions();
      const scaledWidth = (canvas.width * scale);
      const scaledHeight = (canvas.height * scale);
      const xScale = scaledWidth / layoutDems.x;
      const yScale = scaledHeight / layoutDems.y;
      const minScale = xScale < yScale ? xScale : yScale;

      ctx.scale(minScale, minScale);

      const center = layout.center();
      const transX = (canvas.width/minScale)/2 - center.x;
      const transY = (canvas.height/minScale)/2 - center.y;
      ctx.translate(transX, transY);

    }

    draw.centerAndScaleAppropriatly = centerAndScaleAppropriatly;

    let lastHash;
    const drawLayout = () => {
      const layout = getLayout();
      if (layout === undefined) return;
      // centerAndScaleAppropriatly(layout);
      const hoverMap = layout.hoverMap();
      const hash = layout.hash();
      if (hoverMap && hash !== lastHash) hoverMap.update();
      lastHash = hash;
      SnapLocation2d.clear();

      draw.beginPath();
      const walls = layout.walls();
      let wl = walls.length;
      walls.forEach((wall, index) => draw.wall(wall));
      walls.forEach(wall => drawVertex(wall[0]));

      drawMeasurementValues();
      drawObjects(layout.objects.inactive(), '#85858ebd', true);
      drawObjects(layout.objects.active());
      // if (hoverMap.hovering())draw(hoverMap.hovering(), 'green', 20)

      CTX().restore();
    }

    return draw;
  }
}

module.exports = DrawLayout;
