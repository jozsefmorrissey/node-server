const SnapLocation2d = require('../../../../../public/js/utils/canvas/two-d/objects/snap-location.js');
const Snap2d = require('../../../../../public/js/utils/canvas/two-d/objects/snap.js');
const LineMeasurement2d = require('../../../../../public/js/utils/canvas/two-d/objects/line-measurement');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Circle2d = require('../../../../../public/js/utils/canvas/two-d/objects/circle.js');
const LayoutHoverMap = require('../../services/layout-hover-map.js');
const Draw = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const Layout2D = require('../../two-d/layout/layout.js');



class DrawLayout extends Draw {
  constructor(canvasOselector, layout, invertY) {
    super(canvasOselector, invertY);
    const parent = this;
    let hoverMap, panz;

    const updateHoverMap = () => {
      if (layout && panz) hoverMap = new LayoutHoverMap(layout, panz);
    }

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

    draw.hoverMap = () => hoverMap;
    draw.layout = (l) => {
      if (l instanceof Layout2D) {
        layout = l;
        updateHoverMap();
      }
      return layout;
    }
    draw.panz = (pz) => {
      if (pz instanceof Window) {
        panz = pz;
        updateHoverMap();
      }
      return panz;
    }


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
      const wallStartPoint = wall.startVertex().point();
      const points = window.endpoints2D(wallStartPoint);
      const lookupKey = window.toString();
      const ctx = draw.ctx();
      ctx.moveTo(points.start.x(), points.start.y());
      ctx.lineWidth = 8;
      ctx.strokeStyle = color;
      ctx.lineTo(points.end.x(), points.end.y());
      ctx.stroke();
    }

    function doorDrawingFunc(startpointLeft, startpointRight) {
      return (door) => {
        const ctx = draw.ctx();
        ctx.beginPath();
        ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'black';
        const hinge = door.hinge();

        if (hinge === 4) {
          ctx.moveTo(startpointLeft.x(), startpointLeft.y());
          ctx.lineWidth = 8;
          ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'white';
          ctx.lineTo(startpointRight.x(), startpointRight.y());
          ctx.stroke();
        } else {
          const offset = Math.PI * hinge / 2;
          const initialAngle = (door.wall().radians() + offset) % (2 * Math.PI);
          const endAngle = initialAngle + (Math.PI / 2);

          if (hinge === 0 || hinge === 3) {
            ctx.moveTo(startpointRight.x(), startpointRight.y());
            ctx.arc(startpointRight.x(), startpointRight.y(), door.width(), initialAngle, endAngle, false);
            ctx.lineTo(startpointRight.x(), startpointRight.y());
          } else {
            ctx.moveTo(startpointLeft.x(), startpointLeft.y());
            ctx.arc(startpointLeft.x(), startpointLeft.y(), door.width(), endAngle, initialAngle, true);
            ctx.lineTo(startpointLeft.x(), startpointLeft.y());
          }

          ctx.fillStyle = 'white';
          ctx.fill();
        }
        ctx.stroke();
      }
    }

    draw.door = (door, color, width) => {
      const wall = window.wall();
      const wallStartPoint = wall.startVertex().point();
      const initialAngle = wall.radians();

      const distLeft = door.fromPreviousWall() +  door.width();
      const startpointLeft = {x: startpoint.x + distLeft * Math.cos(theta), y: startpoint.y + distLeft * Math.sin(theta)};
      const distRight = door.fromPreviousWall();
      const startpointRight = {x: startpoint.x + distRight * Math.cos(theta), y: startpoint.y + distRight * Math.sin(theta)};
      doorDrawingFunc(door.startVertex(), door.endVertex(), initialAngle);
    }

    const blank = 40;
    const hblank = blank/2;
    function drawMeasurementValue(line, midpoint, measurement) {
      if (line === undefined) return;
      const ctx = draw.ctx();
      midpoint = line.midpoint();

      ctx.save();
      ctx.lineWidth = 0;
      const length = measurement.display();
      const textLength = length.length;
      ctx.translate(midpoint.x(), midpoint.y());
      ctx.rotate(line.radians());
      ctx.beginPath();
      ctx.fillStyle = hoverId() === measurement.toString() ? 'green' : "white";
      ctx.strokeStyle = 'white';
      ctx.rect(textLength * -3, -8, textLength * 6, 16);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'black';
      ctx.fillStyle =  'black';
      ctx.fillText(length, 0, 0);
      ctx.stroke()
      ctx.restore();
    }

    const measurementLineMap = {};
    const getMeasurementLine = (vertex1, vertex2) => {
      const lookupKey = `${vertex1} => ${vertex2}`;
      if (measurementLineMap[lookupKey] === undefined) {
        const line = new Line2d(vertex1, vertex2);
        measurementLineMap[lookupKey] = new LineMeasurement2d(line)
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
      measurmentMap.clear();
      for (let index = 0; index < values.length; index += 1) {
        let m = values[index];
        measurmentMap.add(m.line, 10, m.measurement);
        drawMeasurementValue(m.line, m.midpoint, m.measurement);
      }
    }

    const hovering = () => hoverMap && hoverMap.hovering();
    const hoverId = () => hovering() && hovering().toString();
    const isHovering = (object) => hoverId() === object.toString();

    const measurementLineWidth = 3;
    let measurementIs = {};
    function drawMeasurement(measurement, level, focalVertex)  {
      const lookupKey = `${measurement.toString()}-[${level}]`;
      // if (measurementIs[lookupKey] === undefined) {
        measurementIs[lookupKey] = measurement.I(level);
      // }
      const lines = measurementIs[lookupKey];
      const center = draw.layout().vertices(focalVertex, 2, 3);
      const isHov = isHovering(measurement);
      const measurementColor = isHov ? 'green' : 'grey';
      try {
        draw.beginPath();
        const isWithin = draw.layout().within(lines.furtherLine().midpoint());
        const line = isWithin ? lines.closerLine() : lines.furtherLine();
        const midpoint = Vertex2d.center(line.startLine.endVertex(), line.endLine.endVertex());
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
      for (let index = 0; index < list.length; index += 1) {
        let item = list[index];
        const wall = item.wall();
        const points = item.endpoints2D();
        const measureLine1 = getMeasurementLine(wall.startVertex(), points.start);
        const measureLine2 = getMeasurementLine(points.end, wall.endVertex());
        measureLine1.modificationFunction(item.fromPreviousWall);
        measureLine2.modificationFunction(item.fromNextWall);
        drawMeasurement(measureLine1, level, wall.startVertex())
        drawMeasurement(measureLine2, level, wall.startVertex())
        level += 4;
      }
      return level;
    }

    // function includeDetails() {
    //   return !dragging && (popupOpen)
    // }

    draw.wall = (wall, color, width) => {
      if (wall.endVertex().isFree()) color = 'red';
      if (isHovering(wall)) color = 'green';
      draw.line(wall, color, 4);
      const startpoint = wall.startVertex().point();
      const endpoint = wall.endVertex().point();

      wall.doors().forEach((door) =>
        drawDoor(startpoint, door, wall.radians()));
      wall.windows().forEach((window) =>
        drawWindow(startpoint, window, wall.radians()));

      let level = 8;
      // if (includeDetails()) {
      //   const vertices = wall.vertices();
      //   let measLines = {};
      //   level = measureOnWall(wall.doors(), level);
      //   level = measureOnWall(wall.windows(), level);
      // }
      const measurement = new LineMeasurement2d(wall, undefined, undefined, draw.layout().reconsileLength(wall));
      drawMeasurement(measurement, level, wall.startVertex());

      return endpoint;
    }

    function drawAngle(vertex) {
      const text = Math.round(vertex.angle() * 10) / 10;
      const bisector = vertex.bisector(30);
      const sv = bisector.startVertex();
      const ev = bisector.endVertex();
      const point = sv.distance(vertex) < ev.distance(vertex) ? ev : sv;
      const radians = bisector.perpendicular().radians();
      draw.text(text, point, {radians, size: 5});
    }

    function vertexColor(vertex) {
      const hoverin = hovering();
      if (hoverin && hoverin.constructor.name === 'Wall2D') {
          if (hoverin.startVertex().toString() === vertex.toString()) return 'blue';
          if (hoverin.endVertex().toString() === vertex.toString()) return 'yellow';
      }
      return isHovering(vertex) ? 'green' : 'white';
    }

    function drawVertex(vertex, color, width) {
      const fillColor = color || vertexColor(vertex);
      const p = vertex.point();
      const radius = isHovering(vertex) ? 6 : 4;
      const circle = new Circle2d(radius, p);
      draw.circle(circle, 'black', fillColor);
      if (draw.layout().objects().length === 0 || vertex.showAngle) drawAngle(vertex);
    }
    draw.corner = drawVertex;

    function drawObjects(objects, defaultColor, dontDrawSnapLocs) {
      defaultColor ||= 'black';
      let target;
      objects.forEach((obj) => {
        const color = hovering(obj.snap2d.top()) ? 'green' : defaultColor;
        draw(obj.snap2d.top(), color, 3);
        if (!dontDrawSnapLocs) {
          obj.snap2d.top().snapLocations().forEach((snapLoc, i) => {
            const beingHovered = hoverId() === snapLoc.toString();
            const identfied = Snap2d.identfied(snapLoc);
            const snapColor = identfied ? 'red' : (beingHovered ? 'green' :
            (snapLoc.courting() ? 'white' : (snapLoc.pairedWith() ? 'black' : undefined)));
            const hasPartner = snapLoc.courting() || snapLoc.pairedWith();
            const radius = identfied ? 6 : (beingHovered || hasPartner ? 4 : 1.5);
            if (!beingHovered) draw(snapLoc, snapColor, radius);
            else target = {radius, color: snapColor};
          });
        }
      });
      if (target) draw(hovering(), target.color, target.radius);
    }

    const drawMeasurements = () => {
      const color = 'black';
      const width = .2;
      draw(hoverMap.measurements());

      const objs = hoverMap.targets();
      const filter = obj => obj === hoverMap.hovered()  || obj === hoverMap.lastClicked() ? 'highlight' : 'normal';
      const split = objs.filterSplit(filter, 'highlight', 'normal');

      for (let index = 0; index < split.highlight.length; index++) {
        const obj = split.highlight[index];
        draw(obj, 'blue', width * 4 );
      }
      for (let index = 0; index < split.normal.length; index++) {
        const obj = split.normal[index];
        draw(obj, color, width);
      }
    }

    let lastHash;
    const drawLayout = () => {
      if (hoverMap && hoverMap.measurements.enabled()) return drawMeasurements();
      const layout = draw.layout();
      if (layout === undefined) return;
      const hash = layout.hash();
      if (hoverMap && hash !== lastHash) hoverMap.update();
      lastHash = hash;
      SnapLocation2d.clear();

      draw.beginPath();
      const walls = layout.walls();
      let wl = walls.length;
      walls.forEach((wall, index) => draw.wall(wall));
      walls.forEach(wall => drawVertex(wall.startVertex()));
      // drawMeasurementValues();

      let objects = layout.level();
      let allObjects = layout.objects();
      drawObjects(allObjects, '#85858ebd', true);
      drawObjects(objects);
    }

    return draw;
  }
}

module.exports = DrawLayout;
