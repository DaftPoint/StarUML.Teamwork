define(function (require, exports, module) {
	"use strict";

    //Modules
    var CommandManager      = app.getModule("command/CommandManager");
    var Commands            = app.getModule("command/Commands");
    var Toast               = app.getModule("ui/Toast");

    //Imports
    var TeamworkPreferences = require("./../preferences/TeamworkPreferences");
    var OpenProject         = require("../teamworkApi/OpenProject");
    var CreateProject       = require("../teamworkApi/CreateProject");
    var LockElement         = require("../teamworkApi/LockElement");
    var UpdateProject       = require("../teamworkApi/UpdateProject");
    var ProjectCommitter    = require("../teamworkApi/ProjectCommitter");
    var Locking             = require("../locking/ElementLocker");
    var TeamworkBase        = require("../teamworkApi/TeamworkBase");

    //Functions
    function _handleConfigure() {
        CommandManager.execute(Commands.FILE_PREFERENCES, TeamworkPreferences.getId());
    }

    function doIfProjectIsTeamworkProject(operationCallback) {
        if(TeamworkBase.isTeamworkProject()) {
            operationCallback();
        } else {
            Toast.error("Project has to be Teamwork-Project to execute this operation!");
        }
    }

    function lockWholeTeamworkProject() {
        doIfProjectIsTeamworkProject(LockElement.lockWholeTeamworkProject);
    }

    function updateProjectLockInfo() {
        doIfProjectIsTeamworkProject(LockElement.updateProjectLockInfo);
    }

    function updateProject() {
        doIfProjectIsTeamworkProject(UpdateProject.updateProject);
    }

    function commitProjectChanges() {
        doIfProjectIsTeamworkProject(ProjectCommitter.commitProjectChanges);
    }

    function lockElement() {
        doIfProjectIsTeamworkProject(Locking.lockElement);
    }

    function unlockElement() {
        doIfProjectIsTeamworkProject(Locking.unlockElement);
    }

   //Backbone
   exports.handleConfigure	       = _handleConfigure;
   exports.openProject             = OpenProject.openTeamworkProject;
   exports.createProject           = CreateProject.createTeamworkProject;
   exports.lockWholeProject        = lockWholeTeamworkProject;
   exports.updateProjectLockInfo   = updateProjectLockInfo;
   exports.updateProject           = updateProject;
   exports.commitChanges           = commitProjectChanges;
   exports.lockElement             = lockElement;
   exports.unlockElement           = unlockElement;
});