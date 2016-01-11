define(function(require, exports, module) {
    "use strict";

    //Module
    var StatusBar           = app.getModule("ui/StatusBar");
    var Toast               = app.getModule("ui/Toast");
    var SelectionManager    = app.getModule("engine/SelectionManager");
    var PreferenceManager   = app.getModule("core/PreferenceManager");
    var ModelExplorerView   = app.getModule("explorer/ModelExplorerView");

    //Imports
    var Locking          = require("../teamworkApi/LockElement");
    var TeamworkView     = require("../teamworkView/TeamworkView");

    //Constants
    var USERNAME_PREFERENCE = "teamwork.server.username";

    //Globals/Statics
    var lockedElements = [];

    function lockElement() {
        var models = SelectionManager.getSelectedModels();
        var views = SelectionManager.getSelectedViews();
        var elements = models.concat(views);
        var elementsToLock = [];
        if (elements.length > 0) {
            elements.forEach(function(element, index, array) {
                if(element.isLocked()) {
                    var message = "Element '" + element._id + "' already locked";
                    TeamworkView.addTeamworkItem("Error", message, new Date().toJSON().slice(0, 19).replace("T", " "));
                } else {
                    var username = PreferenceManager.get(USERNAME_PREFERENCE);
                    element.lockElement(username);
                    ModelExplorerView.update(element);
                    var elementId = element._id.replace(/[^a-z0-9]/gi, '_');
                    elementsToLock.push({elementID: element._id, escapedID: elementId});
                    lockedElements[element._id] = elementId;
                }
            });
            Locking.lockGivenElements(elementsToLock);
        } else {
            Toast.info("No Element to lock");
        }
    }

    function unlockElement() {
        var models = SelectionManager.getSelectedModels();
        var views = SelectionManager.getSelectedViews();
        var username = PreferenceManager.get(USERNAME_PREFERENCE);
        var elements = models.concat(views);
        var elementsToUnlock = [];
        if (elements.length > 0) {
            elements.forEach(function(element, index, array) {
                var message;
                if(!element.isLocked()) {
                    message = "Element '" + element._id + "' is not locked";
                    TeamworkView.addTeamworkItem("Error", message, new Date().toJSON().slice(0, 19).replace("T", " "), username);
                } else {
                    if(element.lockedBy === username) {
                        element.unlockElement();
                        ModelExplorerView.update(element);
                        var elementId = element._id.replace(/[^a-z0-9]/gi, '_');
                        elementsToUnlock.push(elementId);
                        delete lockedElements[element._id];
                    } else {
                        message = "Element '" + element._id + "' cannot be unlocked. You do not own the lock";
                        TeamworkView.addTeamworkItem("Error", message, new Date().toJSON().slice(0, 19).replace("T", " "), username);
                    }
                }
            });
            Locking.unlockGivenElements(elementsToUnlock);
        } else {
            Toast.info("No Element to unlock");
        }
    }

    function getLockedElements() {
        return lockedElements;
    }

    function addLockedElement(element) {
        var elementId = element._id.replace(/[^a-z0-9]/gi, '_');
        lockedElements[element._id] = elementId;
    }

    exports.lockElement   = lockElement;
    exports.unlockElement = unlockElement;
    exports.getLockedElements = getLockedElements;
    exports.addLockedElement = addLockedElement;
});