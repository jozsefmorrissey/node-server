
const Line3D = require('line');
const Vertex3D = require('vertex');
const Vector3D = require('vector');
const Polygon3D = require('polygon');
const Plane = require('plane');
const ToleranceMap = require('../../../tolerance-map.js');

const snapShot = (partialParim, matches) => {
  let targetStr = (matches[0] && matches[0].toDrawString('red', .000000001));
  let prospectStr = partialParim.map(l => l.toDrawString('yellow', .000000001)).join('\n');
  let matchStr = matches.map(l => l.toDrawString(Color.next('yellow','blue', 'red'), .000000001)).join('\n');
  Parimeter3D.snapShots ||= [];
  Parimeter3D.snapShots.push([targetStr, prospectStr, matchStr].join('\n\n'));
  return Parimeter3D.snapShots[Parimeter3D.snapShots.length - 1];
}

class Parimeter3D {
  constructor(lines, normal) {
    normal = new Vector3D(normal);
    const toCenter = Vertex3D.midrange(Line3D.vertices(lines)).vector();
    const toOrigin = toCenter.inverse()
    lines = lines.map(l => l.translate(toOrigin, true));
    Line3D.combine(lines);
    lines[0].combineOrder(lines[lines.length - 1])
    lines = Line3D.sliceAll(lines);
    if (lines.length !== lines.unique(l => l.toString()).length){
      console.warn('duplicate lines!')
    }
    if (lines.filter(l => l.isPoint()).length !== 0){
      console.warn('point lines!')
    }
   lines.forEach(l => l.directional(false, true));


    const allMap = new ToleranceMap({'0.x': .001,
                                    '0.y': .001,
                                    '0.z': .001});
    allMap.addAll(lines.concat(lines.map(l=>
      ((l.negitive.line = l.clone().negitive()).negitive.line = l).negitive.line
    )));
    allMap.values().forEach(l =>
      (l.id = String.random()) & l.directional(false, true));

    Parimeter3D.snapShots = [allMap.values().map(l => l.toDrawString('blue', .000000001)).join('\n')];
    const furthest = (list) => allMap.values().max(l => l[0].distance(Vertex3D.origin) +
                                                    l[1].distance(Vertex3D.origin) +
                                                    l.midpoint().distance(Vertex3D.origin));

    let again = false;
    function findParremeter(startLine, ccw) {
      const prospects = [[startLine]];
      const visited = {};
      visited[startLine.id] = startLine;
      visited[startLine.negitive.line.id] = startLine.negitive.line;

      const parimeters = [];
      do {
        const prospect = prospects[0];
        const target = prospect[prospect.length - 1];
        if (prospect[0][0].equals(prospect[prospect.length - 1][1], .001)) {
          let lines = Line3D.combine(prospects.splice(0,1)[0].map(l => l.clone()));
          if (lines.length > 2) {
             let prev = lines[lines.length - 1][1];
             const verts = lines.filter(l => l.length() > .001)
                            .map(l => {let v = Vertex3D.center(prev, l[0]); prev = l[1]; return v});
             const poly = new Polygon3D(verts.map(v => v.translate(toCenter, true)));



            // const poly = new Polygon3D(lines.map(l => l[0].translate(toCenter, true)));
            parimeters.push(poly);
          }
        } else {
          const matches = allMap.matches(target.negitive.line)
                            .filter(l => !visited[l.id] && !visited[l.negitive.line.id])
                            .filter(l => l.negitive.line.id !== target.id);
          Line3D.quadrantSort(matches, target, normal, ccw);
          snapShot(prospect, matches, allMap);
          if (again) Line3D.quadrantSort(matches, target, normal, ccw);
          if (matches.length === 0)
            prospects.splice(0,1);
          else {
            const favorite = matches.splice(0,1)[0];
            visited[favorite.id] = favorite;
            matches.forEach((m,i) => prospects.splice(i+1,0,prospect.concat(m)) & (visited[m.id] = m));
            prospect.push(favorite);
          }
        }
      } while (prospects.length);
      return {parimeter: parimeters.max(p => p.area()), visited};
    }

    const polys = [];
    do {
      const furth = furthest();
      const rightObj = findParremeter(furth, false);
      const leftObj = findParremeter(furth, true);
      const pArr = [rightObj.parimeter, leftObj.parimeter];
      if (pArr[0] === undefined || pArr[1] === undefined)
        console.warn('HEY! Look over here');
      polys.push(pArr.max(p => p.area()));
      allMap.remove.all(Object.values(rightObj.visited).map(l => [l, l.negitive.line]).concatElements());
      // allMap.remove.all(Object.values(leftObj.visited).map(l => [l, l.negitive.line]).concatElements());
    } while (allMap.values().length > 2);

    if (polys.length === 0) {
      console.warn('Parimeter3D could not find a single parimeter');
      if (goDownTheRabbitHole) new Parimeter3D(lines, normal);
    }
    return polys;

  }
}

// Almost works but is slower than Parimeter3D... might come in handy
// for thousands of lines.
class SliceAsYouGo {
  constructor(lines, normal) {
    normal = new Vector3D(normal);
    Line3D.combine(lines);
    const toCenter = Vertex3D.midrange(Line3D.vertices(lines)).vector();
    const toOrigin = toCenter.inverse()
    lines = lines.map(l => l.translate(toOrigin, true));

    const allMap = new ToleranceMap({'0.x': .001,
                                    '0.y': .001,
                                    '0.z': .001});

    const appendAndAttachNegitive = (lines) => {
      lines.concatInPlace(lines.map(l=>
        ((l.negitive.line = l.clone().negitive()).negitive.line = l).negitive.line
      ));
      return lines;
    }

    allMap.addAll(appendAndAttachNegitive(lines));
    allMap.values().forEach(l =>
      (l.id = String.random()) & l.directional(false, true));

    function removeConnected(lines) {
      const visited = {};
      lines.forEach(l => visited[l.hash()] = true)
      appendAndAttachNegitive(lines);
      allMap.remove.all(lines);
      for (let index = 0; index < lines.length; index++) {
        const matches = allMap.matches(lines[index]).filter(l => {
          const hash = l.hash();
          const shouldRemove = !visited[hash];
          visited[hash];
          if (shouldRemove) lines.push(l, l.negitive.line);
          return true;
        });
        allMap.remove.all(appendAndAttachNegitive(matches));
      }
    }

    const furthestLongest = (list) => (list || allMap.values()).max(l => l.midpoint().x + l.midpoint().y + l.length());
    Parimeter3D.snapShots = [allMap.values().map(l => l.toDrawString('blue', .000000001)).join('\n')];

    function sliceLine(line) {
      const info = Line3D.intersectionInfo(line, allMap.values(), true);
      const spliceLineMap = {};
      Object.keys(info.intMap).forEach(k => {
        const orig = info.lineMap[k];
        let prev = orig[0];
        let lines = info.intMap[k].map(int => {
            const line = new Line3D(prev.clone(), int.clone());
            prev = int;
            return line;
        });
        lines.push(new Line3D(prev.clone(), orig[1].clone()));
        lines.forEach((l,i) => {
          if (l.isPoint(.001)) {
            if (i === 0) lines[1][0] = l[0];
            else lines[i-1][1] = l[0];
            lines.splice(i,1);
          }
        });
        allMap.remove.all([orig, orig.negitive.line]);
        allMap.add.all(appendAndAttachNegitive(lines));
        spliceLineMap[k] = lines.length > 1 ? lines : [orig];
      });
      if (info.intMap[line.hash()].length === 0) return line;
      return spliceLineMap[line.hash()][0];
    }

    let again = false;
    function findParremeter(startLine, ccw) {
      const prospects = [[startLine]];
      const visited = {};
      visited[startLine.hash()] = startLine;
      visited[startLine.negitive.line.hash()] = startLine.negitive.line;

      const parimeters = [];
      do {
        const prospect = prospects[0];
        const target = prospect[prospect.length - 1];
        if (prospect[0][0].equals(prospect[prospect.length - 1][1], .001)) {
          const lines = Line3D.combine(prospects.splice(0,1)[0].map(l => l.clone()));
          if (lines.length > 2) {
            const parimeter = new Polygon3D(lines.map(l => l[0].translate(toCenter, true)));
            return {parimeter, visited};
          }
        } else {
          const matches = allMap.matches(target.negitive.line)
                            .filter(l => !visited[l.hash()] && !visited[l.negitive.line.hash()])
                            .filter(l => l.negitive.line.hash() !== target.hash() &&
                                          !l.vector().unit().inverse().equals(target.vector().unit()));
          Line3D.quadrantSort(matches, target, normal, ccw);
          if (again) Line3D.quadrantSort(matches, target, normal, ccw);
          if (matches.length === 0)
            prospects.splice(0,1);
          else {
            const favorite = sliceLine(matches.splice(0,1)[0]);
            visited[favorite.hash()] = favorite;
            matches.forEach((m,i) => prospects.splice(i+1,0,prospect.concat(m)) & (visited[m.hash()] = m));
            prospect.push(favorite);
          }
        }
      } while (prospects.length);
      return null;
    }

    const polys = [];
    do {
      let furth = furthestLongest();
      while (sliceLine(furth) !== furth) furth = furthestLongest();
      const rightObj = findParremeter(furth, false);
      const leftObj = findParremeter(furth, true);
      const pArr = [rightObj.parimeter, leftObj.parimeter];
      if (pArr[0] === undefined || pArr[1] === undefined)
        console.warn('HEY! Look over here');
      polys.push(pArr.max(p => p.area()));
      removeConnected(Object.values(rightObj.visited).concat(Object.values(leftObj.visited)));
    } while (allMap.values().length > 2);

    if (polys.length === 0) {
      console.warn('Parimeter3D could not find a single parimeter');
      if (goDownTheRabbitHole) new Parimeter3D(lines, normal);
    }
    return polys;
  }
}

Parimeter3D.fromCSG = (csg, vector) => {
  vector = new Vector3D(vector).unit();
  const plane = Plane.fromPointNormal(csg.center(), vector);
  let lines = Line3D.fromCSG(csg).filter(l => !l.vector().parrelle(vector));
  lines = plane.projectOnTo(lines);
  lines = Line3D.combine(lines);

  return new Parimeter3D(lines.map(l=>l.clone()), vector)[0];
}

Parimeter3D.SliceAsYouGo = SliceAsYouGo;
Polygon3D.Parimeter3D = Parimeter3D;
module.exports = Parimeter3D;
