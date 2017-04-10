var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  var content = require('../content');
  content.groupshare([8418312], req.query.search).then(function (content) {
    res.render('groupshare', content);
  });
});

module.exports = router;
