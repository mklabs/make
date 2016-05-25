var bake = module.exports;

bake.log = require('./src/log');
bake.parser = require('./src/parser');

bake.CLI = require('./src/cli');
bake.Bake = require('./src/bake');
bake.Template = require('./src/template');
