/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Modules
    var Toast               = app.getModule("ui/Toast");
    var Dialogs             = app.getModule('dialogs/Dialogs');
    var PreferenceManager   = app.getModule("core/PreferenceManager");
    var ProjectManager      = app.getModule("engine/ProjectManager");
    var FileSystem          = app.getModule("filesystem/FileSystem");
    var Repository          = app.getModule("core/Repository");
    var DiagramManager      = app.getModule("diagrams/DiagramManager");

    //Imports
    var GitBase            = require("git/Base");
    var GitConfiguration   = require("git/GitConfiguration");
    var ProjectJSONBuilder = require("./open/ProjectJSONBuilder");
    var LockElement        = require("git/LockElement");
    var GitApi             = require("../htmlGit");
    var ProgressDialog     = require("../dialogs/ProgressDialog");
    var TeamworkView       = require("../locks_view/LockView");

    //Constants
    var NO_PROJECT_DATA_FOUND_MESSAGE           = "No Project-Data found!";
    var CONFIRM_MESSAGE_LOADING_PROJECT         = "Are you sure? Current Project will be closed! Select Project to load...";
    var PROJECT_LOADING_CANCELLATION_MESSAGE    = "Project-Loading cancelled";

    var PREFERENCE_LOCAL_PATH = "teamwork.server.local";

    //Variables

    //Functions
    function openTeamworkProject() {
        var remoteProjectURL = GitConfiguration.getRemoteURLWithoutUsernameAndPasswort();

        var PlatformFileSystem = require("../file/PlatformFileSystem").PlatformFileSystem;
        var DefaultDialog      = require("../dialogs/DefaultDialogs");

        function fileErrorHandler(e) {
            Dialogs.showModalDialog(DefaultDialog.DIALOG_ID_ERROR, 'Unexpected File Error', 'File error code is ' + e.code);
        }

        function getProjectsRootDir(dirPath, callback) {
            PlatformFileSystem.requestNativeFileSystem(dirPath, function (fs) {
                callback(fs.root);
            }, function (e) {
                PlatformFileSystem.requestNativeFileSystem(null, function (fs) {
                    fs.root.getDirectory(localWorkingDir, {create: true}, callback, fileErrorHandler);
                }, fileErrorHandler);
            });
        }

        var localWorkingDir = loadLocalWorkingDirectory("Project");
        getProjectsRootDir(localWorkingDir, function (workingDir) {
            var options = {
                dir: workingDir,
                url: remoteProjectURL,
                depth: 1,
                username: GitConfiguration.getUsername(),
                password: GitConfiguration.getPassword(),
                progress: function (progress) {
                    console.log(progress.pct, progress.msg);
                }
            };
            GitApi.getProjectRefs(options, function (projectRefs) {
                var options = [];
                projectRefs.forEach(function (item, index, array) {
                    options.push({text: item.name, value: item.name});
                });
                var dlg = Dialogs.showSelectDropdownDialog(CONFIRM_MESSAGE_LOADING_PROJECT, options);
                dlg.done(function (buttonId, projectName) {
                    if (buttonId === Dialogs.DIALOG_BTN_OK) {
                        var options = {
                            dir: workingDir,
                            url: remoteProjectURL,
                            branch: 'projects/' + projectName,
                            depth: 1,
                            username: GitConfiguration.getUsername(),
                            password: GitConfiguration.getPassword(),
                            progress: ProgressDialog.showProgress("Loading Teamwork-Project...", "Connecting to server...")
                        };
                        GitApi.clone(options, function () {
                                loadProjectFromFragments("Project", workingDir);
                                GitBase.setTeamworkProjectName(projectName);
                                Dialogs.cancelModalDialogIfOpen('modal');
                                Toast.info("Opening Project...");
                                TeamworkView.addTeamworkItem("Loading Project", "Loaded Teamwork-project " + projectName, new Date().toJSON().slice(0,19).replace("T", " "), GitConfiguration.getUsername());
                            },
                            function (err) {
                                workingDir.moveToTrash();
                                Dialogs.cancelModalDialogIfOpen('modal');
                                Toast.error(err);
                            });
                    } else {
                        Toast.error(PROJECT_LOADING_CANCELLATION_MESSAGE);
                    }
                });
            });
        });
    }

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
        $(exports).triggerHandler('teamworkProjectLoaded', [GitBase.getTeamworkProjectName()]);
    }

    function loadProjectFromFragments(projectName, workingDir) {
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
                var options = {
                    dir: workingDir,
                    url: GitConfiguration.getRemoteURLWithoutUsernameAndPasswort(),
                    username: GitConfiguration.getUsername(),
                    password: GitConfiguration.getPassword(),
                    projectName: GitBase.getTeamworkProjectName()
                }
                GitApi.getProjectLockRefs(options, function(locks) {
                    LockElement.updateProjectLockInfo(locks);
                    directory.moveToTrash();
                });
            });
        });
    }

    function loadLocalWorkingDirectory(projectName) {
        var definedWorkingPath = PreferenceManager.get(PREFERENCE_LOCAL_PATH);
        return definedWorkingPath + "/" + projectName;
    }

    //Backend
    exports.openTeamworkProject = openTeamworkProject;
});