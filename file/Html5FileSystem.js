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
    
    var Html5FileSystem = {
        
        
        /**
         * Shows a modal dialog for selecting and opening files
         *
         * @param {boolean} allowMultipleSelection Allows selecting more than one file at a time
         * @param {boolean} chooseDirectories Allows directories to be opened
         * @param {string} title The title of the dialog
         * @param {string} initialPath The folder opened inside the window initially. If initialPath
         *                          is not set, or it doesn't exist, the window would show the last
         *                          browsed folder depending on the OS preferences
         * @param {Array.<string>} fileTypes List of extensions that are allowed to be opened. A null value
         *                          allows any extension to be selected.
         * @param {function(Array.<string>)} successCallback Callback function for successful operations.
                                    Receives an array with the selected paths as first parameter.
         * @param {function(DOMError)=} errorCallback Callback function for error operations. 
         */
        showOpenDialog: function (allowMultipleSelection,
                                  chooseDirectories,
                                  title,
                                  initialPath,
                                  fileTypes,
                                  successCallback,
                                  errorCallback) {
            if (!successCallback) {
                return;
            }

            // var files = brackets.fs.showOpenDialog(
            //     allowMultipleSelection,
            //     chooseDirectories,
            //     title,
            //     initialPath,
            //     fileTypes,
            //     function (err, data) {
            //         if (!err) {
            //             successCallback(data);
            //         } else if (errorCallback) {
            //             errorCallback(new NativeFileError(NativeFileSystem._fsErrorToDOMErrorName(err)));
            //         }
            //     }
            // );

        },

        /**
         * Implementation of w3 requestFileSystem entry point
         * @param {string} path Path to a directory. This directory will serve as the root of the 
         *                          FileSystem instance.
         * @param {function(DirectoryEntry)} successCallback Callback function for successful operations.
         *                          Receives a DirectoryEntry pointing to the path
         * @param {function(DOMError)=} errorCallback Callback function for errors, including permission errors.
         */
        requestNativeFileSystem: function (path, successCallback, errorCallback) {
            // ignore path
            webkitRequestFileSystem(Window.PERSISTENT, 5*1024*1024*1024, function(fs){
                if (!path || !path.length || path == '/'){
                    successCallback(fs);
                    return;
                }
                fs.root.getDirectory(path, {create:false}, function(dirEntry){
                    successCallback({root:dirEntry});
                }, errorCallback);
            }, errorCallback);
        },
        
        /**
         * NativeFileSystem implementation of LocalFileSystem.resolveLocalFileSystemURL()
         *
         * @param {string} path A URL referring to a local file in a filesystem accessable via this API.
         * @param {function(Entry)} successCallback Callback function for successful operations.
         * @param {function(DOMError)=} errorCallback Callback function for error operations.
         */
        resolveNativeFileSystemPath: function (path, successCallback, errorCallback) {

            webkitRequestFileSystem(Window.PERSISTENT, 5*1024*1024*1024, function(fs){
                fs.root.getFile(path, {create:false}, successCallback, function(err){
                    if (err.code == FileError.TYPE_MISMATCH_ERR){
                        fs.root.getDirectory(path, {create:false}, successCallback, errorCallback);
                    } else {
                        errorCallback(err);
                    }
                });
            }, errorCallback);
        },
    };

    
    

    // Define public API
    exports.Html5FileSystem    = Html5FileSystem;
});
