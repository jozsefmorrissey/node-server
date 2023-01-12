
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Vertex2d = require('../objects/vertex.js');
const SnapPolygon = require('../objects/snap/polygon');
const SnapSquare = require('../objects/snap/square');

class Object2d extends Lookup {
  constructor(center, layout, payload, name, polygon) {
    super(undefined, undefined, true);
    center = new Vertex2d(center);
    let payloadId;
    this.layout = () => layout;
    Object.getSet(this, {name, center}, 'payloadId');
    this.payload = () => {
      if (payload === undefined) payload = Lookup.get(this.payloadId());
      return payload;
    };

    // Ids should only be equal if one object was built using the other as a replacement
    this.equals = (obj) => this.id() === obj.id();

    this.payloadId = (pId) => {
      if ((typeof pId) === 'string') payloadId = pId;
      if (!payload) return payloadId;
      if (payload.ID_ATTRIBUTE) return payload[payload.ID_ATTRIBUTE()]();
      return (typeof payload.id) === 'function' ? payload.id() : payload.id;
    }

    this.name = (val) => {
      if (val) name = val;
      if (this.payload() === undefined) return name;
      if ((typeof this.payload().name) === 'function') return this.payload().name(val);
      return this.payload.name;
    }

    let topview;
    if (polygon) topview = new SnapPolygon(this, polygon, 10);
    // else topview = new SnapSquare(this, 30);

    // TODO: If more views are imolemented center function will not be sufficient.
    this.center = () => topview.object().center();
    this.topview = () => topview;

    if ((typeof name) === 'function') this.name = name;
    this.toString = () => `Object2d: ${center}`;
  }
}

new Object2d();
module.exports = Object2d;
