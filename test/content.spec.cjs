const { execa } = require('execa');

describe('serving data on port 8082', () => {
  let server;

  before(function(done) {
    this.timeout(10000); // 10 seconds
    server = execa('eleventy', ['--serve', '--port=8082'], {
      preferLocal: true,
    });
    const checkData = data => {
      if (/Server at http:\/\/localhost:8082\//.test(data.toString())) {
        return done();
      }
    };
    server.stdout.on('data', checkData);
    server.stderr.on('data', checkData);
  });

  after(() => {
    server.kill();
  });

  describe('getting root document', () => {
    it('should be able to get root document from server', async () => {
      const response = await fetch('http://localhost:8082');
      expect(response.status).to.equal(200);
    });
  });
});
