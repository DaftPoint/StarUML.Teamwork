define(function(require, exports, module) {
    "use strict";

    //Modules
    var PreferenceManager   = app.getModule("core/PreferenceManager");
    var Dialogs             = app.getModule('dialogs/Dialogs');
    var Toast 				= app.getModule("ui/Toast");
    var FileSystem          = app.getModule("filesystem/FileSystem");

    //Imports
    var OpenProject         = require("../git/OpenProject");
    var SaveProject         = require("../git/SaveProject");
    var GitBase             = require("git/Base");
    var GitConfiguration    = require("git/GitConfiguration");
    var GitApi              = require("../htmlGit");
    var ProgressDialog      = require("../dialogs/ProgressDialog");

    //Constants
    var CMD_COMMIT_PROJECT      = "commitProject";
    var PREFERENCE_LOCAL_PATH = "teamwork.server.local";

    //Functions
    function commitProjectChanges() {
        var projectName = GitBase.getTeamworkProjectName();
        pushChangesToServer(projectName);
    }

    function pushChangesToServer(projectName) {
        var promise = new $.Deferred();

        var localPath = loadLocalWorkingDirectory(projectName);
        var remoteURL = GitConfiguration.getRemoteURLWithoutUsernameAndPasswort();
        GitBase.getProjectsRootDir(localPath, function (workingDir) {
            //TODO: REFACTORING!!!
            var options = {
                dir: workingDir,
                url: remoteURL,
                branch: 'projects/' + projectName,
                depth: 1,
                username: GitConfiguration.getUsername(),
                password: GitConfiguration.getPassword(),
                progress: ProgressDialog.showProgress("Loading Teamwork-Project...", "Connecting to server...")
            };
            GitApi.clone(options, function () {
                    SaveProject.splitProjectInSingleFiles(false, projectName);
                    var options = {
                        dir: workingDir,
                        name: GitConfiguration.getUsername(),
                        email: GitConfiguration.getUsername() + '@noreply.com',
                        commitMsg: 'Creating Project: ' + projectName
                    };
                    GitApi.commit(options, function() {
                        /*var options = {
                            dir: workingDir,
                            username: GitConfiguration.getUsername(),
                            password: GitConfiguration.getPassword(),
                            progress: ProgressDialog.showProgress("Pulling Teamwork-Project...", "Connecting to server...")
                        };
                        GitApi.pull(options, function() {*/
                            var options = {
                                dir: workingDir,
                                url: remoteURL,
                                username: GitConfiguration.getUsername(),
                                password: GitConfiguration.getPassword(),
                                progress: ProgressDialog.showProgress("Creating Teamwork-Project...", "Connecting to server...")
                            };
                            GitApi.push(options, function() {
                                GitBase.setTeamworkProjectName(projectName);
                                Toast.info("TeamworkProject created...");
                                Dialogs.cancelModalDialogIfOpen('modal');
                                workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                workingDir.moveToTrash();
                                promise.resolve();
                            });
                        /*}, function (err) {
                         workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                         workingDir.moveToTrash();
                         Dialogs.cancelModalDialogIfOpen('modal');
                         Toast.error(err);
                         promise.reject(););*/
                    }, function (err) {
                        workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                        workingDir.moveToTrash();
                        Dialogs.cancelModalDialogIfOpen('modal');
                        Toast.error(err);
                        promise.reject();
                    });
                },
                function (err) {
                    workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                    workingDir.moveToTrash();
                    Dialogs.cancelModalDialogIfOpen('modal');
                    Toast.error(err);
                    promise.reject();
            });
        });
        return promise.promise();
    }

    function loadLocalWorkingDirectory(projectName) {
        var definedWorkingPath = PreferenceManager.get(PREFERENCE_LOCAL_PATH);
        return definedWorkingPath + "/" + projectName;
    }

    function executeCommand(gitModule, localWorkingDir, remoteProjectURL, projectName, promise) {
        gitModule.exec(CMD_COMMIT_PROJECT, localWorkingDir, remoteProjectURL, projectName)
            .done(function (success) {
                promise.resolve("Changes committed");
            }).fail(function (err) {
            console.error("Error while committing", err);
            promise.reject("Error while committing");
        });
    }

    //Backend
    exports.commitProjectChanges = commitProjectChanges;
});