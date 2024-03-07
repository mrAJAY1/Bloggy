const express = require('express');
const controller = require('../controllers/users_controller');
const store = require('../middlewares/multer');

const router = express.Router();

/* GET home page. */
router.get('/', controller.getHome);

// Get signup

router.get('/signup', controller.getSignup);
router.post('/signup', controller.postSignup);

router.get('/signin', controller.getSignIn);
router.post('/signin', controller.postSignIn);

router.get('/signout', controller.signOut);

router.get('/profile/:id', controller.getProfile);

router.get('/create_blog', controller.getBlogCreate);
router.post('/create_blog', controller.postCreate);

router.get('/delete_blog/:id', controller.getBlogDelete);

router.get('/update_blog/:id', controller.getEditBlog);

router.post(
  '/update_blog/:id',
  store.array('blogImage', 2),
  controller.postEditBlog
);

router.get('/author_profile/:id', controller.getAuthorProfile);

router.get('/read_blog/:id', controller.readBlog);

router.get('/like/:id', controller.like);

router.get('/fav/:id/', controller.fav);

router.get('/category/:id', controller.getCategory);
router.get('/more/:id', controller.getMoreCategoryItems);
router.get('/favorites/:id', controller.getFavorites);

router.post('/upload', store.single('blogImage'), controller.upload);
router.post('/reUpload', store.single('blogImage'), controller.reUpload);
router.get('/deleteUpload', controller.deleteUpload);

router.get('/search', controller.search);
module.exports = router;
