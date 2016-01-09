/*global define, $, _, window, type, app, appshell, document, localStorage, setInterval */
define(function (require, exports, module) {
	"use strict";

	//# Import libs
	var AppInit					= app.getModule("utils/AppInit");
    var CommandManager      	= app.getModule("command/CommandManager");
    var MenuManager        		= app.getModule("menu/MenuManager");
    var DefaultMenus            = app.getModule("menu/DefaultMenus");
    var ContextMenuManager      = app.getModule("menu/ContextMenuManager");
    var ExtensionUtils          = app.getModule("utils/ExtensionUtils");

    //Imported files
    var TeamworkCommandHandler 	= require("./commandHandler/CommandHandler");
    var LockingAttributesElement= require("./locking/LockingAttributesElement");
    var Trigger                 = require("./trigger/Trigger");
    var Locking                 = require("./locking/ElementLocker");
    var ProjectCommitter        = require("./teamworkApi/ProjectCommitter");
    var TeamworkView            = require("./teamworkView/TeamworkView");

    //# Define Commands
    var CMD_TEAMWORK         	= 'teamwork';
    var CMD_TEAMWORK_COMMIT  	= 'teamwork.commit';
    var CMD_TEAMWORK_OPEN       = 'teamwork.open';
    var CMD_TEAMWORK_UPDATE  	= 'teamwork.update';
    var CMD_TEAMWORK_CREATE  	= 'teamwork.create';
    var CMD_TEAMWORK_LOCK  	    = 'teamwork.lock';
    var CMD_UPDATE_LOCKS  	    = 'teamwork.lock.update';
    var CMD_TEAMWORK_CONFIGURE  = 'teamwork.configure';

    var CMD_LOCK_ELEMENT        = 'teamwork.element.lock';
    var CMD_UNLOCK_ELEMENT      = 'teamwork.element.unlock';

    //# register commands
    CommandManager.register("Teamwork",             		CMD_TEAMWORK,           CommandManager.doNothing);
    CommandManager.register("Open Teamwork-Project...",     CMD_TEAMWORK_OPEN,      TeamworkCommandHandler.openProject);
    CommandManager.register("Create Teamwork-Project", 	    CMD_TEAMWORK_CREATE,  	TeamworkCommandHandler.createProject);
    CommandManager.register("Lock Teamwork-Project", 	    CMD_TEAMWORK_LOCK,  	TeamworkCommandHandler.lockWholeProject);
    CommandManager.register("Update Lock-Info", 	        CMD_UPDATE_LOCKS,  	    TeamworkCommandHandler.updateProjectLockInfo);
    CommandManager.register("Commit changes",  			    CMD_TEAMWORK_COMMIT,   	ProjectCommitter.commitProjectChanges);
    CommandManager.register("Update Project",     		    CMD_TEAMWORK_UPDATE, 	TeamworkCommandHandler.updateProject);
    CommandManager.register("Configure Teamwork-Server",    CMD_TEAMWORK_CONFIGURE, TeamworkCommandHandler.handleConfigure);

    CommandManager.register("Lock Element",                 CMD_LOCK_ELEMENT,       Locking.lockElement);
    CommandManager.register("Unlock Element",               CMD_UNLOCK_ELEMENT,     Locking.unlockElement);

    var menu;
    menu = MenuManager.addMenu(CMD_TEAMWORK);
    menu.addMenuItem(CMD_TEAMWORK_OPEN);
    menu.addMenuItem(CMD_TEAMWORK_CREATE);
    menu.addMenuItem(CMD_TEAMWORK_LOCK);
    menu.addMenuItem(CMD_UPDATE_LOCKS);
    menu.addMenuDivider();
    menu.addMenuItem(CMD_TEAMWORK_COMMIT);
    menu.addMenuItem(CMD_TEAMWORK_UPDATE);
    menu.addMenuDivider();
    menu.addMenuItem(CMD_TEAMWORK_CONFIGURE);

    var contextMenuDiagram;
    contextMenuDiagram = ContextMenuManager.getContextMenu(DefaultMenus.contextMenus.DIAGRAM);
    contextMenuDiagram.addMenuItem(CMD_LOCK_ELEMENT);
    contextMenuDiagram.addMenuItem(CMD_UNLOCK_ELEMENT);

    var contextMenuExplorer;
    contextMenuExplorer = ContextMenuManager.getContextMenu(DefaultMenus.contextMenus.EXPLORER);
    contextMenuExplorer.addMenuItem(CMD_LOCK_ELEMENT);
    contextMenuExplorer.addMenuItem(CMD_UNLOCK_ELEMENT);

    AppInit.appReady(function() {
        TeamworkView.init();
    });

    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/dialog.css");
        ExtensionUtils.loadStyleSheet(module, "styles/bootstrap/css/bootstrap.css");
        LockingAttributesElement.addLockingAttributeToElementType();
        LockingAttributesElement.addLockingAttributesToUMLModelElementType();
        Trigger.setupTriggerOpenProject();
        Trigger.setupTriggerOnRepository();
        Trigger.setupTriggerCommitProject();
        Trigger.setupTriggerCreateProject();
    });
});