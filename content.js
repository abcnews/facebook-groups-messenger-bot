module.exports.document = function (documentId) {
  return new Promise (function (resolve, reject) {
    var request = require('request');
    return request.get(
      {
        url: 'https://content-gateway.abc-prod.net.au/api/v2/content/id/'+encodeURIComponent(documentId)
      },
      function(error, response, body) {
        var doc = null;
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body);
          if (result.docType == 'Article') {
            var doc = {};
            doc.id = result.id;
            doc.teaser_title = result.teaserTitle;
            doc.short_teaser_title = result.shortTeaserTitle;
            doc.teaser_text = result.teaserTextPlain;
            doc.short_teaser_text = result.shortTeaserTextPlain;
            doc.url = result.canonicalUrl;
            doc.image = null;
            if (typeof result.thumbnailLink !== 'undefined') {
              doc.image = result.thumbnailLink.id
            }
          }
        }
        if (doc) {
          resolve(doc);
        }
        else {
          reject(Error('Content request error'));
        }
      }
    );
  });
};

module.exports.search = function (query) {
  return new Promise(function(resolve, reject) {
    var request = require('request');
    request.get(
      {
        url: 'https://api.cognitive.microsoft.com/bing/v5.0/news/search?q='+encodeURIComponent(query+' site:abc.net.au/news')+'&count=50&offset=0&mkt=en-us&safeSearch=Moderate',
        headers: {'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY}
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var results = JSON.parse(body);
          var title = 'Search results';
          var message = null;
          var promises = [];
          for (var i=0; i<Math.min(8, results.value.length); i++) {
            var bingRedirectUrl = results.value[i].url;
            var bingRedirectUrlRegexMatches = /[\?\&]r=([^\&]*)/.exec(bingRedirectUrl);
            var abcNewsUrl = decodeURIComponent(bingRedirectUrlRegexMatches[1]);
            var abcNewsUrlRegexMatches = /(\d{5,})(\?|$)/.exec(abcNewsUrl);
            var documentId = abcNewsUrlRegexMatches[1];
            promises.push(module.exports.document(documentId));
          }
          Promise.all(promises).then(function(documents) {
            if (documents.length == 0) {
              message = 'No stories matched your search. Please try a different search.';
            }
            resolve({title: title, message: message, documents: documents});
          }, function () {
            reject(Error('Individual article request error'));
        });
        }
        else {
          reject(Error('Search request error'));
        }
      }
    );
  });
};

module.exports.collection = function (collectionId) {
  return new Promise (function (resolve, reject) {
    var request = require('request');
    return request.get(
      {
        url: 'https://content-gateway.abc-prod.net.au/api/v2/content/id/'+encodeURIComponent(collectionId)
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var results = JSON.parse(body);
          var title = results.title;
          var message = null;
          var documents = [];
          for (var i=0; i<results.items.length && documents.length<12; i++) {
            if (results.items[i].docType == 'Article') {
              var doc = {};
              doc.id = results.items[i].id;
              doc.teaser_title = results.items[i].teaserTitle;
              doc.short_teaser_title = results.items[i].shortTeaserTitle;
              doc.teaser_text = results.items[i].teaserTextPlain;
              doc.short_teaser_text = results.items[i].shortTeaserTextPlain;
              doc.url = results.items[i].canonicalUrl;
              doc.image = null;
              if (typeof results.items[i].thumbnailLink !== 'undefined') {
                doc.image = results.items[i].thumbnailLink.id;
              }
              documents.push(doc);
            }
          }
          if (documents.length == 0) {
            message = 'No stories.';
          }
          resolve({title: title, message: message, documents: documents});
        }
        else {
          reject(Error('Collection request error'));
        }
      }
    );
  });
};

module.exports.groupshare = function (collectionIds, search) {
  return new Promise (function (resolve, reject) {
    if (!collectionIds.isArray) {
      collectionIds = [collectionIds];
    }
    var promises = [];
    if (typeof search !== 'undefined' && search) {
      promises.push(module.exports.search(search));
    }
    for (var i=0; i<collectionIds.length; i++) {
      promises.push(module.exports.collection(collectionIds[i])); // Top Stories is 5513552
    }
    Promise.all(promises).then(function(collections) {
      resolve({
        title: 'Share ABC News story',
        search: search,
        collections: collections
      });
    }, function () {
      reject(Error('Error getting content for Group Share page'));
    });
  });
}

module.exports.image = function (imageId) {
  return new Promise (function (resolve, reject) {
    var request = require('request');
    var fs = require('fs');
    var filename = '/usr/cache/image_'+imageId+'.jpg';
    fs.stat(filename, function (err, stats) {
      var download = false;
      if (err && err.code === 'ENOENT') { // file doesn't exist
        download = true;
      }
      else if (new Date().getTime() - stats.mtime.getTime() > 1000*60*60*24) { // file too old
        download = true;
      }
      if (download) {
        request
          .get('http://www.abc.net.au/cm/rimage/'+encodeURIComponent(imageId)+'-16x9-large.jpg')
          .on('error', function (err) {
            reject(Error('Image request error'));
          })
          .pipe(fs.createWriteStream(filename))
          .on('end', function (res) {
            resolve(filename);
          });
      }
      else {
        resolve(filename);
      }
    });
  });
};

