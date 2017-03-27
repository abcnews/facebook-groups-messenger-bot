var express = require('express');
var router = express.Router();

/* GET share page. */

router.get('/', function(req, res) {
  res.render('groupshare', { title: 'Share with your group' });
});

module.exports = router;
