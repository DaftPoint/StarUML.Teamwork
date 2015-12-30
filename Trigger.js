define(function(require, exports, module) {
    "use strict";

    //modules
    var Repository              = app.getModule("core/Repository");
    var ProjectManager          = app.getModule("engine/ProjectManager");

    //imported modules
    var OpenProject             = require("git/OpenProject");

    function updateTitlebar(projectName) {
        var filename = projectName,
            title = "";

        if (filename && filename.length > 0) {
            title += filename + " — ";
        }

        if (Repository.isModified()) {
            title += "• ";
        }

        title += "Teamwork-Project";

        $("title").html(title);
    }

    function setupTriggerOpenProject() {
        $(OpenProject).on('teamworkProjectLoaded', function (event, projectName) {
            try {
                app.metadata.name = "Teamwork-Project";
                ProjectManager._setFilename(projectName);
                updateTitlebar(projectName);
            } catch (err) {
                console.error(err);
            }
        });
    }

    exports.setupTriggerOpenProject = setupTriggerOpenProject;
});