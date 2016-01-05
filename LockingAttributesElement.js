define(function (require, exports, module) {
    "use strict";

    //Modules

    //Constants

    //Variables

    //Functions
    function addLockingAttributesToUMLModelElementType() {
        type.UMLModelElement.prototype.getBaseNodeText = type.UMLModelElement.prototype.getNodeText;
        type.UMLModelElement.prototype.getNodeText = getNodeTextWithLock;
    }

    function addLockingAttributeToElementType() {
        type.Element.prototype.locked = false;
        type.Element.prototype.lockedBy = null;

        type.Element.prototype.lockElement = lockElement;
        type.Element.prototype.setLockUser = setLockUser;
        type.Element.prototype.getLockUser = getLockUser;
        type.Element.prototype.unlockElement = unlockElement;
        type.Element.prototype.getBaseNodeText = type.Element.prototype.getNodeText;
        type.Element.prototype.getNodeText = getNodeTextWithLock;
        type.Element.prototype.isLocked = isLocked;
    }

    function isLocked() {
        return this.locked;
    }

    function getNodeTextWithLock() {
        var nodeText = this.getBaseNodeText();
        if(this.locked) {
            nodeText = nodeText + " (" + this.lockedBy + ")";
        }
        return nodeText;
    }

    function unlockElement() {
        this.lockedBy = null;
        this.locked = false;
    }

    function setLockUser(username) {
        this.lockedBy = username;
    }

    function getLockUser() {
        return this.lockedBy;
    }

    function lockElement(username) {
        this.locked = true;
        this.setLockUser(username);
    }

    //Backbone
    exports.addLockingAttributeToElementType = addLockingAttributeToElementType;
    exports.addLockingAttributesToUMLModelElementType = addLockingAttributesToUMLModelElementType;
});