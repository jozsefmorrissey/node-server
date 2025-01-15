
Function.safeStdLibAddition(DataView, 'toByteString',  function () {
  let bytes = [];
  for (let index = 0; index < this.byteLength; index++) {
    bytes.push(this.getUint8(index));
  }
  return `[${bytes.join(',')}]`;
});

function formatNumber(number, biteLen, func, bigEndian) {
  const buffer = new ArrayBuffer(biteLen);
  const view = new DataView(buffer);

  view[func](0, number, !bigEndian);

  return buffer;
}
