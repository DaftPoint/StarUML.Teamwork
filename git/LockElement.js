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

    var GitBase             = require("git/Base");
    var GitConfiguration    = require("git/GitConfiguration");

    //Constants
    var ERROR_LOCKING_PROJECT    = "[Locking Project failed:] ";
    var ERROR_LOCKING_ELEMENTS   = "[Locking Elements failed:] ";
    var ERROR_UNLOCKING_ELEMENTS = "[Unlocking Elements failed:] ";
    var ERROR_UPDATING_LOCK_INFO = "[Updating Lock-Info failed:] ";

    var NOT_LOCKED            = "NOT_LOCKED";
    var LOCKED                = "LOCKED";

    var CMD_LOCK_PROJECT      = "lockProject";
    var CMD_LOCK_GIVEN_ELEMENTS= "lockGivenElements";
    var CMD_UNLOCK_GIVEN_ELEMENTS= "unlockGivenElements";
    var CMD_LOAD_KNOWN_LOCKS      = "loadKnownLocks";

    //Variables

    //Functions

    function lockWholeProject() {
        lockProject(loadProject());
    }

    function lockGivenElements(elements) {
        var workingPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURL();
        var gitModule = initGitModule();
        var projectName = ProjectManager.getFilename();
        var username = GitConfiguration.getUsername();
        executeLockGivenElements(gitModule, workingPath, remoteURL, elements,  username, projectName);
    }

    function unlockGivenElements(elements) {
        var workingPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURL();
        var gitModule = initGitModule();
        var projectName = ProjectManager.getFilename();
        var username = GitConfiguration.getUsername();
        executeUnlockGivenElements(gitModule, workingPath, remoteURL, elements,  username, projectName);
    }

    function updateLockInfo() {
        var localPath = GitConfiguration.getLocalWorkingDirectory();
        var remoteURL = GitConfiguration.getRemoteURL();
        var gitModule = initGitModule();
        var projectName = ProjectManager.getFilename();
        executeUpdateLockInfo(gitModule, localPath, remoteURL, projectName);
    }

    function updateProject() {
        throw "Not yet implemented";
    }

    function uploadChanges() {
        throw "Not yet implemented";
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

    function executeLockGivenElements(gitModule, workingPath, remotePath, elementIDs,  username, projectName) {
        gitModule.exec(CMD_LOCK_GIVEN_ELEMENTS, workingPath, remotePath, elementIDs, username, projectName)
            .done(function (lockedElementIDs) {
                console.log("locked: " + lockedElementIDs);
            })
            .fail(function (err) {
                if(err) {
                    console.error(ERROR_LOCKING_ELEMENTS, err);
                }
            })
        ;
    }

    function executeUnlockGivenElements(gitModule, workingPath, remotePath, elementIDs,  username, projectName) {
        gitModule.exec(CMD_UNLOCK_GIVEN_ELEMENTS, workingPath, remotePath, elementIDs, username, projectName)
            .done(function (lockedElementIDs) {
                console.log("removed lock: " + lockedElementIDs);
            })
            .fail(function (err) {
                if(err) {
                    console.error(ERROR_UNLOCKING_ELEMENTS, err);
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
    exports.uploadChanges = uploadChanges;
    exports.updateProject = updateProject;
    exports.updateProjectLockInfo = updateLockInfo;
    exports.lockGivenElements = lockGivenElements;
    exports.unlockGivenElements = unlockGivenElements;
});