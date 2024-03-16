
const Properties = require('../properties');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const IMPERIAL_US = Measurement.units()[1];

class PropertyConfig {
  constructor(props) {
    Object.getSet(this);
    props = props || Properties.instance();
    let style = props.style || PropertyConfig.lastStyle;
    let styleName = props.styleName || PropertyConfig.lastStyleName ||
                    Object.keys(Properties.groupList(style))[0];
    if (styleName)
      props[style] = Properties.getSet(style, styleName);

    function isReveal() {return style === 'Reveal';}
    function isInset() {return style === 'Inset';}
    function isOverlay() {return !isReveal() && !isInset();}
    function overlay() {return props['Overlay'].ov.value()}
    function reveal() {return props['Reveal']};
    function wallHeight() {return props['baseh'] + props['basewallgap']}

    function cabinetStyles() {
      return ['Overlay', 'Inset', 'Reveal'];
    }
    function cabinetStyle() {
      return style;
    }
    function cabinetStyleName() {
      return styleName;
    }

    function set(group, name) {
      if (cabinetStyles().indexOf(group) !== -1) {
        style = group;
        styleName = name;
      } else {
        const newSet = Properties.getSet(group, name);
        newSet.__KEY = name;
        if (newSet === undefined) throw new Error(`Attempting to switch '${group}' to unknown property set '${name}'`);
        props[group] = newSet;
      }
    }

    const panelThicknessRegMetric = /^pwt([0-9]{1,})([0-9][0-9])$/;
    const panelThicknessRegImperial = /^pwt([0-9])([0-9])$/;
    const resolvePanelThickness = (code) => {
      let match = code.match(panelThicknessRegImperial);
      if (match) return new Measurement(match[1]/match[2], IMPERIAL_US).value();
      match = code.match(panelThicknessRegMetric);
      if (match) return new Measurement(`${match[1]}.${match[2]}`).value();
      return undefined;
    }

    const outerCodeReg = /^(rrv|lrv|brv|trv)$/;
    const resolveOuterReveal = (code, props) => {
      if (!code.match(outerCodeReg)) return undefined;
      switch (code) {
        case 'rrv':
          return 0.3175
        case 'lrv':
          return 0.3175
        case 'brv':
          return 0.3175
        case 'trv':
          return 0.3175
        default:
          return 0.3175
      }
    }

    const resolveStyleStatus = (code) => {
      switch (code) {
        case 'isReveal': return isReveal();
        case 'isInset': return isInset();
        case 'isOverlay': return isOverlay();
      }
    }

    const resolveReveals = (code, props) => {
      switch (code) {
        case 'frorl': return new Measurement(1/8, IMPERIAL_US).value();
        case 'frorr': return new Measurement(1/8, IMPERIAL_US).value();
        case 'r': if (isInset()) return 0;
          if (isReveal()) return new Measurement(props.Reveal.r.value()).value();
          return new Measurement(props.Cabinet.frw.value() - 2 * props.Overlay.ov.value()).value();
        default: return resolveCostProps(code, props);
      }
    }

    const resolveComplexProps = (code, props) => {
      if (code === undefined) return undefined;
      let value = resolvePanelThickness(code, props);
      if (value !== undefined) return value;
      value = resolveOuterReveal(code, props);
      if (value !== undefined) return value;
      value = resolveStyleStatus(code);
      // if (value !== undefined) return value;
      // value = resolveReveals(code, props);
      return value;
    }

    const resolveProps = (code, props) => {
      if (code === undefined) return props;
      if (props[code] !== undefined) return props[code].value();
      const complexResolved = resolveComplexProps(code, props);
      if (complexResolved !== undefined) return complexResolved;
    }

    const excludeKeys = ['_ID', '_NAME', '_GROUP', 'properties'];
    function getProperties(clazz, code) {
      if (clazz === undefined) return props;
      clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
      const classProps = props[clazz] || {};
      if (props[clazz]) {
        let val = resolveProps(code, props[clazz]);
        if (val !== undefined) return val;
      }
      let val = resolveProps(code, Properties(clazz));
      if (val !== undefined) return val;
    }

    function toJson() {
      const json = {style, styleName};
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
    getProperties.overlay = overlay;
    getProperties.reveal = reveal;
    getProperties.toJson = toJson;
    getProperties.cabinetStyles = cabinetStyles;
    getProperties.cabinetStyle = cabinetStyle;
    getProperties.cabinetStyleName = cabinetStyleName;
    getProperties.set = set;

    return getProperties;
  }
}

PropertyConfig.lastStyle = 'Overlay';

PropertyConfig.fromJson = (json) => {
  const propConfig = {style: json.style, styleName: json.styleName};
  const keys = Object.keys(json).filter((key) => key.match(/^[A-Z]/));
  keys.forEach((key) => {
    const propKeys = Object.keys(json[key]);
    propConfig[key] = {};
    propKeys.forEach((propKey) =>
                propConfig[key][json[key][propKey].code] = Object.fromJson(json[key][propKey]));
  });
  return new PropertyConfig(propConfig);
}

module.exports = PropertyConfig;
