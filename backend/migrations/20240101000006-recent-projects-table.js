'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

function runFile(db, file) {
  var filePath = path.join(__dirname, 'sqls', file);
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  }).then(function (data) {
    return db.runSql(data);
  });
}

exports.up = function (db) {
  return runFile(db, '20240101000006-recent-projects-table-up.sql');
};

exports.down = function (db) {
  return runFile(db, '20240101000006-recent-projects-table-down.sql');
};

exports._meta = {
  version: 1,
};
