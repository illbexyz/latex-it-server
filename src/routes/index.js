var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Latex-IT server is up!');
});

module.exports = router;
