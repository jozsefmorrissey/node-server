
const Line3D = require('line');
const Vertex3D = require('vertex');
const Vector3D = require('vector');
const Polygon3D = require('polygon');
const Plane = require('plane');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');


class Parimeter3D {
  constructor(lines, normal) {
    normal = new Vector3D(normal);
    Line3D.combine(lines);
    const center = Vertex3D.midrange(Line3D.vertices(lines));
    lines = Line3D.sliceAll(lines);
    //TODO: sliceAll is introducing duplicates
    lines = lines.unique(l => l.toString());


    const allMap = new ToleranceMap({'0.x': .01,
                                    '0.y': .01,
                                    '0.z': .01});
    allMap.addAll(lines.concat(lines.map(l=>
      ((l.negitive.line = l.clone().negitive()).negitive.line = l).negitive.line
    )));
    allMap.values().forEach(l =>
      (l.id = String.random()) & l.directional(false, true));

    const removedMap = allMap.clone.empty();
    const remainingMap = allMap.clone();
    const furthest = () => remainingMap.values().max(l => l[0].distance(center) +
                                                    l[1].distance(center) +
                                                    l.midpoint().distance(center));

    const remainingTouching = (lines, removed) => {
      if (lines.length === 0) return removed;
      remainingTouching(lines.map(line => remainingMap.matches(line)
        .concat(remainingMap.matches(line.negitive.line)))
                .elements()
                .filter(l => !removed[l.id] && (removed[l.id] = l)), removed);
      return removed;
    }

    function findParremeter(parimeter, ccw) {
      const removed = {};
      const remove = (line) => (removed[line.id] = line) &&
                        (removed[line.negitive.line.id] = line.negitive.line);
      const hasNotBeenRemoved = l => removed[l.id] === undefined;
      remove(parimeter[0]);
      do {
        const target = parimeter[parimeter.length - 1];
        const matches = remainingMap.matches(target.negitive.line).filter(hasNotBeenRemoved);
        if (removedMap.matches(target.negitive.line).length)
          return {removed: remainingTouching(parimeter, removed), FOUND_PREVIOUS: true};
        matches.forEach(l => remove(l));
        if (matches.length === 0) return {removed, parimeter: [], length: 0};
        if (matches.length === 1) parimeter.push(matches[0]);
        else if (matches.length > 1){
          Line3D.quadrantSort(matches, target, normal, ccw);
          parimeter.push(matches[0]);
        }
      } while (!parimeter[0][0].equals(parimeter[parimeter.length - 1][1], .001));
      parimeter = parimeter.map(l=>l.clone());
      return {parimeter, removed, length: parimeter.sum(l => l.length())};
    }

    const polys = [];
    const remove = (...objs) => objs.forEach(obj =>
          removedMap.add.all(remainingMap.remove.all(Object.values(obj.removed))));
    const add = (longest, other) => {
      polys.push(new Polygon3D(Line3D.combine(longest.parimeter).map(l => l[0])));
      remove(longest, other);
    }
    do {
      const furth = furthest();
      const right = findParremeter([furth], false);
      const left = findParremeter([furth], true);
      removedMap.add.all(remainingMap.remove.all([furth, furth.negitive.line]));
      if (left.FOUND_PREVIOUS || right.FOUND_PREVIOUS) remove(right, left);
      else if (right.length === 0 && left.length > 0) add(left, right);
      else if (right.length > 0 && left.length == 0) add(right, left);
      else if (right.length > left.length) add(right, left);
      else if (left.length > right.length) add(left, right);
      else if (left.length > 0) add(left, right);
    } while (remainingMap.values().length);

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

module.exports = Parimeter3D;
