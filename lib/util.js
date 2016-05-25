import fs   from 'fs';
import path from 'path';

const { existsSync: exists } = fs;
const debug = require('debug')('bake:util');


// FS util mixin
let util = module.exports = {
  basename(filepath) {
    return path.basename(filepath);
  },

  resolve(dir) {
    return filepath => {
      return path.join(dir, filepath);
    }
  },

  file(filepath) {
    debug('Check is file', filepath);
    return fs.statSync(filepath).isFile();
  },

  directory(filepath) {
    debug('Check is directory', filepath);
    return fs.statSync(filepath).isDirectory();
  },

  exists(filepath) {
    debug('Check %s filepath exists', filepath);
    return exists(filepath);
  },

  read(filepath, encoding = 'utf8') {
    return fs.readFileSync(filepath, encoding);
  },

  readdir(filepath) {
    return fs.readdirSync(filepath);
  }
};
