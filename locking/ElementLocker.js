define(function(require, exports, module) {
    "use strict";

    //Module
    var StatusBar        = app.getModule("ui/StatusBar");
    var Toast            = app.getModule("ui/Toast");
    var SelectionManager = app.getModule("engine/SelectionManager");
    var PreferenceManager = app.getModule("core/PreferenceManager");

    //Imports
    var Locking          = require("../git/LockElement");

    //Constants
    var USERNAME_PREFERENCE = "teamwork.server.username";

    function lockElement() {
        var models = SelectionManager.getSelectedModels();
        var elementsToLock = [];
        if (models.length > 0) {
            models.forEach(function(element, index, array) {
                if(element.isLocked()) {
                    console.log("Element '" + element._id + "' already locked");//TODO: Show all fails in own Dialog
                } else {
                    var username = PreferenceManager.get(USERNAME_PREFERENCE);
                    element.lockElement(username);
                    var elementId = element._id.replace(/[^a-z0-9]/gi, '_');
                    elementsToLock.push({elementID: element._id, escapedID: elementId});
                }
            });
            Locking.lockGivenElements(elementsToLock);
        } else {
            Toast.info("No Element to lock");
        }
    }

    function unlockElement() {
        var models = SelectionManager.getSelectedModels();
        var elementsToUnlock = [];
        if (models.length > 0) {
            models.forEach(function(element, index, array) {
                if(!element.isLocked()) {
                    console.log("Element '" + element._id + "' is not locked");//TODO: Show all fails in own Dialog
                } else {
                    var username = PreferenceManager.get(USERNAME_PREFERENCE);
                    if(element.lockedBy === username) {
                        element.unlockElement();
                        var elementId = element._id.replace(/[^a-z0-9]/gi, '_');
                        elementsToUnlock.push(elementId);
                    } else {
                        console.log("Element '" + element._id + "' cannot be unlocked. You do not own the lock");//TODO: Show all fails in own Dialog
                    }
                }
            });
            Locking.unlockGivenElements(elementsToUnlock);
        } else {
            Toast.info("No Element to unlock");
        }
    }

    exports.lockElement   = lockElement;
    exports.unlockElement = unlockElement;
});