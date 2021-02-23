const mySql = require('mysql');
var Mutex = require('async-mutex').Mutex;
const cleanup = require('../services/cleanup');
var mutex = new Mutex();

const limit = 1;
let count = 0;


const connectionObj = {
host: 'localhost',
user: 'CE',
password: 'ITSJUSTATESTDB',
database: 'CE'
};


const userQuery = 'SELECT * FROM USER WHERE ID=?'

function getId(i) {
  return [i % 55];
}

openConn = mySql.createConnection(connectionObj);

let queryCount = 0;
function end() {
  queryCount++;
  if (queryCount === limit) {
    const time = (new Date().getTime() - start.getTime()) / 1000;
  }
}

function mysqlOpen() {
  start = new Date();
  for (let i = 0; i < limit; i++) {
    openConn.query(userQuery, getId(i), end);
  }
}


function mysql() {
  start = new Date();
  for (let i = 0; i < limit; i++) {
    connection = mySql.createConnection(connectionObj);
    connection.connect();
    connection.end();
  }

  const time = (new Date().getTime() - start.getTime()) / 1000;
  mysqlOpen();
}

function add() {
  count++;
  if (count === limit) {
    const time = (new Date().getTime() - start.getTime()) / 1000;
    mysql();
  }
}

async function acyncAdd(release) {
  count++;
  if (count === limit) {
    const time = (new Date().getTime() - start.getTime()) / 1000;
    count = 0;
    start = new Date();
    for (let i = 0; i < limit; i++) {
      add(true);
    }
  }
  release();
}

let start = new Date();
for (let i = 0; i < limit; i++) {
  mutex.acquire().then(acyncAdd);
}

function clean() {
  openConn.end();
};

cleanup.add(clean);
