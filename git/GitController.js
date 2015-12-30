/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    var OpenProject = require("git/OpenProject");
    var SaveProject = require("git/SaveProject");
    var LockElement = require("git/LockElement");

    //Backbone
    exports.openProject = OpenProject.openTeamworkProject;
    exports.saveProject = SaveProject.saveTeamworkProject;
    exports.lockWholeProject = LockElement.lockWholeTeamworkProject;
    exports.updateProjectLockInfo   = LockElement.updateProjectLockInfo;
});