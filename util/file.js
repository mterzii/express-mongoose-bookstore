const fs = require('fs');
// Dosya oluşturma, silme, okuma gibi işlemler yapar.

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw err;
        }
    });
};

// fs.unlink() → dosya siler


exports.deleteFile = deleteFile;