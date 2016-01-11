define(function(require, exports, module) {
    "use strict";

    //modules
    var _global                 = app.getModule("core/Global").global;
    var Repository              = app.getModule("core/Repository");
    var ProjectManager          = app.getModule("engine/ProjectManager");
    var OperationBuilder        = app.getModule("core/OperationBuilder");
    var Toast 				    = app.getModule("ui/Toast");
    var Core                    = app.getModule("core/Core");

    //imported modules
    var OpenProject             = require("./../teamworkApi/OpenProject");
    var GitConfiguration        = require("./../preferences/TeamworkConfiguration");
    var TeamworkView            = require("./../teamworkView/TeamworkView");
    var TeamworkBase            = require("./../teamworkApi/TeamworkBase");
    var ProjectCommitter        = require("./../teamworkApi/ProjectCommitter");
    var SaveProject             = require("./../teamworkApi/CreateProject");
    var LockElement             = require("./../teamworkApi/LockElement");
    var ElementLocker           = require("./../locking/ElementLocker");

    //Overwrites
    var RepositoryDoOperation= Repository.doOperation;

    function updateTitlebar(projectName) {
        var filename = projectName,
            title = "";
        app.metadata.name = "Teamwork-Project";

        if (filename && filename.length > 0) {
            title += filename + " — ";
        }

        if (Repository.isModified()) {
            title += "• ";
        }

        title += "Teamwork-Project";

        $("title").html(title);
    }

    function doOperation(operation) {
        RepositoryDoOperation.call(this, operation);
        if (operation.ops.length > 0 && TeamworkBase.isTeamworkProject()) {
            try {
                for(var i = 0; operation.ops.length; i++) {
                    var op = operation.ops[i];
                    if(op.op == OperationBuilder.OP_INSERT ||op.op == OperationBuilder.OP_FIELD_INSERT) {
                        var element = op._elem;
                        //$(exports).triggerHandler('elementCreated', [element]);
                        triggerElementCreated([element]);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    function setupTriggerOpenProject() {
        $(OpenProject).on('teamworkProjectLoaded', function (event, projectName) {
            try {
                ProjectManager._setFilename(projectName);
                TeamworkBase.setTeamworkProjectName(projectName);
                TeamworkBase.setTeamworkProject(true);
                Repository.setModified(false);
                updateTitlebar(projectName);
            } catch (err) {
                console.error(err);
            }
        });
    }

    function setupTriggerCommitProject() {
        $(ProjectCommitter).on('projectCommitted', function(event, projectName) {
            Repository.setModified(false);
            var lockedElements = ElementLocker.getLockedElements();
            LockElement.unlockGivenElements(lockedElements);
            updateTitlebar(projectName);
        });
    }

    function setupTriggerCreateProject() {
        $(SaveProject).on('projectCreated', function(event, projectName) {
            Repository.setModified(false);
            TeamworkBase.setTeamworkProject(true);
            TeamworkBase.setTeamworkProjectName(projectName);
            updateTitlebar(projectName);
        });
    }

    function showError(isLocked) {
        var teamworkUser = GitConfiguration.getUsername();
        var MESSAGE_LOCKED = "One of the elements to change is Locked by someone else. Cannot do Operation";
        var MESSAGE_NOT_LOCKED = "You have to lock the element before you can make a change";
        var MESSAGE_TO_SHOW;
        if(isLocked) {
            MESSAGE_TO_SHOW = MESSAGE_LOCKED;
        } else {
            MESSAGE_TO_SHOW = MESSAGE_NOT_LOCKED;
        }
        TeamworkView.addTeamworkItem("Error", MESSAGE_TO_SHOW, new Date().toJSON().slice(0, 19).replace("T", " "), teamworkUser);
        throw new Error(MESSAGE_TO_SHOW);
    }

    function isElementLockedByOtherOrOldAndNotLocked(element) {
        var teamworkUser = GitConfiguration.getUsername();
        return (element && !element.isNewElement() && !element.isLocked())
            || (element && element.isLocked() &&  element.getLockUser() !== teamworkUser);
    }

    function checkLockWhileMovingElement(operationName, element) {
        var MOVE_VIEWS = "move views";
        if(operationName == MOVE_VIEWS) {
            if(isElementLockedByOtherOrOldAndNotLocked(element)) {
                showError(element.isLocked());
            }
        }
    }

    function checkLockWhenInserting(operation) {
        if (operation.op === OperationBuilder.OP_INSERT/* || operation.op === OperationBuilder.OP_FIELD_INSERT*/) {
            var reader = new Core.Reader({ data: operation.arg }, _global.type);
            var elementToCreate  = reader.readObj("data");
            var parentOfCreation = Repository.get(elementToCreate._parent.$ref);
            if(isElementLockedByOtherOrOldAndNotLocked(parentOfCreation)) {
                showError(parentOfCreation.isLocked());
            }
        }
    }

    function checkLockWhenRemoving(operation) {
        if (operation.op === OperationBuilder.OP_REMOVE/* || operation.op === OperationBuilder.OP_FIELD_REMOVE*/) {
            var reader = new Core.Reader({ data: operation.arg }, _global.type);
            var elementToDelete  = reader.readObj("data");
            var parentOfDeletion = Repository.get(elementToDelete._parent.$ref);
            if(isElementLockedByOtherOrOldAndNotLocked(parentOfDeletion)) {
                showError(parentOfDeletion.isLocked());
            }
        }
    }

    function checkLockWhenParentOfElementChanging(operation) {
        if(operation.arg.op !== undefined) {
            var oldParent = Repository.get(operation.arg.op);
            if(isElementLockedByOtherOrOldAndNotLocked(oldParent)) {
                showError(oldParent.isLocked());
            }
        }
        if(operation.arg.np !== undefined) {
            var newParent = Repository.get(operation.arg.np);
            if(isElementLockedByOtherOrOldAndNotLocked(newParent)) {
                showError(newParent.isLocked());
            }
        }
    }

    function triggerBeforeExecuteOperation() {
        var MOVE_VIEWS = "move views";
        $(Repository).on('beforeExecuteOperation', function (event, operation) {
            if(!TeamworkBase.isTeamworkProject()) {
                return;
            }
            var operationName = operation.name;
            var elements = extractElementsToChange(operation);
            checkLockWhileMovingElement(operationName, elements[0]._parent);
            for (var i = 0, len = operation.ops.length; i < len; i++) {
                checkLockWhenInserting(operation.ops[i]);
                checkLockWhenRemoving(operation.ops[i]);
                checkLockWhenParentOfElementChanging(operation.ops[i]);
            }
            for(var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                var element = elements[elementIndex];
                if(isElementLockedByOtherOrOldAndNotLocked(element) && operationName != MOVE_VIEWS) {
                    showError(element.isLocked());
                }
            }
        });
    }

    function triggerOperationExecuted() {
        $(Repository).on('operationExecuted', function(event, operation) {
            var changedElements = Repository.extractChanged(operation);
            TeamworkBase.addChangedElements(changedElements);
        });
    }

    function triggerCreated() {
        $(Repository).on('created', function(event, createdElements) {
            createdElements.forEach(function(element) {
                element = Repository.get(element._id);
                element.newElement = true;
            });
        });

        /*$(Repository).on('elementCreated', function(event, createdElements) {
            createdElements.forEach(function(element) {
                element = Repository.get(element._id);
                element.newElement = true;
            });
        });*/
    }

    function triggerElementCreated(createdElements) {
        createdElements.forEach(function(element) {
            element = Repository.get(element._id);
            element.newElement = true;
        });
    }

    function setupTriggerOnRepository() {
        triggerBeforeExecuteOperation();
        triggerOperationExecuted();
        triggerCreated();
    }

    function extractElementsToChange(operation) {
        return Repository.extractChanged(operation);
    }

    exports.setupTriggerOpenProject = setupTriggerOpenProject;
    exports.setupTriggerOnRepository = setupTriggerOnRepository;
    exports.setupTriggerCommitProject = setupTriggerCommitProject;
    exports.setupTriggerCreateProject = setupTriggerCreateProject;
    exports.doOperation = doOperation;
});