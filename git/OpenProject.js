/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Modules
    var Toast = app.getModule("ui/Toast");
    var Dialogs = app.getModule('dialogs/Dialogs');
    var PreferenceManager = app.getModule("core/PreferenceManager");
    var ProjectManager = app.getModule("engine/ProjectManager");
    var FileSystem = app.getModule("filesystem/FileSystem");
    var Repository = app.getModule("core/Repository");
    var DiagramManager = app.getModule("diagrams/DiagramManager");

    //Imports
    var GitBase = require("git/Base");
    var GitConfiguration = require("git/GitConfiguration");
    var ProjectJSONBuilder = require("./open/ProjectJSONBuilder");
    var LockElement        = require("git/LockElement");

    //Constants
    var CONFIRM_MESSAGE_LOADING_REPO            = "All Projects that exist at the given local path and all it changes will be removed to load the new Project. Are you sure that you want this?";
    var LOADING_PROJECT_CANCELLED               = "Loading project cancelled by user";
    var LOADING_PROJECT_SUCCESSFUL              = "Loading project was successful!";
    var ERROR_OCCURRED_DURING_LOADING           = "An error occurred during the Project loading!";
    var ERROR_WHILE_LOADING_PROJECT             = "[Error while loading Teamwork-Project:] ";
    var BEGIN_LOADING_TEAMWORK_PROJECT          = "Loading Project - please wait";
    var NO_PROJECT_DATA_FOUND_MESSAGE           = "No Project-Data found!";
    var CONFIRM_MESSAGE_LOADING_PROJECT         = "Are you sure? Current Project will be closed! Select Project to load...";
    var PROJECT_LOADING_CANCELLATION_MESSAGE    = "Project-Loading cancelled";

    var CMD_OPEN_TEAMWORK_PROJECT = "openRepoAndLoadRemoteContent";
    var CMD_LOAD_PROJECT_NAMES = "loadProjectNames";

    var PREFERENCE_LOCAL_PATH = "teamwork.server.local";

    //Variables

    //Functions
    function openTeamworkProject() {
        var remoteProjectURL = GitConfiguration.getRemoteURL();
        //var localWorkingDir = loadWorkingDirectory("Test1");
        var localWorkingDir = loadLocalWorkingDirectory("Blub");

        var PlatformFileSystem  = require("../file/PlatformFileSystem").PlatformFileSystem;
        var DefaultDialog = require("../dialogs/DefaultDialogs");
        function fileErrorHandler(e){
            Dialogs.showModalDialog(DefaultDialog.DIALOG_ID_ERROR, 'Unexpected File Error', 'File error code is ' + e.code);
        }

        function getProjectsRootDir(callback){
            PlatformFileSystem.requestNativeFileSystem(localWorkingDir, function(fs){
                callback(fs.root);
            }, function(e){
                PlatformFileSystem.requestNativeFileSystem(null, function(fs){
                    fs.root.getDirectory(localWorkingDir, {create:true}, callback, fileErrorHandler);
                }, fileErrorHandler);
            });
        }
        getProjectsRootDir(function(workingDir) {
            var GitApi = require("../htmlGit");
            var options = {
                dir: workingDir,
                url: '',
                branch: 'projects/Test1',
                depth: 1,
                username: '',
                password: '',
                progress: function(progress) {
                    console.log(progress.pct, progress.msg);
                }
            };
            GitApi.clone(options, function () {
                    console.log("Success");
                },
                function (err) {
                    console.log("Immer noch error: ", err);
                });
        });
    }
    /*function openTeamworkProject() {
        var projectNamePromise = new $.Deferred();
        var gitModule = loadGitModule();
        var remoteProjectURL = GitConfiguration.getRemoteURL();
        executeCommandLoadProjectNames(gitModule, remoteProjectURL, projectNamePromise);
        projectNamePromise.done(function(projectNames) {
            var options = [];
            projectNames.forEach(function(item, index, array) {
                options.push({text: item, value: item});
            });
            var dlg = Dialogs.showSelectDropdownDialog(CONFIRM_MESSAGE_LOADING_PROJECT, options);
            dlg.done(function (buttonId, projectName) {
                if (buttonId === Dialogs.DIALOG_BTN_OK) {
                    var promise = loadFragmentsFromTeamworkServer(projectName);
                    promise.done(function(message) {
                        loadProjectFromFragments(projectName);
                        GitBase.setTeamworkProjectName(projectName);
                        Toast.info(message);
                    }).fail(function(message) {
                        Toast.error(message);
                    });
                } else {
                    Toast.error(PROJECT_LOADING_CANCELLATION_MESSAGE);
                }
            });
        }).fail(function(message) {
            Toast.error(message);
        });
    }*/

    function cleanCurrentWork() {
        ProjectManager.closeProject();
        ProjectManager.newProject();
    }

    function loadWorkingDirectory(projectName) {
        var localWorkingDir = loadLocalWorkingDirectory(projectName);
        return FileSystem.getDirectoryForPath(localWorkingDir);
    }

    function openProjectFromJsonData(_project) {
        ProjectManager.loadFromJson(_project);
        Repository.setModified(false);
        var projectName = _project.name;
        $(exports).triggerHandler('teamworkProjectLoaded', [projectName]);
    }

    function loadProjectFromFragments(projectName) {
        cleanCurrentWork();
        var directory = loadWorkingDirectory(projectName);
        directory.getContents(function (err, content, stats) {
            if (err) {
                Toast.error(NO_PROJECT_DATA_FOUND_MESSAGE);
                throw err;
            }

            if (content == null || content === undefined) {
                return;
            }

            var fragmentPromise = ProjectJSONBuilder.loadFragmentsAsJsonObjects(content);
            var fragments = fragmentPromise.fragments;
            var masterPromise = fragmentPromise.masterPromise;

            masterPromise.done(function() {
                var _project = ProjectJSONBuilder.buildProjectFromFragments(fragments);
                openProjectFromJsonData(_project);
                directory.moveToTrash();
                LockElement.updateProjectLockInfo();
            });
        });
    }

    function loadFragmentsFromTeamworkServer(projectName) {
        var promise = new $.Deferred();
        Toast.info(BEGIN_LOADING_TEAMWORK_PROJECT + ": " + projectName);
        var gitModule = loadGitModule();
        var localWorkingDir = loadLocalWorkingDirectory(projectName);
        var remoteProjectURL = GitConfiguration.getRemoteURL();
        executeCommandOpenProject(gitModule, localWorkingDir, remoteProjectURL, projectName, promise);
        return promise.promise();
    }

    function executeCommandOpenProject(gitModule, localWorkingDir, remoteProjectURL, projectName, promise) {
        gitModule.exec(CMD_OPEN_TEAMWORK_PROJECT, localWorkingDir, remoteProjectURL, projectName)
            .done(function (success) {
                promise.resolve(LOADING_PROJECT_SUCCESSFUL);
            }).fail(function (err) {
                console.error(ERROR_WHILE_LOADING_PROJECT, err);
                promise.reject(ERROR_OCCURRED_DURING_LOADING);
        });
    }

    function executeCommandLoadProjectNames(gitModule, remoteProjectURL, promise) {
        gitModule.exec(CMD_LOAD_PROJECT_NAMES, remoteProjectURL)
            .done(function (projectNames) {
                promise.resolve(projectNames);
            }).fail(function (err) {
            console.error(ERROR_WHILE_LOADING_PROJECT, err);
            promise.reject(ERROR_OCCURRED_DURING_LOADING);
        });
    }

    function loadGitModule() {
        GitBase.init();
        return GitBase.getGitNodeDomain();
    }

    function loadLocalWorkingDirectory(projectName) {
        var definedWorkingPath = PreferenceManager.get(PREFERENCE_LOCAL_PATH);
        return definedWorkingPath + "/" + projectName;
    }

    //Backend
    exports.openTeamworkProject = openTeamworkProject;
    exports.loadFragmentsFromTeamworkServer = loadFragmentsFromTeamworkServer;
});