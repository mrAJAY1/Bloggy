const express = require('express');
const controller = require('../controllers/admin_controller');

const router = express.Router();

// Get Admin Page
router.get('/', controller.getHome);
router.post('/setstatus', controller.setStatus);
router.get('/delete_blog/:id', controller.deleteBlog);
router.post('/setfeatured',controller.setFeatured)
module.exports = router;
