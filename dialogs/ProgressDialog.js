define(function (require, exports, module) {
    "use strict";

    //Modules
    var Dialogs = app.getModule('dialogs/Dialogs');

    //Functions
    function showProgress(title, initialMsg){
        var ProgressTemplate    = require("./ProgressTemplate");
        Dialogs.cancelModalDialogIfOpen('modal');
        var context = {title: title, initialMsg: initialMsg};
        Dialogs.showModalDialogUsingTemplate(Mustache.render(ProgressTemplate, context), false);
        return createProgressMonitor();
    }

    function createProgressMonitor(){
        var bar = $('.git-progress .bar')[0];
        var $msg = $('#import-status')

        var progress = function(data){
            bar.style.width = data.pct + '%';
            $msg.text(data.msg);
        }
        return progress;
    }

    exports.showProgress = showProgress;
});