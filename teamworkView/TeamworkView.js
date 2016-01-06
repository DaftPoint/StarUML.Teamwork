/*
 * Copyright (c) 2016 Michael Seiler. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils     = app.getModule("utils/ExtensionUtils"),
        PanelManager       = app.getModule("utils/PanelManager"),
        Repository         = app.getModule("core/Repository"),
        SelectionManager   = app.getModule("engine/SelectionManager"),
        CommandManager     = app.getModule("command/CommandManager"),
        Commands           = app.getModule("command/Commands"),
        MenuManager        = app.getModule("menu/MenuManager"),
        ContextMenuManager = app.getModule("menu/ContextMenuManager"),
        ModelExplorerView  = app.getModule("explorer/ModelExplorerView"),
        PreferenceManager  = app.getModule("core/PreferenceManager");

    var teamworkPanelTemplate = require("text!teamworkView/teamwork-panel.html"),
        teamworkItemTemplate = require("text!teamworkView/teamwork-item.html"),
        teamworkPanel,
        listView,
        $teamworkPanel,
        $listView,
        $title,
        $close,
        $clear,
        $button = $("<a id='toolbar-teamwork-view' href='#' title='Teamwork-Info'></a>");

    var CMD_TEAMWORK_VIEW = "view.teamwork-info",
        PREFERENCE_KEY = "view.teamwork-info.visibility";

    var isInitialized = false;

    var dataSource = new kendo.data.DataSource();

    function clearTeamworkItems() {
        dataSource.data([]);
    }

    var EVENTS = {
        CREATE_PROJECT: "Project created",
        LOCK_ELEMENT: "Element locked",
        UNLOCK_ELEMENT: "Element unlocked",
        OPEN_PROJECT: "Project loaded",
        UPDATE_LOCK_INFO: "Updating Lock-Info"
    }

    function addTeamworkItem(event, message, time, user) {
        show();
        dataSource.add({
            time: time,
            user: user,
            event: event,
            message: message
        });
    }

    function addCreateProjectEvent(projectName, user) {
        var message = "Teamwork-Project created: " + projectName;
        addTeamworkItem(EVENTS.CREATE_PROJECT, message, new Date().toJSON().slice(0, 19).replace("T", " "), user);
    }

    function addElementLockedEvent(elementId, time, user) {
        var message = "Element locked: " + elementId;
        addTeamworkItem(EVENTS.LOCK_ELEMENT, message, time, user);
    }

    function addElementUnlockedEvent(elementId, user) {
        var message = "Element unlocked: " + elementId;
        addTeamworkItem(EVENTS.UNLOCK_ELEMENT, message, new Date().toJSON().slice(0, 19).replace("T", " "), user);
    }

    function addOpenProjectEvent(projectName, user) {
        var message = "Loaded Project: " + projectName;
        addTeamworkItem(EVENTS.OPEN_PROJECT, message, new Date().toJSON().slice(0, 19).replace("T", " "), user);
    }

    function addUpdateLockInfoEvent(elementID, time, user) {
        var message = "Lock-Information updated for: " + elementID;
        addTeamworkItem(EVENTS.UPDATE_LOCK_INFO, message, time, user);
    }

    function show() {
        teamworkPanel.show();
        $button.addClass("selected");
        CommandManager.get(CMD_TEAMWORK_VIEW).setChecked(true);
        PreferenceManager.set(PREFERENCE_KEY, true);
    }

    function hide() {
        teamworkPanel.hide();
        $button.removeClass("selected");
        CommandManager.get(CMD_TEAMWORK_VIEW).setChecked(false);
        PreferenceManager.set(PREFERENCE_KEY, false);
    }

    function toggle() {
        if (teamworkPanel.isVisible()) {
            hide();
        } else {
            show();
        }
    }

    function init() {
        if(!isInitialized) {
            isInitialized = true
        } else {
            return;
        }
        ExtensionUtils.loadStyleSheet(module, "styles.less");

        $("#toolbar .buttons").append($button);
        $button.click(function () {
            CommandManager.execute(CMD_TEAMWORK_VIEW);
        });

        $teamworkPanel = $(teamworkPanelTemplate);
        $title = $teamworkPanel.find(".title");
        $close = $teamworkPanel.find(".close");
        $close.click(function () {
            hide();
        });
        teamworkPanel = PanelManager.createBottomPanel("?", $teamworkPanel, 29);

        $listView = $teamworkPanel.find(".listview");
        $listView.kendoListView({
            dataSource: dataSource,
            template: teamworkItemTemplate,
            selectable: true
        });
        listView = $listView.data("kendoListView");

        CommandManager.register("Teamwork-Info", CMD_TEAMWORK_VIEW, toggle);


        // Setup Menus
        var menu = MenuManager.getMenu(Commands.VIEW);
        menu.addMenuDivider();
        menu.addMenuItem(CMD_TEAMWORK_VIEW, ["Ctrl-Alt-C"]);

        $clear = $teamworkPanel.find(".clear");
        $clear.click(function() {
            clearTeamworkItems();
        });

        // Load Preference
        var visible = PreferenceManager.get(PREFERENCE_KEY);
        if (visible === true) {
            show();
        } else {
            hide();
        }
    }

    // Initialize Extension
    exports.init = init;
    exports.addCreateProjectEvent = addCreateProjectEvent;
    exports.addOpenProjectEvent = addOpenProjectEvent;
    exports.addElementUnlockedEvent = addElementUnlockedEvent;
    exports.addElementLockedEvent = addElementLockedEvent;
    exports.addUpdateLockInfoEvent = addUpdateLockInfoEvent;
    exports.addTeamworkItem = addTeamworkItem;
});
