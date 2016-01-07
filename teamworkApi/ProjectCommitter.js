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
        var mergePromise = TeamworkBase.mergeProjectWithLocalChanges(currentProjectPromise, commitMsg, true);
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
            clonePromise.done(function(projectName, workingDir) {
                nextPromise.resolve(projectName, workingDir);
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
            Repository.setModified(false);
        });
    }

    //Backend
    exports.commitProjectChanges = commitProjectChanges;
});