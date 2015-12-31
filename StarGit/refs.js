define(function(require, exports, module) {
    "use strict";

    var SmartHttpRemote = require("../gitApi/formats/smart_http_remote");
    var FileObjectStore = require("../gitApi/objectstore/file_repo");
    var PreferenceManager = app.getModule("core/PreferenceManager");
    var GitConfiguration = require("../git/GitConfiguration");

    function getProjectRefs(dir) {
        var objectStore = new FileObjectStore(dir);
        objectStore.init();
        var remoteProjectURL = GitConfiguration.getRemoteURLWithoutUsernameAndPasswort();
        var username = GitConfiguration.getUsername();
        var password = GitConfiguration.getPassword();

        var remote = new SmartHttpRemote(objectStore, "origin", remoteProjectURL, username, password);
        var remoteRefs = remote.getRefs();
        return remoteRefs;
    }

    exports.getProjectRefs = getProjectRefs;
});