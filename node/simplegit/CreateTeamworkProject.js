//Node-Modules
var GIT         = require("simple-git");

//Imported Files
var TeamworkBase        = require("./TeamworkBase");
var FileSystem          = require("./FileSystem");

//Constants
var CMD_CREATE_NEW_PROJECT       = "createNewProject";

//Functions
function cmdCreateTeamworkProject(workingPath, remotePath, projectName) {
    var projectRef = projectName + ":refs/heads/projects/" + projectName;
    GIT(workingPath)
        .init()
        .addRemote('origin', remotePath)
        .then(function () {
            console.log("Begin creating Project...");
        })
        .checkoutLocalBranch(projectName, function (error, data) {
            if(error) console.log("Creating Project failed!: " + error);
            return false;
        })
        .add('./*')
        .commit("Creating Project: " + projectName)
        .push('origin', projectRef)
        .then(function () {
            console.log("Creating Project completed!");
        });
    return true;
}

function registerCMDCreateTeamworkProject(domainManager) {
    domainManager.registerCommand(
        TeamworkBase.DOMAIN,       // domain name
        CMD_CREATE_NEW_PROJECT,    // command name
        cmdCreateTeamworkProject,   // command handler function
        true,          // this command is synchronous in Node
        "Creates a new Project on the Teamwork-Server",
        [{name: "workingPath", // parameters
            type: "string",
            description: "workingPath for the Project"},
            {name: "remotePath", // parameters
                type: "string",
                description: "URL to Remote Repository"},
            {name: "name", // parameters
                type: "string",
                description: "Name of the Project"}],
        [{name: "success", // return values
            type: "boolean",
            description: "'true' if success, 'false' if not"}]
    );
}

exports.registerCMDCreateTeamworkProject = registerCMDCreateTeamworkProject;