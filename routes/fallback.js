var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('error', {
    error: {
      status: 'Please update your Messenger app'
    },
    message: "This feature is not supported on the version of Messenger you're using. Updating to the latest version will provide the best experience for sharing ABC News stories on Messenger."
  });
});

module.exports = router;
