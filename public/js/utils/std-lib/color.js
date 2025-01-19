
const colors = [
  'blue', 'red', 'yellow', 'lime', 'gray', 'indianred', 'fuchsia', 'black', 'lightsalmon',
  'maroon', 'olive', 'lightcoral', 'green', 'aqua', 'white',
  'teal', 'darksalmon', 'navy', 'salmon', 'silver', 'purple'
];
const colorRGBs = {indianred: [205, 92, 92],gray: [128, 128, 128],fuchsia: [255, 0, 255],
  lime: [0, 255, 0],black: [0, 0, 0],lightsalmon: [255, 160, 122],red: [255, 0, 0],
  maroon: [128, 0, 0],yellow: [255, 255, 0],olive: [128, 128, 0],lightcoral: [240, 128, 128],
  green: [0, 128, 0],aqua: [0, 255, 255],white: [255, 255, 255],teal: [0, 128, 128],
  darksalmon: [233, 150, 122],blue: [0, 0, 255],navy: [0, 0, 128],salmon: [250, 128, 114],
  silver: [192, 192, 192],purple: [128, 0, 128]
}

const colorsCodeMap = {}
colors.forEach(k => colorsCodeMap[colorRGBs[k].join(',')] = k);
let colorIndex = 0;
let distinctColorIndex = -1;
const distinct = ['red', 'yellow', 'blue', 'green', 'purple', 'black']

Color = () => colors[colorIndex % colors.length];
Color.getName = function (color) {
  if (!Array.isArray(color)) return '';
  const strKey = color.map(v => Math.round(v * 255)).join(',');
  return colorsCodeMap[strKey] || strKey;
}
Color.RGB = colorRGBs;

Color.next = (...exclude) => {
  if (!exclude) exclude = [];
  exclude.push('black');
  const filteredColors = colors.filter(c => exclude.indexOf(c) === -1)
  return filteredColors[colorIndex++ % filteredColors.length];
}

Color.distinct = () => {
  distinctColorIndex++;
  colorIndex = colors.findIndex((c) => c === distinct[distinctColorIndex % distinct.length]);
  return colors[colorIndex];
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}

function rgbToHex(rgb) {
  return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

function rgbToHSL(rgb) {
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgb;
}

function getRgb(color, deFault) {
  if (deFault === undefined) deFault = [0,0,0];
  if (Array.isArray(color)) {
    if (color[0] < 1) return color.map(v => Math.floor(v*255));
    return color;
  }
  if (color instanceof Object) return Color.hslToRgb(color) || deFault;
  if ((typeof color) === 'string')
    if (Color.RGB[color]) return Color.RGB[color] || deFault;
    else return hexToRgb(color) || deFault;
  return deFault;
}

const getHex = (color) => rgbToHex(getRgb(color));
const getHexShortHand = (color) => rgbToHex(getRgb(color)).replace(/(#.).(.).(.)./, '$1$2$3');
const rgbPercent = (color) => getRgb(color).map(v => v/255);

Color.hexToRgb = hexToRgb;
Color.rgbToHex = rgbToHex;
Color.rgbToHSL = rgbToHSL;
Color.hslToRgb = hslToRgb;
Color.rgb = getRgb;
Color.hex = getHex;
Color.rgb.percent = rgbPercent;
Color.hex.short = getHexShortHand;

Color.regex = /([a-z]{1,})|(${intRegStr},${intRegStr},${intRegStr})/;
Color.fromString = (str) => null === str.match(Color.regex) ? null :
                      Color.rgb(str.match(Color.regex)[0]);
