const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: 'Name is required',
      minlength: 3,
    },
    email: {
      type: String,
      lowercase: true,
      unique: 'email',
      required: 'Email Address is required',
    },
    username: {
      type: String,
      unique: 'username',
      required: 'username is required',
      minlength: 4,
    },
    password: {
      type: String,
      required: 'Please create a password',
    },
    country: {
      type: String,
      required: 'Please select your country',
    },
    state: {
      type: String,
      required: 'Please select your state',
    },
    favorites:[{
     blogId: {
      type:String
    }
    }
     ],
     status :{
       type:String,
       default:'active'
     },

    role: {
      type: Number,
      default: 1,
    },
    profile_img: {
      data: Buffer,
      contentType: String,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    headLine: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      lowercase:true,
    },
    content: {
      type: String,
    },
    author_id: {
      id:{type:String,required:"User Must Be logged In"},
      username:{type:String,required:"user must have a userName"}
    },
    featured: {
      type: Boolean,
      default: false,
    },
    like: [
      {
        userId:{
          type:String
        }
      }
    ],
    reportCount: {
      type: Number,
      default: 0,
    },
    blog_img: [
      {
        filename: {
          type: String,
          required: true,
        },
        contentType: {
          type: String,
          required: true,
        },
        imageBase64: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Blog = mongoose.model('Blog', blogSchema);

module.exports = { User, Blog };
