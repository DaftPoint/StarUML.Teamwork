/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Modules
    var NodeDomain          = app.getModule("utils/NodeDomain");
    var ExtensionUtils      = app.getModule("utils/ExtensionUtils");
    var Dialogs             = app.getModule('dialogs/Dialogs');

    var GitConfiguration    = require("git/GitConfiguration");
    var PlatformFileSystem  = require("../file/PlatformFileSystem").PlatformFileSystem;
    var DefaultDialog       = require("../dialogs/DefaultDialogs");

    //Constants
    var GIT_MODULE_BASE_PATH = "../node/";
    var DOMAIN_NAME_PREFIX   = "teamwork-";
    var MAIN_FILENAME        = "/main";

    //Variables
    var _teamworkProjectName = null;
    var nodeDomain = null;

    //Functions
    function init() {
        if(nodeDomain != null) {
            return;
        }
        var gitModuleName = determineGitModuleName();
        if(gitModuleName == null) {
            throw "No GitModule defined";
        }
        var domainName = DOMAIN_NAME_PREFIX + gitModuleName;
        var modulePath = GIT_MODULE_BASE_PATH + gitModuleName + MAIN_FILENAME;
        nodeDomain = createNewNodeDomain(domainName, modulePath);
    }

    function determineGitModuleName() {
        switch(GitConfiguration.getSelectedGitBackendModule()) {
            case "0":
                return "simplegit";
                break;
            case "1":
                return "jsgit";
                break;
            case "2":
                return "nodegit";
                break;
            default:
                return null;
        }
    }

    function createNewNodeDomain(domainName, modulePath) {
        return new NodeDomain(domainName, ExtensionUtils.getModulePath(module, modulePath));
    }

    function getGitNodeDomain() {
        if(nodeDomain == null) {
            throw "You have to call 'init()' first to initialize the NodeDomain!";
        }
        return nodeDomain;
    }

    function getTeamworkProjectName() {
        return _teamworkProjectName;
    }

    function setTeamworkProjectName(projectName) {
        _teamworkProjectName = projectName;
    }

    function fileErrorHandler(e) {
        Dialogs.showModalDialog(DefaultDialog.DIALOG_ID_ERROR, 'Unexpected File Error', 'File error code is ' + e.code);
    }

    function getProjectsRootDir(dirPath, callback) {
        PlatformFileSystem.requestNativeFileSystem(dirPath, function (fs) {
            callback(fs.root);
        }, function (e) {
            PlatformFileSystem.requestNativeFileSystem(null, function (fs) {
                fs.root.getDirectory(dirPath, {create: true}, callback, fileErrorHandler);
            }, fileErrorHandler);
        });
    }

    //Backend
    exports.init = init;
    exports.getGitNodeDomain = getGitNodeDomain;
    exports.getTeamworkProjectName = getTeamworkProjectName;
    exports.setTeamworkProjectName = setTeamworkProjectName;
    exports.getProjectsRootDir = getProjectsRootDir;
});