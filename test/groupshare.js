require('dotenv').config({path: 'credentials.env'});
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const assert = require('assert');
const nock = require('nock');
const setup = require('./helpers/setup');
const topStories = fs.readFileSync(path.join(__dirname, './data/topstories.rss'), 'utf8');
const quizzes = fs.readFileSync(path.join(__dirname, './data/quizzes.rss'), 'utf8');
const bingSearch = require('./data/bingsearch');
const article = require('./data/article');
let request;

function assertStory($){
  return function(){
    const href = $(this).find('a').attr('href');
    const shortTeaserTitle = $(this).find('a').data('short-teaser-title');
    const shortTeaserText = $(this).find('a').data('short-teaser-text');
    const imgSrcProxied = $(this).find('img').attr('src');topStories
    const rimgSrc = $(this).find('a').data('image');
    const title = $(this).text().trim();
    assert(href.match(/http:\/\/www.abc.net.au\/news\/.*\/\d+/), 'should look like a proper URL');
    assert(!!shortTeaserTitle, 'should have a short teaser title');
    assert(!!shortTeaserText, 'should have a short teaser text');
    assert(!shortTeaserText.includes('<p>'), 'should not contain <p> tags');
    assert(!!imgSrcProxied, 'should have a proxied image src');
    assert(!!rimgSrc, 'should have a rimage');
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
    nock('http://www.abc.net.au').get('/news/feed/8418312/rss.xml').reply(200, topStories);
    nock('http://www.abc.net.au').get('/news/feed/8447910/rss.xml').reply(200, quizzes);

    request
      .get('/groupshare')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .catch(done)
      .then(response => {
        const cheerio = require('cheerio')
        const $ = cheerio.load(response.text);

        const $topStories = $('.main > ul.collection-8418312 > li');
        assert.deepEqual($topStories.length, 12, 'Should have 12 topStories');
        $topStories.each(assertStory($));

        const $quizzes = $('.main > ul.collection-8447910 > li');
        assert.deepEqual($quizzes.length, 8, 'Should have 12 quizzes');
        $quizzes.each(assertStory($));
        done();
      })
      .catch(done);
  });

  it('should perform a search', (done) => {
    // get the top stories index
    nock('http://www.abc.net.au').get('/news/feed/8418312/rss.xml').reply(200, topStories);
    nock('http://www.abc.net.au').get('/news/feed/8447910/rss.xml').reply(200, quizzes);

    // get the Bing search
    nock('https://api.cognitive.microsoft.com')
      .get(/.*/)
      .delay(10)
      .reply(200, bingSearch);

    // bing search requests each story individually
    nock('https://content-gateway.abc-prod.net.au')
      .get(/.*/)
      .times(100)
      .reply(200, article);

    request
      .get('/groupshare?search=battery')
      .expect(200)
      .expect('Content-Type', /text\/html/)
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
