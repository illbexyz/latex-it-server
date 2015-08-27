var express 	= require('express');
var router 		= express.Router();
var mkdirp      = require('mkdirp');
var fs          = require('fs');
var exec 		= require('child_process').exec;
var rimraf 		= require('rimraf');
var multer      = require('multer')
var upload      = multer({ dest: 'uploads/' })
var admzip      = require('adm-zip');
var crypto		= require('crypto');
var glob        = require("glob");
var path        = require("path");

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'We' });
});

// POST method route
router.post('/', upload.single('zip_file'), function (req, res) {
    var parentDirectory = "uploads/";
    var filename = req.file.filename;
    var pdfname = "file.pdf";

    var myDirectory = parentDirectory + randomValueHex(12) + "/";
    var oldZipPath = parentDirectory + filename;
    var newZipPath = myDirectory + "zip.zip";
    // Creating the directory in /tmp
    mkdirp(myDirectory, function(directoryError){
        if(directoryError){
            console.log("Error creating the directory: " + directoryError);
            deleteDirectory(myDirectory);
            res.status(400).send("Error");
        }
        fs.rename(oldZipPath, newZipPath, function(err){
            if(err){
                console.log("Error renaming the file: " + err);
                deleteDirectory(myDirectory);
                res.status(400).send("Error");
            }
            try {
                var zip = new admzip(newZipPath);
                zip.extractAllTo(myDirectory, true);
            } catch(error){
                console.log("Invalid zip file: " + error);
                deleteDirectory(myDirectory);
                res.status(400).send("Error unzipping the file. ");
            }
            glob(myDirectory + "*.tex", function(err, files){
                if(err || files.length == 0){
                    console.log("Error finding the .tex file: " + err);
                    deleteDirectory(myDirectory);
                    res.status(400).send("Error");
                } else {
                    var texFilePath = files[0];
                    var texFileName = files[0].substring(files[0].lastIndexOf("/") + 1);
                    var stats = fs.statSync(texFilePath);
                    if (stats["size"] == 0) {
                        console.log("Empty file");
                        deleteDirectory(myDirectory);
                        res.status(400).send("Error");
                    } else {
                        // Executing the pdflatex command
                        var oldCwd = process.cwd();
                        var dir = oldCwd + "/" + myDirectory;
                        process.chdir(dir);
                        exec('pdflatex'
                            + " -halt-on-error " + texFileName, function callback(err, stdout, stderr) {
                            process.chdir(oldCwd);
                            var filename = myDirectory + "*.pdf";
                            if (err) {
                                filename = myDirectory + "*.log";
                            }
                            glob(filename, function (err, files) {
                                // Sending the resulting file (pdf or log) to client
                                res.sendFile(path.resolve(files[0]), function (err) {
                                    if (err) {
                                        console.log("Error sending the file: " + err);
                                        res.send("Error");
                                    }
                                    deleteDirectory(myDirectory);
                                });
                            });
                        });
                    }
                }
            });
        });
    });
});

function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

function deleteDirectory(directory){
    rimraf(directory, function(err){
        if(err){
            console.log("Error deleting the directory: " + err);
        }
    });
}

module.exports = router;