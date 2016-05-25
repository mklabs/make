
const cli = require('gentle-cli');
const { join, resolve } = require('path');

describe('bake init', () => {

  it('bake init', (done) => {
    cli({ cwd: join(__dirname, 'examples') })
      .use('bake init')
      .expect('Running default template')
      .expect('Makefile already exists, skipping this file')
      .expect(/Build success in \d+ms/)
      .expect(0)
      .end(done);
  });
});
