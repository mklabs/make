const fs         = require('fs');
const path       = require('path');
const minimist   = require('minimist');
const chalk      = require('chalk');
const logsymbols = require('log-symbols');
const { spawn }  = require('child_process');
const debug      = require('debug');

const padding = 20;

const exists = fs.existsSync;

const bake = require('..');
const log  = bake.log;

export default class CLI {
  get alias() {
    return {
      alias: {
        h: 'help',
        v: 'version',
        d: 'debug'
      }
    };
  }

  constructor(filename, opts = {}) {
    this.options = opts;
    this.env = this.options.env || {};
    this.argv = minimist(this.options.argv || process.argv.slice(2), this.alias);

    if (opts.debug || this.argv.debug) {
      debug.enable('bake*');
    }

    if (this.argv.help) {
      return CLI.help();
    }

    if (!filename) {
      return CLI.fail('Missing %s Makefile / Bakefile', filename);
    }

    this.debug = debug('bake:cli');
    this.start = Date.now();
    this.debug('Bake init CLI with %s options', Object.keys(opts).join(' '));

    this.bakefile = filename;
    this.init();
  }

  init() {
    let argv = this.argv;
    if (argv.help && !this.bakefile) {
      return CLI.help();
    }

    if (argv.version)  {
      return console.log(require('../package.json').version);
    }

    if (!this.bakefile) {
      log('No Makefile/Bakefile in the current folder');
      return this.generate('Makefile', argv);
    }

    this.file = fs.readFileSync(this.bakefile, 'utf8');
    this.result = bake(this.file);

    this.targets = this.result.targets;
    this.variables = this.result.variables;

    if (argv.help) {
      return CLI.help(this.targets);
    }

    let args = argv._;
    if (this.bakefile !== 'Bakefile' && this.bakefile !== 'Makefile') args = args.slice(1);
    if (!args[0]) args[0] = 'all';

    // Run!
    this.run(args);
  }

  run(targets) {
    this.debug('Run %s targets', targets.join(' '));
    var argv = targets.concat();

    return new Promise((r, errback) => {
      (function next(name) {
        if (!name) return CLI.end(this.start, r);

        this.executeTarget(name)
          .then(() => {
            next.call(this, argv.shift());
          })
          .catch((err) => {
            CLI.fail(argv.debug ? err : err.message);
            errback(err);
          });
      }).call(this, argv.shift());
    });
  }

  executeTarget(target) {
    return new Promise((r, errback) => {
      if (!this.targets[target]) {
        CLI.help(this.targets);
        return errback(new Error('No target matching "' + target + '"'));
      }

      log.info('Invoking %s target', target);
      var name = this.targets[target];
      return this.executeRecipe(name, target)
        .then(r)
        .catch(errback)
    });
  }

  executeRecipe(target, name) {
    return new Promise((r, errback) => {
      var prerequities = target.prerequities;

      // deps on this recipe, execute rules right away
      if (!prerequities.length) return this.executeRules(target)
        .then(r)
        .catch(errback);

      // found prereq, execute them before executing rules
      this.debug('Prerequities "%s" for target %s', prerequities.join(' '), name);
      return this.executePrereq(target)
        .then(() => {
          return this.executeRules(target)
            .then(r)
            .catch(errback);
        })
        .catch(errback);
    });
  }

  executePrereq(target) {
    return new Promise((r, errback) => {
      var prerequities = target.prerequities;

      // Before executing this recipe, execute any prerequities first
      (function nextPrereq(pre) {
        if (!pre) return r();

        this.executeTarget(pre)
          .catch(errback)
          .then(() => {
            nextPrereq.call(this, prerequities.shift());
          });
      }).call(this, prerequities.shift());
    });
  }

  executeRules(target) {
    var recipe = target.recipe;
    return new Promise((r, errback) => {
      this.debug('bash:', recipe);

      var sh = spawn('bash', ['-c', recipe], {
        stdio: 'inherit',
        env: this.env
      });

      sh.on('error', errback);

      sh.on('close', (code) => {
        if (code != 0) {
          return errback(new Error('%s exited with code %d', target.name, code));
        }

        r();
      });
    });
  }

  static help(targets = []) {
    console.log(`
  $ bake <target> [options]

  Options:
    -h, --help         Show this help
    -v, --version      Show package version
    -d, --debug        Enable extended output
    `);

    if (Object.keys(targets).length) console.log('  Targets:');

    var keys = Object.keys(targets);
    var str = keys.map((t) => {
      let pad = new Array(padding - t.length).join(' ');
      return '    ' + t + pad + 'Run target ' + t;
    });

    console.log(str.join('\n'));
    console.log();
  }

  static fail() {
    log.error.apply(log, arguments);
    process.exit(1);
  }

  static end(start, cb) {
    var time = Date.now() - start;
    log.info(logsymbols.success + ' Build sucess in %sms', time);
    cb && cb();
  }
}
