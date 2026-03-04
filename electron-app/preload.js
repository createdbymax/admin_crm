const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('crm', {
  isElectron: true
});
