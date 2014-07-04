'use strict';

var q = require('q');
var MongoClient = require('mongodb').MongoClient;
var log = require('./logger').getLogger('redis');

var Mongo = module.exports = function Mongo(config) {
    this.connection = null;
    this.config = config;
};

// Get mongo database connection
// Returns promise
Mongo.prototype._dbConnection = function () {
    if (this.connection !== null) {
        return this.connection;
    }
    var deferred = q.defer();
    var self = this;
    MongoClient.connect(this.config.url, this.config.options, function (err, db) {
        log.debug('Mongo connection done with error ' + err);
        if (err || !db) {
            self.connection = null;
            deferred.reject(err);
            return;
        }
        db.on('close', function () {
            self.connection = null;
        });
        deferred.resolve(db);
    });
    self.connection = deferred.promise;
    return self.connection;
};

// Cleanup given document
//
// name - The String with document name for cleanup
// returns promise
Mongo.prototype.cleanup = function (docName) {
    log.debug('mongo clenup for ' + docName);
    var self = this;
    return this._dbConnection().then(function (db) {
        var deferred = q.defer();
        var opsCollection = self.config.collection + '_ops';
        db.collection(self.config.collection).remove({_id: docName}, function (err) {
            log.debug('ops log cleanup done with error ' + err + ' for ' + docName);
            if (err) {
                deferred.reject();
            } else {
                db.collection(opsCollection).remove({name: docName}, function (err) {
                    log.debug('document cleanup done with error ' + err + ' for ' + docName);
                    if (err) {
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                });
            }
        });
        return deferred.promise;
    });
};

// Search documents for cleanup
// returns promise
Mongo.prototype.findCleanup = function () {
    var self = this;
    var lessDate = (new Date()).getTime() -
        (this.config.options.cleanupOps * 1000); // from s to ms
    log.debug('Search docs for cleanup, docs less then ' + lessDate);
    return this._dbConnection().then(function (db) {
        var deferred = q.defer();
        db.collection(self.config.collection).find({'_m.ctime': {'$lt': lessDate}}, {'_id': 1})
            .toArray(function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
        return deferred.promise;
    });
};