define(function (require, exports, module) {
	"use strict";

    var CommandManager      = app.getModule("command/CommandManager");
    var Commands            = app.getModule("command/Commands");

    var TeamworkPreferences = require("./../preferences/TeamworkPreferences");
    var OpenProject         = require("../teamworkApi/OpenProject");
    var SaveProject         = require("../teamworkApi/SaveProject");
    var LockElement         = require("../teamworkApi/LockElement");

    function _handleConfigure() {
        CommandManager.execute(Commands.FILE_PREFERENCES, TeamworkPreferences.getId());
    }

   //# Backbone
   exports.handleConfigure	        =	_handleConfigure;
   exports.openProject             = OpenProject.openTeamworkProject;
   exports.saveProject             = SaveProject.saveTeamworkProject;
   exports.lockWholeProject        = LockElement.lockWholeTeamworkProject;
   exports.updateProjectLockInfo   = LockElement.updateProjectLockInfo;
});