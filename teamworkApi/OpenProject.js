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
define(function (require, exports, module) {
    "use strict";

    //Modules
    var Toast               = app.getModule("ui/Toast");
    var Dialogs             = app.getModule('dialogs/Dialogs');
    var ProjectManager      = app.getModule("engine/ProjectManager");
    var Repository          = app.getModule("core/Repository");
    var FileSystem          = app.getModule("filesystem/FileSystem");

    //Imports
    var TeamworkBase            = require("./TeamworkBase");
    var TeamworkConfiguration   = require("../preferences/TeamworkConfiguration");
    var GitApi                  = require("../StarGit/api-built");
    var ProgressDialog          = require("../dialogs/ProgressDialog");
    var TeamworkView            = require("../teamworkView/TeamworkView");

    //Constants
    var CONFIRM_MESSAGE_LOADING_PROJECT         = "Are you sure? Current Project will be closed! Select Project to load...";
    var PROJECT_LOADING_CANCELLATION_MESSAGE    = "Project-Loading cancelled";

    //Variables

    //Functions
    function openTeamworkProject() {
        var nextPromise = new $.Deferred();
        var localWorkingDir = TeamworkBase.loadLocalWorkingPath("Project");
        TeamworkBase.getProjectsRootDir(localWorkingDir, function (workingDir) {
            nextPromise.resolve(workingDir);
        });
        loadKnownProjectRefs(nextPromise);
    }

    function loadKnownProjectRefs(promise) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir) {
            var options = TeamworkBase.getDefaultGitOptions(workingDir);
            GitApi.getProjectRefs(options, function (projectRefs) {
                nextPromise.resolve(projectRefs, workingDir);
            });
        });
        var selectionClonePromise = selectProjectToClone(nextPromise);
        var loadProjectPromise = TeamworkBase.loadProjectFromFragments(selectionClonePromise, "Project");
        cleanAndNotifyUser(loadProjectPromise);
    }

    function selectProjectToClone(promise) {
        var nextPromise = new $.Deferred();
        promise.done(function(projectRefs, workingDir) {
            var options = buildProjectSelectionList(projectRefs);
            var selectionPromise = Dialogs.showSelectDropdownDialog(CONFIRM_MESSAGE_LOADING_PROJECT, options);
            var clonePromise = cloneSelectedProject(selectionPromise, workingDir);
            clonePromise.done(function(workingDir, projectName) {
                nextPromise.resolve(workingDir, projectName);
            });
        });
        return nextPromise;
    }

    function cloneSelectedProject(promise, workingDir) {
        var nextPromise = new $.Deferred();
        promise.done(function (buttonId, projectName) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                TeamworkBase.clearChangedIds();
                var dir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                dir.unlink();
                dir.create();
                var clonePromise  = TeamworkBase.cloneRepoFromServer(workingDir, projectName);
                clonePromise.done(function(workingDir, projectName) {
                    nextPromise.resolve(workingDir, projectName);
                });
            } else {
                Toast.error(PROJECT_LOADING_CANCELLATION_MESSAGE);
            }
        });
        return nextPromise;
    }

    function cleanAndNotifyUser(promise) {
        promise.done(function(projectName) {
            Dialogs.cancelModalDialogIfOpen('modal');
            Toast.info("Opening Project...");
            var workingDirPath = TeamworkBase.loadLocalWorkingPath("Project");
            var workingDir = FileSystem.getDirectoryForPath(workingDirPath);
            workingDir.unlink();
            TeamworkView.addOpenProjectEvent(projectName, TeamworkConfiguration.getUsername());
            $(exports).triggerHandler('teamworkProjectLoaded', [projectName]);
        });
    }

    function buildProjectSelectionList(projectRefs) {
        var options = [];
        projectRefs.forEach(function (item, index, array) {
            options.push({text: item.name, value: item.name});
        });
        return options;
    }

    //Backend
    exports.openTeamworkProject = openTeamworkProject;
});