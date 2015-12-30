//Node-Modules
var promisify = require("promisify-node");
var GIT = require("simple-git");
var fse = require("fs-extra");
var Promise = require("bluebird");
var deasync = require("deasync");

//Importet Modules
var TeamworkBase = require("./TeamworkBase");
var FileSystem = require("./FileSystem");

//Constants
var LOCK_PROJECT = "lockProject";
var LOCK_GIVEN_ELEMENTS = "lockGivenElements";
var UNLOCK_GIVEN_ELEMENTS = "unlockGivenElements";
var LOAD_KNOWN_LOCKS = "loadKnownLocks";

//Variables

//Functions

function cmdLoadKnownLocksSync(baseWorkingPath, remotePath, projectName) {
    var locksPromise = new Promise(function (resolve, reject) {
        loadKnownLocks(baseWorkingPath, remotePath, projectName, function (determinedLocks) {
            resolve(determinedLocks);
        });
    });
    deasync.loopWhile(function () {
        return !locksPromise.isFulfilled();
    });

    var elementIdsPromise = new Promise(function (resolve, reject) {
        checkoutLocks(baseWorkingPath, remotePath, locksPromise.value(), projectName, function (lockedElementInfo) {
            resolve(lockedElementInfo);
        })
    });
    deasync.loopWhile(function () {
        return !elementIdsPromise.isFulfilled();
    });
    return elementIdsPromise.value();
}

function cmdLockProject(workingPath, remotePath, elementID, unescapedElementID, username, projectName) {
    workingPath = workingPath + "/locking/" + projectName + "/" + elementID;
    FileSystem.ensureEmptyDir(workingPath, 0, function () {
        var branchName = elementID;
        GIT(workingPath)
            .init()
            .addRemote('origin', remotePath)
            .checkoutLocalBranch(branchName, function (error, data) {
                if (error) {
                    console.log("Locking Element failed!: " + unescapedElementID);
                    return false;
                }
            }).then(function () {
                fse.outputJson(workingPath + "/lockedBy.json", {lockedBy: username, elementID: unescapedElementID});
            })
            .add('./*')
            .commit("Locking Element: " + unescapedElementID)
            .push('origin', branchName + ":refs/heads/locks/" + projectName + "/" + branchName);
    });
}

function cmdLockGivenElements(workingPath, remotePath, elementIDs, username, projectName) {
    elementIDs.forEach(function (element, index, array) {
        var elementID = element.escapedID;
        var unescapedElementId = element.elementID;
        var elementWorkingPath = workingPath + "/locking/" + projectName + "/" + elementID;
        FileSystem.ensureEmptyDir(elementWorkingPath, 0, function () {
            var branchName = elementID;
            GIT(elementWorkingPath)
                .init()
                .addRemote('origin', remotePath)
                .checkoutLocalBranch(branchName, function (error, data) {
                    if (error) {
                        console.log("Locking Element failed!: " + unescapedElementId);
                        return false;
                    }
                }).then(function () {
                    fse.outputJson(elementWorkingPath + "/lockedBy.json", {
                        lockedBy: username,
                        elementID: unescapedElementId
                    });
                })
                .add('./*')
                .commit("Locking Element: " + unescapedElementId)
                .push('origin', branchName + ":refs/heads/locks/" + projectName + "/" + branchName);
        });
    });
}

function cmdUnlockGivenElements(workingPath, remotePath, elementIDs, username, projectName) {
    elementIDs.forEach(function (element, index, array) {
        var branchName = element;
        var elementWorkingPath = workingPath + "/locking/" + projectName + "/" + branchName;
        FileSystem.ensureEmptyDir(elementWorkingPath, 0, function () {
            GIT(elementWorkingPath)
                .init()
                .addRemote('origin', remotePath)
                .push('origin', ":locks/" + projectName + "/" + branchName);
        });
    });
}

function checkoutLocks(workingPath, remotePath, locks, projectName, callback) {
    var lockedElementInfo = [];
    workingPath = workingPath + "/locking/";
    locks.forEach(function (branchName, index, array) {
        var branchWorkingPath = workingPath + "/" + branchName;
        FileSystem.ensureEmptyDir(branchWorkingPath, 0, function () {
            GIT(branchWorkingPath)
                .init()
                .addRemote('origin', remotePath)
                .fetch()
                .checkout("locks/" + projectName + "/" + branchName, function (error, data) {
                    if (error) {
                        console.log("Loading Lock-Branch failed!: " + branchName);
                        return false;
                    }
                }).then(function () {
                var lockedBy = fse.readJsonSync(branchWorkingPath + "/lockedBy.json");
                lockedElementInfo.push(lockedBy);
            });
        });
    });
    deasync.loopWhile(function () {
        return locks.length != lockedElementInfo.length;
    });
    callback(lockedElementInfo);
}

function loadKnownLocks(workingPath, remotePath, projectName, callback) {
    var locks = [];
    GIT(workingPath).listRemote(['--heads', remotePath, "locks/" + projectName + "/*"], function (err, data) {
        var heads = data.split('\n');
        for (var i = 0; i < heads.length; i++) {
            var index = heads[i].indexOf("refs/heads/locks/" + projectName + "/");
            if (index > -1) {
                locks.push(heads[i].substring(index + ("refs/heads/locks/" + projectName + "/").length));
            }
        }
        callback(locks);
    });
    return locks;
}

function registerCMDLoadKnownLocks(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        LOAD_KNOWN_LOCKS,    // command name
        cmdLoadKnownLocksSync,   // command handler function
        false,          // this command is synchronous in Node
        "Loads all known locks of the actual project",
        [{
            name: "baseWorkingPath", // parameters
            type: "string",
            description: "workingPath of the actual project"
        },
            {
                name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository of the actual project"
            }],
        [{
            name: "locks", // return values
            type: "array",
            description: "known locks"
        }]
    );
}

function registerCMDLockProject(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        LOCK_PROJECT,    // command name
        cmdLockProject,   // command handler function
        false,          // this command is synchronous in Node
        "Opens a git-Repository and adds a file",
        [{
            name: "workingPath", // parameters
            type: "string",
            description: "workingPath for the file to create"
        },
            {
                name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"
            },
            {
                name: "elementID", // parameters
                type: "string",
                description: "escaped ID of the element to lock"
            },
            {
                name: "unescapedElementID", // parameters
                type: "string",
                description: "unescaped ID of the element to lock"
            },
            {
                name: "username", // parameters
                type: "string",
                description: "Username of the locking user"
            },
            {
                name: "projectName", // parameters
                type: "string",
                description: "name of the project to lock"
            }],
        [{
            name: "result", // return values
            type: "string",
            description: "Locking-Result"
        }]
    );
}

function registerCMDLockGivenElements(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        LOCK_GIVEN_ELEMENTS,    // command name
        cmdLockGivenElements,   // command handler function
        false,          // this command is synchronous in Node
        "Locks given elements",
        [{
            name: "workingPath", // parameters
            type: "string",
            description: "workingPath for the file to create"
        },
            {
                name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"
            },
            {
                name: "elementIDs", // parameters
                type: "array",
                description: "escaped ID of the element to lock"
            },
            {
                name: "username", // parameters
                type: "string",
                description: "Username of the locking user"
            },
            {
                name: "projectName", // parameters
                type: "string",
                description: "name of the project to lock"
            }],
        [{
            name: "result", // return values
            type: "string",
            description: "Locking-Result"
        }]
    );
}

function registerCMDUnlockGivenElements(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        UNLOCK_GIVEN_ELEMENTS,    // command name
        cmdUnlockGivenElements,   // command handler function
        false,          // this command is synchronous in Node
        "Locks given elements",
        [{
            name: "workingPath", // parameters
            type: "string",
            description: "workingPath for the file to create"
        },
            {
                name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"
            },
            {
                name: "elementIDs", // parameters
                type: "array",
                description: "escaped ID of the element to lock"
            },
            {
                name: "username", // parameters
                type: "string",
                description: "Username of the locking user"
            },
            {
                name: "projectName", // parameters
                type: "string",
                description: "name of the project to lock"
            }],
        [{
            name: "result", // return values
            type: "string",
            description: "Locking-Result"
        }]
    );
}

//Backbone
exports.registerCMDLockProject = registerCMDLockProject;
exports.registerCMDLoadKnownLocks = registerCMDLoadKnownLocks;
exports.registerCMDLockElements = registerCMDLockGivenElements;
exports.registerCMDUnlockGivenElements = registerCMDUnlockGivenElements;