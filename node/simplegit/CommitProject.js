//Node-Modules
var GIT         = require("simple-git");

//Imported Files
var TeamworkBase        = require("./TeamworkBase");
var FileSystem          = require("./FileSystem");

//Constants
var COMMIT_PROJECT      = "commitProject";

//Functions
function cmdCommitProject(workingPath, remotePath, projectName) {
    console.log("Begin 'committing Project' Command");
    GIT(workingPath)
        .init()
        .then(function () {
            console.log("Begin committing changes...");
        })
        .add("./*")
        .commit("Committing changes")
        .pull('origin', 'refs/heads/projects/' + projectName)
        .commit("Merged")
        .push('origin', 'refs/heads/projects/' + projectName)
        .then(function () {
            console.log("Committing changes completed!");
        })
        .then(function() {
            FileSystem.removeDir(workingPath);
        });
    return true;
}

function registerCMDCommitProject(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        COMMIT_PROJECT,    // command name
        cmdCommitProject,   // command handler function
        true,          // this command is synchronous in Node
        "Commits the Project-Changes",
        [{name: "workingPath", // parameters
            type: "string",
            description: "workingPath for the project"},
            {name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"},
            {name: "projectName", // parameters
                type: "string",
                description: "Name of the Project to commit"}],
        [{name: "success", // return values
            type: "boolean",
            description: "'true' if success, 'false' if not"}]
    );
}

exports.registerCMDCommitProject = registerCMDCommitProject;