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
    var DiagramManager      = app.getModule("diagrams/DiagramManager");

    //Imports
    var TeamworkBase        = require("./TeamworkBase");
    var GitConfiguration    = require("../preferences/TeamworkConfiguration");
    var ProgressDialog      = require("../dialogs/ProgressDialog");
    var TeamworkView        = require("../teamworkView/TeamworkView");
    var GitApi              = require("../StarGit/api-built");
    var TeamworkConfiguration   = require("../preferences/TeamworkConfiguration");

    //Constants
    //Functions
    function updateProject() {
        DiagramManager.saveWorkingDiagrams();
        var projectName = TeamworkBase.getTeamworkProjectName();
        var workingDirPromise = getProjectWorkDir("Update_" + projectName);
        var currentProjectPromise = loadCurrentProjectFromServer(workingDirPromise, projectName);
        var mergePromise = mergeProjectWithLocalChanges(currentProjectPromise);
        TeamworkBase.loadProjectFromFragments(mergePromise, "Update_" + projectName);
        notifyUserAfterwards(mergePromise, projectName);
    }

    function mergeProjectWithLocalChanges(promise) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir, projectName) {
            try {
                var splitPromise = TeamworkBase.splitProjectInSingleFiles(false, "Update_" + projectName, true, true, false);
            } catch(error) {
                nextPromise.reject();
            }
            splitPromise.done(function(change) {
                if(change != "NO_CHANGES") {
                    var options = {
                        dir: workingDir,
                        name: TeamworkConfiguration.getUsername(),
                        email: TeamworkConfiguration.getUsername() + '@noreply.com',
                        commitMsg: "Committing local changes"
                    };
                    GitApi.commit(options, function() {
                        nextPromise.resolve(workingDir, projectName);
                    },
                    function (err) {
                        TeamworkBase.handleGitApiError(workingDir, err);
                        nextPromise.reject();
                    });
                } else {
                    nextPromise.resolve(workingDir, projectName);
                }
            });
        });
        return nextPromise;
    }

    function getProjectWorkDir(projectName) {
        var promise = new $.Deferred();
        var localPath = TeamworkBase.loadLocalWorkingPath(projectName);
        TeamworkBase.getProjectsRootDir(localPath, function (workingDir) {
            promise.resolve(workingDir);
        });
        return promise;
    }

    function loadCurrentProjectFromServer(promise, projectName) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir) {
            var directory = FileSystem.getDirectoryForPath(workingDir.fullPath);
            directory.unlink();
            directory.create();
            var clonePromise  = TeamworkBase.cloneRepoFromServer(workingDir, projectName);
            clonePromise.done(function(workingDir, projectName) {
                nextPromise.resolve(workingDir, projectName);
            });
        });
        return nextPromise;
    }

    function notifyUserAfterwards(promise, projectName) {
        promise.done(function() {
            TeamworkView.addProjectUpdateEvent(projectName, GitConfiguration.getUsername());
            Dialogs.cancelModalDialogIfOpen('modal');
            $(exports).triggerHandler('projectUpdated', [projectName]);
            DiagramManager.restoreWorkingDiagrams();
        });
    }

    exports.updateProject = updateProject;
});