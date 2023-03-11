
const Assembly = require('../../assembly');
const Vertex3D = require('../../../../three-d/objects/vertex');
const Line3D = require('../../../../three-d/objects/line');
const Polygon3D = require('../../../../three-d/objects/polygon');
const BiPolygon = require('../../../../three-d/objects/bi-polygon');
const Butt = require('../../../joint/joints/butt.js');

class AutoToekick extends Assembly {
  constructor(cabinet) {
    super('AUTOTK', 'AutoToeKick');
    function cornerLines(side, openingCenter, targetCorner, innerPoly) {
      const biPoly = side.position().toBiPolygon();
      const poly = biPoly.furthestOrder(openingCenter)[1];
      let front = Line3D.centerClosestTo(openingCenter, poly.lines()).polarize(targetCorner);
      const withoutUp = poly.lines().filter(l => !l.equals(front));
      let longBottom = Line3D.endpointClosestTo(targetCorner, withoutUp).polarize(targetCorner);

      let innerFront = Line3D.centerClosestTo(openingCenter, innerPoly.lines()).clone().polarize(targetCorner);

      let newStart = innerPoly.toPlane().lineIntersection(longBottom);

      longBottom.startVertex = newStart;
      const shortBottom = longBottom.clone();

      const tkh = cabinet.value('tkh');
      const tkd = cabinet.value('tkd');
      const targetFront = Line3D.fromVector(innerFront.vector().unit().scale(tkh), newStart);
      shortBottom.adjustLength(tkd, true);
      longBottom.adjustLength(tkd + cabinet.value('tkbw'), true);
      const shortVector = shortBottom.vector();
      const longVector = longBottom.vector();
      const shortTop = Line3D.fromVector(shortVector, targetFront.endVertex);
      const longTop = Line3D.fromVector(longVector, targetFront.endVertex);

      console.log("(" + [targetFront.endVertex, targetFront.startVertex, shortTop.endVertex, shortBottom.endVertex, newStart,
                    longTop.endVertex, longBottom.endVertex].join('),(') + ")")

      return {void: [targetFront.endVertex, shortTop.endVertex,
                    shortBottom.endVertex, newStart],
              tkb: [shortTop.endVertex, longTop.endVertex,
                longBottom.endVertex, shortBottom.endVertex]};
    }

    function openingToeKick(opening) {
      const right = opening.right();
      const left = opening.left();
      const coords = opening.coordinates();
      const center = Vertex3D.center(coords.inner);
      const innerPoly = new Polygon3D(coords.inner);

      const rightLines = cornerLines(right, center, coords.inner[2], innerPoly);
      const leftLines = cornerLines(left, center, coords.inner[3], innerPoly);

      const leftPoly = new Polygon3D(leftLines.tkb);
      const rightPoly = new Polygon3D(rightLines.tkb);
      return new BiPolygon(rightPoly, leftPoly);
    }

    this.toBiPolygon = () => {
      const openings = cabinet.openings;
      let opening;
      if (openings.length > 1) throw new Error('Not yet implemented for multiple openings...');
      for (let index = 0; index < openings.length; index++) {
        opening = openingToeKick(openings[index]);
      }
      return opening;
    }

    const joint = (otherPartCode) => new Butt(this.partCode(), otherPartCode);
    this.addJoints(joint('R'), joint('B'), joint('L'));
    this.toModel = () => this.toBiPolygon().toModel();
  }
}

module.exports = AutoToekick;
