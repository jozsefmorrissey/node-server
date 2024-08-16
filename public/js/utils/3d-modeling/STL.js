
class STL {
  constructor(header) {
    let _header = header;
    const triangles = [];
    const throwXYZError = () => {throw new Error('Invalid XYZ object all must be finite numbers')};
    const validateXYZ = (...objs) => {
      for (let index = 0; index < obj.length; index++) {
        if (!Number.isFinite(obj.x)) throwXYZError();
        if (!Number.isFinite(obj.y)) throwXYZError();
        if (!Number.isFinite(obj.z)) throwXYZError();
      }
      return true;
    }
    const copyXYZ = (obj) => ({x: obj.x,y: obj.y,z: obj.z});

    this.header = (header) => header !== undefined ? (_header = header) : header;
    this.addTriangle = (v1, v2, v3, normal) =>
      validateXYZ(v1,v2,v3,normal) && triangles.push({vertices: [v1,v2,v3], normal});
    this.toJson = () => {
      const json = {header};
      json.triangles = triangles.map(t => {
        const json = {normal: copyXYZ(t.normal)};
        json.vertices = t.vertices.map(v => copyXYZ(v));
      });
      return json;
    }
  }
}

exports.module = STL;
