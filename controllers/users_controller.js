/* eslint-disable no-underscore-dangle */
const fs = require('fs');

const userHelper = require('../helpers/user_helper');
const blogHelper = require('../helpers/blog_helper');

const access = 1;
let userActive;
module.exports = {
  getHome: async (req, res) => {
    const user = req.session.userSignedIn ? req.session.userSignedIn : {};
    userActive = {
      username: user.username,
      id: user._id,
    };
    const result = await blogHelper.findLatest(req.session.userId);
    const featured = await blogHelper.findFeatured();
    const trending = await blogHelper.findTrending();
    const blogPrime = result.slice(0, 1);
    const blogSecond = result.slice(1, 4);
    const blogThird = result.slice(4);

    res.render('users/index', {
      userActive,
      featured,
      blogPrime,
      blogSecond,
      blogThird,
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
  getBlogCreate: async(req, res) => {
    const signed = req.session.userSignedIn
    if(!signed)res.redirect('/')
    const isBlocked = await userHelper.isBlocked(signed._id)
    if(!isBlocked)
      res.render('users/create_blog', { blogData: 0, userActive });
    else res.redirect('/');
  },
  postCreate: async (req, res) => {
    const signed = req.session.userSignedIn
    if(!signed)res.redirect('/')
    const isBlocked = await userHelper.isBlocked(signed._id)
    if(!isBlocked){

      const { files } = req;

    const authorData = req.session.userSignedIn;
    const finalData = req.body;
    finalData.author_id = {
      id: authorData._id,
      username: authorData.username,
    };

    // converrt image into base 64 encoding
    const imgArray = await files.map((file) => {
      const img = fs.readFileSync(file.path);
      const encodeImage = img.toString('base64');
      return encodeImage;
    });
    const finalImg = [];
    await imgArray.map((src, index) => {
      const result = finalImg.push({
        filename: files[index].originalname,
        contentType: files[index].mimetype,
        imageBase64: src,
      });
      return result;
    });
    finalData.blog_img = finalImg;
    try {
      await blogHelper.createBlog(finalData);
      res.redirect(`/profile/${authorData._id}`);
    } catch (error) {
      console.log(error);
      req.flash('blogUploadError', error);
    }
    }else{
      res.redirect('/');
    }
    
  },
  getCategory: async (req, res) => {
    const result = await blogHelper.findByCategory(req.params.id);
    res.render('users/category', { userActive, result });
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
    const { files } = req;
    const { body } = req;
    // converrt image into base 64 encoding

    const imgArray = await files.map((file) => {
      const img = fs.readFileSync(file.path);
      const encodeImage = img.toString('base64');
      return encodeImage;
    });
    const finalImg = [];
    await imgArray.map((src, index) => {
      const result = finalImg.push({
        filename: files[index].originalname,
        contentType: files[index].mimetype,
        imageBase64: src,
      });
      return result;
    });
    body.blog_img = finalImg;

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
      res.render('users/user_profile', { blogData, userData, userActive });
    } catch (errMessage) {
      res.render('users/user_profile', { userActive });
    }
  },
  readBlog: async (req, res) => {
    const blog = await blogHelper.BlogDetails(req.params.id);
    const user = await userHelper.findById(req.session.userId);
    const blogId = req.params.id;
    const { userSignedIn } = req.session;
    const { userId } = req.session;
    const slicedContent = {
      _id: blog._id,
      createdAt: blog.createdAt,
      like: blog.like,
      category: blog.category,
      author_id: blog.author_id,
      blog_img: blog.blog_img,
      title: blog.title,
      firstcharacter: blog.content.slice(0, 1),
      p1: blog.content.slice(1, 200),
      p2: blog.content.slice(200, 450),
      p3: blog.content.slice(450, 700),
      p4: blog.content.slice(700, 950),
      p5: blog.content.slice(950, 1200),
      p6: blog.content.slice(1200, 1450),
      p7: blog.content.slice(1450, 1700),
      p8: blog.content.slice(1700, 1950),
      p9: blog.content.slice(1950, 2200),
      p10: blog.content.slice(2200, 2450),
    };
    const likes = blog.like;
    let liked = false;
    let faved = false;
    if (userSignedIn) {
      // eslint-disable-next-line array-callback-return
      likes.some((dt) => {
        if (dt.userId === userId) liked = true;
      });
      const fav = user.favorites;

      // eslint-disable-next-line array-callback-return
      fav.some((favList) => {
        if (favList.blogId === blogId) {
          faved = true;
        }
      });
    }
    res.render('users/read_blog', { userActive, slicedContent, liked, faved });
    faved = false;
    liked = false;
  },

  donate: async (req, res) => {
    if (!req.session.userId) {
      res.redirect('/signin');
    }
  },
  like: async (req, res) => {
    const result = await blogHelper.like(req.params.id, req.session.userId);
    res.send({ result, session: req.session.userId });
  },
  fav: async (req, res) => {
    const data = req.params.id;
    const result = await userHelper.fav(data, req.session.userId);
    if (result) res.send({ fav: true, session: req.session.userId });
    else res.send({ fav: false, session: req.session.userId });
  },
  getFavorites: async (req, res) => {
    res.redirect('/');
    // }
    // const data =req.params.id;
    // const result = await userHelper.findFavorites(data);
    // res.render('users/favorites',{result,userActive})
  },
  search: async (req, res) => {
    const result = await blogHelper.search(req.query.search);
    res.render('users/search', { result, userActive });
  },
};
