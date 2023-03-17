
const Approximate = require('../../../../../public/js/utils/approximate.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const within = Tolerance.within(.0001);

const withinTight = Tolerance.within(.000000001);
const isZero = (val) => withinTight(val, 0);

function findRowColumnCount (array) {
  let rows = array.length;
  let columns = array[0].length;
  for (let i = 0; i < array.length; i++) {
    const row = array[i];
    columns = row.length > columns ? row.length : columns;
  }
  return {rows, columns};
}

function columnValidator (min, max) {
  return (target, key, value) => {
    if (key > max || key < min) {
      throw new Error('An assignment error was made or you need to resize your matrix');
    }
    if ((typeof value) !== 'number') {
      throw new Error('Matrix must be filled with numbers');
    }
    target[key] = value;
    return true;
  }
}

function rowValidator () {
  return (target, key, value) => {
    if (Number.isNaN(Number.parseInt(key))) {
      throw new Error('You do not have access to the numerical attributes of a Matrix object, they are reserved for rows and cannot be modified');
    }
    target[key] = value;
    return true;
  }
}

class Matrix extends Array {
  constructor(values, rows, columns) {
    super();
    if (!rows || !columns) {
      const max = findRowColumnCount(values);
      if (!rows) rows = max.rows;
      if (!columns) columns = max.columns;
    }

    for (let i = 0; i < rows; i +=1) {
      this[i] = new Proxy([], { set: columnValidator(0, columns) });
      for (let j = 0; j < columns; j ++) {
        const value = values && values[i] && values[i][j];
        this[i][j] = !value ? 0 : value;
      }
    }

    new Proxy(this, {set: rowValidator()});

    this.rows = () => rows;
    this.columns = () => columns;

    this.remove = (rowIndex, columnIndex) => {
      if ((typeof rowIndex) !== 'number') rowIndex = Number.MAX_SAFE_INTEGER;
      else rowIndex = Math.mod(rowIndex, rows);
      if ((typeof columnIndex) !== 'number') columnIndex = Number.MAX_SAFE_INTEGER;
      else columnIndex = Math.mod(columnIndex, columns);

      const rowLimit = rowIndex > -1 && rowIndex < rows ? rows - 1 : rows;
      const columnLimit = columnIndex > -1 && columnIndex < columns ? columns - 1 : columns;
      let matrix = new Matrix(null, rowLimit, columnLimit);
      for (let i = 0; i < rows; i++) {
        if (i !== rowIndex) {
          const rowI = i < rowIndex ? i : i - 1;
          for (let j = 0; j < columns; j++) {
            if (j !== columnIndex) {
              const columnJ = j < columnIndex ? j : j - 1;
              matrix[rowI][columnJ] = this[i][j];
            }
          }
        }
      }
      return matrix;
    }

    this.replaceRow = (rowIndex, values) => {
      rowIndex = Math.mod(rowIndex, rows);

      for (let j = 0; j < columns; j++) {
        this[rowIndex][j] = values[j];
      }
    }

    this.replaceColumn = (columnIndex, values) => {
      columnIndex = Math.mod(columnIndex, rows);

      for (let i = 0; i < rows; i++) {
        this[i][columnIndex] = values[i];
      }
    }

    this.minor = (index) => {
      return this.remove(0, index);
    }

    this.toArray = () => JSON.copy(this);

    const nonZeroIndex = (cIndex, matrix, startRowIndex) => {
      for (let index = startRowIndex; index < rows; index++) {
        if (!isZero(matrix[index][cIndex])) return index;
      }
      return null;
    }

    this.fixedColumns = () => {
      const fixed = [];
      let found = false;
      for (let cIndex = 0; cIndex < columns; cIndex++) {
        let firstVal = this[0][cIndex];
        let isFixed = true;
        for (let rIndex = 1; isFixed && rIndex < rows; rIndex++) {
          isFixed = within(firstVal, this[rIndex][cIndex]);
        }
        if (isFixed === true) found = true;
        fixed[cIndex] = isFixed;
      }
      if (found) return fixed;
      return null;
    }

    this.square = () => this.rows() === this.columns();

    this.solvable = () => {
      const uniqRows = this.uniqueRows();
      if (!uniqRows.square()) return false;
      const rref = this.rowEchelon(true);
      return rref.equals(Matrix.identity(uniqRows.rows()));
    }

    this.uniqueRows = () => {
      const unique = [];
      for (let index = 0; index < rows; index++) {
        let isUnique = true;
        for (let uRow = 0; uRow < unique.length; uRow++) {
          let same = true;
          for (let uCol = 0; uCol < columns; uCol++) {
            if (!within(unique[uRow][uCol], this[index][uCol]))
              same = false;
          }
          if (same) isUnique = false;
        }
        if (isUnique)  unique.push(Array.from(this[index]));
      }
      return new Matrix(unique);
    }

    function eliminateConfusion(matrix) {
      for(let cIndex = 0; matrix.rows() > matrix.columns() && cIndex < matrix.columns(); cIndex++) {
        let values = {};
        for(let rIndex = 0; rIndex < matrix.rows(); rIndex++) {
          if (values[matrix[rIndex][cIndex]] !== undefined) {
            matrix = matrix.remove(rIndex);
            break;
          } else values[matrix[rIndex][cIndex]] = true;
        }
      }
      while(matrix.rows() > matrix.columns()) matrix = matrix.remove(matrix.rows()-1);
      return matrix;
    }

    this.properDemension = () => {
      const info = {fixedValues: []};
      let rowReduced = this.uniqueRows();
      const fixedColumns = rowReduced.fixedColumns();
      for (let index = columns; fixedColumns && index >= 0; index--) {
         if (fixedColumns[index]) {
           info.fixedValues[index] = rowReduced[0][index];
           rowReduced = rowReduced.remove(null, index);
         }
      }
      info.matrix = eliminateConfusion(rowReduced);
      return info;
    }

    this.rowEchelon = (reduced) => {
      const echelon = this.toArray();
      let pivot = 0;
      for (let rIndex = 0; pivot < columns && rIndex < rows; rIndex++) {
        const eRow = echelon[rIndex];
        const firstValidIndex = nonZeroIndex(pivot, echelon, rIndex);
        if (firstValidIndex !== rIndex) {
          if (firstValidIndex === null) pivot++;
          else echelon.swap(rIndex, firstValidIndex);
          rIndex--;
        } else {
          let startIndex = rIndex;
          if (reduced) {
            startIndex = 0;
            eRow.scale(1/eRow[pivot]);
          }
          const pivotValue = eRow[pivot];
          for (let r2Index = startIndex; r2Index < rows; r2Index++) {
            if (r2Index !== rIndex) {
              const row = echelon[r2Index];
              if (row[pivot] !== 0) {
                const pivotRatio = row[pivot] / -pivotValue;
                row.add((val, index) => pivotRatio * eRow[index]);
              }
            }
          }
        }
      }

      return new Matrix(echelon);
    }

    const bigEnough = (val) => Math.abs(val) > .00000001;
    this.consise = () => {
      const removedColumns = [];
      let consiseMatrix = this.copy();
      for (let j = columns - 1; j > -1; j--) {
        // const initialValue = this[0][j];
        let notZero = false;
        for (let i = 0; i < rows; i++) {
            notZero ||= bigEnough(this[i][j]);
        }
        if (!notZero) {
          removedColumns.push(j);
          consiseMatrix = consiseMatrix.remove(undefined, j);
        }
      }

      const changes = [];
      const keepRows = [consiseMatrix[0]];
      const moreInfo = (row) => {
        for (let i = 0; i < keepRows.length; i++) {
          const kRow = keepRows[i];
          for (let j = 0; j < kRow.length; j++) {
            if (!changes[j] && !within(kRow[j], row[j])) {
              changes[j] = true;
              keepRows.push(row);
              return;
            }
          }
        }
      }
      for (let i = 1; keepRows.length < keepRows[0].length && i < rows; i++) {
        const row = consiseMatrix[i];
        if (keepRows.equalIndexOf(row) === -1) moreInfo(row);
      }
      return {removedColumns, matrix:  new Matrix(keepRows)};
    }

    this.determinate = () => {
      if (rows === 2) return this[0][0] * this[1][1] - this[0][1] * this[1][0];

      let sign = 1;
      let sum = 0;
      let colNum = 0;
      while (colNum < columns) {
        const minor = this.minor(colNum);
        const determinate = minor.determinate();
        sum += this[0][colNum++] * determinate * sign;
        sign *= -1;
      }
      return sum;
    }

    this.solve2 = (answer) => {
      const consiseObj = this.consise();
      const consiseMatrix = consiseObj.matrix;
      const removedColumns = consiseObj.removedColumns;
      const solution = new Matrix(null, columns, 1);
      answer ||= new Array(columns).fill(0);
      let consiseIndex = 0;
      const determinate = consiseMatrix.determinate();
      for (let j = 0; j < columns; j++) {
        let value;
        if (removedColumns.indexOf(j) !== -1) value = 0;
        else {
          const matrix = consiseMatrix.copy()
          matrix.replaceColumn(consiseIndex++, answer);
          const matrixDeterminate = matrix.determinate();
          value = matrixDeterminate / determinate;
        }
        solution[j][0] = value;
      }
      return solution;
    }

    this.solve = (answer) => {
      const properDemension = this.properDemension();
      const matrix = properDemension.matrix;
      const fixedValues = properDemension.fixedValues;
      const solution = new Matrix(null, columns, 1);
      answer ||= new Array(columns).fill(0);
      let consiseIndex = 0;
      const determinate = matrix.determinate();
      for (let j = 0; j < columns; j++) {
        let value;
        if (fixedValues[j] !== undefined) value = fixedValues[j];//new Number(fixedValues[j]);
        else {
          const detMat = matrix.copy()
          detMat.replaceColumn(consiseIndex++, answer);
          const matrixDeterminate = detMat.determinate();
          value = matrixDeterminate / determinate;
        }
        solution[j][0] = value;
      }
      return solution;
    }

    this.dot = (other) => {
      if (this.columns() !== other.rows()) throw new Error('this.columns() and other.rows() much match for a dot product');
      const result = new Matrix(null, this.rows(), other.columns());
      let ri = 0;
      let rj = 0;
      for (let i = 0; i < rows; i++) {
        for (let oj = 0; oj < other.columns(); oj++) {
          let value = 0;
          for (let j = 0; j < columns; j++) {
            value = value + this[i][j] * other[j][oj];
          }
          result[i][oj] = value;
        }
      }
      return result;
    }

    this.scale = (coef, oddOnly) => {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          if (!oddOnly || (i + j) % 2 === 1) {
            this[i][j] = this[i][j] * coef;
          }
        }
      }
    }

    this.approximate = (accuracy) => {
      const approximate = Approximate.new(accuracy);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          this[i][j] = approximate(this[i][j]);
        }
      }
    }

    this.transpose = () => {
      const rows = this.rows();
      const cols = this.columns();
      const result = new Matrix(null, cols, rows);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          result[j][i] = this[i][j];
        }
      }
      return result;
    }

    this.diagonal = () => {
      const rows = this.rows();
      const cols = this.columns();
      const result = new Matrix(null, cols, rows);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i + j !== rows - 1) {
            result[rows - i - 1][cols - j - 1] = this[i][j];
          } else {
            result[i][j] = this[i][j];
          }
        }
      }
      return result;
    }

    this.multiply = (other) => {
      const result = new Matrix(null, this.rows(), other.columns());
      for (let i = 0; i < this.rows(); i++) {
        for (let j = 0; j < this.columns(); j++) {
          let sum = 0
          for (let k = 0; k < other.rows(); k++) {
            sum = sum + this[i][k] * other[k][j]
            result[i][j] = sum
          }
        }
      }
      return result;
    }

    this.inverse = () => {
      let inverse;
      if (this.rows() === 2) {
        inverse = this.diagonal();
        inverse.scale(-1, true);
        inverse.scale(1/this.determinate());
        return inverse;
      }

      const rows = this.rows();
      const cols = this.columns();
      inverse = new Matrix(null, rows, columns);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const minor = this.remove(i, j);
          const value = minor.determinate();
          inverse[i][j] = value;
        }
      }
      inverse.scale(-1, true);
      inverse = inverse.transpose();
      inverse.scale(1/this.determinate());
      return inverse;
    }

    this.toString = (formatFunc) => {
      const maxLen = {before: 1, after: 0};
      formatFunc ||= (val) => val;
      const format = (val) => {
        val = `${formatFunc(val)}`;
        const decimalIndex = val.indexOf('.');
        let spaceBefore, spaceAfter;
        if (decimalIndex === -1) {
          spaceBefore = new Array(maxLen.before - val.length).fill(' ').join('');
          spaceAfter = new Array(maxLen.after).fill(' ').join('');
        } else {
          spaceBefore = new Array(maxLen.before - decimalIndex).fill(' ').join('');
          spaceAfter = new Array(maxLen.after - (val.length - decimalIndex)).fill(' ').join('');
        }
        return `${spaceBefore}${val}${spaceAfter}`;

      }
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          let string = `${formatFunc(this[i][j])}`;
          const decimalIndex = string.indexOf('.');
          if (decimalIndex === -1) {
            if (string.length > maxLen.before) maxLen.before = string.length;
          } else {
            const beforeLen = decimalIndex;
            if (beforeLen > maxLen.before) maxLen.before = beforeLen;
            const afterLen = string.length + 1 - decimalIndex;
            if (afterLen > maxLen.after) maxLen.after = afterLen;
          }
        }
      }

      let str = '';
      for (let i = 0; i < rows; i++) {
        str += '|'
        for (let j = 0; j < columns; j++) {
          str += `${format(this[i][j])}`;
        }
        str += '|\n'
      }
      return str.substring(0, str.length - 1);
    }

    this.approxToString = (accuracy) => {
      const approximate = Approximate.new(accuracy);
      return this.toString((val) => approximate(val));
    }

    this.equals = (other) => {
      if (other.rows() !== rows || other.columns() !== columns) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          if (!within(other[i][j], this[i][j])) return false;
        }
      }
      return true;
    }

    this.copy = () => new Matrix(this);

  }
}

Matrix.identity = (rows) => {
  let identity = new Matrix(null, rows, rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < rows; j++) {
      if (i === j) identity[i][i] = 1;
      else identity[i][j] = 0;
    }
  }
  return identity;
}

Matrix.rotation = function (roll, pitch, yaw) {
  if (roll instanceof Object) {
    pitch = Math.toRadians(roll.y);
    yaw = Math.toRadians(roll.z);
    roll = Math.toRadians(roll.x);
  }
  roll ||= 0;
  pitch ||= 0;
  yaw ||= 0;
  var cosa = Math.cos(yaw);
  var sina = Math.sin(yaw);

  var cosb = Math.cos(pitch);
  var sinb = Math.sin(pitch);

  var cosc = -1*Math.cos(roll);
  var sinc = -1*Math.sin(roll);

  var Axx = cosa*cosb;
  var Axy = cosa*sinb*sinc - sina*cosc;
  var Axz = cosa*sinb*cosc + sina*sinc;

  var Ayx = sina*cosb;
  var Ayy = sina*sinb*sinc + cosa*cosc;
  var Ayz = sina*sinb*cosc - cosa*sinc;

  var Azx = -sinb;
  var Azy = cosb*sinc;
  var Azz = cosb*cosc;

  return new Matrix([
    [Axx, Axy, Axz],
    [Ayx, Ayy, Ayz],
    [Azx, Azy, Azz],
  ]);
}

Matrix.fromGL = (glMatrix) => {
  return new Matrix( [[glMatrix[0], glMatrix[1], glMatrix[2], glMatrix[3]],
                      [glMatrix[4], glMatrix[5], glMatrix[6], glMatrix[7]],
                      [glMatrix[8], glMatrix[9], glMatrix[10],  glMatrix[11]],
                      [glMatrix[12], glMatrix[13], glMatrix[14],  glMatrix[15]]]);
}

Matrix.fromVertex = (vertex) => {
  return new Matrix( [[vertex.x],
                      [vertex.y],
                      [vertex.z],
                      [1]]);
}

Matrix.mapObjects = (objects, attrs) => {
  const matrix = new Matrix(null, attrs.length, attrs.length);
  const val = (funcOval) => (typeof funcOval) === 'function' ? funcOval() : funcOval;
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    for (let j = 0; j < attrs.length; j++) {
      matrix[i][j] = Function.orVal(obj[attrs[j]]);
    }
  }
  return matrix;
}

module.exports = Matrix;
