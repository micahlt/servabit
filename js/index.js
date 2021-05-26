const remote = require('electron').remote;
let dialog = remote.require('electron').dialog;
let shell = remote.require('electron').shell;
let dataLocation = remote.getGlobal('dataDir');
let w = remote.getCurrentWindow();
const fs = require('fs-extra');
let networkDrive = require('windows-network-drive');
const d = document;
d.querySelector("#exit").addEventListener('click', () => {
  w.close();
});
const renderFile = (name, parentFolder) => {
  if (name) {
    let ext;
    if (name.includes('.')) {
      ext = name.split('.')[name.split('.').length - 1].toUpperCase();
    } else {
      ext = "Unknown";
    }
    let template;
    if (name.length > 40) {
      let shortName = name.slice(0, 39) + '...';
      template = `
      <tr title="${name}" data-path="${parentFolder + '\\' + name}">
        <td>${shortName}</td>
        <td>${ext}</td>
        <td>28K</td>
      </tr>`;
    } else {
      template = `
      <tr title="${name}" data-path="${parentFolder + '\\' + name}">
        <td>${name}</td>
        <td>${ext}</td>
        <td>28K</td>
      </tr>`;
    }
    let temp = d.createElement('tbody');
    temp.innerHTML = template;
    let htmlObject = temp.children[0];
    d.querySelector("#files").appendChild(htmlObject);
    htmlObject.addEventListener('click', () => {
      shell.showItemInFolder(parentFolder + '\\' + name);
    })
  }
}
const renderFolder = (name, path, type) => {
  if (!type) {
    type = 'folder'
  }
  if (name && path) {
    let template =
      `<span class="nav-group-item ${type == 'drive' ? 'active' : ''}" data-path="${path}" title="${path}">
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
      fs.readdir(path, (err, files) => {
        d.querySelector("#files").innerHTML = "";
        files.forEach((file) => {
          renderFile(file, path);
        });
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
          renderFile(file, object.backupDrive.path);
        });
      });
    }
    d.querySelector("#addFolder").addEventListener('click', () => {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then((res) => {
        if (object == undefined) {
          window.open('settings.html', '_blank', 'width=500,height=300');
        } else {
          let dupes = object.folders.find((item) => {
            return item.path == res.filePaths[0];
          })
          if (dupes == undefined) {
            let name = res.filePaths[0].split('\\');
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
  window.open('settings.html', '_blank', 'width=500,height=300');
});