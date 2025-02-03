const {BiPolygon, Vertex3D, Polygon3D} = require('../../../../../public/js/utils/canvas/three-d/lib.js');

class CounterTop {
  constructor(layout) {
    let _color = 'black';
    this.color = (color) => color !== undefined ? (_color = color) : _color;

    this.csg = (groupId) => {
      if (groupId === undefined) {
        let csg = new CSG();
        const groupMap = layout.modelInformation().groupMap;
        Object.keys(groupMap).forEach(groupId => {
          csg = csg.union(this.csg(groupId));
        });
        return csg;
      }
      const layoutPolys = layout.modelInformation().groupMap[groupId].result;
      const counterTopPolys = layoutPolys.outlines.find(ps => ps[0].center().y > 30 * 2.54);
      counterTopPolys.forEach((p,i) => p.normal().equals({i:0,j:-1,k:0}) && (counterTopPolys[i] = p.reverse()))
      const regulars = counterTopPolys.map(p => p.regular()).concatElements();
      let counter = new CSG();
      const dirThickness = (p) => (p.normal().positive() ? 1 : -1) * 2.54*1.5;
      regulars.forEach(p => counter = counter.union(BiPolygon.fromPolygon(p,dirThickness(p),0).model()));
      counter.setColor(_color);

      return counter;
    }
  }
}

Object.class.register(CounterTop, 'color');

module.exports = CounterTop;
