/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const userHelper = require('../helpers/user_helper');
const blogHelper = require('../helpers/blog_helper');
const Showdown = require('showdown');

const access = 1;
let userActive;
module.exports = {
  getHome: async (req, res) => {
    const user = req.session.userSignedIn ?? {};
    userActive = {
      username: user.username,
      id: user._id,
    };
    const result = await blogHelper.findLatest(10);
    const featured = await blogHelper.findFeatured();
    const trending = await blogHelper.findTrending();
    // eslint-disable-next-line no-param-reassign
    if (result) result.forEach((blog) => delete blog.content);
    res.render('users/index', {
      userActive,
      featured,
      blogData: result,
      trending,
    });
  },
  // getCategories:async(req,res)=>{
  //   const postData = req.body
  //   const data = await blogHelper.getLatestcategories(postData.category)
  //   res.send({data})
  // },

  getSignup: (req, res) => {
    if (req.session.adminSignedIn) res.redirect('/admin');
    else if (req.session.userSignedIn) res.redirect('/');

    const errorData = req.session.signupEntered
      ? req.session.signupEntered
      : {};
    delete req.session.signupEntered;
    res.render('users/signup', {
      emailErr: req.flash('emailErr'),
      usernameErr: req.flash('usernameErr'),
      errorData,
      access,
    });
  },
  postSignup: async (req, res) => {
    req.session.signupEntered = req.body;
    try {
      const userData = await userHelper.doSignup(req.body);
      req.session.userSignedIn = userData;
      req.session.userId = userData._id;
      res.redirect('/');
    } catch (error) {
      if (error === 'email') {
        req.flash(
          'emailErr',
          'That email is already in use, try Signing in...'
        );
        res.redirect('/signup');
      } else if (error === 'username') {
        req.flash(
          'usernameErr',
          'username is already in use, try Signing in...'
        );
        res.redirect('/signup');
      } else {
        req.flash('errorMessage', error);
        res.redirect('/signup');
      }
    }
  },

  getSignIn: (req, res) => {
    if (req.session.adminSignedIn) {
      res.redirect('/admin');
    } else if (req.session.userSignedIn) {
      res.redirect('/');
    }
    const errorData = req.session.signInEntered
      ? req.session.signInEntered
      : {};
    delete req.session.signInEntered;
    res.render('signin', {
      errMessage: req.flash('signInError'),
      errorData,
      access,
    });
  },

  postSignIn: async (req, res) => {
    req.session.signInEntered = req.body;
    try {
      const data = await userHelper.doSignIn(req.body);
      const error = 'No Data';
      if (!data) throw error;
      if (data.role === 2) {
        req.session.adminSignedIn = data;
        res.redirect('/admin');
      } else {
        req.session.userSignedIn = data;
        req.session.userId = data._id;
        res.redirect('/');
      }
    } catch (e) {
      req.flash('signInError', 'Invalid username or password');
      res.redirect('/signin');
    }
  },
  signOut: (req, res) => {
    req.session.destroy();
    userActive = null;
    res.redirect('/');
  },

  getProfile: async (req, res) => {
    if (!req.session.userSignedIn) res.redirect('/');
    else {
      const userId = req.params.id;
      try {
        // eslint-disable-next-line no-underscore-dangle
        const blogData = await blogHelper.profileBlog(userId);
        res.render('users/profile', {
          blogData,
          userActive,
          userId,
          editErr: req.flash('blogEditErr'),
          userData: req.session.userSignedIn,
        });
      } catch (error) {
        res.render('users/profile', { blogsEmpty: error, userId, userActive });
      }
    }
  },
  getBlogCreate: async (req, res) => {
    const signed = req.session.userSignedIn;
    if (!signed) return res.redirect('/');
    const isBlocked = await userHelper.isBlocked(signed._id);
    if (!isBlocked)
      res.render('users/create_blog', { blogData: 0, userActive });
    else res.redirect('/');
  },
  postCreate: async (req, res) => {
    const signed = req.session.userSignedIn;
    if (!signed) res.redirect('/');
    const isBlocked = await userHelper.isBlocked(signed._id);
    if (!isBlocked) {
      const authorData = req.session.userSignedIn;
      const finalData = req.body;
      console.log(finalData);
      finalData.author_id = {
        id: authorData._id,
        username: authorData.username,
      };
      try {
        await blogHelper.createBlog(finalData);
        res.redirect(`/profile/${authorData._id}`);
      } catch (error) {
        console.log(error);
        req.flash('blogUploadError', error);
      }
    } else {
      res.redirect('/');
    }
  },
  getCategory: async (req, res) => {
    const result = await blogHelper.findByCategory(
      req.params.id,
      req.query.limit
    );
    res.render('users/category', { userActive, result });
  },
  getMoreCategoryItems: async (req, res) => {
    const result = await blogHelper.findByCategory(
      req.params.id,
      req.query.limit,
      req.query.skip
    );
    res.send(result);
  },
  getBlogDelete: async (req, res) => {
    const id = req.session.userId;
    try {
      blogHelper.deleteBlog(req.params.id);
      // eslint-disable-next-line no-underscore-dangle
      res.redirect(`/profile/${id}`);
    } catch (err) {
      res.send(err);
    }
  },
  getEditBlog: async (req, res) => {
    const blogData = await blogHelper.BlogDetails(req.params.id);
    res.render('users/create_blog', { blogData, userActive });
  },
  postEditBlog: async (req, res) => {
    const { body } = req;
    try {
      await blogHelper.updateBlog(body, req.params.id);
      res.redirect(`/profile/${req.session.userId}`);
    } catch (err) {
      req.flash('blogEditErr', err);
      res.redirect(`/profile/${req.session.userId}`);
    }
  },
  getAuthorProfile: async (req, res) => {
    try {
      const blogData = await blogHelper.findAuthorBlogs(req.params.id);
      const userData = await userHelper.findById(blogData[0].author_id);
      res.render('users/author_profile', { blogData, userData, userActive });
    } catch (errMessage) {
      res.render('users/author_profile', { userActive });
    }
  },
  readBlog: async (req, res) => {
    const blog = await blogHelper.BlogDetails(req.params.id);
    const { userId } = req.session;
    const { userSignedIn } = req.session;
    let user = null;
    if (userSignedIn && userId) user = await userHelper.findById(userId);
    if (!blog) return res.redirect('/');
    const blogId = req.params.id;

    const likes = blog.like;
    let liked = false;
    let faved = false;
    if (user) {
      // eslint-disable-next-line array-callback-return
      likes.some((dt) => {
        if (dt.userId === userId) liked = true;
      });
      const fav = user.favorites;
      // eslint-disable-next-line array-callback-return
      fav.some((favList) => {
        // eslint-disable-next-line eqeqeq
        if (favList.blogId.toString() === blogId) {
          faved = true;
        }
      });
    }
    const showdown = new Showdown.Converter();
    blog.content = showdown.makeHtml(blog.content);
    blog.likeLength = blog.like.length;
    delete blog.like;
    res.render('users/read_blog', { userActive, blogData: blog, liked, faved });
    faved = false;
    liked = false;
  },

  donate: async (req, res) => {
    if (!req.session.userId) {
      res.redirect('/signin');
    }
  },
  like: async (req, res) => {
    if (!req.session.userId) {
      res.send({ session: null });
      return;
    }
    try {
      const result = await blogHelper.like(req.params.id, req.session.userId);
      res.send({ result, session: req.session.userId });
    } catch (err) {
      console.log(err);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  },
  fav: async (req, res) => {
    const data = req.params.id;
    const result = await userHelper.fav(data, req.session.userId);
    if (result) res.send({ fav: true, session: req.session.userId });
    else res.send({ fav: false, session: req.session.userId });
  },
  getFavorites: async (req, res) => {
    // res.redirect('/');

    const data = req.params.id;
    const result = await userHelper.findFavorites(data);
    res.render('users/favorites', { result, userActive });
  },
  search: async (req, res) => {
    const result = await blogHelper.search(req.query.search);
    res.render('users/search', { result, userActive });
  },

  upload: async (req, res) => {
    cloudinary.uploader.upload(req.file.path, (error, result) => {
      if (error) {
        console.error('Upload failed', error);
        return res.status(500).json({ error: 'Upload failed' });
      }
      fs.unlink(req.file.path, (err) => {
        if (err) console.log(err);
        console.log(`Deleted ${req.file.path}`);
      });
      return res
        .status(200)
        .json({ url: result.secure_url, public_id: result.public_id });
    });
  },
  reUpload: async (req, res) => {
    // extract the publicId from query string
    const { publicId } = req.body;
    if (!publicId) {
      res.status(400).json({ error: 'Missing publicId in query string' });
      return;
    }
    try {
      await cloudinary.uploader.destroy(publicId);
      await cloudinary.uploader.upload(req.file.path, (error, result) => {
        if (error) {
          console.error('Re Upload failed', error);
          return res.status(500).json({ error: 'Re upload failed' });
        }
        fs.unlink(req.file.path, (err) => {
          if (err) console.log(err);
          console.log(`Deleted ${req.file.path}`);
        });
        return res
          .status(200)
          .json({ url: result.secure_url, public_id: result.public_id });
      });
    } catch (error) {
      console.error('Failed to delete Image', error);
      res.status(500).json({ error: 'Failed to delete Image' });
    }
  },
  deleteUpload: async (req, res) => {
    const { publicId } = req.query;
    if (!publicId) {
      res.status(400).json({ error: 'Missing publicId in query string' });
      return;
    }
    try {
      await cloudinary.uploader.destroy(publicId);
      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Failed to delete Image', error);
      res.status(500).json({ error: 'Failed to delete Image' });
    }
  },
};
