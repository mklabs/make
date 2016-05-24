#!/usr/bin/env node

const { CLI } = require('..');
var init = new CLI({
  namespace: 'bake:init'
});

console.log(init);
