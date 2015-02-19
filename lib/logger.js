'use strict';
var log4js = require('log4js');
var _ = require('lodash');

var loggers = [];

exports.level = 'ERROR';

// Configure logger system
//
// config - The object with logger configuration
exports.configure = function (config) {
    var logFolder = __dirname + '/../logs';
    console.log('logFolder' + logFolder);
    // Configure Logger
    log4js.configure(config, {cwd: logFolder});
    exports.level = config.level;
    _.each(loggers, function (logger) {
        logger.setLevel(config.level);
    });
};

// Get logger with name
//
// name - The String with logger name
exports.getLogger = function (name) {
    var logger = log4js.getLogger(name);
    logger.setLevel(exports.level);
    loggers.push(logger);
    return logger;
};