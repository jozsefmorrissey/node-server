const Object3D = require('../object');
const Vertex3D = require('../../objects/vertex.js');
const Vector3D = require('../../objects/vector.js');
const Line3D = require('../../objects/line.js');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Assembly = require('../../../objects/assembly/assembly.js');
const SnapPolygon = require('../../../../../../public/js/utils/canvas/two-d/objects/snap/polygon.js');
const Canvas = require('../../../displays/canvas.js');
const Jobs = require('../../../../web-worker/external/jobs.js');

class Assembly3D extends Object3D {
  constructor(assembly, layout) {
    super(layout);
    const instance = this;
    let topSnap;
    this.assembly = () => assembly;
    this.center = (vertex3D) => {
      const position = assembly.position();
      if (vertex3D instanceof Vertex3D) {
        position.setCenter('x', vertex3D.x);
        position.setCenter('y', vertex3D.y);
        position.setCenter('z', vertex3D.z);
      }
      return new Vertex3D(position.center());
    }

    const buildOnChange = (func) => (...args) => {
      const curr = func();
      if (args.length === 0) return curr;
      const newVal = func(...args);
      if (newVal !== curr) Canvas.build(assembly);
      return newVal;
    }
    this.height = buildOnChange(assembly.length);
    this.width = buildOnChange(assembly.width);
    this.thickness = buildOnChange(assembly.thickness);
    this.name = assembly.name;
    // this.snap2d.top = () => topSnap;
    this.shouldSave = () => false;

    this.rotation = (rotation) => {
      if (rotation) assembly.position().setRotation(rotation);
      return assembly.position().rotation();
    }


    function configurePoly(poly, twoDInfo) {
      if (assembly.faceNormals instanceof Function) {
        const normals = assembly.faceNormals();
        const lines = poly.lines();
        const topCenter = Vertex2d.center(Line2d.vertices(lines));
        const dist = Math.max(assembly.width(), assembly.thickness());

        const normalLines = normals.map((n) => {
          const searchLine = Line3D.startAndVector(instance.center().copy(), n.scale(dist));
          const veiwFromVect = Line3D.viewFromVector([searchLine], new Vector3D(twoDInfo.normals.top).inverse())[0];
          const searchLine2d = veiwFromVect.to2D(twoDInfo.axis.top[0], twoDInfo.axis.top[1]);
          searchLine2d.translate(new Line2d(searchLine2d.startVertex().copy(), topCenter.copy()));
          return searchLine2d;
        });
        const faceIndecies = normalLines.map((normalLine) => {
          for (let index = 0; index < lines.length; index++) {
            if (lines[index].findSegmentIntersection(normalLine, true))
              return index;
          }
        });
        poly.faceIndecies(faceIndecies);
      }

      return poly;
    }

    layout.applyCount ||= 0;
    layout.polys ||= [];
    function applyTopOutline(modelInfo) {
      const twoDInfo = modelInfo.threeView(assembly.id());
      if (!twoDInfo) return;
      const initialize = topSnap === undefined;
      const poly = configurePoly(twoDInfo.parimeter.top, twoDInfo);
      layout.polys.push(poly);
      if (initialize) {
        topSnap = new SnapPolygon(instance.bridge.top(), twoDInfo.parimeter.top.copy(), 10);
        instance.snap2d.top = () => topSnap;
        layout.applyCount++;
      } else {
        if (topSnap.object().vertices().length === poly.vertices().length) {
          topSnap.polyCopy(poly);
        }
      }
    }

    const error = (error) => {
      console.error(error);
    }

    function updateOutline() {
      new Jobs.CSG.Cabinet.To2D([assembly]).then(applyTopOutline, error).queue();
    }

    assembly.on.change(updateOutline);
  }
}

Assembly3D.build = (assembly, layout) => {
  if (assembly instanceof Assembly) return new Assembly3D(assembly, layout);
}

Object3D.register(Assembly3D);

module.exports = Assembly3D;
