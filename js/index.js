const remote = require('electron').remote;
const dialog = remote.require('electron').dialog;
const shell = remote.require('electron').shell;
const dataLocation = remote.getGlobal('dataDir');
const w = remote.getCurrentWindow();
const fs = require('fs-extra');
const path = require('path');
const d = document;
d.querySelector("#exit").addEventListener('click', () => {
  w.close();
});
const renderFile = (name, parentFolder, icon) => {
  if (name) {
    let ext;
    if (name.includes('.')) {
      ext = name.split('.')[name.split('.').length - 1].toUpperCase();
    } else if (fs.existsSync(path.join(parentFolder, name))) {
      ext = "Folder"
    } else {
      ext = "Unknown";
    }
    let template;
    if (name.length > 40) {
      let shortName = name.slice(0, 39) + '...';
      template = `
      <tr title="${name}" data-path="${parentFolder + '/' + name}">
        <td>${shortName}</td>
        <td>${ext}</td>
        <td><span class="icon icon-${icon}"></span></td>
      </tr>`;
    } else {
      template = `
      <tr title="${name}" data-path="${parentFolder + '/' + name}">
        <td>${name}</td>
        <td>${ext}</td>
        <td><span class="icon icon-${icon}"></span></td>
      </tr>`;
    }
    let temp = d.createElement('tbody');
    temp.innerHTML = template;
    let htmlObject = temp.children[0];
    d.querySelector("#files").appendChild(htmlObject);
    htmlObject.addEventListener('click', () => {
      shell.showItemInFolder(path.join(parentFolder, name));
    });
    htmlObject.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      fs.readJson(path.join(dataLocation, 'prefs.json'), (err, object) => {
        const disabledList = object.disabled;
        let currentlyDisabled = false;
        let disabledIndex = -1;
        disabledList.forEach((item, i) => {
          if (item.path == path.join(parentFolder, name)) {
            currentlyDisabled = true;
            disabledIndex = i;
          }
        })
        if (currentlyDisabled) {
          dialog.showMessageBox(null, {
            "message": "Do you want to enable backup for this file?",
            "detail": path.join(parentFolder, name),
            "checkboxLabel": "Don't ask again",
            "buttons": ["Confirm", "Cancel"],
            "title": "Disable backup",
            "icon": "../assets/icons/64x64.png"
          }).then((res) => {
            if (res.response == 0) {
              disabledList.splice(disabledIndex, 1);
              object.disabled = disabledList;
              fs.writeJson(path.join(dataLocation, 'prefs.json'), object, (err) => {
                if (err) {
                  alert(err);
                } else {
                  htmlObject.children[2].firstChild.classList.replace('icon-cancel', 'icon-check');
                }
              });
            }
          });
        } else {
          dialog.showMessageBox({
            "message": "Do you want to disable backup for this file?",
            "detail": path.join(parentFolder, name),
            "checkboxLabel": "Don't ask again",
            "buttons": ["Confirm", "Cancel"],
            "title": "Disable backup",
            "icon": "../assets/icons/64x64.png"
          }).then((res) => {
            if (res.response == 0) {
              disabledList.push({
                "path": path.join(parentFolder, name)
              });
              object.disabled = disabledList;
              fs.writeJson(path.join(dataLocation, 'prefs.json'), object, (err) => {
                if (err) {
                  alert(err);
                } else {
                  htmlObject.children[2].firstChild.classList.replace('icon-check', 'icon-cancel');
                }
              });
            }
          });
        }
      });
    });
  }
}
const renderFolder = (name, filePath, type) => {
  if (!type) {
    type = 'folder'
  }
  if (name && filePath) {
    let template =
      `<span class="nav-group-item ${type == 'drive' ? 'active' : ''}" data-path="${filePath}" title="${filePath}">
      <span class="icon icon-${type}"></span>
      ${name}
     </span>`;
    let temp = d.createElement('div');
    temp.innerHTML = template;
    let htmlObject = temp.firstChild;
    d.querySelector("#folders").appendChild(htmlObject);
    htmlObject.addEventListener('click', () => {
      const nodes = d.querySelector("#folders").children;
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove('active');
        htmlObject.classList.add('active');
      }
      fs.readdir(filePath, (err, files) => {
        fs.readJson(path.join(dataLocation, 'prefs.json'), (err, object) => {
          object = object.disabled;
          d.querySelector("#files").innerHTML = "";
          files.forEach((file) => {
            let disabled = object.findIndex((item) => {
              return item.path == path.join(filePath, file);
            });
            disabled = disabled == -1 ? 'check' : 'cancel';
            renderFile(file, filePath, disabled);
          });
        })
      });
    });
  }
}
window.addEventListener("DOMContentLoaded", () => {
  fs.readJson(dataLocation + '/prefs.json', (err, object) => {
    if (err) {
      window.open('settings.html', '_blank', 'width=500,height=300');
    } else if (object) {
      renderFolder('Backup Drive', object.backupDrive.path, 'drive');
      object.folders.forEach((item) => {
        renderFolder(item.name, item.path);
      });
      fs.readdir(object.backupDrive.path, (err, files) => {
        d.querySelector("#files").innerHTML = "";
        files.forEach((file) => {
          let disabled = object.disabled.findIndex((item) => {
            return item.path == path.join(file, object.backupDrive.path);
          });
          disabled = disabled = -1 ? 'check' : 'cancel';
          renderFile(file, object.backupDrive.path, disabled);
        });
      });
    }
    d.querySelector("#addFolder").addEventListener('click', () => {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then((res) => {
        if (object == undefined) {
          window.open('settings.html', '_blank', 'width=500,height=400');
        } else {
          let dupes = object.folders.find((item) => {
            return item.path == res.filePaths[0];
          })
          if (dupes == undefined) {
            let name = res.filePaths[0].split('/');
            name = name[name.length - 1];
            console.log(name);
            object.folders.push({
              "name": name,
              "path": res.filePaths[0]
            });
            renderFolder(name, res.filePaths[0]);
          }
        }
        fs.writeJson(dataLocation + '/prefs.json', object)
      });
    });
    d.querySelector("#removeFolder").addEventListener('click', () => {
      let folder = d.querySelector("span.nav-group-item.active");
      console.log(folder.firstElementChild.classList)
      if (folder.firstElementChild.classList.contains("icon-drive")) {
        alert("You can't delete the backup drive!  To change it, go to settings.")
      } else {
        let del = object.folders.filter((item) => {
          return item.path != folder.getAttribute("data-path");
        });
        folder.parentElement.removeChild(folder);
        object.folders = del;
        fs.writeJson(dataLocation + '/prefs.json', object);
      }
    });
  });
});

window.addEventListener('blur', () => {
  d.querySelector("#window").style.filter = "brightness(0.5) blur(1px)";
});

window.addEventListener('focus', () => {
  d.querySelector("#window").style.filter = "brightness(1) blur(0)";
});

d.querySelector("#openSettings").addEventListener('click', () => {
  window.open('settings.html', '_blank', 'width=500,height=400');
});