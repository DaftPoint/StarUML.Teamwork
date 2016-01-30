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

    //Modules
    var PreferenceManager 	= app.getModule("core/PreferenceManager");
    var Toast 				= app.getModule("ui/Toast");
    var Repository      	= app.getModule("core/Repository");
    var Helper              = app.getModule("utils/Helper");
    var FileSystem          = app.getModule("filesystem/FileSystem");
    var Dialogs             = app.getModule('dialogs/Dialogs');

    //Imports
    var TeamworkBase        = require("./TeamworkBase");
    var GitConfiguration    = require("./../preferences/TeamworkConfiguration");
    var ProgressDialog      = require("../dialogs/ProgressDialog");
    var TeamworkView        = require("../teamworkView/TeamworkView");

    //Constants
    //Variables
    //Functions

    function createProject() {
        var dlg = Dialogs.showInputDialog("Enter a name for the Project to create");
        dlg.done(function (buttonId, projectName) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                createNewProjectOnTeamworkServer(projectName);
            } else {
                Toast.error("Creating Teamwork-Project cancelled");
            }
        });
    }

    function createNewProjectOnTeamworkServer(projectName) {
        var localPath = TeamworkBase.getProjectPath(projectName);
        var refContent = 'refs/heads/projects/' + projectName;
        var valueToResolve = 'projects/' + projectName;
        var workingDirPromise = TeamworkBase.prepareWorkingDirectory(valueToResolve, localPath, refContent);
        var branchPromise = TeamworkBase.createAndCheckoutBranch(workingDirPromise, projectName);
        var commitMsg = 'Creating Project: ' + projectName;
        var mergePromise = TeamworkBase.mergeProjectWithLocalChanges(branchPromise, commitMsg, false, true, true);
        var progressTitle = "Creating Teamwork-Project...";
        var pushPromise = TeamworkBase.pushToServer(mergePromise, progressTitle);
        notifyUserOfSuccessfulProjectCreation(pushPromise, projectName);
    }

    function notifyUserOfSuccessfulProjectCreation(pushPromise, projectName) {
        pushPromise.done(function(workingDir) {
            TeamworkBase.setTeamworkProjectName(projectName);
            Dialogs.cancelModalDialogIfOpen('modal');
            workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
            workingDir.unlink();
            TeamworkView.addCreateProjectEvent(projectName, GitConfiguration.getUsername());
            $(exports).triggerHandler('projectCreated', [projectName]);
        });
    }

    //Backend
    exports.createTeamworkProject = createProject;
});