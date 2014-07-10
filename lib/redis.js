'use strict';

var redis = require('redis');
var q = require('q');
var log = require('./logger').getLogger('redis');

var Redis = module.exports = function Redis(config) {
    log.debug('Configure redis');
    var client = this.client = redis.createClient(config.port, config.host, config.options);
    if (config.database) {
        log.debug('Select redis db #' + config.database);
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

// Cleanup given document
//
// name - The String with document name for cleanup
// returns promise
Redis.prototype.cleanup = function (docName) {
    log.debug('redis cleanup for ' + docName);
    var self = this;
    var deferred = q.defer();
    var versionName = self._versionCollectionName(docName);
    this.client.del(versionName, function (err) {
        log.debug('Cleanup version collection done with error ' + err + ' for ' + docName + ':' + versionName);
        if (err) {
            deferred.reject();
        } else {
            var opLogName = self._opLogCollectionName(docName);
            self.client.del(opLogName, function (err) {
                log.debug('Cleanup ops collection done with error ' + err + ' for ' + docName + ':' + opLogName);
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