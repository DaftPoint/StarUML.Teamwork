/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {

    //Modules
    var PreferenceManager 	= app.getModule("core/PreferenceManager");
    var Toast 				= app.getModule("ui/Toast");
    var Repository      	= app.getModule("core/Repository");
    var ProjectManager  	= app.getModule("engine/ProjectManager");
    var Helper              = app.getModule("utils/Helper");
    var FileSystem          = app.getModule("filesystem/FileSystem");
    var Constants           = app.getModule("utils/Constants");
    var Dialogs             = app.getModule('dialogs/Dialogs');

    var GitBase             = require("./Base");
    var GitConfiguration    = require("./GitConfiguration");
    var GitApi              = require("../htmlGit");
    var ProgressDialog      = require("../dialogs/ProgressDialog");

    //Constants
    var ERROR_SAVING_PROJECT  = "[Error commiting Projekt-Fragment to Teamwork-Server:] ";

    var NOT_CREATED           = "NOT_CREATED";
    var OK                    = "OK";

    var CMD_CREATE_NEW_PROJECT       = "createNewProject";

    //Variables

    //Functions

    function saveProject() {
        var dlg = Dialogs.showInputDialog("Enter a name for the Project");
        dlg.done(function (buttonId, projectName) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                //splitProjectInSingleFiles(true, projectName);
                createNewProjectOnTeamworkServer(projectName);
                Repository.setModified(false);
            } else {
                Toast.error("Creating Teamwork-Project cancelled");
            }
        });
    }

    function updateProject() {
        throw "Not yet implemented";
    }

    function uploadChanges() {
        throw "Not yet implemented";
    }

    function createNewProjectOnTeamworkServer(projectName) {
        var localPath = getProjectPath(projectName);
        var remoteURL = GitConfiguration.getRemoteURLWithoutUsernameAndPasswort();
        GitBase.getProjectsRootDir(localPath, function (workingDir) {
                var options = {
                    dir: workingDir,
                    branch: 'projects/' + projectName
                };
                GitApi.branch(options, function () {
                    var options = {
                        dir: workingDir,
                        branch: 'projects/' + projectName
                    };
                    GitApi.checkout(options, function () {
                            splitProjectInSingleFiles(false, projectName);
                            var options = {
                                dir: workingDir,
                                name: GitConfiguration.getUsername(),
                                email: GitConfiguration.getUsername() + '@noreply.com',
                                commitMsg: 'Creating Project: ' + projectName
                            };
                            GitApi.commit(options, function() {
                                var options = {
                                    dir: workingDir,
                                    url: remoteURL,
                                    username: GitConfiguration.getUsername(),
                                    password: GitConfiguration.getPassword(),
                                    progress: ProgressDialog.showProgress("Creating Teamwork-Project...", "Connecting to server...")
                                };
                                GitApi.push(options, function() {
                                    GitBase.setTeamworkProjectName(projectName);
                                    Toast.info("TeamworkProject created...");
                                    Dialogs.cancelModalDialogIfOpen('modal');
                                    /*var options = {
                                        url: remoteURL,
                                        username: GitConfiguration.getUsername(),
                                        password: GitConfiguration.getPassword()
                                    };
                                    GitApi.getRemoteBranches(options, function(branches) {
                                        console.log(branches);
                                    });*/

                                    var options = {
                                        dir: workingDir,
                                        url: remoteURL,
                                        depth: 1,
                                        username: GitConfiguration.getUsername(),
                                        password: GitConfiguration.getPassword(),
                                        progress: function (progress) {
                                            console.log(progress.pct, progress.msg);
                                        }
                                    };
                                    GitApi.getProjectRefs(options, function (projectRefs) {

                                    });
                                    workingDir.removeRecursively();
                                });
                            }, function (err) {
                                workingDir.removeRecursively();
                                Dialogs.cancelModalDialogIfOpen('modal');
                                Toast.error(err);
                            });
                        },
                        function (err) {
                            workingDir.removeRecursively();
                            Dialogs.cancelModalDialogIfOpen('modal');
                            Toast.error(err);
                        });
                    });
                });
    }

    /*function createNewProjectOnTeamworkServer(projectName) {
        var localPath = getProjectPath(projectName);
        var remoteURL = GitConfiguration.getRemoteURL();
        var gitModule = initGitModule();
        executeCreateProject(gitModule, localPath, remoteURL, projectName);
    }*/

    function executeCreateProject(gitModule, localPath, remoteURL, projectName) {
        gitModule.exec(CMD_CREATE_NEW_PROJECT, localPath, remoteURL, projectName)
            .done(function (success) {
                Toast.info("Creating Project completed");
            })
            .fail(function (err) {
                console.error(ERROR_SAVING_PROJECT, err);
                Toast.error("Creating Project failed");
            });
    }

    function getProjectPath(projectName) {
        var localPath = GitConfiguration.getLocalWorkingDirectory();
        return localPath + "/" + projectName + "/";
    }

    function splitProjectInSingleFiles(deleteExistingDirectory, projectName) {
        var idMap = Repository.getIdMap();
        var fragmentDirectory = getProjectPath(projectName);
        var directory = FileSystem.getDirectoryForPath(fragmentDirectory);
        if(deleteExistingDirectory) {
            directory.moveToTrash();
            directory.create();
        }
        for (var key in idMap) {
            var element = idMap[key];
            var tempOwnedElements = element.ownedElements;
            var tempOwnedViews = element.ownedViews;
            var tempSubViews = element.subViews;
            if(tempOwnedElements != null && tempOwnedElements !== undefined) {
                element.ownedElements = null;
            }
            if(tempOwnedViews != null && tempOwnedViews !== undefined) {
                element.ownedViews = null;
            }
            if(tempSubViews != null && tempSubViews !== undefined) {
                element.subViews = null;
            }
            ProjectManager.exportToFile(element, buildFilePathForElement(fragmentDirectory, key));
            if(tempOwnedElements != null && tempOwnedElements !== undefined) {
                element.ownedElements = tempOwnedElements;
            }
            if(tempOwnedViews != null && tempOwnedViews !== undefined) {
                element.ownedViews = tempOwnedViews;
            }
            if(tempSubViews != null && tempSubViews !== undefined) {
                element.subViews = tempSubViews;
            }
        }
    }

    function buildFilePathForElement(fragmentDirectory, id) {
        var convertedId = id.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return fragmentDirectory + convertedId + "." + Constants.FRAG_EXT;
    }

    function initGitModule() {
        GitBase.init();
        return GitBase.getGitNodeDomain();
    }

    //Backend
    exports.saveTeamworkProject = saveProject;
    exports.uploadChanges = uploadChanges;
    exports.updateProject = updateProject;
    exports.splitProjectInSingleFiles = splitProjectInSingleFiles;
});