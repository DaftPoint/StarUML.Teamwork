//Node-Modules
var GIT         = require("simple-git");
var Promise     = require("bluebird");
var deasync     = require("deasync");

//Imported Files
var TeamworkBase = require("./TeamworkBase");
var FileSystem   = require("./FileSystem");

//Constants
var OPEN_REPO_AND_LOAD_REMOTE_CONTENT   = "openRepoAndLoadRemoteContent";
var LOAD_PROJECT_NAMES   = "loadProjectNames";

//Functions
function cmdLoadProjectNames(remotePath) {
    var projectNamesPromise = new Promise(function (resolve, reject) {
        loadProjectNames(remotePath, function (determinedProjectNames) {
            resolve(determinedProjectNames);
        });
    });
    deasync.loopWhile(function () {
        return !projectNamesPromise.isFulfilled();
    });
    return projectNamesPromise.value();
}

function loadProjectNames(remotePath, callback) {
    var projectNames = [];
    GIT().listRemote(['--heads', remotePath, "projects/*"], function (err, data) {
        var heads = data.split('\n');
        for (var i = 0; i < heads.length; i++) {
            var index = heads[i].indexOf("refs/heads/projects/");
            if (index > -1) {
                projectNames.push(heads[i].substring(index + ("refs/heads/projects/").length));
            }
        }
        callback(projectNames);
    });
    return projectNames;
}

function cmdOpenTeamworkProject(localPath, remotePath, projectName) {
    console.log("Begin 'open Project' Command");
    var result;
    var promise = new Promise(function(resolve, reject) {
        FileSystem.ensureEmptyDir(localPath, 0, function () {
            resolve();
        });
    });
    deasync.loopWhile(function() {
        return promise.isFulfilled();
    });

    GIT(localPath)
        .then(function () {
            console.log("Begin loading Project...");
        })
        .init()
        .then(function() {
            console.log("add Remote");
        })
        .addRemote('origin', remotePath)
        .then(function() {
            console.log("fetch content from remote");
        })
        .fetch()
        .then(function() {
            console.log("checkout");
        })
        .checkout("projects/" + projectName, function (error, data) {
            if (error) {
                console.log("Loading Project failed!");
                result = false;
            } else {
                console.log("Loading Project completed!");
                result = true;
            }
        });
    deasync.loopWhile(function() {
        return result === undefined;
    });
    return result;
}

/**
 * @param domainManager
 */
function registerCMDOpenTeamworkProject(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        OPEN_REPO_AND_LOAD_REMOTE_CONTENT,    // command name
        cmdOpenTeamworkProject,   // command handler function
        false,          // this command is synchronous in Node
        "Clone Remote repo to local path",
        [{name: "localPath", // parameters
            type: "string",
            description: "Local-Path where the Repo should be cloned"},
            {name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"},
            {name: "projectName",
            type: "string",
            description: "The name of the Project to load"}],
        [{name: "success", // return values
            type: "boolean",
            description: "'true' if success, 'false' if not"}]
    );
}
function registerCMDLoadProjectNames(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        LOAD_PROJECT_NAMES,    // command name
        cmdLoadProjectNames,   // command handler function
        false,          // this command is synchronous in Node
        "Loads the names of known Projects",
        [{name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"}],
        [{name: "projectNames", // return values
            type: "array",
            description: "Array of ProjectNames"}]
    );
}

//Backbone
exports.registerCMDOpenTeamworkProject = registerCMDOpenTeamworkProject;
exports.registerCMDLoadProjectNames = registerCMDLoadProjectNames;