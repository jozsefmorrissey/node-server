class FrameDivider extends Assembly {
  constructor (partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

FrameDivider.abbriviation = 'fd';

Assembly.register(FrameDivider);
