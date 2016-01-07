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
    var TeamworkView            = require("../teamworkView/TeamworkView");

    //Constants
    var PREFERENCE_LOCAL_PATH = "teamwork.server.local";

    //Variables
    var _teamworkProjectName = null;
    var _changedElementIDs   = {};

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

    function mergeProjectWithLocalChanges(promise, commitMsg, onlyChangedElements) {
        var nextPromise = new $.Deferred();
        promise.done(function(projectName, workingDir) {
            try {
                splitProjectInSingleFiles(false, projectName, onlyChangedElements);
            } catch(error) {
                nextPromise.reject();
            }
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

    function splitProjectInSingleFiles(recreateExistingDirectory, projectName, onlyChangedElements) {
        var idMap = Repository.getIdMap();
        var changedIds;
        if(onlyChangedElements) {
            changedIds = getChangedElementIDs();
            if(Object.keys(changedIds).length === 0) {
                TeamworkView.addTeamworkItem("Error", "No changes to commit", new Date().toJSON().slice(0, 19).replace("T", " "), TeamworkConfiguration.getUsername());
                throw new Error("No changes to commit");
            }
        }
        var fragmentDirectory = getProjectPath(projectName);
        var directory = FileSystem.getDirectoryForPath(fragmentDirectory);
        if(recreateExistingDirectory) {
            directory.unlink();
            directory.create();
        }
        var iteratorMap;
        if(onlyChangedElements) {
            iteratorMap = changedIds;
        } else {
            iteratorMap = idMap;
        }
        for (var key in iteratorMap) {
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

    function addChangedElementIDs(changedElements) {
        for(var i = 0; i < changedElements.length; i++) {
            var element = changedElements[i];
            if (element && !_.contains(_changedElementIDs, element._id)) {
                _changedElementIDs[element._id] = element._id;
            }
        }
    }

    function removeChangedElementIdsAfterUndoOperation() {
        throw new Error("Not implemented yet");
    }

    function getChangedElementIDs() {
        return _changedElementIDs;
    }

    function clearChangedIds() {
        _changedElementIDs = {};
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
    exports.addChangedElements = addChangedElementIDs;
    exports.clearChangedIds = clearChangedIds;
    exports.removeChangedElementIdsAfterUndoOperation = removeChangedElementIdsAfterUndoOperation;
});