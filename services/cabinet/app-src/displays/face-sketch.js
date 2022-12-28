
const du = require('../../../../public/js/utils/dom-utils.js');
const Draw2D = require('../two-d/draw.js');
const Line2d = require('../two-d/objects/line.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const PanZoom = require('../two-d/pan-zoom.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const LineMeasurement2d = require('../two-d/objects/line-measurement.js');


class FaceSketch {
  constructor(clazz) {
    clazz ||= 'front-sketch';
    function draw(event, model) {
      if (model === undefined) return;
      let centerOn = new Vertex2d({x:0, y:0});
      console.log(model);
    }

    ThreeDModel.onRenderObjectUpdate(draw);
  }
}

module.exports = FaceSketch;
