const fs = require('fs');
const path = require('path');
const target = 'C:\\dev\\egdesk-PublicSMS\\src\\app\\api\\settings\\ai-usage\\ai-usage';

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
    console.log('Successfully deleted:', directoryPath);
  }
}
deleteFolderRecursive(target);
