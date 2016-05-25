const CLI            = require('./cli');
const Template       = require('./template');
const UNKNOWN_TARGET = 'target:unknown';
const parse          = require('./parser');

export default class Bake extends CLI {

  // Used to generate the help output
  get example() {
    return `bake <target...> [options]`;
  }

  get more() {
    return new Template().more;
  }

  get flags() {
    return {
      help: 'Show this help output',
      version: 'Show package version',
      debug: 'Enable extended log output',
    };
  }

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
      this.help();
      return;
    }

    this.debug('Bake init CLI with %s options', Object.keys(opts).join(' '));

    this.bakefile = filename;

    this.target = this.args.shift();

    if (this.target === 'init') {
      this.generate(this.args.shift(), this.args);
      return;
    }

    if (!filename) {
      Bake.fail('Missing Makefile / Bakefile', filename);
      this.info('Run "bake init" to generate a Makefile.');
      return;
    }

    process.nextTick(this.init.bind(this));
  }

  init() {
    let argv = this.argv;
    if (argv.help && !this.bakefile) {
      return this.help();
    }

    if (argv.version)  {
      console.log(require('../package.json').version);
      return this;
    }

    this.file = this.read(this.bakefile);
    this.result = parse(this.file);

    this.targets = this.result.targets;
    this.variables = this.result.variables;

    let first = this.target || 'all';
    if (!this.targets[first]) {
      this.debug('No target %s', first);
      if (first === 'all') return this.help(this.targets);
      return this.noTarget(first);
    }

    if (argv.help) {
      return this.help(this.targets);
    }

    let args = this.argv._;
    if (first === 'all' && !args.length) args = ['all'];

    // Run!
    return this.run(first, args);
  }

  run(target, targets) {
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

  noTarget(target) {
    this.debug('Emit %s', UNKNOWN_TARGET);
    let handler = this.emit(UNKNOWN_TARGET, target, this.targets);
    this.debug('Handled', handler);

    return new Promise((r, errback) => {
      if (handler) return errback();

      this.help(this.targets);
      return errback(new Error('No target matching "' + target + '"'));
    });
  }

  executeTarget(target) {
    return new Promise((r, errback) => {
      if (!this.targets[target]) {
        return this.noTarget(target);
      }

      this.info('Invoking %s target', target);
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
    return this.exec(target.recipe);
  }

  generate(name = 'default', args = this.argv._) {
    this.debug('Argv', process.argv);
    var template = new Template({
      namespace: 'bake:init',
      argv: process.argv.slice(3)
    });

    if (this.argv.help) return template.help();

    return template.run(name, args)
      .then(template.end.bind(template));
  }
}

Bake.UNKNOWN_TARGET = UNKNOWN_TARGET;
