/**
 * Copyright (c) 2016 Michael Seiler. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
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
        type.Element.prototype.newElement = false;
        type.Element.prototype.isNewElement = isNewElement;
    }

    function isNewElement() {
        return this.newElement;
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