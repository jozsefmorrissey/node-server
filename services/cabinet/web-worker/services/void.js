

class Void {
  constructor(voidDto) {
    const offsetSets = [
      {
        first: {x: pt, y: pt},
        second: {x: pt*2, y: pt*2},
        third: {x: pt, y: pt*2},
      },
      {
        first: {x: pt, y: pt},
        third: {x: pt*2, y: pt*2},
        second: {x: pt, y: pt*2},
      },


      {
        first: {x: pt, y: pt*2},
        second: {x: pt, y: pt},
        third: {x: pt*2, y: pt*2},
      },
      {
        first: {x: pt*2, y: pt*2},
        second: {x: pt, y: pt},
        third: {x: pt*2, y: pt},
      },


      {
        first: {x: pt*2, y: pt*2},
        second: {x: pt*2, y: pt},
        third: {x: pt, y: pt},
      },
      {
        first: {x: pt*2, y: pt},
        second: {x: pt*2, y: pt*2},
        third: {x: pt, y: pt},
      },
    ]

    this.panel = (index) => {
      biPolygon: () => toBiPoly(index);
    }

    const biPolys = [];
    const toBiPoly = (index) => {
      if (biPolys[index]) return biPolys[index];
      const startIndex = setIndex;
      const biPoly = this.toBiPolygon();
      let polys = biPoly.toPolygons();
      polys.swap(3,4);
      const spliceIndex = Math.mod(startIndex + index, 6);
      const offsetSet = offsetSets[setIndex];
      const offset = index < 2 ? offsetSet.first : (index < 4 ? offsetSet.second : offsetSet.third);
      let pt = panelThickness;
      const center = biPoly.center();
      const centerVect = new Line3D(center.copy(), polys[index].center()).vector();

      if (!centerVect.sameDirection(polys[index].normal())) pt *= -1;

      return BiPolygon.fromPolygon(polys[index], pt, 0, offset);
    }

    let abyssBiPoly;
    function abyssBiPolygon() {
      if (abyssBiPoly) return abyssBiPoly;
      const biPoly = instance.toBiPolygon();
      const polys = biPoly.toPolygons();
      polys.swap(3,4);
      const center = biPoly.center();
      const joints = controlableAbyss.getJoints();
      const polyVects = polys.map(p => new Line3D(center.copy(), p.center()).vector().unit());
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index].copy();
        if (instance.includedSides()[index] !== true) {
          const vector = polyVects[index];
          biPoly.extend(vector.scale(2000));
        }
      }

      abyssBiPoly = biPoly;
      return abyssBiPoly;
    }

    this.abyss = {biPolygon: abyssBiPolygon};

  }
}
