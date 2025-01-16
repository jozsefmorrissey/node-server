
const Properties = require('../properties');
const IMPERIAL_US = Measurement.units()[1];

class PropertyConfig {
  constructor(props) {
    Object.getSet(this);
    props = props || new Properties();
    let style = props.style || PropertyConfig.lastStyle;
    let _frameStyle = 'Frameless';
    let _frameWidth = 1.5*2.54;

    function isReveal() {return props('style').value() === 'Reveal';}
    function isInset() {return props('style').value() === 'Inset';}
    function isOverlay() {return !isReveal() && !isInset();}
    function wallHeight() {return props('baseh').value() + props('basewallgap').value()}

    function frameStyles() {
      return ['Framless', 'Framed', 'FrameOnly'];
    }
    function frameStyle() {
      return _frameStyle;
    }
    function frameWidth() {
      return _frameWidth;
    }

    const resolveStyleStatus = (code) => {
      switch (code) {
        case 'isReveal': return isReveal();
        case 'isInset': return isInset();
        case 'isOverlay': return isOverlay();
      }
    }

    const excludeKeys = ['_ID', '_NAME', '_GROUP', 'properties'];
    function getProperties(code, value, notMetric) {
      if (code === undefined) return props;
      let val = resolveStyleStatus(code);
      if (val !== undefined) return val;
      val = props(code, value, notMetric);
      if (val !== undefined) return val;
      val = Properties.default(code);
      return val;
    }

    getProperties.value = (code, value) => {
      const prop = getProperties(code);
      return prop && prop.value ? prop.value(value) : prop;
    }
    getProperties.display = (code, dispVal) => {
      const prop = getProperties(code);
      if (dispVal) prop.value(dispVal, true);
      return prop && prop.display ? prop.display() : prop;
    }

    function toJson() {
      const json = {style};
      const keys = Object.keys(props).filter((key) => key.match(/^[A-Z]/));
      keys.forEach((key) => {
        json[key] = [];
        const propKeys = Object.keys(props[key]);
        propKeys.forEach((propKey) => {
          if (props[key][propKey] && (typeof props[key][propKey].toJson) === 'function')
            json[key].push(props[key][propKey].toJson())
        });
      });
      return json;
    }

    getProperties.wallHeight = wallHeight;
    getProperties.isReveal = isReveal;
    getProperties.isInset = isInset;
    getProperties.toJson = toJson;

    return getProperties;
  }
}

PropertyConfig.lastStyle = 'Overlay';

PropertyConfig.fromJson = (json) => {
  const propConfig = new PropertyConfig(Properties.fromJson(json));
  const keys = Object.keys(json).filter((key) => key.match(/^[A-Z]/));
  keys.forEach((key) => {
    propConfig(key, Object.fromJson(json[key]));
  });
  return propConfig;
}

module.exports = PropertyConfig;
