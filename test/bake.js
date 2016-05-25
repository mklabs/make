const cli = require('gentle-cli');
const { join } = require('path');

describe('Bake cli', () => {
  let bake = (cmd) => {
    return cli()
      .use('node ' + join(__dirname, '../bin/bake.js') + ' ' + cmd);
  };

  it('Outputs help', (done) => {
    bake('-h')
      .expect('bake <target...> [options]')
      .expect('Options:')
      .expect(0)
      .end(done);
  });

  it('bake foo', (done) => {
    bake('foo')
      .expect('prefoo\nblahblah\nfoo')
      .expect(0)
      .end(done);
  });

  it('bake all', (done) => {
    bake('all')
      .expect('prefoo\nblahblah\nfoo\nfoo2\nblahblah\nfoobar')
      .expect(0)
      .end(done);
  });

  it('bake maoow - Outputs help on UNKNOWN_TARGET', (done) => {
    bake('maoow')
      .expect('bake <target...> [options]')
      .expect('Options:')
      .expect(0)
      .end(done);
  });
});
