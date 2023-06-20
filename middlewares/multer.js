const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, 'uploads');
  },
  filename(req, file, callback) {
    // gets the extension of the file eg: image.jpg
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));

    callback(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});
const store = multer({storage});

module.exports = store;
