class Divider extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}
Divider.count = 0;

Divider.abbriviation = 'dv';

Assembly.register(Divider);
