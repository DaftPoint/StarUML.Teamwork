define(function(require, exports, module) { return '<div class="git-progress dialog modal" data-title=\"{{title}}\">\
    \
    <div class="dialog-body modal-body k-progressbar">\
        <div class="k-progressbar" style="width: 100%;">\
            <div class="bar k-file-progress .k-progress" style="width: 0%; height: 20px;"></div>\
        </div>\
        <span class="dialog-message" id="import-status">\
            {{initialMsg}}\
        </span>\
    </div>\
    <div class="dialog-footer modal-footer">\
        <button class="k-button dialog-button btn primary git-progress-cancel" data-button-id="cancel">Cancel</button>\
    </div>\
</div>\
\
';});