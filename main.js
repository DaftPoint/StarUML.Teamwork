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
// define(function (require, exports, module) {
// 	"use strict";

// 	//# Import libs
// 	var AppInit					= app.getModule("utils/AppInit");
//     var CommandManager      	= app.getModule("command/CommandManager");
//     var MenuManager        		= app.getModule("menu/MenuManager");
//     var DefaultMenus            = app.getModule("menu/DefaultMenus");
//     var ContextMenuManager      = app.getModule("menu/ContextMenuManager");
//     var ExtensionUtils          = app.getModule("utils/ExtensionUtils");
//     var Repository              = app.getModule("core/Repository");

//     //Imported files
//     var TeamworkCommandHandler 	= require("./commandHandler/CommandHandler");
//     var LockingAttributesElement= require("./locking/LockingAttributesElement");
//     var Trigger                 = require("./trigger/Trigger");
//     var TeamworkView            = require("./teamworkView/TeamworkView");

//     //Overwrites
//     Repository.doOperation  = Trigger.doOperation;

//     //# Define Commands
//     var CMD_TEAMWORK         	= 'teamwork';
//     var CMD_TEAMWORK_COMMIT  	= 'teamwork.commit';
//     var CMD_TEAMWORK_OPEN       = 'teamwork.open';
//     var CMD_TEAMWORK_UPDATE  	= 'teamwork.update';
//     var CMD_TEAMWORK_CREATE  	= 'teamwork.create';
//     var CMD_TEAMWORK_LOCK  	    = 'teamwork.lock';
//     var CMD_UPDATE_LOCKS  	    = 'teamwork.lock.update';
//     var CMD_TEAMWORK_CONFIGURE  = 'teamwork.configure';

//     var CMD_LOCK_ELEMENT        = 'teamwork.element.lock';
//     var CMD_UNLOCK_ELEMENT      = 'teamwork.element.unlock';

//     //# register commands
//     CommandManager.register("Teamwork",             		CMD_TEAMWORK,           CommandManager.doNothing);
//     CommandManager.register("Open Teamwork-Project...",     CMD_TEAMWORK_OPEN,      TeamworkCommandHandler.openProject);
//     CommandManager.register("Create Teamwork-Project", 	    CMD_TEAMWORK_CREATE,  	TeamworkCommandHandler.createProject);
//     CommandManager.register("Lock Teamwork-Project", 	    CMD_TEAMWORK_LOCK,  	TeamworkCommandHandler.lockWholeProject);
//     CommandManager.register("Update Lock-Info", 	        CMD_UPDATE_LOCKS,  	    TeamworkCommandHandler.updateProjectLockInfo);
//     CommandManager.register("Commit changes",  			    CMD_TEAMWORK_COMMIT,   	TeamworkCommandHandler.commitChanges);
//     CommandManager.register("Update Project",     		    CMD_TEAMWORK_UPDATE, 	TeamworkCommandHandler.updateProject);
//     CommandManager.register("Configure Teamwork-Server",    CMD_TEAMWORK_CONFIGURE, TeamworkCommandHandler.handleConfigure);

//     CommandManager.register("Lock Element",                 CMD_LOCK_ELEMENT,       TeamworkCommandHandler.lockElement);
//     CommandManager.register("Unlock Element",               CMD_UNLOCK_ELEMENT,     TeamworkCommandHandler.unlockElement);

//     var menu;
//     menu = MenuManager.addMenu(CMD_TEAMWORK);
//     menu.addMenuItem(CMD_TEAMWORK_OPEN);
//     menu.addMenuItem(CMD_TEAMWORK_CREATE);
//     menu.addMenuItem(CMD_TEAMWORK_LOCK);
//     menu.addMenuItem(CMD_UPDATE_LOCKS);
//     menu.addMenuDivider();
//     menu.addMenuItem(CMD_TEAMWORK_COMMIT);
//     menu.addMenuItem(CMD_TEAMWORK_UPDATE);
//     menu.addMenuDivider();
//     menu.addMenuItem(CMD_TEAMWORK_CONFIGURE);

//     var contextMenuDiagram;
//     contextMenuDiagram = ContextMenuManager.getContextMenu(DefaultMenus.contextMenus.DIAGRAM);
//     contextMenuDiagram.addMenuItem(CMD_LOCK_ELEMENT);
//     contextMenuDiagram.addMenuItem(CMD_UNLOCK_ELEMENT);

//     var contextMenuExplorer;
//     contextMenuExplorer = ContextMenuManager.getContextMenu(DefaultMenus.contextMenus.EXPLORER);
//     contextMenuExplorer.addMenuItem(CMD_LOCK_ELEMENT);
//     contextMenuExplorer.addMenuItem(CMD_UNLOCK_ELEMENT);

//     AppInit.appReady(function() {
//         TeamworkView.init();
//     });

//     AppInit.htmlReady(function () {
//         ExtensionUtils.loadStyleSheet(module, "styles/dialog.css");
//         ExtensionUtils.loadStyleSheet(module, "styles/preferences.css");
//         ExtensionUtils.loadStyleSheet(module, "styles/bootstrap/css/bootstrap.css");
//         LockingAttributesElement.addLockingAttributeToElementType();
//         LockingAttributesElement.addLockingAttributesToUMLModelElementType();
//         Trigger.setupTriggerOpenProject();
//         Trigger.setupTriggerOnRepository();
//         Trigger.setupTriggerCommitProject();
//         Trigger.setupTriggerCreateProject();
//         //Trigger.setupTriggerOnDiagramChanges();
//     });
// });

function handleShowMessage() {
    window.alert('Hello, world!')
}

function init() {
    app.commands.register('helloworld:show-message', handleShowMessage)
}

exports.init = init