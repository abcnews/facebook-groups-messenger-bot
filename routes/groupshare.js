var express = require('express');
var router = express.Router();

/* GET share page. */

router.get('/', function(req, res) {
  var content = require('../content');
  content.groupshare([5513552], req.query.search).then(function (content) {
    res.render('groupshare', content);
  });
});

module.exports = router;
