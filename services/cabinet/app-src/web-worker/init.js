
require('../../../../public/js/utils/utils.js');
require('../objects/assembly/init-assem.js');
require('../objects/joint/init.js');
require('../config/properties.js');
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../three-d/objects/polygon.js');


const cabinet = Cabinet.build('base');
CabinetLayouts.map['test'].build(cabinet);
const cabinetClone = Cabinet.fromJson(cabinet.toJson());

const model = cabinetClone.toModel();
console.log(Polygon3D.toDrawString(model, 'blue'));
