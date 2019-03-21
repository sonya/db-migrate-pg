var vows = require('vows');
var assert = require('assert');
var dataType = require('db-migrate-shared').dataType;
var driver = require('../');
var log = require('db-migrate-shared').log;
var semver = require('semver');

var config = require('./db.config.json').pg;
var db;
var version;

var internals = {};
internals.mod = {
  log: log,
  type: dataType
};
internals.interfaces = {
  SeederInterface: {},
  MigratorInterface: {}
};
internals.migrationTable = 'migrations';
log.silence(true);

function getPartitionInfo (db, tableName, callback) {
  var sql = 'select pg_get_partkeydef(oid) ' +
    'from pg_class ' +
    "where relkind = 'p' " +
    "and relname = '" + tableName + "'";

  db.runSql(sql, function (err, metadata) {
    var result = null;
    if (!err && metadata.rows.length) {
      result = metadata.rows[0].pg_get_partkeydef;
    }
    return callback(err, result);
  });
}

vows
  .describe('pg')
  .addBatch({
    connect: {
      topic: function () {
        driver.connect(config, internals, this.callback);
      },

      'is connected': function (err, _db) {
        assert.isNull(err);
        db = _db;
      }
    }
  })
  .addBatch({
    determineVersion: {
      topic: function () {
        db.determineVersion(this.callback);
      },

      'has valid version': function (err, _version) {
        assert.isNull(err);
        version = _version;
      }
    }
  })
  .addBatch({
    'partition by list': {
      topic: function () {
        db.createTable(
          'partitioned_by_list', {
            columns: {
              key: dataType.STRING
            },
            partitionBy: 'LIST (key)'
          },
          this.callback.bind(this)
        );
      },

      'has table metadata': {
        topic: function () {
          getPartitionInfo(db, 'partitioned_by_list', this.callback);
        },

        'is partitioned by LIST (key)': function (err, partitionDef) {
          if (semver.gte(version, '10.0.0')) {
            assert.isNull(err);
            assert.strictEqual(partitionDef, 'LIST (key)');
          } else {
            assert.isNotNull(err);
          }
        }
      },

      teardown: function () {
        db.dropTable('partitioned_by_list', this.callback);
      }
    },

    'partition by range': {
      topic: function () {
        db.createTable(
          'partitioned_by_range', {
            columns: {
              date: {
                type: 'TIMESTAMP'
              }
            },
            partitionBy: 'RANGE (date)'
          },
          this.callback.bind(this)
        );
      },

      'has table metadata': {
        topic: function () {
          getPartitionInfo(db, 'partitioned_by_range', this.callback);
        },

        'is partitioned by RANGE (date)': function (err, partitionDef) {
          if (semver.gte(version, '10.0.0')) {
            assert.isNull(err);
            assert.strictEqual(partitionDef, 'RANGE (date)');
          } else {
            assert.isNotNull(err);
          }
        }
      },

      teardown: function () {
        db.dropTable('partitioned_by_range', this.callback);
      }
    }
  })
  .addBatch({
    'partition by hash': {
      topic: function () {
        db.createTable(
          'partitioned_by_hash', {
            columns: {
              txt: { type: dataType.TEXT, notNull: true, defaultValue: 'foo' }
            },
            partitionBy: 'HASH (txt)'
          },
          this.callback.bind(this)
        );
      },

      'has table metadata': {
        topic: function () {
          getPartitionInfo(db, 'partitioned_by_hash', this.callback);
        },

        'is partitioned by HASH (txt)': function (err, partitionDef) {
          if (semver.gte(version, '11.0.0')) {
            assert.isNull(err);
            assert.strictEqual(partitionDef, 'HASH (txt)');
          } else if (semver.gte(version, '10.0.0')) {
            // HASH is not recognized in pg10 and the table fails to create
            // which causes the partition query to return nothing.
            // (there's likely a better way to express these version tests)
            assert.isNull(err);
            assert.isNull(partitionDef);
          } else {
            assert.isNotNull(err);
          }
        }
      },

      teardown: function () {
        db.dropTable('partitioned_by_hash', this.callback);
      }
    }
  })
  .export(module);
