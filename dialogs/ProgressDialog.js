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