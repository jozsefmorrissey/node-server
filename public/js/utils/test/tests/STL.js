
const STL = require('../../3d-modeling/STL.js');
require('../../3d-modeling/csg');
require('../../utils');

const cube = new CSG.cube({radius: [50,50,50]});
const stl = new STL('Cube! Mother Fucker');
cube.polygons.forEach(p => stl.add.polygon(p.vertices.map(v => v.pos), p.plane.normal));
const blob = stl.binary.file();

const link = document.createElement('a');
link.innerText = 'Cube!';
link.href = URL.createObjectURL(blob);
link.download = 'cube.stl'; // Set the desired filename

document.body.append(link);
