//Node-Modules
var GIT         = require("simple-git");

//Imported Files
var TeamworkBase        = require("./TeamworkBase");
var FileSystem          = require("./FileSystem");

//Constants
var CREATE_BRANCH                       = "createBranch";

//Functions
function cmdCreateCRBranch(workingPath, remotePath, name) {
    FileSystem.ensureEmptyDir(workingPath, 0);
    GIT(workingPath)
        .init()
        .addRemote('origin', remotePath)
        .then(function () {
            console.log("Begin creating CR...");
        })
        .checkoutLocalBranch(name, function (error, data) {
            if(error) console.log("Creating CR failed!: " + error);
            return false;
        })
        .pull('origin', 'master')
        .add('./*')
        .commit("Creating Branch: " + name)
        .push('origin', name)
        .then(function () {
            console.log("Creating CR completed!");
        });
    return true;
}

function registerCMDCreateCRBranch(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        CREATE_BRANCH,    // command name
        cmdCreateCRBranch,   // command handler function
        true,          // this command is synchronous in Node
        "Creates a local branch",
        [{name: "workingPath", // parameters
            type: "string",
            description: "workingPath for the branch"},
            {name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"},
            {name: "name", // parameters
                type: "string",
                description: "Name of the Branch"}],
        [{name: "success", // return values
            type: "boolean",
            description: "'true' if success, 'false' if not"}]
    );
}

exports.registerCMDCreateTeamworkProject = registerCMDCreateCRBranch;