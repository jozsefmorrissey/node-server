function HandleCenter(location, frontPoly, heo, hcco, centerToCenter) {
  let center;
  const toCenter = hcco + centerToCenter / 2;
  const tp = frontPoly.line(0);
  const right = frontPoly.line(1);
  const bm = frontPoly.line(2);
  const left = frontPoly.line(3);

  switch (location.position) {
    case "BOTTOM_RIGHT":
      center = bm[0];
      center.translate(bm.vector().unit().scale(heo));
      center.translate(right.vector().unit().scale(-toCenter));
      break;
    case "BOTTOM_LEFT":
      center = bm[1];
      center.translate(bm.vector().unit().scale(-heo));
      center.translate(left.vector().unit().scale(toCenter));
      break;
    case "TOP_RIGHT":
      center = tp[1];
      center.translate(tp.vector().unit().scale(-heo));
      center.translate(right.vector().unit().scale(toCenter));
      break;
    case "TOP_LEFT":
      center = tp[0];
      center.translate(tp.vector().unit().scale(heo));
      center.translate(left.vector().unit().scale(-toCenter));
      break;
    case "BOTTOM":
      center = bm.midpoint();
      center.translate(right.vector().unit().scale(heo));
      break;
    case "TOP":
      center = tp.midpoint();
      center.translate(right.vector().unit().scale(-heo));
      break;
    case "RIGHT":
      center = right.midpoint();
      center.translate(bm.vector().unit().scale(-heo));
      break;
    case "LEFT":
      center = left.midpoint();
      center.translate(bm.vector().unit().scale(heo));
      break;
    case "CENTER":
      center = frontPoly.center();
      break;
    break;
    default:
      throw new Error('Invalid pull location');
  }
  return center;
};

module.exports = {HandleCenter}
