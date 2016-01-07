/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {

    //Modules
    var PreferenceManager 	= app.getModule("core/PreferenceManager");
    var Toast 				= app.getModule("ui/Toast");
    var Repository      	= app.getModule("core/Repository");
    var Helper              = app.getModule("utils/Helper");
    var FileSystem          = app.getModule("filesystem/FileSystem");
    var Dialogs             = app.getModule('dialogs/Dialogs');

    //Imports
    var TeamworkBase        = require("./TeamworkBase");
    var GitConfiguration    = require("./../preferences/TeamworkConfiguration");
    var ProgressDialog      = require("../dialogs/ProgressDialog");
    var TeamworkView        = require("../teamworkView/TeamworkView");

    //Constants
    //Variables
    //Functions

    function saveProject() {
        var dlg = Dialogs.showInputDialog("Enter a name for the Project to create");
        dlg.done(function (buttonId, projectName) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                createNewProjectOnTeamworkServer(projectName);
                Repository.setModified(false);
            } else {
                Toast.error("Creating Teamwork-Project cancelled");
            }
        });
    }

    function updateProject() {
        throw "Not yet implemented";
    }

    function createNewProjectOnTeamworkServer(projectName) {
        var localPath = TeamworkBase.getProjectPath(projectName);
        var refContent = 'refs/heads/projects/' + projectName;
        var valueToResolve = 'projects/' + projectName;
        var workingDirPromise = TeamworkBase.prepareWorkingDirectory(valueToResolve, localPath, refContent);
        var branchPromise = TeamworkBase.createAndCheckoutBranch(workingDirPromise);
        var commitMsg = 'Creating Project: ' + projectName;
        var mergePromise = TeamworkBase.mergeProjectWithLocalChanges(branchPromise, projectName, commitMsg);
        var progressTitle = "Creating Teamwork-Project...";
        var pushPromise = TeamworkBase.pushToServer(mergePromise, progressTitle);
        notifyUserOfSuccessfulProjectCreation(pushPromise, projectName);
    }

    function notifyUserOfSuccessfulProjectCreation(pushPromise, projectName) {
        pushPromise.done(function(workingDir) {
            TeamworkBase.setTeamworkProjectName(projectName);
            Dialogs.cancelModalDialogIfOpen('modal');
            workingDir = FileSystem.getDirectoryForPath(workingDir.fullPath);
            workingDir.unlink();
            TeamworkView.addCreateProjectEvent(projectName, GitConfiguration.getUsername());
        });
    }

    //Backend
    exports.saveTeamworkProject = saveProject;
    exports.updateProject = updateProject;
});