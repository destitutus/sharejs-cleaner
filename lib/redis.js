'use strict';

var redis = require('redis');
var q = require('q');

var Redis = module.exports = function Redis(config) {
    var client = this.client = redis.createClient(config.port, config.host, config.options);
    if (config.database) {
        client.select(config.database);
    }

    //this._redisDel = q.denodeify(client.del);
};

Redis.prototype.cleanup = function (docName) {
    console.log('Redis.prototype.cleanup', docName);
    var self = this;
    var deferred = q.defer();
    this.client.del(self.config + '.' + docName + ' v', function (err) {
        if (err) {
            deferred.reject();
        } else {
            self.client.del(self.config + '.' + docName + ' ops', function (err) {
                if (err) {
                    console.log('Redis.prototype.cleanup', err);
                    deferred.reject();
                } else {
                    console.log('Redis.prototype.cleanup', docName);
                    deferred.resolve();
                }
            });
        }
    });
    return deferred.promise;
};