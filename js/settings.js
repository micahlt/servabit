const remote = require('electron').remote;
let dialog = remote.require('electron').dialog;
let dataLocation = remote.getGlobal('dataDir');
let w = remote.getCurrentWindow();
const fs = require('fs-extra');
let networkDrive = require('windows-network-drive');
const d = document;
d.querySelector("#exit").addEventListener('click', () => {
  w.close();
});

window.addEventListener("DOMContentLoaded", () => {
  fs.readJson(dataLocation + '/prefs.json', (err, object) => {
    if (err) {
      // handle?
    } else if (object) {
      d.querySelector("#currentBackupFolder").innerText = object.backupDrive.path;
    }
    d.querySelector("#pickFolder").addEventListener('click', () => {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then((res) => {
        d.querySelector("#currentBackupFolder").innerText = res.filePaths[0];
        if (object == undefined) {
          object = {
            "backupDrive": {},
            "folders": []
          };
        }
        object.backupDrive.path = res.filePaths[0];
        fs.writeJson(dataLocation + '/prefs.json', object)
      });
    })
  })
})

window.addEventListener('blur', () => {
  d.querySelector("#window").style.filter = "brightness(0.5) blur(1px)";
});

window.addEventListener('focus', () => {
  d.querySelector("#window").style.filter = "brightness(1) blur(0)";
});