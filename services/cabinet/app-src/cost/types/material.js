class Material extends Cost {
  constructor (id, formula, options) {
    super(id, formula, options)
  }
}
Material.addRelations = (id, name) => Cost.addRelations(Material, id, name);
Material.pricePerSquareInch = (lengthFeet, widthFeet, cost) => {
  const squareInchRatio = 1 / ((lengthFeet * 12) + (widthFeet * 12))
  return `l*w*${cost}*${squareInchRatio}`
};
Material.pricePerCubicInch = (lengthFeet, widthFeet, depthFeet, cost) => {
  const squareInchRatio = 1 / ((lengthFeet * 12) + (widthFeet * 12) + (depthFeet * 12))
  return `l*w*d*${cost}*${squareInchRatio}`
};

Material.sheet = (name, width, length, cost) => new Material(name, Material.pricePerSquareInch(width, length, cost));
Material.volume = (name, width, length, depth, cost) => new Material(name, Material.pricePerSquareInch(width, length, depth, cost));

new Material('Wood');
new Material('Wood.SoftMapel', 'sheet 4x8 75.00', {optionalPercentage: true});
new Material('Wood.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood');
new Material('Plywood.PaintGrade.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.PaintGrade.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.PaintGrade.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.StainGrade.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.StainGrade.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.StainGrade.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Glass');
new Material('Glass.Flat', '(l*w*d)*.2', {optionalPercentage: true});
new Material('Glass.textured', '(l*w*d)*.2', {optionalPercentage: true});
