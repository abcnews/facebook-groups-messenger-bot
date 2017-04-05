var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var content = require('../content');
  content.groupshare([8418312], req.query.search).then(function (content) {
    res.render('groupshare', content);
  });
});

router.get('/image/:id', function(req, res) {
  var forbidden = false;
  if (!/^\d+$/.test(req.params.id)) { // Block non-integer IDs
    forbidden = true;
  }
  if (req.get('Referer') && req.get('Referer').indexOf(req.get('Host')) === -1) { // Block hotlinking
    forbidden = true;
  }
  if (forbidden) {
    res.status(403);
    res.render('error', {
        message: 'Forbidden',
        error: {},
        title: 'error'
    });
  }
  else {
    var content = require('../content');
    content.image(req.params.id).then(function (filename) {
      res.sendFile(filename, {
        maxAge: 1000*60*60*24
      });
    });
  }
});

module.exports = router;
