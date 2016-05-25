const cli = require('gentle-cli');

describe('Bake cli', () => {

  it('Outputs help', (done) => {
    cli()
      .use('bake -h')
      .expect('bake <target...> [options]')
      .expect('Options:')
      .expect(0)
      .end(done);
  });

  it('bake foo', (done) => {
    cli()
      .use('bake foo')
      .expect('prefoo\nblahblah\nfoo')
      .expect(0)
      .end(done);
  });

  it('bake all', (done) => {
    cli()
      .use('bake')
      .expect('prefoo\nblahblah\nfoo\nfoo2\nblahblah\nfoobar')
      .expect(0)
      .end(done);
  });

  it('bake maoow - Outputs help on UNKNOWN_TARGET', (done) => {
    cli()
      .use('bake maoow')
      .expect('bake <target...> [options]')
      .expect('Options:')
      .expect(0)
      .end(done);
  });
});
