/**
 * Copyright (c) 2016 Michael Seiler. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
define(function(require, exports, module) {
    "use strict";

    //Modules
    var PreferenceManager   = app.getModule("core/PreferenceManager");
    var Dialogs             = app.getModule('dialogs/Dialogs');
    var Toast 				= app.getModule("ui/Toast");
    var FileSystem          = app.getModule("filesystem/FileSystem");
    var Repository      	= app.getModule("core/Repository");

    //Imports
    var TeamworkBase        = require("./TeamworkBase");
    var GitConfiguration    = require("../preferences/TeamworkConfiguration");
    var ProgressDialog      = require("../dialogs/ProgressDialog");
    var TeamworkView        = require("../teamworkView/TeamworkView");

    //Constants

    //Functions
    function commitProjectChanges() {
        var projectName = TeamworkBase.getTeamworkProjectName();
        var workingDirPromise = getProjectWorkDir(projectName);
        var currentProjectPromise = loadCurrentProjectFromServer(workingDirPromise, projectName);
        var commitMsg = 'Committing Project-Changes for "' + projectName + '"';
        var mergePromise = TeamworkBase.mergeProjectWithLocalChanges(currentProjectPromise, commitMsg, true, true, true);
        var pushPromise = TeamworkBase.pushToServer(mergePromise, "Committing Project-Changes...");
        notifyUserAndCleanAfterwards(pushPromise, projectName);
    }

    function getProjectWorkDir(projectName) {
        var promise = new $.Deferred();
        var localPath = TeamworkBase.loadLocalWorkingPath(projectName);
        var workingDir = FileSystem.getDirectoryForPath(localPath);
        workingDir.unlink();
        TeamworkBase.getProjectsRootDir(localPath, function (workingDir) {
            promise.resolve(workingDir);
        });
        return promise;
    }

    function loadCurrentProjectFromServer(promise, projectName) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir) {
            var clonePromise  = TeamworkBase.cloneRepoFromServer(workingDir, projectName);
            clonePromise.done(function(workingDir, projectName) {
                nextPromise.resolve(workingDir, projectName);
            });
        });
        return nextPromise;
    }

    function notifyUserAndCleanAfterwards(promise, projectName) {
        promise.done(function(workingDir) {
            TeamworkView.addProjectCommitEvent(projectName, GitConfiguration.getUsername());
            Dialogs.cancelModalDialogIfOpen('modal');
            workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
            workingDir.unlink();
            $(exports).triggerHandler('projectCommitted', [projectName]);
        });
    }

    //Backend
    exports.commitProjectChanges = commitProjectChanges;
});