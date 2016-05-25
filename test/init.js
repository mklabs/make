
const cli = require('gentle-cli');
const { join, resolve } = require('path');

describe('bake init', () => {

  it('bake init', (done) => {
    cli({ cwd: join(__dirname, 'examples') })
      .use('bake init --skip')
      .expect('Running default template')
      .expect(/Makefile\s+already exists, skipping/)
      .expect(/Build success in \d+ms/)
      .expect(0)
      .end(done);
  });
});
