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
        var username 		= getUsername();
        var password 		= getPassword();
        var remoteHost 		= getRemoteHost();
        var remoteProtocol 	= getRemoteProtocol();
        var remoteURL 		= remoteProtocol;
        remoteURL = addUsernameAndPasswordToRemoteURLWhenGiven(remoteURL, username, password);
        remoteURL = remoteURL + remoteHost;
        return remoteURL;
    }

    function getUserName() {
        return PreferenceManager.get(USERNAME_PREFERENCE);
    }

    function addUsernameAndPasswordToRemoteURLWhenGiven(remoteURL, username, password) {
        if(isUsernameGiven(username)) {
            remoteURL = remoteURL + username;
            remoteURL = addPasswordToRemoteURLWhenGiven(remoteURL, password);
            remoteURL = addAtSignToRemoteURL(remoteURL);
        }
        return remoteURL;
    }

    function addAtSignToRemoteURL(remoteURL) {
        return remoteURL + "@";
    }

    function addPasswordToRemoteURLWhenGiven(remoteURL, password) {
        if(isPasswordGiven(password)) {
            remoteURL = remoteURL + ":" + password;
        }
        return remoteURL;
    }

    function isUsernameGiven(username) {
        return username != "" && username != null;
    }

    function isPasswordGiven(password) {
        return password != "" && password != null;
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
});