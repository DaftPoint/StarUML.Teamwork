/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global $, define, brackets, InvalidateStateError, window */

/**
 * Generally NativeFileSystem mimics the File-System API working draft:
 *  http://www.w3.org/TR/2011/WD-file-system-api-20110419
 *
 * A more recent version of the specs can be found at:
 *  http://www.w3.org/TR/2012/WD-file-system-api-20120417
 *
 * Other relevant w3 specs related to this API are:
 *  http://www.w3.org/TR/2011/WD-FileAPI-20111020
 *  http://www.w3.org/TR/2011/WD-file-writer-api-20110419
 *  http://www.w3.org/TR/progress-events
 *
 * The w3 entry point requestFileSystem is replaced with our own requestNativeFileSystem.
 *
 * The current implementation is incomplete and notably does not
 * support the Blob data type and synchronous APIs. DirectoryEntry
 * and FileEntry read/write capabilities are mostly implemented, but
 * delete is not. File writing is limited to UTF-8 text.
 *
 *
 * Basic usage examples:
 *
 *  - CREATE A DIRECTORY
 *      var directoryEntry = ... // NativeFileSystem.DirectoryEntry
 *      directoryEntry.getDirectory(path, {create: true});
 *
 *
 *  - CHECK IF A FILE OR FOLDER EXISTS
 *      NativeFileSystem.resolveNativeFileSystemPath(path 
 *                                  , function(entry) { console.log("Path for " + entry.name + " resolved"); }
 *                                  , function(err) { console.log("Error resolving path: " + err.name); });
 *
 *
 *  - READ A FILE
 *
 *      (Using file/NativeFileSystem)
 *          reader = new NativeFileSystem.FileReader();
 *          fileEntry.file(function (file) {
 *              reader.onload = function (event) {
 *                  var text = event.target.result;
 *              };
 *              
 *              reader.onerror = function (event) {
 *              };
 *              
 *              reader.readAsText(file, Encodings.UTF8);
 *          });
 *
 *      (Using file/FileUtils)
 *          FileUtils.readAsText(fileEntry).done(function (rawText, readTimestamp) {
 *              console.log(rawText);
 *          }).fail(function (err) {
 *              console.log("Error reading text: " + err.name);
 *          });
 *
 *
 *  - WRITE TO A FILE 
 *
 *      (Using file/NativeFileSystem)
 *          writer = fileEntry.createWriter(function (fileWriter) {
 *              fileWriter.onwriteend = function (e) {
 *              };
 *              
 *              fileWriter.onerror = function (err) {
 *              };
 *              
 *              fileWriter.write(text);
 *          });
 *
 *      (Using file/FileUtils)
 *          FileUtils.writeText(text, fileEntry).done(function () {
 *              console.log("Text successfully updated");
 *          }).fail(function (err) {
 *              console.log("Error writing text: " + err.name);
 *          ]);
 *
 *
 *  - PROMPT THE USER TO SELECT FILES OR FOLDERS WITH OPERATING SYSTEM'S FILE OPEN DIALOG
 *      NativeFileSystem.showOpenDialog(true, true, "Choose a file...", null, function(files) {}, function(err) {});
 */

define(function (require, exports, module) {
    "use strict";

    var platformFileSystem;
    var config = module.config();
    if (config.filesystem == "html5"){
        platformFileSystem = require("./Html5FileSystem").Html5FileSystem;
    }
    else{
        platformFileSystem = require("./NativeFileSystem").NativeFileSystem;
    }
    exports.PlatformFileSystem  = platformFileSystem;
});
