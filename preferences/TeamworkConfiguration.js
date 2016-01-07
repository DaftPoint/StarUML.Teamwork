/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Modules
    var PreferenceManager 	= app.getModule("core/PreferenceManager");

    //Constants
    var USERNAME_PREFERENCE = "teamwork.server.username";
    var PASSWORD_PREFERENCE = "teamwork.server.password";
    var REMOTE_PREFERENCE   = "teamwork.server.remote";
    var PROTOCOL_PREFERENCE = "teamwork.server.protocol";
    var LOCAL_WORK_DIR_PREFERENCE = "teamwork.server.local";
    var BACKEND_PREFERENCE = "teamwork.server.backend";

    //Variables

    //Functions
    function getLocalWorkingDirectory() {
        return PreferenceManager.get(LOCAL_WORK_DIR_PREFERENCE);
    }

    function getSelectedGitBackendModule() {
        return PreferenceManager.get(BACKEND_PREFERENCE);
    }

    function buildRemoteURL() {
        var remoteHost 		= getRemoteHost();
        var remoteProtocol 	= getRemoteProtocol();
        return remoteProtocol + remoteHost;
    }

    function getUsername() {
        return PreferenceManager.get(USERNAME_PREFERENCE);
    }

    function getPassword() {
        return PreferenceManager.get(PASSWORD_PREFERENCE);
    }

    function getRemoteHost() {
        return PreferenceManager.get(REMOTE_PREFERENCE);
    }

    function getRemoteProtocol() {
        return PreferenceManager.get(PROTOCOL_PREFERENCE);
    }

    //Backend
    exports.getRemoteURL = buildRemoteURL;
    exports.getLocalWorkingDirectory = getLocalWorkingDirectory;
    exports.getSelectedGitBackendModule = getSelectedGitBackendModule;
    exports.getUsername = getUsername;
    exports.getPassword = getPassword;
});