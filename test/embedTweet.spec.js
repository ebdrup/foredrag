const embedTweet = require('../_filters/embedTweet');

const url = 'https://twitter.com/code_conf/status/651724049463312384';

describe.only(`fetching tweet ${url} for embedding`, () => {
  let res;
  before(async () => {
    res = await embedTweet(url);
  });

  it('should return html', () => {
    expect(res).to.be.a('string');
  });
});
