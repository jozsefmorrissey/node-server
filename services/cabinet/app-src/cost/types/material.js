class Material extends Cost {
  constructor (id, method, cost, length, width, depth) {
    super(id, method, cost, length, width, depth);
  }
}

Cost.register(Material);

// new Material('Wood');
// new Material('Wood.SoftMapel', 'sheet 4x8 75.00', {optionalPercentage: true});
// new Material('Wood.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Wood.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Plywood');
// new Material('Plywood.PaintGrade.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Plywood.PaintGrade.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Plywood.PaintGrade.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Plywood.StainGrade.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Plywood.StainGrade.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Plywood.StainGrade.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
// new Material('Glass');
// new Material('Glass.Flat', '(l*w*d)*.2', {optionalPercentage: true});
// new Material('Glass.textured', '(l*w*d)*.2', {optionalPercentage: true});
