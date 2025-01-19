
const Polygon3D = require('../polygon');
const Line3D = require('../line');
const Vertex3D = require('../vertex');
const ToleranceMap = require('../../../../../../public/js/utils/tolerance-map.js');

const HashMap = (lines) => {
  const map = {};
  const funcs = {
    add: (line) => (map[line.hash()] = line) &
                    (map[line.negitive().hash()] = line.negitive()),
    remove: (line) => (delete map[line.hash()]) &
                      (delete map[line.negitive().hash()]),
    should: (line) => !map[line.hash()]
  }
  if (lines) lines.forEach(l => funcs.add(l));
  return funcs;
}

class LinePolys {
  constructor(lines, exclusionFilter) {
    const minParimeter = (paths) => paths[paths.length - 1].complete ? paths[paths.length - 1].parimeter : Number.MAX_SAFE_INTEGER;
    const parimeterLength = (lines) =>
      lines.sum(l => l.length()) + lines[0][0].distance(lines[lines.length - 1][1]);
    function followPaths(line, map) {
      const paths = [[line]];
      if (paths.length === 0) return [];
      let visited = HashMap([line]);
      while (true) {
        if (paths.length === 0) return null;
        let min = minParimeter(paths);
        let path = paths[0];
        if (!path.parimeter) path.parimeter = parimeterLength(path);
        while (path.deadEnd || path.parimeter > min || (path.complete && paths.length > 1)) {
          if (paths.length === 1)
            throw new Error('This shhould not happen!!!');
          paths.splice(0, 1);
          path = paths[0];
        }
        const line = path[path.length - 1];
        if (path.complete) break;
        else {
          const matches = map.matches(line.negitive()).filter(l => !l.equivalent(line));
          if (matches.length === 0) {
            map.remove.all([line, line.negitive()]);
          } else {
            const newPaths = matches.map(l => [...path, l]);
            paths.concatInPlace(newPaths);
            matches.forEach((l,i) => {
              let newPath = paths[paths.length-newPaths.length+i];
              newPath.parimeter = path.parimeter + l.length();
              if (l[1].equals(path[0][0])) newPath.complete = true;
              if (!visited.should(l)) newPath.deadEnd = true;
              else visited.add(l);
            });
          }
          paths.splice(0, 1);
          const split = paths.filterSplit(p => p.deadEnd ? 'deadEnd' : (p.complete ? 'complete' : 'not'));
          split.not ||= []; split.complete ||= [];
          split.complete.sortByAttr('parimeter', true);
          split.not.sortByAttr('parimeter');
          paths.copy(split.not.concat(split.complete));
          console.log();
        }
      }
      return paths[0];
    }

    const origin = Vertex3D.center(Line3D.vertices(lines));

    lines.sort((l1, l2) =>
      [l2[0].distance(origin), l2.midpoint().distance(origin), l2[1].distance(origin)].sum()*l2.length() -
      [l1[0].distance(origin), l1.midpoint().distance(origin), l1[1].distance(origin)].sum()*l1.length());
    const map = new ToleranceMap({'0.x': .001,
                                    '0.y': .001,
                                    '0.z': .001});
    map.addAll(lines.concat(lines.map(l=>l.negitive.line = l.negitive())));
    const hashMap = HashMap(lines);
    let line, paths, visited; const polys = [];
    let states = [];
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const minPath = followPaths(line, map);
      if (minPath) {
        let poly = Polygon3D.fromLines(minPath)[0];
        polys.concatInPlace([poly]);
        map.remove(line); map.remove(line.negitive.line);
        minPath.forEach(l => hashMap.remove(l));
        states.push(line.toDrawString('red') + '\n\n' + map.group().concatElements().map(l => l.toDrawString('green')).join('\n'))
      }
    }

    const normal = polys[0].normal();
    polys.forEach((p,i) => p.normal().sameDirection(normal) || (polys[i] = p.reverse()));
    return polys;
  }
}

module.exports = LinePolys;
