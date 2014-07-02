'use strict';

var _ = require('lodash');
var q = require('q');
var async = require('async');
var Redis = require('./redis');
var Mongo = require('./mongo');

function cleanDoc(mongo, redis, docName, callback) {
    console.log('docName', docName);
    q.all(mongo.cleanup(docName), redis.cleanup(docName))
        .fin(callback);
}

function startCleanup(mongo, redis, data) {
    var deferred = q.defer();
    var tasks = [];
    _.each(data, function (item) {
        tasks.push(function (callback) {
            cleanDoc(mongo, redis, item._id, callback);
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

exports.clean = function (config) {
    var redis = new Redis(config.redis);
    var mongo = new Mongo(config.mongo);

    return mongo.findCleanup().then(function (data) {
        console.log('data', data);
        if (data.length > 0) {
            return startCleanup(mongo, redis, data);
        }
    });
};