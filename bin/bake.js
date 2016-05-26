#!/usr/bin/env node

const fs        = require('fs');
const path      = require('path');
const debug     = require('debug')('bake');
const which     = require('which');

const { existsSync: exists } = fs;
const { spawn } = require('child_process');
const { format } = require('util');

const { CLI, Bake } = require('..');
const { verbose, info, warn, error  } = require('../src/log');
const { fail } = CLI;

const assign = Object.assign || require('object-assign');
const separator = process.platform === 'win32' ? ';' : ':';

let env = assign({}, process.env, {
  PATH: path.resolve('./node_modules/.bin') + separator + process.env.PATH
});

const bakefile = exists('Bakefile') ? 'Bakefile' :
  exists('Makefile') ? 'Makefile' :
  '';

let bake = new Bake(bakefile, {
  env: env
});

bake.on(Bake.UNKNOWN_TARGET, (target, targets) => {
  var cmd = 'bake-' + target;
  which(cmd, (err, filename) => {
    if (err) {
      fail(err.message);
      return bake.help(targets);
    }

    // var args = bake.argv._.slice(1);
    var args = process.argv.slice(3);

    info('Go for it', filename, args);
    var sh = spawn(filename, args, {
      stdio: 'inherit',
      env: bake.env
    });

    // sh.on('error', error.bind(null));

    sh.on('close', (code) => {
      if (code === 0) return;

      // fail(new Error(format('%s exited with code %d', cmd, code)));
      process.exit(code);
    });
  });
});
