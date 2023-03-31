

class CompressedString {
  constructor(string, keyCharacter, maxReplaceLength) {
    const keyChar = keyCharacter || '^';
    const mrl = maxReplaceLength || 10;

    const startMap = [];
    const countMap = {};
    for (let i = 0; i < string.length - 3; i++) {
      startMap[i] = [];
      for (let j = 3; j < mrl && i + j < string.length + 1; j++) {
        let str = string.substring(i, i + j);
        if (countMap[str] === undefined) countMap[str] = 0;
        countMap[str]++;
        startMap[i].push(str);
      }
    }

    function biggestNumerousStr(i, winner) {
      let newLeader = false;
      for (let j = 0; j < startMap[i].length; j++) {
        const str = startMap[i][j];
        const score = countMap[str] * str.length;
        if (winner === undefined || winner.score < score) {
          newLeader = true;
          winner = {str, score, start: i};
        }
      }
      winner.newLeader = newLeader;
      return winner;
    }

    function updateRange(i, str, range) {
      range ||= {};
      for (let index = i; index < i + str.length; index++) {
        if (!range[i]) range[i] =  true;
      }
      return range;
    }

    const replaceKeys = [];
    let i = 2;
    while (i < string.length) {
      let winner = biggestNumerousStr(i);
      const range = updateRange(i, winner.str);
      let keys;
      do {
        keys = Object.keys(range).filter((key) => range[key]);
        for (let j = 0; j < keys.length; j++) {
          winner = biggestNumerousStr(keys[j], winner);
          range[keys[j]] = false;
          if (winner.newLeader) updateRange(j, winner.str, range);
        }
        i = winner.start + winner.str.length;
      } while (keys.length > 0);

      replaceKeys.push(winner);
    }

    let charIndex = 65;
    const newKey = () => `${keyChar}${String.fromCharCode(charIndex++)}`;

    replaceKeys.sort((w1, w2) => w2.score > w1.score);
    replaceKeys.forEach(w => w.key = newKey());

    this.replaceKeys = () => replaceKeys;

    this.toString = () => {
      let str = string;
      for (let i = 0; i < replaceKeys.length; i++) {
        const rStr = replaceKeys[i].str;
        const rKey = replaceKeys[i].key;
        str = str.replaceAll(rStr, rKey);
      }
      return str;
    }
  }
}

module.exports = CompressedString;
