var start = Date.now();

const fs         = require('fs');
const path       = require('path');
const minimist   = require('minimist');
const chalk      = require('chalk');
const logsymbols = require('log-symbols');
const { spawn }  = require('child_process');

const padding = 20;

const exists = fs.existsSync;

const bake = require('..');
const log  = bake.log;

const opts = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
    d: 'debug'
  }
});

if (opts.debug && !process.env.DEBUG) {
  process.env.DEBUG = 'bake*';
}

const debug = require('debug')('bake');

// Init
let env = process.env;
env.PATH += (process.platform === 'win32' ? ';' : ':') + path.resolve('./node_modules/.bin');

const bakefile = exists('Bakefile') ? 'Bakefile' :
  exists('Makefile') ? 'Makefile' : '';

if (opts.help && !bakefile) {
  help();
  process.exit(0);
}

if (opts.version)  {
  console.log(require('../package.json').version);
  process.exit(0);
}

if (!bakefile) {
  fail('No Makefile/Bakefile in the current folder');
}

let file = fs.readFileSync(bakefile, 'utf8');
let result = bake(file);

let targets = result.targets;
let variables = result.variables;

if (opts.help) {
  help(targets);
  process.exit(0);
}

let argv = opts._;
if (bakefile !== 'Bakefile' && bakefile !== 'Makefile') argv = argv.slice(1);
if (!argv[0]) argv[0] = 'all';

// Run

(function next(targetName) {
  if (!targetName) return end();

  executeTarget(targetName, function(err) {
    if (err) return fail(opts.debug ? err : err.message);
    next(argv.shift());
  });
})(argv.shift());


// Functions

function executeTarget(targetName, cb) {
  if (!targets[targetName]) {
    help(targets);
    return cb(new Error('No target matching "' + targetName + '"'));
  }

  log.info('Invoking %s target', targetName);

  var target = targets[targetName];
  executeRecipe(target, targetName, function(err) {
    if (err) return cb(err);
    cb();
  });
}

function executeRecipe(target, targetName, cb) {
  var prerequities = target.prerequities;

  if (!prerequities.length) return executeRules(target, cb);

  executePrereq(target, function(err) {
    if (err) return fail(err);

    executeRules(target, cb);
  });

}

function executePrereq(target, cb) {
  var prerequities = target.prerequities;

  // Before executing this recipe, execute any prerequities first
  (function nextPrereq(pre) {
    if (!pre) return cb();

    executeTarget(pre, function(err) {
      if (err) return cb(err);
      nextPrereq(prerequities.shift());
    });

  })(prerequities.shift());
}

function executeRules(target, cb) {
  var recipe = target.recipe;
  return new Promise((r, errback) => {
    var sh = spawn('bash', ['-c', recipe], {
      stdio: 'inherit',
      env: env
    });

    sh.on('error', cb);

    sh.on('close', (code) => {
      if (code != 0) {
        return new Error('%s exited with code %d', target.name, code);
      }

      cb();
    });
  });
}

function help(targets = []) {
  console.log(`
  $ bake <target> [options]

  Options:
    -h, --help         Show this help
    -v, --version      Show package version
    -d, --debug        Enable extended output
  `);

  if (Object.keys(targets).length) console.log('  Targets:');

  var keys = Object.keys(targets);
  var str = keys.map(function(t) {
    let pad = new Array(padding - t.length).join(' ');
    return '    ' + t + pad + 'Run target ' + t;
  });

  console.log(str.join('\n'));
  console.log();
}

function fail() {
  log.error.apply(log, arguments);
  process.exit(1);
}

function end() {
  var time = Date.now() - start;
  log.info(logsymbols.success + ' Build sucess in %sms', time);
}
