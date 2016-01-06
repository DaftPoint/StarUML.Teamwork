define(function(require, exports, module) {
    "use strict";

    //modules
    var Repository              = app.getModule("core/Repository");
    var ProjectManager          = app.getModule("engine/ProjectManager");
    var OperationBuilder        = app.getModule("core/OperationBuilder");
    var Toast 				    = app.getModule("ui/Toast");

    //imported modules
    var OpenProject             = require("./git/OpenProject");
    var GitConfiguration        = require("./git/GitConfiguration");

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

    function setupTriggerOnRepository() {
        var teamworkUser = GitConfiguration.getUsername();
        var MESSAGE = "One of the elements to change is Locked by someone else. Cannot do Operation";
        var MOVE_VIEWS = "move views";
        $(Repository).on('beforeExecuteOperation', function (event, operation) {
            var operationName = operation.name;
            var elements = extractElementsToChange(operation);

            if(operationName == MOVE_VIEWS) {
                if(elements[0]._parent.isLocked() && elements[0]._parent.getLockUser() !== teamworkUser) {
                    Toast.error(MESSAGE);
                    throw new Error(MESSAGE);
                }
            }

            for (var i = 0, len = operation.ops.length; i < len; i++) {
                if (operation.ops[i] === OperationBuilder.OP_INSERT || operation.ops[i] === OperationBuilder.OP_REMOVE) {

                }
                if(operation.ops[i].arg.op !== undefined) {
                    var oldParent = Repository.get(operation.ops[i].arg.op);
                    if(oldParent.isLocked() && oldParent.getLockUser() !== teamworkUser) {
                        Toast.error(MESSAGE);
                        throw new Error(MESSAGE);
                    }
                }
                if(operation.ops[i].arg.np !== undefined) {
                    var newParent = Repository.get(operation.ops[i].arg.np);
                    if(newParent.isLocked() && newParent.getLockUser() !== teamworkUser) {
                        Toast.error(MESSAGE);
                        throw new Error(MESSAGE);
                    }
                }
            }
            for(var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                var element = elements[elementIndex];
                if(element.isLocked() && element.getLockUser() !== teamworkUser) {
                    Toast.error(MESSAGE);
                    throw new Error(MESSAGE);
                }
            }
        });
    }

    function extractElementsToChange(operation) {
        return Repository.extractChanged(operation);
    }

    exports.setupTriggerOpenProject = setupTriggerOpenProject;
    exports.setupTriggerOnRepository = setupTriggerOnRepository;
});