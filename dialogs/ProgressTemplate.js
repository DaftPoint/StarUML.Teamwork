define(function(require, exports, module) { return '<div class="git-progress dialog modal" data-title=\"{{title}}\">\
    \
    <div class="dialog-body modal-body ">\
        <div class="progress">\
            <div class="progress-bar progress-bar-info progress-bar-striped active bar" style="width: 0%;">\
                <span class="dialog-message" id="import-status">\
                    {{initialMsg}}\
                </span>\
            </div>\
        </div>\
    </div>\
    <div class="dialog-footer modal-footer">\
        <button class="k-button dialog-button btn primary git-progress-cancel" data-button-id="cancel">Cancel</button>\
    </div>\
</div>\
\
';});