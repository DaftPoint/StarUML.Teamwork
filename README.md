# StarUML Teamwork-Server

Version 0.1.1 - There may be bugs. Please report an issue so they can be fixed.

StarUML Teamwork-Server is an extension for the modelling tool http://staruml.io/ which provides the option to add a central repository for storing your work or Project on a git-Repository.
The communication with the Git-Repository is done over [StarGit](https://github.com/DaftPoint/StarGit) which is based on ryanackleys [git-html5.js](https://github.com/ryanackley/git-html5.js).

By installing and using this extension you can define a git-Repository to use and add Projects to it. The moment you create a new *Teamwork-Project* you can lock single elements of your project and also the whole Project. Changes made can be committed to the server without merge-conflicts because of the locks.

## Configure a Teamwork-Server
```
1) Teamwork -> Configure Teamwork-Server
2) Enter the required informations like Repo-Url, Username and Password, Local Working-Directory
```

## Open a Teamwork-Project
```
1) Teamwork -> Open Teamwork-Project...
2) Select a Project from the Dropdown-Menu
2) Confirm
```

## Create a new Teamwork-Project
```
1) Teamwork -> Create Teamwork-Project
2) Enter a name
3) Confirm
```

## Un-/Lock an Element
```
1) Right-Click on an Element or Diagram
2) Click 'Lock Element' or 'Unlock Element'
```

## Commit/Update a Project
```
Teamwork -> Commit changes
  or 
Teamwork -> Update Project
```

## Show/Hide Teamwork-View
```
View -> Teamwork-Info
  or
CTRL+ALT+C
  or
Clicking the Teamwork-View-Icon
```
