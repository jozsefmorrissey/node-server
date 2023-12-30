const BiPolygon = require('../../app-src/three-d/objects/bi-polygon.js');


class PanelWW {
  constructor(center, dems, normals) {
    const current = this.current();
    const dem = current.demension;
    const center = new Vertex3D(current.center);
    const vecObj = this.normals();
    return BiPolygon.fromVectorObject(dem.x, dem.y, dem.z, center, vecObj, this.biPolyNormVector());
  }
}
