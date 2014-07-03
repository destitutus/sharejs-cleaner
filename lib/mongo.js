'use strict';

var q = require('q');
var MongoClient = require('mongodb').MongoClient;

var Mongo = module.exports = function Mongo(config) {
    this.connection = null;
    this.config = config;
};

Mongo.prototype._dbConnection = function () {
    if (this.connection !== null) {
        return this.connection;
    }
    var deferred = q.defer();
    var self = this;
    MongoClient.connect(this.config.url, this.config.options, function (err, db) {
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

Mongo.prototype.cleanup = function (docName) {
    console.log('mc:1');
    var self = this;
    return this._dbConnection().then(function (db) {
        console.log('mc:3');
        var deferred = q.defer();
        var opsCollection = self.config.collection + '_ops';
        console.log('opsCollection', opsCollection);
        db.collection(self.config.collection).remove({_id: docName}, function (err) {
            console.log('mc:4');
            if (err) {
                deferred.reject();
            } else {
                db.collection(opsCollection).remove({name: docName}, function (err) {
                    console.log('mc:5');
                    if (err) {
                        deferred.reject();
                    } else {
                        console.log('mc:6');
                        deferred.resolve();
                    }
                });
            }
        });
        return deferred.promise;
    });
};

Mongo.prototype.findCleanup = function () {
    var self = this;
    var lessDate = (new Date()).getTime() - this.config.options.cleanupOps;
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