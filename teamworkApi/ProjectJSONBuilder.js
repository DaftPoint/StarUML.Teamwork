/**
 * @author Michael Seiler
 *
 */
define(function(require, exports, module) {
    "use strict";

    //Modules
    var Async = app.getModule("utils/Async");

    //Constants
    var PROJECT_TYPE_PROPERTY     = "Project";
    var PARENT_PROPERTY           = "_parent";
    var DIAGRAM_DEFAULT_PROPERTY  = "defaultDiagram";
    var VIEW_MODEL_PROPERTY       = "model";

    //Functions
    function buildProjectFromFragments(fragments) {
        var _project;
        for (var item in fragments) {
            var fragment = fragments[item];
            _project = checkIfFragmentIsProjectRoot(fragment, _project);
            addFragmentToProject(fragment, fragments);
            fragments[item] = fragment;
        }
        _project = fragments[_project._id];
        return _project;
    }

    function loadFragmentsAsJsonObjects(content) {
        var fragments = [];
        var masterPromise = Async.doSequentially(content, function (item, index) {
            var promise = new $.Deferred();
            if(item.isFile) {
                item.read(function (err, data, stats) {
                    var json = JSON.parse(data);
                    fragments[json._id] = json;
                    promise.resolve();
                });
            } else {
                promise.resolve();
            }
            return promise.promise();
        }, false);
        return {fragments: fragments, masterPromise: masterPromise};
    }

    function addViewToOwnedViews(parent, fragment) {
        if (parent.ownedViews === undefined) {
            parent.ownedViews = [];
        }
        parent.ownedViews.push(fragment);
        return parent;
    }

    function addSubViewToView(parent, fragment) {
        if (parent.subViews === undefined) {
            parent.subViews = [];
        }
        parent.subViews.push(fragment);
        return parent;
    }

    function addElementToOwnedElements(parent, fragment) {
        if (parent.ownedElements === undefined) {
            parent.ownedElements = [];
        }
        parent.ownedElements.push(fragment);
        return parent;
    }

    function checkIfFragmentIsProjectRoot(fragment, project) {
        if (fragment._type === PROJECT_TYPE_PROPERTY) {
            return fragment;
        }
        return project;
    }

    function hasFragmentParent(fragment) {
        return fragment.hasOwnProperty(PARENT_PROPERTY);
    }

    function isFragmentOfTypeDiagram(parent) {
        return parent.hasOwnProperty(DIAGRAM_DEFAULT_PROPERTY);
    }

    function isFragmentView(parent) {
        return parent.hasOwnProperty(VIEW_MODEL_PROPERTY);
    }

    function addFragmentToProject(fragment, fragments) {
        if (hasFragmentParent(fragment)) {
            var parentId = fragment._parent.$ref;
            var parent = fragments[parentId];
            if (isFragmentOfTypeDiagram(parent)) {
                parent = addViewToOwnedViews(parent, fragment);
            } else if (isFragmentView(parent)) {
                parent = addSubViewToView(parent, fragment);
            } else {
                parent = addElementToOwnedElements(parent, fragment);
            }
        }
        return {parentId: parentId, parent: parent};
    }

    //Backbone
    exports.loadFragmentsAsJsonObjects = loadFragmentsAsJsonObjects;
    exports.buildProjectFromFragments = buildProjectFromFragments;
});