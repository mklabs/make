const fs         = require('fs');
const path       = require('path');
const chalk      = require('chalk');
const { spawn }  = require('child_process');


const exists = fs.existsSync;

const bake = require('..');
const log  = bake.log;
const UNKNOWN_TARGET = 'target:unknown';
const parse = require('./parser');

export default class Bake extends bake.CLI {

  // Used to generate the help output
  get example() {
    return `bake <target...> [options]`;
  }

  // Used to generate the help output
  get flags() {
    return {
      help: 'Show this help output',
      version: 'Show package version',
      debug: 'Enable extended log output',
    };
  }

  // Used to parse arguments with minimist
  get alias() {
    return {
      h: 'help',
      v: 'version',
      d: 'debug'
    };
  }

  constructor(filename, opts = {}) {
    super(opts);

    if (this.argv.help && !filename) {
      return this.help();
    }

    if (!filename) {
      return Bake.fail('Missing %s Makefile / Bakefile', filename);
    }

    this.debug('Bake init CLI with %s options', Object.keys(opts).join(' '));

    this.bakefile = filename;

    process.nextTick(this.init.bind(this));
  }

  init() {
    let argv = this.argv;
    if (argv.help && !this.bakefile) {
      return this.help();
    }

    if (argv.version)  {
      return console.log(require('../package.json').version);
    }

    if (!this.bakefile) {
      log('No Makefile/Bakefile in the current folder');
      return this.generate('Makefile', argv);
    }

    this.file = fs.readFileSync(this.bakefile, 'utf8');
    this.result = parse(this.file);

    this.targets = this.result.targets;
    this.variables = this.result.variables;

    if (argv.help) {
      return this.help(this.targets);
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
        if (!name) return this.end(r);

        this.executeTarget(name)
          .then(() => {
            next.call(this, argv.shift());
          })
          .catch((err) => {
            Bake.fail(argv.debug ? err : err.message);
            errback(err);
          });
      }).call(this, argv.shift());
    });
  }

  executeTarget(target) {
    return new Promise((r, errback) => {
      if (!this.targets[target]) {
        this.help(this.targets);
        this.debug('Emit %s', UNKNOWN_TARGET);
        let handler = this.emit(UNKNOWN_TARGET, target, this.targets);
        this.debug('Handled', handler);
        if (handler) return errback();
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
        if (code !== 0) {
          return errback(new Error('%s exited with code %d', target.name, code));
        }

        r();
      });
    });
  }

}

Bake.UNKNOWN_TARGET = UNKNOWN_TARGET;
