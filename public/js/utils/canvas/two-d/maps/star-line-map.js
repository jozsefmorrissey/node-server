
const Vertex2d = require('../objects/vertex');
const Line2d = require('../objects/line');
const ExtremeSector = require('./star-sectors/extreme');



class StarLineMap {
  constructor(type, sectorCount, center) {
    type = type.toLowerCase();
    let sectors;
    let compiled;
    const lines = [];
    const instance = this;
    sectorCount ||= 1000;

    this.center = () => center ||= Vertex2d.center(...Line2d.vertices(lines));

    function getSector(t) {
      const args = Array.from(arguments).slice(1);
      t ||= type;
      switch (t) {
        case 'extreme':
          return new ExtremeSector(...args);
        default:
          throw new Error(`Unknown sector type '${t}'`);
      }
    }

    function buildSectors(type, center, count) {
      count ||= sectorCount;
      sectors = [];
      center ||= instance.center();
      const thetaDiff = 2*Math.PI / count;
      for (let index = 0; index < count; index++) {
        const sector = getSector(type, center, thetaDiff * (index));
        sectors.push(sector);
        for (let sIndex = 0; sIndex < lines.length; sIndex++) {
          sector.add(lines[sIndex]);
        }
      }
    }

    this.isSupported = (obj) => obj instanceof Line2d;

    this.add = (obj) => {
      if (!this.isSupported(obj)) throw new Error(`obj of type ${obj.constructor.name} is not supported`);
      lines.push(obj);
    }

    this.addAll = (lines) => {
      for(let index = 0; index < lines.length; index++)this.add(lines[index]);
    }

    this.filter = (type, center, count) => {
      buildSectors(type, center, count);
      const extremes = {};
      for (let index = 0; index < sectors.length; index++) {
        sectors[index].filter(extremes);
      }
      return Object.values(extremes);
    }

    this.sectorLines = () => buildSectors() || sectors.map((s) => s.line());
    this.toDrawString = (sectorCount) => {
      buildSectors(null, sectorCount || 24);
      const center = this.center();
      let str = `//center ${center.approxToString()}`;
      str += '\n//lines\n' + Line2d.toDrawString(lines, 'black');
      str += '\n\n//Sectors\n';
      sectors.forEach(s => str += s.toDrawString(String.nextColor()));
      return str;
    }
  }
}


module.exports = StarLineMap;
