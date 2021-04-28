class Material extends Cost {
  constructor (id, formula, options) {
    super(id, formula, options)
  }
}
Material.addRelations = (id, name) => Cost.addRelations(Material, id, name);


new Material('Wood');
new Material('Wood.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood');
new Material('Plywood.SoftMapel.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Hickory.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Oak.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.SoftMapel.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Hickory.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Oak.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Glass');
new Material('Glass.Flat', '(l*w*d)*.2', {optionalPercentage: true});
new Material('Glass.textured', '(l*w*d)*.2', {optionalPercentage: true});
