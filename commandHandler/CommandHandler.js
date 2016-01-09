define(function (require, exports, module) {
	"use strict";

    //Modules
    var CommandManager      = app.getModule("command/CommandManager");
    var Commands            = app.getModule("command/Commands");

    //Imports
    var TeamworkPreferences = require("./../preferences/TeamworkPreferences");
    var OpenProject         = require("../teamworkApi/OpenProject");
    var CreateProject       = require("../teamworkApi/CreateProject");
    var LockElement         = require("../teamworkApi/LockElement");
    var UpdateProject       = require("../teamworkApi/UpdateProject");

    //Functions
    function _handleConfigure() {
        CommandManager.execute(Commands.FILE_PREFERENCES, TeamworkPreferences.getId());
    }

   //Backbone
   exports.handleConfigure	       = _handleConfigure;
   exports.openProject             = OpenProject.openTeamworkProject;
   exports.createProject           = CreateProject.createTeamworkProject;
   exports.lockWholeProject        = LockElement.lockWholeTeamworkProject;
   exports.updateProjectLockInfo   = LockElement.updateProjectLockInfo;
   exports.updateProject           = UpdateProject.updateProject;
});