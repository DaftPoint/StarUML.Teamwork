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

    var teamworkPanelTemplate = require("text!locks_view/teamwork-panel.html"),
        teamworkItemTemplate = require("text!locks_view/teamwork-item.html"),
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

    /**
     * DataSource for ListView
     * @type {kendo.data.DataSource}
     */
    var dataSource = new kendo.data.DataSource();

    /**
     * Clear All Relationship Items
     */
    function clearTeamworkItems() {
        dataSource.data([]);
    }

    /**
     * Add a Teamwork-Message Item
     * @param {Relationship} rel
     * @param {Model} elem
     * @param {string} role
     */
    function addTeamworkItem(event, message, time, user) {
        dataSource.add({
            time: time,
            user: user,
            event: event,
            message: message
        });
    }

    /**
     * Show Relationships Panel
     */
    function show() {
        teamworkPanel.show();
        $button.addClass("selected");
        CommandManager.get(CMD_TEAMWORK_VIEW).setChecked(true);
        PreferenceManager.set(PREFERENCE_KEY, true);
    }

    /**
     * Hide Relationships Panel
     */
    function hide() {
        teamworkPanel.hide();
        $button.removeClass("selected");
        CommandManager.get(CMD_TEAMWORK_VIEW).setChecked(false);
        PreferenceManager.set(PREFERENCE_KEY, false);
    }

    /**
     * Toggle Relationships Panel
     */
    function toggle() {
        if (teamworkPanel.isVisible()) {
            hide();
        } else {
            show();
        }
    }

    /**
     * Initialize Extension
     */
    function init() {
        if(!isInitialized) {
            isInitialized = true
        } else {
            return;
        }
        // Load our stylesheet
        ExtensionUtils.loadStyleSheet(module, "styles.less");

        // Toolbar Button
        $("#toolbar .buttons").append($button);
        $button.click(function () {
            CommandManager.execute(CMD_TEAMWORK_VIEW);
        });

        // Setup RelationshipPanel
        $teamworkPanel = $(teamworkPanelTemplate);
        $title = $teamworkPanel.find(".title");
        $close = $teamworkPanel.find(".close");
        $close.click(function () {
            hide();
        });
        teamworkPanel = PanelManager.createBottomPanel("?", $teamworkPanel, 29);

        // Setup Relationship List
        $listView = $teamworkPanel.find(".listview");
        $listView.kendoListView({
            dataSource: dataSource,
            template: teamworkItemTemplate,
            selectable: true
        });
        listView = $listView.data("kendoListView");

        // Register Commands
        CommandManager.register("Teamwork-Info", CMD_TEAMWORK_VIEW, toggle);


        // Setup Menus
        var menu = MenuManager.getMenu(Commands.VIEW);
        menu.addMenuDivider();
        menu.addMenuItem(CMD_TEAMWORK_VIEW, ["Ctrl-Alt-C"]);

        $clear = $teamworkPanel.find(".clear");
        $clear.click(function() {
            clearTeamworkItems();
        });
        //addTeamworkItem(rel, otherSide, role);

        // Load Preference
        var visible = PreferenceManager.get(PREFERENCE_KEY);
        if (visible === true) {
            show();
        } else {
            hide();
        }

        //_setupContextMenu();
    }

    // Initialize Extension
    //init();
    exports.init = init;
    exports.addTeamworkItem = addTeamworkItem;
});
