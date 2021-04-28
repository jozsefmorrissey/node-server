class Dado extends Joint {
  constructor(joinStr, defaultDepth, axis, centerOffset) {
    super(joinStr);

    this.maleOffset = (assembly) => {
      return defaultDepth;
    }

    if (axis === undefined) return;

    this.updatePosition = (position) => {
      const direction = centerOffset[0] === '-' ? -1 : 1;
      const centerAxis = centerOffset[1];
      position.demension[axis] += defaultDepth;
      position.center[centerAxis] += defaultDepth/2 * direction;
    };

  }
}
