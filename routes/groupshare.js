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
      title: 'Share ABC News story',
      search: req.query.search,
      collections: collections
    });
  }, function (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Sorry, something went wrong, please <a href="/groupshare">try your request again</a>.'
    });
  });
});

module.exports = router;
