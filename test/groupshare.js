require('dotenv').config({path: 'credentials.env'});
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const assert = require('assert');
const nock = require('nock');
const setup = require('./helpers/setup');
const topStories = require('./data/topstories');
const bingSearch = require('./data/bingsearch');
const article = require('./data/article');
let request;

function assertStory($){
  return function(){
    const href = $(this).find('a').attr('href');
    const shortTeaserTitle = $(this).find('a').data('short-teaser-title');
    const shortTeaserText = $(this).find('a').data('short-teaser-text');
    const imgSrcProxied = $(this).find('img').attr('src');
    const rimgSrc = $(this).find('a').data('image');
    const title = $(this).text().trim();
    assert(href.match(/http:\/\/www.abc.net.au\/news\/.*\/\d+/), 'should look like a proper URL');
    assert(!!shortTeaserTitle, 'should have a short teaser title');
    assert(!!shortTeaserText, 'should have a short teaser text');
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
    nock('https://content-gateway.abc-prod.net.au')
      .get('/api/v2/content/id/8418312')
      .reply(200, topStories);

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
    // get the top stories index
    nock('https://content-gateway.abc-prod.net.au')
      .get(/.*/)
      .reply(200, topStories);

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
