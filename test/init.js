
const cli = require('gentle-cli');
const { join, resolve } = require('path');

describe('bake init', () => {

  let bake = (cmd) => {
    return cli({ cwd: join(__dirname, 'examples') })
      .use('node ' + join(__dirname, '../bin/bake.js') + ' ' + cmd);
  };

  it('bake init', (done) => {
    cli({ cwd: join(__dirname, 'examples') })
    bake('init --skip')
      .expect('Running default template')
      .expect(/Makefile\s+already exists, skipping/)
      .expect(/Build success in \d+ms/)
      .expect(0)
      .end(done);
  });
});
