
const chalk = require('chalk');
const npmlog = require('npmlog');
const prefix = 'bake';

let log = module.exports = npmlog;
log.heading = prefix;

// Automatic silent prefix
Object.keys(log.levels).forEach((lvl) => {
  log[lvl] = log[lvl].bind(log, '');
});
