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
    var Toast               = app.getModule("ui/Toast");
    var PreferenceManager   = app.getModule("core/PreferenceManager");
    var ProjectManager      = app.getModule("engine/ProjectManager");
    var FileSystem          = app.getModule("filesystem/FileSystem");
    var Constants           = app.getModule("utils/Constants");
    var Repository      	= app.getModule("core/Repository");
    var FileUtils           = app.getModule("file/FileUtils");

    //Imports
    var PlatformFileSystem      = require("../file/PlatformFileSystem").PlatformFileSystem;
    var DefaultDialog           = require("../dialogs/DefaultDialogs");
    var TeamworkConfiguration   = require("../preferences/TeamworkConfiguration");
    var GitApi                  = require("../htmlGit");
    var ProgressDialog          = require("../dialogs/ProgressDialog");

    //Constants
    var PREFERENCE_LOCAL_PATH = "teamwork.server.local";

    //Variables
    var _teamworkProjectName = null;

    //Functions

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

    function cleanCurrentWork() {
        ProjectManager.closeProject();
        ProjectManager.newProject();
    }

    function loadLocalWorkingPath(projectName) {
        var definedWorkingPath = PreferenceManager.get(PREFERENCE_LOCAL_PATH);
        return definedWorkingPath + "/" + projectName;
    }

    function loadLocalWorkingDirectory(projectName) {
        var localWorkingDir = loadLocalWorkingPath(projectName);
        return FileSystem.getDirectoryForPath(localWorkingDir);
    }

    function handleGitApiError(workingDir, error) {
        workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
        workingDir.unlink();
        Dialogs.cancelModalDialogIfOpen('modal');
        Toast.error(error);
    }

    function getDefaultGitOptions(workingDir, branch, progressCallback, projectName) {
        return {
            dir: workingDir,
            url: TeamworkConfiguration.getRemoteURL(),
            branch: branch,
            depth: 1,
            username: TeamworkConfiguration.getUsername(),
            password: TeamworkConfiguration.getPassword(),
            progress: progressCallback,
            projectName: projectName
        };
    }

    function prepareWorkingDirectory(promiseResolveValue, workingPath, refContent) {
        var promise = $.Deferred();
        var directory = FileSystem.getDirectoryForPath(workingPath);
        directory.unlink();
        getProjectsRootDir(workingPath, function (workingDir) {
            workingDir.getDirectory('.git', {create:true}, function(gitDir){
                    gitDir.getDirectory('objects', {create: true}, function(objectsDir){
                        var file = FileSystem.getFileForPath(workingPath + "/.git/HEAD");
                        file.write('ref: '+ refContent + '\n', function() {
                            promise.resolve(workingDir, promiseResolveValue);
                        });
                    }, function(error) {
                        handleGitApiError(workingDir, error)
                    });
                },
                function(error){
                    handleGitApiError(workingDir, error)
                });
        });
        return promise;
    }

    function mergeProjectWithLocalChanges(promise, commitMsg) {
        var nextPromise = new $.Deferred();
        promise.done(function(projectName, workingDir) {
            splitProjectInSingleFiles(false, projectName);
            var options = {
                dir: workingDir,
                name: TeamworkConfiguration.getUsername(),
                email: TeamworkConfiguration.getUsername() + '@noreply.com',
                commitMsg: commitMsg
            };
            GitApi.commit(options, function() {
                nextPromise.resolve(workingDir);
            },
            function (err) {
                handleGitApiError(workingDir, err);
            });
        });
        return nextPromise;
    }

    function getProjectPath(projectName) {
        var localPath = TeamworkConfiguration.getLocalWorkingDirectory();
        localPath = FileUtils.convertWindowsPathToUnixPath(localPath);
        return localPath + "/" + projectName + "/";
    }

    function splitProjectInSingleFiles(recreateExistingDirectory, projectName) {
        var idMap = Repository.getIdMap();
        var fragmentDirectory = getProjectPath(projectName);
        var directory = FileSystem.getDirectoryForPath(fragmentDirectory);
        if(recreateExistingDirectory) {
            directory.unlink();
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

    function pushToServer(promise, progressTitle) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir) {
            var progressCallback = ProgressDialog.showProgress(progressTitle, "Connecting to server...");
            var options = getDefaultGitOptions(workingDir, undefined, progressCallback);
            GitApi.push(options, function() {
                nextPromise.resolve(workingDir);
            });
        });
        return nextPromise;
    }

    function createAndCheckoutBranch(promise) {
        var nextPromise = $.Deferred();
        promise.done(function(workingDir, branchName) {
            var options = {
                dir: workingDir,
                branch: branchName
            };
            GitApi.branch(options, function () {
                var options = {
                    dir: workingDir,
                    branch: branchName
                };
                GitApi.checkout(options, function () {
                        nextPromise.resolve(workingDir);
                    },
                    function (error) {
                        handleGitApiError(workingDir, error)
                    });
            });
        });
        return nextPromise;
    }

    function cloneProjectFromServer(workingDir, projectName) {
        var nextPromise = new $.Deferred();
        var branchName = 'projects/' + projectName;
        var progressCallback = ProgressDialog.showProgress("Loading Teamwork-Project...", "Connecting to server...");
        var options = getDefaultGitOptions(workingDir, branchName, progressCallback);
        GitApi.clone(options, function () {
            nextPromise.resolve(projectName, workingDir);
        },
        function (err) {
            handleGitApiError(workingDir, err);
        });
        return nextPromise;
    }

    //Backend
    exports.getTeamworkProjectName = getTeamworkProjectName;
    exports.setTeamworkProjectName = setTeamworkProjectName;
    exports.getProjectsRootDir = getProjectsRootDir;
    exports.cleanCurrentWork = cleanCurrentWork;
    exports.loadLocalWorkingPath = loadLocalWorkingPath;
    exports.loadLocalWorkingDirectory = loadLocalWorkingDirectory;
    exports.handleGitApiError = handleGitApiError;
    exports.getDefaultGitOptions = getDefaultGitOptions;
    exports.prepareWorkingDirectory = prepareWorkingDirectory;
    exports.mergeProjectWithLocalChanges = mergeProjectWithLocalChanges;
    exports.splitProjectInSingleFiles = splitProjectInSingleFiles;
    exports.pushToServer = pushToServer;
    exports.createAndCheckoutBranch = createAndCheckoutBranch;
    exports.getProjectPath = getProjectPath;
    exports.cloneRepoFromServer = cloneProjectFromServer;
});