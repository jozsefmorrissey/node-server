
const Approximate = require('../../../../../public/js/utils/approximate.js');

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

    this.solve = (answer) => {
      const solution = new Matrix(null, columns, 1);
      answer ||= new Array(columns).fill(0);
      const determinate = this.determinate();
      for (let j = 0; j < columns; j++) {
        const matrix = this.copy()
        matrix.replaceColumn(j, answer);
        const matrixDeterminate = matrix.determinate();
        solution[j][0] = matrixDeterminate / determinate;
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

    this.toString = () => {
      let str = '';
      for (let i = 0; i < rows; i++) {
        str += '|'
        for (let j = 0; j < columns; j++) {
          str += `${this[i][j]}  `;
        }
        str = str.substring(0, str.length - 2) + '|\n'
      }
      return str.substring(0, str.length - 1);
    }

    this.equals = (other) => {
      if (other.rows() !== rows || other.columns() !== columns) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          if (other[i][j] !== this[i][j]) return false;
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

module.exports = Matrix;
