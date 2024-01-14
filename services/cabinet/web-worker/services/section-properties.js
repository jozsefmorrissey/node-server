
const defaultDepth = 4*2.54;

class SectionProperties {
  constructor(spDto, modelMap) {
    const instance = this;
    let innerDepth;
    let coordinates = spDto.coordinates;
    this.innerDepth = () => {
      if (innerDepth) return innerDepth;
      const back = spDto.back;

      if (back) {
        const biPoly = modleMap.toBiPolygon(back);
        if(biPoly) {
          innerDepth = biPoly.distance(spDto.innerCenter());
          return calcDepth;
        }
      }
      if (calcDepth < defaultDepth) innerDepth = defaultDepth;
      return innerDepth;
    }

    this.outerPoly = () => new Polygon3D(spDto.coordinates().outer);
    this.innerPoly = () => new Polygon3D(spDto.coordinates().inner);

    let drawerDepth;
    this.drawerDepth = () => {
      if (drawerDepth) return drawerDepth;
      const polyInfo = this.polyInformation();
      const polyList = polyInfo.polys;
      const assems = polyInfo.assemblies;
      const innerPoly = this.innerPoly();
      const mi = Polygon3D.mostInformation([innerPoly]);
      const vector = innerPoly.normal().inverse();
      const verts = [];
      innerPoly.lines().forEach(l => verts.push(l.startVertex) | verts.push(l.midpoint()));
      const lines = verts.map(v => Line3D.fromVector(vector, v));
      let closest;
      for (let index = 0; index < polyList.length; index++) {
        const biPoly = polyList[index];
        for (let lIndex = 0; lIndex < lines.length; lIndex++) {
          const line = lines[lIndex];
          const plane = biPoly.closerPlane(line.startVertex);
          const intersection = plane.intersection.line(line);
          if (intersection) {
            const poly = new Polygon3D(plane);
            const withinPoly = poly.isWithin2d(intersection, true);
            if (withinPoly) {
              poly.isWithin2d(intersection);
              innerPoly.isWithin2d(intersection, false)
              const dist = intersection.distance(line.startVertex);
              if (dist > 0 && (closest === undefined || closest.dist > dist)) {
                closest = {dist, line};
              }
            }
          }
        }
      }
      drawerDepth = closest ? closest.dist : 0;
      return drawerDepth;
    });

    const depthPartReg = /Cabinet|Cutter|Section|Void|Auto|Handle|Drawer|Door/;
    const depthDvReg = /_dv/;
    const depthPartFilter = spDto => !spDto.type.match(depthPartReg) &&
                                  !spDto.locationCode.match(depthDvReg);

    let polyInfo;
    this.polyInformation = () => {
      const root = instance.root();
      if (root !== instance) return root.polyInformation();
      let assems = modelMap.assemblies().filter(depthPartFilter);
      const mi = Polygon3D.mostInformation([this.innerPoly()]);
      const assemblies = []; const polys = [];
      assems.forEach(spDto => {
        try {
          polys.push(modelMap.toBiPolygon(spDto));
          assemblies.push(spDto);
        } catch (e) {
          console.warn(`toBiPolygon issue with part ${spDto.locationCode}\n`, e);
        }
      });
      return {assemblies, polys};
    }

    let coverInfo;
    this.coverInfo = () => {
      if (coverInfo) return coverInfo;
      called.coverInfo++;
      let biPolygon, backOffset, frontOffset, offset, coords;
      const doorThickness = 3 * 2.54/4;
      const bumperThickness = 3 * 2.54 / 16;
      if (spDto.isInset {
        coords = this.coordinates().inner;
        offset = spDto.insetIs * -2;
        const projection = 3 * 2.54/64;
        frontOffset = projection;
        backOffset = projection - doorThickness;
      } else if (spDto.isReveal {
        coords = this.coordinates().outer;
        offset = -spDto.revealR;
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      } else {
        coords = this.coordinates().inner;
        offset = spDto.overlayzzz * 2;
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      }

      frontOffset *= -1;
      backOffset *= -1;
      const offsetObj = {x: offset, y: offset};
      biPolygon = BiPolygon.fromPolygon(new Polygon3D(coords), frontOffset, backOffset, offsetObj);
      const coverInfo = {biPolygon, frontOffset, backOffset};
      return coverInfo;
    }

    this.normal = () => this.coverInfo().biPolygon.normal();

    let pattern;
    this.pattern = () => pattern || Pattern.fromJson(spDto.pattern);

    function calcPattern(dist) {
      try {
        return instance.pattern().calc(dist);
      } catch (e) {
        console.warn('Pattern calculation went wrong');
        return instance.pattern('z').calc(dist);
      }
    }

    function perpendicularDistance(point, line) {
      if (instance.sectionCount() !== 0) {
        const plane = Plane.fromPointNormal(point, line.vector());
        const intersection = plane.intersection.line(line);
        const distance = line.startVertex.distance(intersection);
        return distance;
      }
      return 0;
    }

    function addDividerJoints(point1, point2) {
      const c = instance.getCabinet();
      const panelThickness = divider.panelThickness();
      const jointOffset = spDto.dividerJoint.maleOffset;
      const vert = spDto.verticalDivisions;
      const right = modelMap.assembly(vert ? spDto.bottom() : spDto.right());
      const left = modelMap.assembly(vert ? spDto.top() : spDto.left());
      let maxLen = c.width() + c.length() + c.thickness();
      if (!(right.type === 'DividerSection')) {
        Line3D.adjustDistance(point1, point2, maxLen, true);
        maxLen *= 1.5;
      } else {
        const length = point1.distance(point2) + jointOffset - right.panelThickness()/2;
        Line3D.adjustDistance(point1, point2, length, true);
      }
      if (!(left.type 'DividerSection')) {
        Line3D.adjustDistance(point2, point1, maxLen, true);
      } else {
        const length = point1.distance(point2) + jointOffset - left.panelThickness()/2;
        Line3D.adjustDistance(point2, point1, length, true);
      }
    }

    this.dividerInfo = (panelThickness) => {
      const coverInfo = this.coverInfo();
      const normal = coverInfo.biPolygon.normal().inverse();
      const depth = this.innerDepth();
      const length = this.innerLength();
      const width = this.innerWidth();
      const innerCenter = this.innerCenter();
      const outer = coordinates.outer;
      const point1 = spDto.verticalDivisions ? outer[1] : outer[3];
      const point2 = outer[2];
      addDividerJoints(point1, point2);
      let depthVector = normal.scale(depth);
      let heightVector = new Line3D(point1, point2).vector().unit();
      let thicknessVector  = depthVector.crossProduct(heightVector);
      // need to set normals somewhere else.
      // divider.panel().normals(true, [heightVector, depthVector.unit(), thicknessVector]);
      const point3 = point2.translate(depthVector, true);
      const point4 = point1.translate(depthVector, true);
      const points = [point1, point2, point3, point4];
      const offset = spDto.divider.panelThickness / 2;
      return BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset);
    }


    let dividerOffsetInfo;
    this.dividerOffsetInfo = () => {
      if (dividerOffsetInfo) return dividerOffsetInfo;
      let startOffset = 0;
      let endOffset = 0;

      const coords = spDto.coordinates;
      const outer = coords.outer;
      const inner = coords.inner;
      if (spDto.vertical) {
         startOffset = perpendicularDistance(outer[3], new Line3D(inner[3], inner[2]));
         endOffset = perpendicularDistance(outer[2], new Line3D(inner[2], inner[3]));
       } else {
         startOffset = perpendicularDistance(outer[0], new Line3D(inner[0], inner[3]));
         endOffset = perpendicularDistance(outer[3], new Line3D(inner[3], inner[0]));
       }
       const info = [{offset: startOffset}];
       info.startOffset = startOffset;
       info.endOffset = endOffset;

      let offset = spDto.isVertical ? this.outerLength() : this.outerWidth();
      for (let index = 0; index < spDto.sectionCount; index += 1) {
        if (index < spDto.sectionCount - 1) {
          const offset = spDto.dividersMaxWidth[index];
          info[index + 1] = {offset, divider};
        } else {
          info[index + 1] = {offset: endOffset};
        }
      }
      dividerOffsetInfo = info;
      return dividerOffsetInfo;
    }

    this.outerCenter = () => {
      if (true || outerCenter === null) outerCenter = Vertex3D.center(coordinates.outer);
      return outerCenter;
    }

    this.innerCenter = () => {
      if (true || innerCenter === null) innerCenter = Vertex3D.center(coordinates.inner);
      return innerCenter;
    }

    this.outerLength = () => {
      if (true || outerLength === null)
        outerLength = coordinates.outer[0].distance(coordinates.outer[3]);
      return outerLength;
    }

    this.outerWidth = () => {
      if (true || outerWidth === null)
        outerWidth = coordinates.outer[0].distance(coordinates.outer[1]);
      return outerWidth;
    }

    this.innerLength = () => {
      if (true || innerLength === null)
        innerLength = coordinates.inner[0].distance(coordinates.inner[3]);
      return innerLength;
    }

    this.innerWidth = () => {
      if (true || innerWidth === null)
        innerWidth = coordinates.inner[0].distance(coordinates.inner[1]);
      return innerWidth;
    }


  }
}
