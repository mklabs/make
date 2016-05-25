import fs         from 'fs';
import path       from 'path';
import CLI        from './cli';
import { Stream } from 'stream';

// import existSync as exists from 'fs';
const { existsSync: exists } = fs;

// Basic scaffolding command
//
// Its purpose is to init a project Makefile with sensible defaults for various
// development needs.
//
// The default list of templates should be configurable. Adding new ones or
// overriding existing ones should be a simple process.
//
// Looking in
//
// - ~/.config/bake/templates
// - ~/.bake/templates
//
// Where the templates directories have the following structure:
//
// .
// ├── es6
// │   ├── Makefile
// │   └── package.json
// └── node
//     └── Makefile
//
//
// The subdirectory name is the template name (invoked with bake init <name>).
//
// If no name is defined, it defaults to "default"
//
// Files
//
// - Makefile     - Is the template Makefile to use
// - package.json - JSON file to merge with project's package.json (usually to include devDepedencies)
// - *            - Every other files is copied to destination
//
// The JSON file can have a "bake" field (removed when merged with
// package.json), with the following properties:
//
// - "scripts"          - Similar to npm scripts, a list of hooks for bake to invoke
// - "scripts.start"    - Executed when the generation process starts
// - "scripts.install"  - Executed when the template has been generated
// - "scripts.end"      - Executed at the end of the process
//
// These hooks can be used to further customize the template generation (like
// running `npm install` in "scripts.install")
export default class Template extends CLI {
  get example() {
    return 'bake init <template> [options]';
  }

  get home() {
    return process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME;
  }

  // Used to parse arguments with minimist
  get alias() {
    return {
      h: 'help',
      v: 'version',
      d: 'debug',
      f: 'force'
    };
  }

  // Used to generate the help output
  get flags() {
    return {
      help: 'Show this help output',
      version: 'Show package version',
      debug: 'Enable extended log output',
      force: 'Force file write even if already existing'
    };
  }

  get directories() {
    return [
      path.join(this.home, '.config/bake/templates'),
      path.join(this.home, '.bake/templates'),
      path.join(__dirname, '../templates')
    ];
  }

  constructor(options = {}) {
    super(options);

    this.templates = this.loadTemplates();
    this.names = this.templates.map(dir => dir.name);
  }

  init() {
    if (this.argv.help) return this.help();

    this.debug('Template...', this.dir);
    let args = this.argv._;
    return this.run(args.shift(), args)
      .then(() => {
        this.end();
      });
  }

  expandTemplateDirectory(template) {
    let dir = template.dir;
    if (!exists(dir)) return template;

    let files = fs.readdirSync(dir)
      .map(this.resolve(dir))
      .filter(this.file);

    var promises = files.map((file) => {
      return this.template(file)
        .then(() => {
          this.debug('Finished streaming %s content', path.basename(file));
        });
    });

    return Object.assign({}, template, { promises });
  }

  // template(file, dest = path.resolve(file)) {
  template(file, dest = path.resolve(path.basename(file))) {
    let name = path.basename(file);
    if (name === 'package.json') return this.json(file, dest);

    return this.stream(file, dest);
  }

  json(file, dest) {
    this.debug('JSON', file, dest);
    if (exists(dest)) return this.mergeJSON(file, dest);
    return this.stream(file, dest);
  }

  mergeJSON(file, dest) {
    this.debug('Merge JSON', file, dest);
    return new Promise((r, errback) => {
      let data = require(dest);
      let json = require(file);
      let result = JSON.stringify(Object.assign(json, data, {
        bake: undefined
      }), null, 2);

      this.info('Result', result, dest);
      fs.writeFile(dest, result, (err) => {
        return err ? errback(err) : r();
      });
    });
  }

  stream(file, dest) {
    return new Promise((r, errback) => {
      let existing = exists(dest);
      let filename = path.basename(dest);
      let destname = dest.replace(path.resolve(), '.');
      let output = existing ? this.noopStream() : fs.createWriteStream(dest);
      let input = fs.createReadStream(file);

      if (existing) this.warning('%s already exists, skipping this file', filename);
      else this.info('Streaming %s file content to %s', filename, destname);

      let stream = input.pipe(output)
        .on('error', errback)
        .on('close', r);

      if (!existing) stream.on('close', this.success.bind(this, 'Finished streaming %s file', filename));
    });
  }

  run(name = 'default', args) {
    let template = this.templates.find((template) => {
      return template.name === name;
    });

    if (!template) {
      return CLI.fail('No "%s" template', name);
    }

    this.info('Running %s template', name, args.join(' '));
    template = this.expandTemplateDirectory(template);

    return Promise.all(template.promises).catch(CLI.fail);
  }

  loadTemplates() {
    let dirs = this.directories;
    this.debug('Load templates from %d directories', dirs.length);

    return dirs
      // Ignore invalid dirs
      .filter(this.exists)
      // Load template from these dirs
      .map(this.loadTemplatesFrom, this)
      // Flatten
      .reduce((a, b) => {
        return a.concat(b);
      }, [])
      // Transfrom into a mapping { name: dir }
      .map((dir) => {
        let json = path.join(dir, 'package.json');

        return {
          dir: dir,
          name: this.basename(dir),
          json: exists(json) ? require(json) : {}
        };
      });
  }

  loadTemplatesFrom(dir) {
    this.debug('Load templates from', dir);
    return fs.readdirSync(dir)
      .map(this.resolve(dir), this)
      .filter(this.directory);
  }

  has(name, names = this.names) {
    return names.indexOf(name) !== -1;
  }

  noopStream() {
    var stream = new Stream();
    stream.write = () => {};
    stream.end = () => {
      stream.emit('finish');
      stream.emit('close');
    };
    return stream;
  }

  help() {
    this.debug('Heeeeeelp', this.templates, this.names);
  }
}
