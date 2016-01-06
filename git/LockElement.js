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
    var ModelExplorerView   = app.getModule("explorer/ModelExplorerView");

    var GitBase             = require("../git/Base");
    var GitConfiguration    = require("../git/GitConfiguration");
    var GitApi              = require("../htmlGit");
    var ProgressDialog      = require("../dialogs/ProgressDialog");
    var TeamworkView        = require("../teamworkView/TeamworkView");

    //Constants

    var NOT_LOCKED            = "NOT_LOCKED";
    var LOCKED                = "LOCKED";


    //Variables

    //Functions

    function lockWholeProject() {
        throw Error("Not implemented");
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
                                            elementID: unescapedElementId,
                                            lockingDate: new Date().toJSON().slice(0,19).replace("T", " ")
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
                                                    Toast.info("Element locked...");
                                                    Dialogs.cancelModalDialogIfOpen('modal');
                                                    workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                                    workingDir.moveToTrash();
                                                    TeamworkView.addElementLockedEvent(value.elementID, value.lockingDate, value.lockedBy);
                                                    ModelExplorerView.rebuild();
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
                                                progress: ProgressDialog.showProgress("Unlocking Element...", "Connecting to server...")
                                            };
                                            GitApi.push(options, function() {
                                                GitBase.setTeamworkProjectName(projectName);
                                                Toast.info("Element unlocked...");
                                                Dialogs.cancelModalDialogIfOpen('modal');
                                                workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                                                workingDir.moveToTrash();
                                                TeamworkView.addElementUnlockedEvent(element, GitConfiguration.getUsername());
                                                ModelExplorerView.rebuild();
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
        var projectName = GitBase.getTeamworkProjectName();

        GitBase.getProjectsRootDir(localPath, function(workingDir) {
            var options = {
                dir: workingDir,
                url: GitConfiguration.getRemoteURLWithoutUsernameAndPasswort(),
                username: GitConfiguration.getUsername(),
                password: GitConfiguration.getPassword(),
                projectName: GitBase.getTeamworkProjectName()
            }
            GitApi.getProjectLockRefs(options, function(locks) {
                executeUpdateLockInfo(locks, projectName);
                workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
                workingDir.moveToTrash();
                ModelExplorerView.rebuild();
            });
        });
    }

    function executeUpdateLockInfo(locks, projectName) {
        var remoteURL = GitConfiguration.getRemoteURL();
        locks.forEach(function(lockInfo, index, array) {
            var lockName = lockInfo.name;
            var localPath = GitConfiguration.getLocalWorkingDirectory();
            var locksPath = localPath + "/locking/" + projectName + "/" + lockName;
            GitBase.getProjectsRootDir(locksPath, function(workingDir) {
                var options = {
                    dir: workingDir,
                    url: remoteURL,
                    branch: 'locks/' + projectName + '/' + lockName,
                    depth: 1,
                    username: GitConfiguration.getUsername(),
                    password: GitConfiguration.getPassword(),
                    progress: ProgressDialog.showProgress("Loading Teamwork-Project-Locks...", "Connecting to server...")
                };
                GitApi.clone(options, function () {
                    var lockInfoFile = FileSystem.getFileForPath(workingDir.fullPath + "/lockedBy.json");
                    lockInfoFile.read(function(err, data, stat) {
                        lockInfoFile = JSON.parse(data);
                        var lockedElement = Repository.get(lockInfoFile.elementID);
                        if(lockedElement !== undefined) {//TODO: Only for Test-Purpose. Don't forget to remove!!!
                            lockedElement.lockElement(lockInfoFile.lockedBy);
                        }
                        Dialogs.cancelModalDialogIfOpen('modal');
                        TeamworkView.addUpdateLockInfoEvent(lockInfoFile.elementID, lockInfoFile.lockingDate, lockInfoFile.lockedBy);
                    });
                    },
                    function (err) {
                        workingDir.moveToTrash();
                        Dialogs.cancelModalDialogIfOpen('modal');
                        Toast.error(err);
                });
            });
        });
    }

    //Backend
    exports.lockWholeTeamworkProject = lockWholeProject;
    exports.updateProjectLockInfo = updateLockInfo;
    exports.lockGivenElements = lockGivenElements;
    exports.unlockGivenElements = unlockGivenElements;
});