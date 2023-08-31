
const du = require('../../../../dom-utils.js');
const $t = require('../../../../$t.js');

const defaultValues = {
  LAYOUT_INTERIOR_ONLY: true,
  SNAPS: true,
  WALLS: true,
  MATCH_WALL_ANGLE: true,
  FIXED_ANGLE: false,
  TOLERANCE: .1,
  CORNERS: true,
  SIZE_ADJUST_PERCENT: 50,
  RESIZE: true,
}

class AutoLocationProperties {
  constructor(id, initialValues) {
    const ivs = initialValues;
    this.update = (values) => {
      if (!(values instanceof Object)) return;
      const update = (name) => values[name] !== undefined  && (this[name] = values[name]);
      update('LAYOUT_INTERIOR_ONLY');
      update('SNAPS');
      update('WALLS');
      update('MATCH_WALL_ANGLE');
      update('FIXED_ANGLE');
      update('TOLERANCE');
      update('SIZE_ADJUST_PERCENT');
      update('CORNERS');
    }
    this.id = () => id;
    this.isDefault = () => byId[id] === undefined;
    this.update(byId.undefined);
    this.update(initialValues);

    this.equals = (other) => {
      if (!(other instanceof AutoLocationProperties)) return false;
      const attrs = Object.keys(this).filter(key => key.match(/^[A-Z_]*$/));
      for (let index = 0; index < attrs.length; index++) {
        const key = attrs[index];
        if (this[key] !== other[key]) return false;
      }
      return true;
    }
  }
}

const byId = {};
byId.undefined = new AutoLocationProperties(null, defaultValues);
AutoLocationProperties.get = (id) => {
    if (byId[id] !== undefined) {
      if (byId.undefined.equals(byId[id])) {
        AutoLocationProperties.remove(id);
      }
    }
    return byId[id] || new AutoLocationProperties(id, byId.undefined);
}
AutoLocationProperties.set = (id) => {
  if (id) {
    if (byId[id] === undefined) byId[id] = new AutoLocationProperties(id);
    return byId[id];
  }
}
AutoLocationProperties.remove = (id) => {id && delete byId[id];}

const template = new $t('2d/auto-location-properties');
AutoLocationProperties.render = (id) => {
  return template.render(AutoLocationProperties.get(id));
}

const chevDisplay = (elem, hidden) => {
  if (hidden) du.class.add(elem, 'hidden');
  else du.class.remove(elem, 'hidden')

}

du.on.match('click', '.auto-location-properties-cnt .dropdown-toggle', (elem) => {
  const dropdown = du.find.down('.plain-dropdown', elem.parentElement);
  const downChev = du.find.closest('.down', elem);
  const rightChev = du.find.closest('.right', elem);
  dropdown.hidden = !dropdown.hidden;
  chevDisplay(downChev, dropdown.hidden);
  chevDisplay(rightChev, !dropdown.hidden);
});


du.on.match('change', '.auto-location-properties-cnt input', (elem) => {
  const cnt = du.find.up('.auto-location-properties-cnt', elem);
  const values = du.input.valueObject(cnt);
  const alps = AutoLocationProperties.set(values.id);
  alps.update(values);
  const defaultReset = du.find.closest('.default-reset', cnt);
  defaultReset.parentElement.hidden = alps.equals(byId.undefined);
});

du.on.match('click', '.auto-location-properties-cnt .default-reset', (elem) => {
  const id = du.find.closest('[name="id"]', elem).value;
  AutoLocationProperties.remove(id);
  const cnt = du.find.up('.auto-location-properties-cnt', elem);
  cnt.innerHTML = AutoLocationProperties.render(id);
});

du.on.match('click', '.auto-location-properties-cnt .apply-to-defualt', (elem) => {
  const cnt = du.find.up('.auto-location-properties-cnt', elem);
  const values = du.input.valueObject(cnt);
  byId.undefined.update(values);
  const defaultReset = du.find.closest('.default-reset', cnt);
  defaultReset.parentElement.hidden = true;
});
module.exports = AutoLocationProperties;
