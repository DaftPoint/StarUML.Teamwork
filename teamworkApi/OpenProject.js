/**
 * @author Michael Seiler
 *
 */
define(function (require, exports, module) {
    "use strict";

    //Modules
    var Toast               = app.getModule("ui/Toast");
    var Dialogs             = app.getModule('dialogs/Dialogs');
    var ProjectManager      = app.getModule("engine/ProjectManager");
    var Repository          = app.getModule("core/Repository");

    //Imports
    var TeamworkBase            = require("./TeamworkBase");
    var TeamworkConfiguration   = require("../preferences/TeamworkConfiguration");
    var ProjectJSONBuilder      = require("./ProjectJSONBuilder");
    var LockElement             = require("./LockElement");
    var GitApi                  = require("../StarGit/api-built");
    var ProgressDialog          = require("../dialogs/ProgressDialog");
    var TeamworkView            = require("../teamworkView/TeamworkView");

    //Constants
    var NO_PROJECT_DATA_FOUND_MESSAGE           = "No Project-Data found!";
    var CONFIRM_MESSAGE_LOADING_PROJECT         = "Are you sure? Current Project will be closed! Select Project to load...";
    var PROJECT_LOADING_CANCELLATION_MESSAGE    = "Project-Loading cancelled";

    //Variables

    //Functions
    function openTeamworkProject() {
        var nextPromise = new $.Deferred();
        var localWorkingDir = TeamworkBase.loadLocalWorkingPath("Project");
        TeamworkBase.getProjectsRootDir(localWorkingDir, function (workingDir) {
            nextPromise.resolve(workingDir);
        });
        loadKnownProjectRefs(nextPromise);
    }

    function loadKnownProjectRefs(promise) {
        var nextPromise = new $.Deferred();
        promise.done(function(workingDir) {
            var options = TeamworkBase.getDefaultGitOptions(workingDir);
            GitApi.getProjectRefs(options, function (projectRefs) {
                nextPromise.resolve(projectRefs, workingDir);
            });
        });
        var selectionClonePromise = selectProjectToClone(nextPromise);
        openClonedProject(selectionClonePromise);
    }

    function selectProjectToClone(promise) {
        var nextPromise = new $.Deferred();
        promise.done(function(projectRefs, workingDir) {
            var options = buildProjectSelectionList(projectRefs);
            var selectionPromise = Dialogs.showSelectDropdownDialog(CONFIRM_MESSAGE_LOADING_PROJECT, options);
            var clonePromise = cloneSelectedProject(selectionPromise, workingDir);
            clonePromise.done(function(workingDir, projectName) {
                nextPromise.resolve(workingDir, projectName);
            });
        });
        return nextPromise;
    }

    function cloneSelectedProject(promise, workingDir) {
        var nextPromise = new $.Deferred();
        promise.done(function (buttonId, projectName) {
            if (buttonId === Dialogs.DIALOG_BTN_OK) {
                TeamworkBase.clearChangedIds();
                var clonePromise  = TeamworkBase.cloneRepoFromServer(workingDir, projectName);
                clonePromise.done(function(workingDir, projectName) {
                    nextPromise.resolve(workingDir, projectName);
                });
            } else {
                Toast.error(PROJECT_LOADING_CANCELLATION_MESSAGE);
            }
        });
        return nextPromise;
    }

    function openClonedProject(promise) {
        promise.done(function(workingDir, projectName) {
            var promise = loadProjectFromFragments("Project", workingDir);
            promise.done(function() {
                Dialogs.cancelModalDialogIfOpen('modal');
                Toast.info("Opening Project...");
                TeamworkView.addOpenProjectEvent(projectName, TeamworkConfiguration.getUsername());
                $(exports).triggerHandler('teamworkProjectLoaded', [projectName]);
            });
        });
    }

    function buildProjectSelectionList(projectRefs) {
        var options = [];
        projectRefs.forEach(function (item, index, array) {
            options.push({text: item.name, value: item.name});
        });
        return options;
    }

    function openProjectFromJsonData(_project) {
        ProjectManager.loadFromJson(_project);
    }

    function loadProjectFromFragments(projectName, workingDir) {
        var promise = new $.Deferred();
        TeamworkBase.cleanCurrentWork();
        var directory = TeamworkBase.loadLocalWorkingDirectory(projectName);
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
                var options = TeamworkBase.getDefaultGitOptions(workingDir, null, null, null, projectName);
                GitApi.getProjectLockRefs(options, function(locks) {
                    LockElement.updateProjectLockInfo(locks);
                    directory.unlink();
                    promise.resolve();
                });
            });
        });
        return promise;
    }

    //Backend
    exports.openTeamworkProject = openTeamworkProject;
});