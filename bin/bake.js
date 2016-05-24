#!/usr/bin/env node

const fs        = require('fs');
const path      = require('path');
const bake      = require('..');
const debug     = require('debug')('bake');
const which     = require('which');

const { existsSync: exists } = fs;
const { spawn } = require('child_process');
const { format } = require('util');

const { CLI, Bake } = bake;
const { verbose, info, warn, error  } = bake.log;
const { fail } = CLI;

const assign = Object.assign || require('object-assign');

// Init
let separator = process.platform === 'win32' ? ';' : ':';

let env = assign({}, process.env, {
  PATH: process.env.PATH + separator + path.resolve('./node_modules/.bin')
});

const bakefile = exists('Bakefile') ? 'Bakefile' :
  exists('Makefile') ? 'Makefile' :
  '';

let build = new bake.Bake(bakefile, {
  env: env
});

build.on(bake.Bake.UNKNOWN_TARGET, (target, targets) => {
  info('No target matching %s', target, build.argv);
  var cmd = 'bake-' + target;
  var filename = which.sync(cmd);

  var args = build.argv._.slice(1);

  info('Exec %s', cmd, args.join(' '));
  var sh = spawn(filename, args, {
    stdio: 'inherit',
    env: build.env
  });

  sh.on('error', fail.bind(null));

  sh.on('close', (code) => {
    if (code !== 0) {
      return fail(new Error(format('%s exited with code %d', cmd, code)));
    }
  });
});
