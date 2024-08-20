
class STL {
  constructor(header) {
    let _header = header;
    const triangles = [];
    const throwXYZError = () => {throw new Error('Invalid XYZ object all must be finite numbers')};
    const validateXYZ = (...objs) => {
      for (let index = 0; index < objs.length; index++) {
        const obj = objs[index];
        if (!Number.isFinite(obj.x)) throwXYZError();
        if (!Number.isFinite(obj.y)) throwXYZError();
        if (!Number.isFinite(obj.z)) throwXYZError();
      }
      return true;
    }
    const copyXYZ = (obj) => ({x: obj.x,y: obj.y,z: obj.z});
    const copyAllXYZ = (...vs) => vs.map(v => copyXYZ(v));
    const XYZstr = (obj) => `${obj.x} ${obj.y} ${obj.z}`

    this.header = (header) => header !== undefined ? (_header = header) : header;
    // TODO: make add imutable
    this.add = {};
    this.add.triangle = (v1, v2, v3, normal) =>
      validateXYZ(v1,v2,v3,normal) && triangles.push({vertices: copyAllXYZ(v1,v2,v3), normal});
    this.add.polygon = (vertices, normal) => {
      vertices = vertices.map(v=>v);
      while (vertices.length > 2) {
        this.add.triangle(vertices[0],vertices[1],vertices[2], normal);
        vertices.splice(1,1);
      }
    }
    this.toJson = () => {
      const json = {header};
      json.triangles = triangles.map(t => {
        const json = {normal: copyXYZ(t.normal)};
        json.vertices = t.vertices.map(v => copyXYZ(v));
        return json;
      });
      return json;
    }
    this.binary = () => {
      const byteLength = 320 + 4 + 50 * triangles.length;
      const buffer = new ArrayBuffer(byteLength);
      const view = new DataView(buffer);
      let bPos = 0;

      bPos += 80;
      view.setUint32(bPos, triangles.length, true);
      bPos += 4;
      triangles.forEach(t => {
        view.setFloat32(bPos, t.normal.x, true); bPos += 4;
        view.setFloat32(bPos, t.normal.y, true); bPos += 4;
        view.setFloat32(bPos, t.normal.z, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[0].x, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[0].y, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[0].z, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[1].x, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[1].y, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[1].z, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[2].x, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[2].y, true); bPos += 4;
        view.setFloat32(bPos, t.vertices[2].z, true); bPos += 4;
        view.setUint16(bPos, 0, true); bPos += 2;
      });

      console.log(view.toByteString());
      return buffer;
    }
    this.binary.file = () => {
      const blob = new Blob([this.binary()], { type: 'application/octet-stream' }); // Set the MIME type to binary
      return blob;
    }
    this.ascii = () => {
      return `solid ${header}
${triangles.map(t =>
`  facet normal ${XYZstr(t.normal)}
    outer loop
      vertex ${XYZstr(t.vertices[0])}
      vertex ${XYZstr(t.vertices[1])}
      vertex ${XYZstr(t.vertices[2])}
    endloop
  endfacet`).join('\n')}
endsolid ${header}`
    }
  }
}

module.exports = STL;
