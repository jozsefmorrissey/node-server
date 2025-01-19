const Object3D = require('../object');
const {Vertex3D, Vector3D, Line3D} =
    require('../../../../../../public/js/utils/canvas/three-d/lib');
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

    this.height = assembly.length;
    this.width = assembly.width;
    this.thickness = assembly.thickness;
    this.name = (value) =>
      '' + (assembly.name(value) || assembly.groupIndex());
    // this.snap2d.top = () => topSnap;
    this.shouldSave = () => false;

    this.rotation = (rotation) => {
      if (rotation)
        assembly.position().setRotation(rotation);
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
          searchLine2d.translate(new Line2d(searchLine2d[0].copy(), topCenter.copy()));
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

    function applyTopOutline(modelInfo) {
      const initialize = topSnap === undefined;
      const poly = modelInfo.unioned.silhouette.to2D();
      if (initialize) {
        topSnap = new SnapPolygon(instance.bridge.top(), poly.copy(), 10);
        instance.snap2d.top = () => topSnap;
      } else {
        topSnap.polyCopy(poly);
      }
    }

    const error = (error) => {
      console.error(error);
    }

    function updateOutline(force) {
      if (force || assembly.hash()) {
        new Jobs.CSG.Assembly(assembly).then(applyTopOutline, error).queue();
      }
    }
    function outlineNeedsUpdated (force) {
      updateOutline.lastCall(instance.id(), 50, force);
    }
    assembly.on.change(outlineNeedsUpdated);
    outlineNeedsUpdated(true);
  }
}

Assembly3D.build = (assembly, layout) => {
  if (assembly instanceof Assembly) return new Assembly3D(assembly, layout);
}

Object3D.register(Assembly3D);

module.exports = Assembly3D;
