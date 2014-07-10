'use strict';

var _ = require('lodash');
var q = require('q');
var async = require('async');
var Redis = require('./redis');
var Mongo = require('./mongo');
var log = require('./logger').getLogger('cleaner');

// Cleanup documen by name
//
// mongo - The Mongo object for data manipulation
// redis - The Redis object for data manipulation
// docName - The String with document name for cleanup
// callback - The Function for async handler
function cleanDoc(mongo, redis, docName, callback) {
    log.debug('cleanDoc', docName);
    mongo.cleanup(docName).fin(function () {
        redis.cleanup(docName).fin(function () {
            callback && callback();
        });
    });
}

// Start cleanup in parallel queue
//
// mongo - The Mongo object for data manipulation
// redis - The Redis object for data manipulation
// data - The Array with data for process
// returns promise
function startCleanup(mongo, redis, data) {
    var deferred = q.defer();
    var tasks = [];
    _.each(data, function (docName) {
        tasks.push(function (callback) {
            cleanDoc(mongo, redis, docName, callback);
        });
    });
    async.parallelLimit(tasks, 2, function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

// Clean sharejs unused collections
//
// config - The object with configuration
// returns promise
exports.clean = function (config) {
    var redis = new Redis(config.redis);
    var mongo = new Mongo(config.mongo);
    log.debug('Start cleanup');
    return mongo.findCleanup().then(function (data) {
        log.debug('Count docs for cleanup is ' + data.length);
        if (data.length > 0) {
            return startCleanup(mongo, redis, data);
        }
    });
};