require('dotenv').config({path: 'credentials.env'});
const supertest = require('supertest');
const assert = require('assert');
const setup = require('./helpers/setup');
let request;

function assertStory($){
  return function(){
    const href = $(this).find('a').attr('href');
    const shortTeaserTitle = $(this).find('a').attr('href');
    const shortTeaserText = $(this).find('a').attr('href');
    const imgSrc = $(this).find('img').attr('src');
    const title = $(this).text().trim();

    assert(href.match(/http:\/\/www.abc.net.au\/news\/.*\/\d+/), 'should look like a proper URL');
    assert(!!shortTeaserTitle, 'should have a short teaser title');
    assert(!!shortTeaserText, 'should have a short teaser text');
    assert(!!imgSrc, 'should have an image src');
    assert(!!title, 'should have a title');
  }
}

describe('groupshare', function(){
  this.timeout(10000);
  before(done => {
    setup((error, app) => {
      if(error) throw error();
      request = supertest(app);
      done();
    });
  });

  it('should get index', (done) => {
    request
      .get('/groupshare')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .catch(done)
      .then(response => {
        const cheerio = require('cheerio')
        const $ = cheerio.load(response.text);

        const $items = $('.main > ul > li');
        assert.deepEqual($items.length, 12, 'Should have 12 items');
        $items.each(assertStory($));
        done();
      });
  });

  it('should perform a search', (done) => {
    request
      .get('/groupshare?search=battery')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .catch(done)
      .then(response => {
        const cheerio = require('cheerio')
        const $ = cheerio.load(response.text);

        // search results
        const $lists = $('.main > ul');
        $lists.find('li').eq(0).each(assertStory($));

        // top stories
        assert.deepEqual($lists.eq(1).find('li').length, 12, 'Should have 12 top stories');
        $lists.find('li').eq(1).each(assertStory($));
        done();
      })
      .catch(done);
  });
})
