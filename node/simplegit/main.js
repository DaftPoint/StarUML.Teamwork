//Importet Modules
var TeamworkBase = require("./TeamworkBase");
var OpenTeamworkProject = require("./OpenTeamworkProject");
var CreateCRBranch      = require("./CreateCRBranch");
var LockElement         = require("./Locking");
var CreateProject       = require("./CreateTeamworkProject");
var ProjectCommitter    = require("./CommitProject");

//Functions
function init(domainManager) {
    console.log("init module");
    registerDomainAndCommands(domainManager);
}

function registerDomainAndCommands(domainManager) {
    if (!domainManager.hasDomain(TeamworkBase.DOMAIN)) {
        console.log("Domain was not registered. Trying to register");
        domainManager.registerDomain(TeamworkBase.DOMAIN, {major: 0, minor: 1});

        OpenTeamworkProject.registerCMDOpenTeamworkProject(domainManager);
        CreateCRBranch.registerCMDCreateTeamworkProject(domainManager);
        LockElement.registerCMDLockProject(domainManager);
        LockElement.registerCMDLoadKnownLocks(domainManager);
        LockElement.registerCMDLockElements(domainManager);
        LockElement.registerCMDUnlockGivenElements(domainManager);
        CreateProject.registerCMDCreateTeamworkProject(domainManager);
        ProjectCommitter.registerCMDCommitProject(domainManager);
        OpenTeamworkProject.registerCMDLoadProjectNames(domainManager);
    }
}

//Backbone
exports.init = init;