
const chalk  = require('chalk');
const npmlog = require('npmlog');
const prefix = 'bake';
const { format } = require('util');

const { success, warning } = require('log-symbols');

let log = module.exports = npmlog;
log.heading = prefix;

// Automatic silent prefix
Object.keys(log.levels).forEach((lvl) => {
  log[lvl] = log[lvl].bind(log, '');
});

// Few logsymbols log helper
log.success = (...args) => {
  let msg = format.apply(null, args);
  log.info(`${success} ${msg}`);
};

log.warning = (...args) => {
  let msg = format.apply(null, args);
  log.info(`${warning} ${msg}`);
};
