
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

      return {
        void: [targetFront.endVertex, shortTop.endVertex,
                shortBottom.endVertex, newStart],
        tkb: [shortTop.endVertex, longTop.endVertex,
              longBottom.endVertex, shortBottom.endVertex],
      };
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

      const tkh = cabinet.value('tkh');
      const tkd = cabinet.value('tkd');
      const tkbw = cabinet.value('tkbw');

      const leftLine = innerPoly.lines()[3];
      const rightLine = innerPoly.lines()[1].negitive();
      const bottomPlane = new Polygon3D([rightLines.tkb[2], rightLines.tkb[3], leftLines.tkb[2], leftLines.tkb[3]]).toPlane();
      const leftStart = bottomPlane.lineIntersection(leftLine);
      const rightStart = bottomPlane.lineIntersection(rightLine);
      const leftTkLine = Line3D.fromVector(leftLine.vector().unit().scale(tkh), leftStart);
      const rightTkLine = Line3D.fromVector(rightLine.vector().unit().scale(tkh), rightStart);
      const tkSpacePoly = new Polygon3D([leftTkLine.endVertex, rightTkLine.endVertex, rightTkLine.startVertex, leftTkLine.startVertex]);
      const tkVoid = BiPolygon.fromPolygon(tkSpacePoly, tkd);
      const tkBiPoly = BiPolygon.fromPolygon(tkSpacePoly, tkd, tkd+tkbw);

      const print = (stuff, dir, side) => console.log(dir, '-', side, ':', stuff[dir][side].dist, '->', stuff[dir][side].intersection.toString());
      const printAll = (stuff) => print(stuff, 'positive', 'inner') || print(stuff, 'positive', 'outer') || print(stuff, 'negitive', 'inner') || print(stuff, 'negitive', 'outer');

      const faces = tkBiPoly.closestOrder(tkSpacePoly.center());
      const topInner = cabinet.planeIntersection(faces[0].lines()[0]);
      // printAll(topInner);
      const bottomInner = cabinet.planeIntersection(faces[0].lines()[2]);
      // printAll(bottomInner);
      const topOuter = cabinet.planeIntersection(faces[1].lines()[0]);
      // printAll(topOuter);
      const bottomOuter = cabinet.planeIntersection(faces[1].lines()[2]);
      // printAll(bottomOuter);

      return tkBiPoly || tkVoid || new BiPolygon(rightPoly, leftPoly);
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
