class Labor extends Cost {
  constructor (id, formula, options) {
    super(id, formula, options)
  }
}
Labor.addRelations = (id, name) => Cost.addRelations(Labor, id, name);
new Labor('Panel', '1+(0.05*l*w');
new Labor('Frame', '0.25');
new Labor('GlueFrame', '0.25');
new Labor('SandFrame', '0.05*l*l*w*w*d*d');
new Labor('SandPanel', '(0.25*l*w)/12');
new Labor('GlueMiter', '(0.25*l*l*w*w)');
new Labor('InstallBlumotionGuides', '2');
new Labor('InstallOtherGuides', '2');
new Labor('InstallFushHinges', '2');
new Labor('installOverLayHinges', '2');
new Labor('Paint', '(l*l*w*w*.1)/12');
new Labor('Stain', '(l*l*w*w*.25)/12');
new Labor('InstallDrawerFront', '2');
new Labor('InstallPullout', 10);
