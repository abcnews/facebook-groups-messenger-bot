const imageUrl = require('./image-url');
const request = require('request');
const debug = require('debug')('newsbot:content');
const toCmid = require('util-url2cmid');
const cheerio = require('cheerio');

module.exports.document = function (documentId) {
  return new Promise (function (resolve, reject) {
    debug('request document');
    request.get(
      {
        url: 'https://content-gateway.abc-prod.net.au/api/v2/content/id/'+encodeURIComponent(documentId)
      },
      function(err, response, body) {

        // Reject on HTTP error
        if (err) {
          return reject(err);
        }

        // Reject on bad HTTP status
        if (response.statusCode !== 200) {
          return reject(Error(`Bad HTTP response code ${response.statusCode} from ABC Content API`));
        }

        try {
          var result = JSON.parse(body);
        } catch (e) {
          return reject(Error(`Malformed JSON in ABC Content API response`));
        }

        defineDocumentImage(result);

        // Resolve
        return resolve(result);
      }
    );
  });
};

module.exports.search = function (query) {
  return new Promise(function(resolve, reject) {
    debug('request search');
    request.get(
      {
        url: 'https://api.cognitive.microsoft.com/bing/v5.0/news/search?q='+encodeURIComponent(query+' site:abc.net.au/news')+'&count=50&offset=0&mkt=en-us&safeSearch=Moderate',
        headers: {'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY}
      },
      function(err, response, body) {

        // Reject on HTTP error
        if (err) {
          return reject(err);
        }

        // Reject on bad HTTP status
        if (response.statusCode !== 200) {
          try {
            return reject(Error(JSON.parse(body).message));
          } catch (e) {
            return reject(Error(`Bad HTTP response code ${response.statusCode} from Bing API`));
          }
        }

        try {
          var results = JSON.parse(body);
        } catch (e) {
          return reject(Error(`Malformed JSON in Bing API response`));
        }

        var promises = results.value
          .slice(0,8)
          .map(function(result) {
            let bingRedirectUrl = result.url;
            let bingRedirectUrlRegexMatches = /[\?\&]r=([^\&]*)/.exec(bingRedirectUrl);
            let abcNewsUrl = decodeURIComponent(bingRedirectUrlRegexMatches[1]);
            let abcNewsUrlRegexMatches = /(\d{5,})(\?|$)/.exec(abcNewsUrl);
            let documentId = abcNewsUrlRegexMatches[1];
            return module.exports.document(documentId);
          });

        Promise.all(promises).then(function(documents) {

          documents = documents.filter(function(result){
            return (result.docType === 'Article');
          })

          resolve({
            title: 'Search results',
            message: (documents.length === 0) ? 'No stories matched your search. Please try a different search.' : null,
            documents: documents
          });

        }, function (err) {
          reject(err);
        });
      }
    );
  });
}


function defineDocumentImage(result) {
  // Define image urls
  result.imageId = (result.thumbnailLink) ? result.thumbnailLink.id : '8394058';
  result.imageUrl = `http://www.abc.net.au/cm/rimage/${result.imageId}-16x9-large.jpg?v=2`;
  result.imageProxyUrl = imageUrl(`http://www.abc.net.au/cm/rimage/${result.imageId}-16x9-medium.jpg?v=2`) + '/img.jpg';
  return result;
}

// The ABC Content API (in a fit of insanity) doesn't treat teasers transparently
// and returns a non-sensical canonicalUrl. This (kind of) fixes that.
function fixTeaser(result) {
  if (result.target) {
    result.canonicalUrl = `http://www.abc.net.au/news/${result.target.id}`;
  }
  return result;
}

module.exports.collection = function (collectionId) {
  return new Promise (function (resolve, reject) {
    const url = `http://www.abc.net.au/news/feed/${encodeURIComponent(collectionId)}/rss.xml`;
    debug('request collection', url);
    request.get(
      { url },
      function(err, response, body) {

        // Reject on HTTP error
        if (err) {
          return reject(err);
        }

        // Reject on bad HTTP status
        if (response.statusCode !== 200) {
          return reject(Error(`Bad HTTP response code ${response.statusCode} from ABC Content API`));
        }

        const results = {
          title: 'Top stories',
          items: [],
        };

        const $ = cheerio.load(body, {
          xmlMode: true,
        });

        $('item').each(function(){
          const canonicalUrl = $(this).find('link').text().trim();
          const teaserTitle = $(this).find('title').text().trim();
          const shortTeaserTitle = teaserTitle;
          const shortTeaserTextPlain = $(this).find('description').text().trim();
          const imageUrl = $(this).find('[medium="image"]').eq(0).attr('url');
          const thumbnailLink = {
            id: imageUrl ? toCmid(imageUrl) : null,
          };
          results.items.push({ canonicalUrl, shortTeaserTitle, shortTeaserTextPlain, imageUrl, teaserTitle, thumbnailLink });
        });

        var documents = results.items
          .slice(0,12)
          .map(fixTeaser)
          .map(function(result) {
            defineDocumentImage(result);
            return result;
          });

        resolve({
          id: Number(collectionId),
          title: results.title,
          message: (documents.length === 0) ? 'No stories available.' : null,
          documents: documents
        });
      }
    );
  });
};
