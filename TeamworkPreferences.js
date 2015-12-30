define(function (require, exports, module) {
	"use strict";
	var AppInit           = app.getModule("utils/AppInit");
    var PreferenceManager = app.getModule("core/PreferenceManager");

    var preferenceId 	  = "teamwork";

    var teamworkPreferences = {
	    "teamwork.server.protocol": {
	        text: "HTTP-Protocol",
	        description: "HTTP-Protocol to use for the connection to the GIT-Repository",
	        type: "Dropdown",
	        options: [
	        	{value: "http://", text: "HTTP"},
	        	{value: "https://", text: "HTTPS"}
	        ],
	        'default': "http://"
	    },
	    "teamwork.server.local": {
	        text: "Local Working-Directory",
	        description: "Local Path where the Remote-Data will be cached",
	        type: "String",
	        'default': ""
	    },
	    "teamwork.server.remote": {
	        text: "git URL",
	        description: "URL to the git-Repository you want to use.",
	        type: "String",
	        'default': ""
	    },
	    "teamwork.server.username": {
	        text: "Username",
	        description: "Username to access the git-Repository.",
	        type: "String",
	        'default': ""
	    },
	    "teamwork.server.password": {
	        text: "Password",
	        description: "Password (if required) to access the git-Repository",
	        type: "String",
	        'default': ""
	    },
	    "teamwork.server.backend": {
	        text: "Backend",
	        description: "The GIT-NodeJS-Module which sould be used to enable StarUML to do some Teamwork-Stuff",
	        type: "Dropdown",
	        options: [
	        	{value: 0, text: "Simple-GIT"},
	        	{value: 1, text: "js-git"},
	        	{value: 2, text: "Nodegit v0.1.3"}
	        ],
	        'default': 0
	    }
	};

    function getId() {
        return preferenceId;
    }

	AppInit.htmlReady(function () {
	    PreferenceManager.register(preferenceId, "Teamwork", teamworkPreferences);
	});


	//# Backbone
	exports.getId	=	getId;
});