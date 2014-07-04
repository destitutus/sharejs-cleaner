'use strict';
var log4js = require('log4js');
var _ = require('lodash');

var loggers = [];

exports.level = 'ERROR';

exports.configure = function (config) {
    var logFolder = __dirname + '/../logs';
    // Configure Logger
    log4js.configure(config, {cwd: logFolder});
    exports.level = config.level;
    _.each(loggers, function (logger) {
        logger.setLevel(config.level);
    });
};

exports.getLogger = function (name) {
    var logger = log4js.getLogger(name);
    logger.setLevel(exports.level);
    loggers.push(logger);
    return logger;
};