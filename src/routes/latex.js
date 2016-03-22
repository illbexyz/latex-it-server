const express = require('express');
const router 	= express.Router();
const multer  = require('multer');
const upload  = multer({dest: 'uploads/'});
const path    = require('path');
const latexCompiler = require('../latex/latex');

// POST method route
router.post('/', upload.single('zip_file'), function (req, res) {
  const filename = req.file.filename;
  let compiler = req.body.compiler;
  // Just making sure to run one of this allowed exes
  switch(compiler) {
  case 'pdflatex':
  case 'latexmk':
  case 'xelatex':
    break;
  default:
    compiler = 'pdflatex';
    break;
  }
  latexCompiler.compileFile(compiler, filename)
    .then((result) => sendResultingFile(result.file, res))
    // TODO: Questo non funzia
    .then((result) => latexCompiler.deleteDirectory(result.directory))
    .catch((error) => errorHandler(error, res));
});

function sendResultingFile(file, res) {
  const fileAbsolutePath = path.resolve(file);
  res.sendFile(fileAbsolutePath, function (err) {
    if(err) {
      throw new Error('Error sending the file: ' + err);
    }
  });
}

function errorHandler(error, res) {
  console.error(error);
  res.status(400).send(error);
}

module.exports = router;
