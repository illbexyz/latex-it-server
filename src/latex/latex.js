const mkdirp  = require('mkdirp-promise');
const fs      = require('fs');
const exec    = require('child_process').exec;
const rimraf  = require('rimraf');
const admzip  = require('adm-zip');
const crypto  = require('crypto');
const glob    = require('glob');

function compileFile(compiler, filename) {
  return new Promise((resolve, reject) => {
    const parentDirectory = 'uploads/';
    const workingDir = parentDirectory + randomValueHex(12) + '/';
    const oldZipPath = parentDirectory + filename;
    const newZipPath = workingDir + 'zip.zip';

    createNewDirectory(workingDir)
      .then(() => renameFile(oldZipPath, newZipPath))
      .then(() => extractZip(workingDir, newZipPath))
      .then(() => findTexFilesIn(workingDir))
      .then((texFileName) => launchCompiler(compiler, workingDir, texFileName))
      .then((file) => resolve(file))
      .then(() => deleteDirectory(workingDir))
      .catch((error) => {
        deleteDirectory(workingDir);
        reject(error);
      });
  });
}

/**
 * Creates a new directory
 * @param  {String} directory Path
 * @return {Promise}
 */
function createNewDirectory(directory) {
  return new Promise((resolve, reject) => {
    mkdirp(directory)
      .then(() => {
        resolve();
      })
      .catch(directoryError => {
        reject(new Error(directoryError));
      });
  });
}

/**
 * Renames a file (Promise wrapper for fs.rename)
 * @param  {String} src  File location
 * @param  {String} dest File destination
 * @return {Promise}
 */
function renameFile(src, dest) {
  return new Promise((resolve, reject) => {
    fs.rename(src, dest, function(err){
      if(err) {
        reject(new Error(err));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Extracts a zip file
 * @param  {String} directory Directory path
 * @param  {String} zipPath   Zip path
 * @return {Promise}
 */
function extractZip(directory, zipPath) {
  return new Promise((resolve, reject) => {
    try {
      const zip = new admzip(zipPath);
      zip.extractAllTo(directory, true);
      resolve();
    } catch(error){
      console.err('Invalid zip file: ' + error);
      reject(new Error(error));
    }
  });
}

/**
 * Finds the .tex files within a directory
 * @param  {String} directory Directory path
 * @return {Promise} Will resolve giving the filename found
 */
function findTexFilesIn(directory) {
  return new Promise((resolve, reject) => {
    glob(directory + '*.tex', function(err, files) {
      if(err || files.length == 0) {
        reject(new Error('Error finding the .tex file: ' + err));
      } else {
        var texFilePath = files[0];
        var texFileName = files[0].substring(files[0].lastIndexOf('/') + 1);
        var stats = fs.statSync(texFilePath);
        if (stats['size'] == 0) {
          reject(new Error('Empty file'));
        } else {
          resolve(texFileName);
        }
      }
    });
  });
}

/**
 * Compiles a .tex file
 * @param  {String} compiler    Compiler
 * @param  {String} directory   Directory path
 * @param  {String} texFileName File path
 * @return {Promise}            Will resolve giving the pdf/log file
 */
function launchCompiler(compiler, directory, texFileName) {
  return new Promise((resolve, reject) => {
    const oldCwd = process.cwd();
    const dir = oldCwd + '/' + directory;
    const command = compiler + ' -halt-on-error -interaction=nonstopmode ' + texFileName;
    process.chdir(dir);
    exec(command, (err, stdout, stderr) => {
      process.chdir(oldCwd);
      var filename = directory + '*.pdf';
      if(err) {
        filename = directory + '*.log';
      }
      glob(filename, function (err, files) {
        resolve(files[0]);
      });
    });
  });
}

function randomValueHex(len) {
  return crypto.randomBytes(Math.ceil(len/2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len);  // return required number of characters
}

function deleteDirectory(directory){
  return new Promise((resolve, reject) => {
    rimraf(directory, function(err){
      if(err){
        reject(new Error('Error deleting the directory: ' + err));
      } else {
        resolve();
      }
    });
  });
}

module.exports = compileFile;