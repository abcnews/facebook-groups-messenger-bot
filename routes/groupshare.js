const express = require('express');
const router = express.Router();
const content = require('../lib/content');
const collections = [8418312]; // dynamic collection based on top stories

router.get('/', function(req, res) {

  let promises = collections.map(function(id) {
    return content.collection(id);
  });

  if (req.query.search) {
    promises.unshift(content.search(req.query.search));
  }

  Promise.all(promises).then(function(collections) {
    res.render('groupshare', {
      title: 'Share ABC News',
      search: req.query.search,
      collections: collections
    });
  }, function (err) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if(isDevelopment) console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: isDevelopment ? err.message : 'Sorry, something unexpectedly went wrong. Please <a href="/groupshare">try your request again</a>.'
    });
  });
});

module.exports = router;
