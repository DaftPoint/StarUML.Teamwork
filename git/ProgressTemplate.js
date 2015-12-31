define(function(require, exports, module) { return '<div class="git-progress modal">\
    \
    <div class="modal-header">\
        <h1 class="dialog-title">{{title}}</h1>\
    </div>\
    <div class="modal-body">\
        <div class="progress progress-striped active">\
            <div class="bar" style="width: 0%;"></div>\
        </div>\
        <span id="import-status">\
            {{initialMsg}}\
        </span>\
    </div>\
    <div class="modal-footer">\
        <button class="dialog-button btn primary git-progress-cancel">Cancel</button>\
    </div>\
</div>\
\
';});