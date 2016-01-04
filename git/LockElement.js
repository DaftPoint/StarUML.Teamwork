/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Modules
    var PreferenceManager 	= app.getModule("core/PreferenceManager");
    var Toast 				= app.getModule("ui/Toast");
    var Repository      	= app.getModule("core/Repository");
    var ProjectManager  	= app.getModule("engine/ProjectManager");
    var Async  	            = app.getModule("utils/Async");
    var Dialogs             = app.getModule('dialogs/Dialogs');
    var FileSystem          = app.getModule("filesystem/FileSystem");

    var GitBase             = require("../git/Base");
    var GitConfiguration    = require("../git/GitConfiguration");
    var GitApi              = require("../htmlGit");
    var ProgressDialog      = require("../dialogs/ProgressDialog");

    //Constants
    var ERROR_LOCKING_PROJECT    = "[Locking Project failed:] ";

    var NOT_LOCKED            = "NOT_LOCKED";
    var LOCKED                = "LOCKED";

    var CMD_LOCK_PROJECT      = "lockProject";
    var CMD_LOAD_KNOWN_LOCKS      = "loadKnownLocks";

    //Variables

    //Functions

    function lockWholeProject() {
        lockProject(loadProject());
    }

    function lockGivenElements(elements) {
        var workingPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURLWithoutUsernameAndPasswort();
        var projectName = GitBase.getTeamworkProjectName();
        var username = GitConfiguration.getUsername();


        elements.forEach(function (element, index, array) {
            var elementID = element.escapedID;
            var unescapedElementId = element.elementID;
            var elementWorkingPath = workingPath + "/locking/" + projectName + "/" + elementID;
            GitBase.getProjectsRootDir(elementWorkingPath, function (workingDir) {
                var branchName = elementID;
                //TODO: REFACTORING!!!
                workingDir.getDirectory('.git', {create:true}, function(gitDir){
                        gitDir.getDirectory('objects', {create: true}, function(objectsDir){
                            var file = FileSystem.getFileForPath(elementWorkingPath + "/.git/HEAD");
                            file.write('ref: refs/heads/locks/' + projectName + '/' + branchName + '\n', function() {
                                var options = {
                                    dir: workingDir,
                                    branch: 'locks/' + projectName + '/' + branchName
                                };
                                GitApi.branch(options, function () {
                                    var options = {
                                        dir: workingDir,
                                        branch: 'locks/' + projectName + '/' + branchName
                                    };
                                    GitApi.checkout(options, function () {
                                        var file = FileSystem.getFileForPath(elementWorkingPath + "/lockedBy.json");
                                        var value = {
                                            lockedBy: username,
                                            elementID: unescapedElementId
                                        };
                                        file.write(JSON.stringify(value), function() {
                                            var options = {
                                                dir: workingDir,
                                                name: GitConfiguration.getUsername(),
                                                email: GitConfiguration.getUsername() + '@noreply.com',
                                                commitMsg: 'Locking Element: ' + unescapedElementId
                                            };
                                            GitApi.commit(options, function() {
                                                var options = {
                                                    dir: workingDir,
                                                    url: remoteURL,
                                                    username: GitConfiguration.getUsername(),
                                                    password: GitConfiguration.getPassword(),
                                                    progress: ProgressDialog.showProgress("Locking Element...", "Connecting to server...")
                                                };
                                                GitApi.push(options, function() {
                                                    GitBase.setTeamworkProjectName(projectName);
                                                    Toast.info("TeamworkProject created...");
                                                    Dialogs.cancelModalDialogIfOpen('modal');
                                                    workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                                    workingDir.moveToTrash();
                                                });
                                            }, function (err) {
                                                workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                                workingDir.moveToTrash();
                                                Dialogs.cancelModalDialogIfOpen('modal');
                                                Toast.error(err);
                                            });
                                        });
                                        },
                                        function (err) {
                                            workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                            workingDir.moveToTrash();
                                            Dialogs.cancelModalDialogIfOpen('modal');
                                            Toast.error(err);
                                        });
                                });
                            });
                        }, function(e) { console.log(e); });
                    },
                    function(e){
                    });
            });
        });
    }

    function unlockGivenElements(elements) {
        var workingPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURLWithoutUsernameAndPasswort();
        var projectName = GitBase.getTeamworkProjectName();

        elements.forEach(function (element, index, array) {
            var branchName = element;
            var elementWorkingPath = workingPath + "/locking/" + projectName + "/" + branchName;

            GitBase.getProjectsRootDir(elementWorkingPath, function (workingDir) {
                //TODO: REFACTORING!!!
                workingDir.getDirectory('.git', {create:true}, function(gitDir){
                        gitDir.getDirectory('objects', {create: true}, function(objectsDir){
                            var file = FileSystem.getFileForPath(elementWorkingPath + "/.git/HEAD");
                            file.write('ref: refs/heads/locks/' + projectName + '/' + branchName + '\n', function() {
                                var options = {
                                    dir: workingDir,
                                    branch: 'locks/' + projectName + '/' + branchName
                                };
                                GitApi.branch(options, function () {
                                    var options = {
                                        dir: workingDir,
                                        branch: 'locks/' + projectName + '/' + branchName
                                    };
                                    GitApi.checkout(options, function () {
                                            var options = {
                                                dir: workingDir,
                                                url: remoteURL,
                                                remove: true,
                                                username: GitConfiguration.getUsername(),
                                                password: GitConfiguration.getPassword(),
                                                progress: ProgressDialog.showProgress("Locking Element...", "Connecting to server...")
                                            };
                                            GitApi.push(options, function() {
                                                GitBase.setTeamworkProjectName(projectName);
                                                Toast.info("TeamworkProject created...");
                                                Dialogs.cancelModalDialogIfOpen('modal');
                                                workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                                workingDir.moveToTrash();
                                            });
                                        },
                                        function (err) {
                                            workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                            workingDir.moveToTrash();
                                            Dialogs.cancelModalDialogIfOpen('modal');
                                            Toast.error(err);
                                        });
                                });
                            });
                        }, function(e) { console.log(e); });
                    },
                    function(e){
                    });
            });
        });
    }

    function updateLockInfo() {
        var localPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURL();
        var gitModule = initGitModule();
        var projectName = ProjectManager.getFilename();
        executeUpdateLockInfo(gitModule, localPath, remoteURL, projectName);
    }

    function loadProject() {
        return ProjectManager.getProject();
    }

    function lockProject(element) {
        var checkValue = LOCKED;
        if(isElementNotUndefined(element.ownedElements)) {
            checkValue = lockOwnedObjects(element.ownedElements);
        }
        /*if(isElementNotUndefined(element.ownedViews)) {
            checkValue = lockOwnedObjects(element.ownedViews);
        }*/
        lockSingleElement(element, checkValue);
    }

    function lockOwnedObjects(elements) {
        if(elements == null) return;
        for(var innerElement in elements) {
            innerElement = elements[innerElement];
            if((innerElement._id == null) || isElementUndefined(innerElement._id)) return NOT_LOCKED;
            if (isElementNotUndefined(innerElement.ownedElements)) {
                lockOwnedObjects(innerElement.ownedElements);
            }
            lockSingleElement(innerElement);
        }
    }

    function lockSingleElement(element, checkValue) {
        if (!isObjectLocked(checkValue)) element.ownedElements = null;
        var localPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURL();
        var gitModule = initGitModule();
        var username = GitConfiguration.getUsername();
        var projectName = ProjectManager.getFilename();
        var elementId = element._id;
        elementId = elementId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        executeLockProject(gitModule, localPath, remoteURL, elementId, element._id, username, projectName);
    }

    function executeLockProject(gitModule, workingPath, remotePath, elementID, unescapedElementId,  username, projectName) {
        gitModule.exec(CMD_LOCK_PROJECT, workingPath, remotePath, elementID, unescapedElementId, username, projectName)
            .done(function (elementID) {
                console.log("locked: " + elementID);
            })
            .fail(function (err) {
                if(err) {
                    console.error(ERROR_LOCKING_PROJECT, err);
                }
            })
        ;
    }

    function executeUpdateLockInfo(gitModule, workingPath, remotePath, projectName) {
        gitModule.exec(CMD_LOAD_KNOWN_LOCKS, workingPath, remotePath, projectName)
            .done(function (locks) {
                locks.forEach(function(lockInfo, index, array) {
                    var lockedElement = Repository.get(lockInfo.elementID);
                    if(lockedElement !== undefined) {//TODO: Only for Test-Purpose. Don't forget to remove!!!
                        lockedElement.lockElement(lockInfo.lockedBy);
                    }
                })
            })
            .fail(function (err) {
                if(err) {
                    console.error(ERROR_LOCKING_PROJECT, err);
                }
            })
        ;
    }

    function isObjectLocked(checkValue) {
        return checkValue != NOT_LOCKED;
    }

    function initGitModule() {
        GitBase.init();
        return GitBase.getGitNodeDomain();
    }

    function isElementUndefined(element) {
        return typeof element == 'undefined';
    }

    function isElementNotUndefined(element){
        return typeof element !== 'undefined';
    }

    //Backend
    exports.lockWholeTeamworkProject = lockWholeProject;
    exports.updateProjectLockInfo = updateLockInfo;
    exports.lockGivenElements = lockGivenElements;
    exports.unlockGivenElements = unlockGivenElements;
});