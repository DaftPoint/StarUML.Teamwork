define(function (require, exports, module) {
	"use strict";

    var CommandManager      = app.getModule("command/CommandManager");
    var Commands            = app.getModule("command/Commands");

    var TeamworkPreferences = require("TeamworkPreferences");

    function _handleConfigure() {
        CommandManager.execute(Commands.FILE_PREFERENCES, TeamworkPreferences.getId());
    }

   //# Backbone
   exports.handleConfigure	=	_handleConfigure;
});