const imageUrl = require('./image-url');
const request = require('request');
const debug = require('debug')('newsbot:content');

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
}

module.exports.collection = function (collectionId) {
  return new Promise (function (resolve, reject) {
    debug('request collection');
    request.get(
      {
        url: 'https://content-gateway.abc-prod.net.au/api/v2/content/id/'+encodeURIComponent(collectionId)
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
          var results = JSON.parse(body);
        } catch (e) {
          return reject(Error(`Malformed JSON in ABC Content API response`));
        }

        var documents = results.items
          .filter(result => result.docType === 'Article')
          .map(function(result) {
            defineDocumentImage(result);
            return result;
          });

        resolve({
          title: results.title,
          message: (documents.length === 0) ? 'No stories available.' : null,
          documents: documents
        });
      }
    );
  });
};
