//Node-Modules
var promisify   = require('promisify-node');
var fse         = promisify(require('fs-extra'));
var chmodr      = require('chmodr');

//Promisifying
//fse.ensureDir = promisify(fse.ensureDir);
//fse.emptyDir = promisify(fse.emptyDir);
//fse.remove  = promisify(fse.remove);

/* Checks if the given directory exists and is empty. If not then it is removed and created
 * Tries only a given number of times
 *
 */
function ensureEmptyDir(dirPath, tries, callback) {
    fse.ensureDir(dirPath, function (err) {
        fse.emptyDir(dirPath, function (err) {
            if(err) {
                tries = tries + 1;
                if(tries >= 100) {
                    throw err;
                }
                chmodr(dirPath, 0777, function (err) {
                    fse.remove(dirPath, function (err) {
                        ensureEmptyDir(dirPath, tries);
                    });
                });
            } else {
                if(callback !== undefined) {
                    callback();
                }
            }
        });
    });
}

function removeDir(dirPath, callback) {
    chmodr(dirPath, 0777, function (err) {
        fse.remove(dirPath, function(err) {
            if(err) {
                removeDir(dirPath, callback);
            } else {
                if(callback !== undefined) {
                    callback();
                }
            }
        });
    });
}

exports.ensureEmptyDir = ensureEmptyDir;
exports.removeDir      = removeDir;