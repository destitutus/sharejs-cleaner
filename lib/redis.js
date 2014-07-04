'use strict';

var redis = require('redis');
var q = require('q');

var Redis = module.exports = function Redis(config) {
    var client = this.client = redis.createClient(config.port, config.host, config.options);
    if (config.database) {
        client.select(config.database);
    }
    this.config = config;
};

Redis.prototype._versionCollectionName = function (docName) {
    return this.config.collection + '.' + docName + ' v';
};

Redis.prototype._opLogCollectionName = function (docName) {
    return this.config.collection + '.' + docName + ' ops';
};

Redis.prototype.cleanup = function (docName) {
    var self = this;
    var deferred = q.defer();
    var versionName = self._versionCollectionName(docName);
    this.client.del(versionName, function (err) {
        if (err) {
            deferred.reject();
        } else {
            var opLogName = self._opLogCollectionName(docName);
            self.client.del(opLogName, function (err) {
                if (err) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });
        }
    });
    return deferred.promise;
};