const colors = {
  indianred: [205, 92, 92],
  gray: [128, 128, 128],
  fuchsia: [255, 0, 255],
  lime: [0, 255, 0],
  black: [0, 0, 0],
  lightsalmon: [255, 160, 122],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  yellow: [255, 255, 0],
  olive: [128, 128, 0],
  lightcoral: [240, 128, 128],
  green: [0, 128, 0],
  aqua: [0, 255, 255],
  white: [255, 255, 255],
  teal: [0, 128, 128],
  darksalmon: [233, 150, 122],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  salmon: [250, 128, 114],
  silver: [192, 192, 192],
  purple: [128, 0, 128]
}

// function coloring(part) {
//   if (part.partName() && part.partName().match(/.*Frame.*/)) return getColor('blue');
//   else if (part.partName() && part.partName().match(/.*Drawer.Box.*/)) return getColor('green');
//   else if (part.partName() && part.partName().match(/.*Handle.*/)) return getColor('silver');
//   return getColor('red');
// }


const colorChoices = Object.keys(colors);
let colorIndex = 0;
function getColor(name) {
  if(colors[name]) return colors[name];
  return colors[colorChoices[colorIndex++ % colorChoices.length]];
}

module.exports = getColor;
