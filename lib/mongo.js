'use strict';

var q = require('q');
var _ = require('lodash');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var log = require('./logger').getLogger('mongo');

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
        var opsCollection = db.collection(self.config.collection + '_ops');
        // we need more complex way for detect document for cleanup when check timestamp in
        // basic collection, because sharejs do not update it on opetation
        // first step - got all distinct document names
        db.collection(self.config.collection).distinct('_id', function (err, data) {
            var docsForCleanup = [];
            var tasks = [];
            _.each(data, function (docName) {
                tasks.push(function (callback) {
                    // next step is check records in oplog with time greater then cleanup date
                    opsCollection.findOne({'name': docName, 'm.ts': {$gt: lessDate}}, function (err, data) {
                        log.debug('check', docName, !data);
                        if (!data) {
                            docsForCleanup.push(docName);
                        }
                        callback(err);
                    });
                });
            });

            async.parallelLimit(tasks, 2, function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(docsForCleanup);
                }
            });
        });
        return deferred.promise;
    });
};