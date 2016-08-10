#!/usr/bin/env node

const { Template } = require('..');

var run = new Template({
  namespace: 'bake:init'
});

run.init();
