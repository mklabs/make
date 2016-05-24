#!/usr/bin/env node

const fs        = require('fs');
const path      = require('path');
const { spawn } = require('child_process');
const { CLI }   = require('..');

const { existsSync: exists } = fs;
const assign = Object.assign || require('object-assign');

// Init
let separator = process.platform === 'win32' ? ';' : ':';

let env = assign({}, process.env, {
  PATH: process.env.PATH + separator + path.resolve('./node_modules/.bin')
});

const bakefile = exists('Bakefile') ? 'Bakefile' :
  exists('Makefile') ? 'Makefile' :
  '';

let cli = new CLI(bakefile, {
  env: env
});
