
const Polygon3D = require('../../../../../../services/cabinet/app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../../services/cabinet/app-src/three-d/objects/vector.js');
const Parimeters = require('../maps/parimeters.js');
const Polygon2d = require('../objects/polygon');
const Line2d = require('../objects/line');
const Vertex2d = require('../objects/vertex');
const Line3D = require('../../../../../../services/cabinet/app-src/three-d/objects/line.js')

const defaultNormals = {front: new Vector3D(0,0,1), right: new Vector3D(1,0,0), top: new Vector3D(0,-1,0)};
const defaultNormArr = [defaultNormals.front, defaultNormals.top, defaultNormals.right];
class ThreeView {
  constructor(polygons, normals, gap) {
    gap ||= 10;
    normals ||= defaultNormals;
    Polygon3D.merge(polygons);

    this.normals = {};
    this.normals.front = () => normals.front;
    this.normals.right = () => normals.right;
    this.normals.top = () => normals.top;

    const frontView = Polygon3D.viewFromVector(polygons, normals.front);
    const rightView = Polygon3D.viewFromVector(polygons, normals.right);
    const topview = Polygon3D.viewFromVector(polygons, normals.top);

    const axis = {};
    axis.front = ['x', 'y'];
    axis.right = ['z', 'y'];
    axis.top = ['x', 'z'];

    const to2D = (mi) => (p) => p.to2D(mi[0],mi[1]);
    const front2D = frontView.map(to2D(axis.front));
    const right2D = rightView.map(to2D(axis.right));
    const top2D = topview.map(to2D(axis.top));

    Polygon2d.centerOn({x:0,y:0}, front2D);

    const frontMinMax = Polygon2d.minMax(...front2D);
    const rightMinMax = Polygon2d.minMax(...right2D);
    const topMinMax = Polygon2d.minMax(...top2D);
    const rightCenterOffset = (frontMinMax.max.x() + gap + (rightMinMax.max.x() - rightMinMax.min.x())/2);
    const topCenterOffset = -(frontMinMax.max.y() + gap + (topMinMax.max.y() - topMinMax.min.y())/2);

    Polygon2d.centerOn({x:rightCenterOffset, y:0}, right2D);
    Polygon2d.centerOn({x:0,y:topCenterOffset}, top2D);

    const front = Polygon2d.lines(front2D);
    const right = Polygon2d.lines(right2D);
    const top = Polygon2d.lines(top2D);
    const threeView = front.concat(right).concat(top);
    // Vertex2d.scale(1, -1, Line2d.vertices(top));

    let parimeter;
    this.parimeter = () => {
      if (!parimeter) {
        parimeter = {};
        parimeter.front = new Parimeters(this.front(), true).largest();
        parimeter.right = new Parimeters(this.right(), true).largest();
        parimeter.top = new Parimeters(this.top(), true).largest();
        parimeter.front.ensureClockWise();
        parimeter.right.ensureClockWise();
        parimeter.top.ensureClockWise();

      }
      return {
        front: parimeter.front,
        right: parimeter.right,
        top: parimeter.top,
        threeView: parimeter.front.lines().concat(parimeter.right.lines().concat(parimeter.top.lines()))
      };
    }

    this.all = () => {
      let parimeter = this.parimeter();
      return {parimeter, front, right, top, threeView, axis, normals};
    }

    this.axis = () => axis;
    this.front = () => front.map(l => l.copy());
    this.right = () => right.map(l => l.copy());
    this.top = () => top.map(l => l.copy());
    this.toDrawString = () => {
      let str = '';
      str += '//Front\n' + Line2d.toDrawString(front);
      str += '\n//Right\n' + Line2d.toDrawString(right);
      str += '\n//Top\n' + Line2d.toDrawString(top);
      return str;
    }
  }
}

module.exports = ThreeView;
