const execa = require('execa');

describe('serving data on port 8081', () => {
  let server;

  before(done => {
    server = execa('eleventy', ['--serve', '--port=8081'], {
      preferLocal: true,
      silent: true,
    });
    server.stdout.on('data', data => {
      if (/Serving files from: _site/.test(data.toString())) {
        return done();
      }
    });
  });

  after(() => {
    server.cancel();
  });

  describe('getting root document', () => {
    it('should be able to get root document from server', async () => {
      expect(await request('http://localhost:8081').get('/')).to.have.status(200);
    });
  });
});
