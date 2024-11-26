
const colorShifts = [0,5,10,15]
function encodeColor(color) {
  if (color === undefined) return 0;
  const values = [(Math.floor(color[0] * 32)), (Math.floor(color[1] * 32)), (Math.floor(color[2] * 32)), 1];
  return values.sum((v,i) => (v << colorShifts[i]));
}

function extractColor(encoding) {
  return colorShifts.map((s,i) => i === 3 ? encoding % 2 : ((encoding >> s) % 32)/32);
}

class STL {
  constructor(header) {
    let _header;
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

    this.header = (header) => header !== undefined ? (_header = header.slice(0,80)) : _header;
    this.header(header);
    // TODO: make add imutable
    this.add = {};
    this.add.triangle = (v1, v2, v3, normal, colorPercent) =>
          validateXYZ(v1,v2,v3,normal) &&
          triangles.push({vertices: copyAllXYZ(v1,v2,v3), normal, color: colorPercent});
    this.add.polygon = (vertices, normal, colorPercent) => {
      vertices = vertices.map(v=>v);
      while (vertices.length > 2) {
        this.add.triangle(vertices[0],vertices[1],vertices[2], normal, colorPercent);
        vertices.splice(1,1);
      }
    }
    this.toJson = () => {
      const json = {header};
      json.triangles = triangles.map(t => {
        const json = {normal: copyXYZ(t.normal)};
        if (t.color) json.color = t.color.slice(0,3);
        json.vertices = t.vertices.map(v => copyXYZ(v));
        return json;
      });
      return json;
    }
    this.binary = () => {
      const byteLength = STL.binaryLength(triangles.length);
      const buffer = new ArrayBuffer(byteLength);
      const view = new DataView(buffer);
      let bPos = 0;

      if (header) header.split('').forEach((c,i) => view.setUint8(i, c.charCodeAt(0)));

      bPos = 80;
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
        view.setUint16(bPos, encodeColor(t.color), true); bPos += 2;
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
    this.url = () => {
      return URL.createObjectURL(this.binary.file());
    }
  }
}

STL.fromCSG = (csg, header) => {
  const stl = new STL(header);
  const scaled = csg.clone();
  scaled.scale(10);
  scaled.polygons.forEach(p => stl.add.polygon(p.vertices.map(v => v.pos), p.plane.normal));
  return stl;
}

STL.binaryLength = (length) => 80+4+50*length;

const viewVertex = (view, i) => {
  const x = view.getFloat32(i, true);
  const y = view.getFloat32(i + 4, true);
  const z = view.getFloat32(i + 8, true);
  return {x, y, z};
}

STL.fromArrayBuffer = (arrayBuffer, header) => {
  const view = new DataView(arrayBuffer);
  const length = view.getUint32(80, true);
  const expectedLength = STL.binaryLength(length);
  if (expectedLength < 1 || arrayBuffer.length < expectedLength)
    throw new Error(`Data is corrupt or invalid\n\tExpecting a bufferLength of at least ${expectedLength}`);
  header ||= Array.fill(80, (i) => (charCode = view.getUint8(i)) ?
                                  String.fromCharCode(charCode) : '').join('')
  const stl = new STL(header);
  for (let i = 84; i < expectedLength - 1;) {
    const normal = viewVertex(view, i);
    const v1 = viewVertex(view, i+=12);
    const v2 = viewVertex(view, i+=12);
    const v3 = viewVertex(view, i+=12);
    const color = extractColor(view.getUint16(i += 12, true));
    stl.add.triangle(v1, v2, v3, normal, color);
    i+=2;
  }

  return stl;
}

STL.fromFiles = async (files) => {
  const stls = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    try {
      stls.push(STL.fromArrayBuffer(await file.arrayBuffer(), file.name));
    } catch (e) {
      e.name = file.name;
      stls.push(e);
    }
  }

  return stls;
}

module.exports = STL;
