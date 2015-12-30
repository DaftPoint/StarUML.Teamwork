define(function(require, exports, module) {
    "use strict";

    //Modules
    var PreferenceManager = app.getModule("core/PreferenceManager");

    //Imports
    var OpenProject         = require("../git/OpenProject");
    var SaveProject         = require("../git/SaveProject");
    var GitBase             = require("git/Base");
    var GitConfiguration    = require("git/GitConfiguration");

    //Constants
    var CMD_COMMIT_PROJECT      = "commitProject";
    var PREFERENCE_LOCAL_PATH = "teamwork.server.local";

    //Functions
    function commitProjectChanges() {
        var projectName = GitBase.getTeamworkProjectName();
        var promise = OpenProject.loadFragmentsFromTeamworkServer(projectName);
        promise.done(function(){
            SaveProject.splitProjectInSingleFiles(false, projectName);
            pushChangesToServer(projectName);
        });
    }

    function pushChangesToServer(projectName) {
        var promise = new $.Deferred();
        var gitModule = loadGitModule();
        var localWorkingDir = loadLocalWorkingDirectory(projectName);
        var remoteProjectURL = GitConfiguration.getRemoteURL();
        executeCommand(gitModule, localWorkingDir, remoteProjectURL, projectName, promise);
        return promise.promise();
    }

    function loadGitModule() {
        GitBase.init();
        return GitBase.getGitNodeDomain();
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