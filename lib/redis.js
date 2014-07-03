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
    console.log('Redis.prototype.cleanup:1');
    var self = this;
    var deferred = q.defer();
    console.log('Redis.prototype.cleanup:2');
    var versionName = self._versionCollectionName(docName);
    console.log('cleanup redis', versionName);
    this.client.del(versionName, function (err) {
        console.log('redis:1', err);
        if (err) {
            deferred.reject();
        } else {
            var opLogName = self._opLogCollectionName(docName);
            console.log('cleanup redis', opLogName);
            self.client.del(opLogName, function (err) {
                console.log('redis:2', err);
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