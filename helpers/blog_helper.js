const { ObjectId } = require('mongodb');

const BlogModel = require('../models/model').Blog;

module.exports = {
  createBlog: async (blogData) => {
    const blog = await new BlogModel(blogData);
    try {
      await blog.save(blogData);
      return;
    } catch (error) {
      throw error.message;
    }
  },
  profileBlog: async (userId) => {
    const errorMessage = 'No blogs to display';
    const result = await BlogModel.find({ 'author_id.id': userId }).lean();
    if (!result) throw errorMessage;
    return result;
  },
  deleteBlog: (id) => {
    BlogModel.findByIdAndDelete(id, (err) => {
      if (err) {
        throw err.message;
      }
    });
  },
  BlogDetails: async (id) => {
    const blogData = await BlogModel.findById(id).lean();
    return blogData;
  },
  updateBlog: async (data, blogId) => {
    try {
      if (data.blog_img) {
        await BlogModel.findByIdAndUpdate(blogId, {
          title: data.title,
          description: data.description,
          content: data.content,
          category: data.category,
          headLine: data.headLine,
          blog_img: data.blog_img,
        });
        return;
      }
      await BlogModel.findByIdAndUpdate(blogId, {
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        headLine: data.headLine,
      });
    } catch (err) {
      const errMessage = "Oops coudn't update Blog";
      throw errMessage;
    }
  },
  findAuthorBlogs: async (id) => {
    const blogs = await BlogModel.find({ 'author_id.id': id });
    const errMessage = 'Cant find any blogs';
    if (!blogs) throw errMessage;
    return blogs;
  },
  findLatest: async (id) => {
    const result = await BlogModel.find({ $nor: [{ 'author_id.id': id }] })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    return result;
  },
  findFeatured: async () => {
    const result = await BlogModel.find({ featured: true }).lean();
    return result;
  },
  findTrending: async () => {
    const result = await BlogModel.aggregate([
      {
        $match: { featured: { $ne: true } },
      },
      {
        $project: {
          _id: 1,
          likes: { $size: '$like' },
          title: 1,
          author_id: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { likes: -1, createdAt: -1 },
      },
      { $limit: 5 },
    ]);

    return result;
  },
  findByCategory: async (data) => {
    if (data === 'all-blogs') {
      const result = await BlogModel.find().lean();
      return result;
    }
    const result = await BlogModel.find({ category: data });
    return result;
  },
  like: async (blogId, usersId) => {
    // checks if the user has already liked the blog
    let result = await BlogModel.findOneAndUpdate(
      {
        _id: new ObjectId(String(blogId)),
        'like.userId': usersId,
      },
      {
        $pull: { like: { userId: usersId } },
      },
      { new: true }
    );
    if (result) {
      return { likeLength: result.like.length, status: false };
    }
    result = await BlogModel.findOneAndUpdate(
      {
        _id: new ObjectId(String(blogId)),
      },
      {
        $push: { like: { userId: usersId, _id: new ObjectId() } },
      },
      { new: true }
    );
    return { likeLength: result?.like?.length || 'NA', status: true };
  },
  search: async (keyword) => {
    const result = await BlogModel.aggregate([
      {
        $match: { title: { $regex: keyword, $options: '$i' } },
      },
      {
        $project: {
          title: 1,
          content: 1,
          _id: 1,
          blog_img: 1,
          author_id: 1,
          createdAt: 1,
          category: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    return result;
  },
};
