
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Stairs extends SimpleModel {
  constructor(layout, group) {
    super(layout, group);
    Object.getSet(this, {count: 2, treadLength: 10*2.54});
    this.width(37*2.54);
    this.height(20*2.54);
    this.color('#9aacb6');
    this.thickness = () => this.treadLength() * this.count();
  }
}

module.exports = Stairs;


// http://localhost:3000/canvas-buddy/html/index.html?input=inch&output=inch&2D=[(0,0),(0,17),(21,17),(21,0)]:[(9.75,8.5),(21,8.5)]:[(10.5,8.5),(10.5,17)]:[(-19.5,11.5),(40.5,11.5),(40.5,5.5),(-19.5,5.5)]@-39::[(9.75,7.75),(21,7.75)]:[(9.75,7.75),(9.75,16.25)]::[(20.25,0),(20.25,7.75)]:[(0,16.25),(10.5,16.25)]::&measurements=[(51.435,0),(41.223,0)]:[(51.435,0),(51.435,11.341)]:[(41.223,0),(41.131,19.685)]:[(24.765,19.685),(0,19.685)]:[(14.469,41.275),(0,41.275)]:[(0,33.382),(0,41.275)]:[(51.435,0),(0,41.275)]:[(24.765,19.685),(51.435,19.685)]:[(41.223,0),(0,33.382)]:[(51.435,0),(24.765,19.685)]:[(0,41.275),(24.765,19.685)]:[(24.765,19.685),(21.656,15.845)]
