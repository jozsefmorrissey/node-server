
const Vertex2d = require('./vertex');

class Circle2d {
  constructor(radius, center) {
    center = new Vertex2d(center);
    Object.getSet(this, {radius, center});
    // ( x - h )^2 + ( y - k )^2 = r^2
    const instance = this;
    // Stole the root code from: https://stackoverflow.com/a/37225895
    function lineIntersects (line, bounded) {
      const p1 = line.startVertex();
      const p2 = line.endVertex();
        var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
        v1 = {};
        v2 = {};
        v1.x = p2.x() - p1.x();
        v1.y = p2.y() - p1.y();
        v2.x = p1.x() - instance.center().x();
        v2.y = p1.y() - instance.center().y();
        b = (v1.x * v2.x + v1.y * v2.y);
        c = 2 * (v1.x * v1.x + v1.y * v1.y);
        b *= -2;
        d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - instance.radius() * instance.radius()));
        if(isNaN(d)){ // no intercept
            return [];
        }
        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
        u2 = (b + d) / c;
        retP1 = {};   // return points
        retP2 = {}
        ret = []; // return array
        if(!bounded || (u1 <= 1 && u1 >= 0)){  // add point if on the line segment
            retP1.x = p1.x() + v1.x * u1;
            retP1.y = p1.y() + v1.y * u1;
            ret[0] = retP1;
        }
        if(!bounded || (u2 <= 1 && u2 >= 0)){  // second add point if on the line segment
            retP2.x = p1.x() + v1.x * u2;
            retP2.y = p1.y() + v1.y * u2;
            ret[ret.length] = retP2;
        }
        return ret;
    }

    function circleIntersects(circle) {
      return Circle2d.intersectionOfTwo(instance, circle);
    }

    this.toString = () => `(${this.radius()}${this.center()}----)`;

    this.intersections = (input) => {
      if (input === undefined)
        console.log('here');
      if (input instanceof Circle2d) return circleIntersects(input);
      if (input.constructor.name === 'Line2d') return lineIntersects(input);
      throw new Error(`Cannot find intersections for ${input.constructor.name}`);
    }
  }
}

// Ripped off from: https://stackoverflow.com/a/12221389
Circle2d.intersectionOfTwo = (circle0, circle1) => {
    const x0 = circle0.center().x();
    const y0 = circle0.center().y();
    const r0 = circle0.radius();

    const x1 = circle1.center().x();
    const y1 = circle1.center().y();
    const r1 = circle1.radius();
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy*dy) + (dx*dx));

    /* Check for solvability. */
    if (d > (r0 + r1)) {
        /* no solution. circles do not intersect. */
        return [];
    }
    if (d < Math.abs(r0 - r1)) {
        /* no solution. one circle is contained in the other */
        return [];
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

    /* Determine the coordinates of point 2. */
    x2 = x0 + (dx * a/d);
    y2 = y0 + (dy * a/d);

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt((r0*r0) - (a*a));

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h/d);
    ry = dx * (h/d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    const list = [];
    return [{x: xi, y: yi}, {x: xi_prime, y: yi_prime}];
}

Circle2d.reusable = true;
Circle2d.instance = (radius, center) => {
  const inst = Lookup.instance(Circle2d.name);
  inst.radius(radius);
  inst.center(center);
  return inst;
}
new Circle2d();

module.exports = Circle2d;
