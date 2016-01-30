/**
 * Copyright (c) 2016 Michael Seiler. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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
    var Async               = app.getModule("utils/Async");

    //Imports
    var PlatformFileSystem      = require("../file/PlatformFileSystem").PlatformFileSystem;
    var DefaultDialog           = require("../dialogs/DefaultDialogs");
    var TeamworkConfiguration   = require("../preferences/TeamworkConfiguration");
    var GitApi                  = require("../StarGit/api-built");
    var ProgressDialog          = require("../dialogs/ProgressDialog");
    var TeamworkView            = require("../teamworkView/TeamworkView");
    var LockElement             = require("./LockElement");
    var ProjectJSONBuilder      = require("./ProjectJSONBuilder");

    //Constants
    var PREFERENCE_LOCAL_PATH           = "teamwork.server.local";
    var NO_PROJECT_DATA_FOUND_MESSAGE   = "No Project-Data found!";

    //Variables
    var _teamworkProjectName = null;
    var _isTeamworkProject = false;
    var _ignoreLocks       = false;
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
        // workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
        // workingDir.unlink();
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

    function mergeProjectWithLocalChanges(promise, commitMsg, onlyChangedElements, throwError) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir, projectName) {
            try {
                var splitPromise = splitProjectInSingleFiles(false, projectName, onlyChangedElements, throwError);
            } catch(error) {
                nextPromise.reject();
            }
            splitPromise.done(function(change) {
                if(change != "NO_CHANGE") {
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
                }
            });
        });
        return nextPromise;
    }

    function getProjectPath(projectName) {
        var localPath = TeamworkConfiguration.getLocalWorkingDirectory();
        localPath = FileUtils.convertWindowsPathToUnixPath(localPath);
        return localPath + "/" + projectName + "/";
    }

    function splitProjectInSingleFiles(recreateExistingDirectory, projectDirName, onlyChangedElements, overwriteAllowed, throwError) {
        resetChangesDone();
        var nextPromise = new $.Deferred();
        var idMap = Repository.getIdMap();
        var changedIds;
        if(onlyChangedElements) {
            changedIds = getChangedElementIDs();
            if(Object.keys(changedIds).length === 0) {
                if(throwError) {
                    TeamworkView.addTeamworkItem("Error", "No changes to commit", new Date().toJSON().slice(0, 19).replace("T", " "), TeamworkConfiguration.getUsername());
                    nextPromise.reject("NO_CHANGES");
                    throw new Error("No changes to commit");
                } else {
                    nextPromise.resolve("NO_CHANGES");
                    return nextPromise;
                }
            }
        }
        var fragmentDirectory = getProjectPath(projectDirName);
        var directory = FileSystem.getDirectoryForPath(fragmentDirectory);
        if(recreateExistingDirectory) {
            directory.unlink();
            directory.create();
        }
        var iteratorMap;
        if(onlyChangedElements) {
            iteratorMap = changedIds;
            for(var id in changedIds) {
                if(changedIds.hasOwnProperty(id)) {
                    var iterateRefs = function(id) {
                        var refIds = Repository.getRefMap()[id];
                        for(var refId in refIds) {
                            var checkElement = Repository.get(id);
                            if(refIds.hasOwnProperty(refId) && checkElement._parent && checkElement._parent._id != refId) {
                                iteratorMap[refId] = refId;
                                iterateRefs(refId);
                            }
                        }
                    };
                    iterateRefs(id);
                }
            }
        } else {
            iteratorMap = idMap;
        }
        var counterRuns = 0;
        var masterPromise = new $.Deferred();
        for(var key in iteratorMap) {
            if(iteratorMap.hasOwnProperty(key)) {
                var filePathForElement = buildFilePathForElement(fragmentDirectory, key);
                var file = FileSystem.getFileForPath(filePathForElement);
                createFile(file, filePathForElement, idMap[key], iteratorMap, overwriteAllowed, function() {
                    counterRuns++;
                    return counterRuns;
                }, masterPromise);
            }
        }
        masterPromise.done(function() {
            if(getChangesDone() == 0) {
                nextPromise.resolve("NO_CHANGES");
            } else {
                nextPromise.resolve();
            }
        });
        return nextPromise;
    }

    var changesDone = 0;

    function getChangesDone() {
        return changesDone;
    }
    function resetChangesDone() {
        changesDone = 0;
    }
    function countChangePlusOne() {
        changesDone++;
    }

    function createFile(file, path, element, iteratorMap, overwriteAllowed, counterCallback, masterPromise) {
        file.exists(function(exists) {
            if(!exists || overwriteAllowed) {
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

                ProjectManager.exportToFile(element, path);
                console.log(path);
                console.log(element);
                countChangePlusOne();

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
            var counterRuns = counterCallback();
            if(counterRuns == Object.keys(iteratorMap).length) {
                masterPromise.resolve();
            }
        });
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

    function createAndCheckoutBranch(promise, projectName) {
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
                    nextPromise.resolve(workingDir, projectName);
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
            nextPromise.resolve(workingDir, projectName);
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
    }function openProjectFromJsonData(_project) {
        ProjectManager.loadFromJson(_project);
    }

    function loadProjectFromFragments(promise, workDirName) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir, projectName) {
            cleanCurrentWork();
            var directory = loadLocalWorkingDirectory(workDirName);
            directory.getContents(function (err, content, stats) {
                if (err) {
                    Toast.error(NO_PROJECT_DATA_FOUND_MESSAGE);
                    throw err;
                }
                if (!content) {
                    return;
                }
                var fragmentPromise = ProjectJSONBuilder.loadFragmentsAsJsonObjects(content);
                var fragments = fragmentPromise.fragments;
                var masterPromise = fragmentPromise.masterPromise;

                masterPromise.done(function() {
                    var _project = ProjectJSONBuilder.buildProjectFromFragments(fragments);
                    openProjectFromJsonData(_project);
                    setTeamworkProjectName(projectName);
                    var options = getDefaultGitOptions(workingDir, undefined, undefined, projectName);
                    GitApi.getProjectLockRefs(options, function(locks) {
                        LockElement.updateProjectLockInfo(locks);
                        //directory.unlink();
                        nextPromise.resolve(projectName);
                    });
                });
            });
        });
        return nextPromise;
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

    function isTeamworkProject() {
        return _isTeamworkProject;
    }

    function setTeamworkProject(isTeamworkProject) {
        _isTeamworkProject = isTeamworkProject;
    }

    function isIgnoreLocks() {
        return _ignoreLocks;
    }

    function setIgnoreLocks(ignoreLocks) {
        _ignoreLocks = ignoreLocks;
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
    exports.isTeamworkProject = isTeamworkProject;
    exports.setTeamworkProject = setTeamworkProject;
    exports.loadProjectFromFragments = loadProjectFromFragments;
    exports.isIgnoreLocks = isIgnoreLocks;
    exports.setIgnoreLocks = setIgnoreLocks;
});