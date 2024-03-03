const {ObjectId} = require('mongodb')

const UserModel = require('../models/model').User;
const BlogModel = require('../models/model').Blog;


module.exports = {
  getUserData: async () => {
    
      const result = await UserModel.aggregate([
        { $match: { "role": 1} },
        {
          $group:{_id: {
              id:'$_id',
            username: '$username',
            email: '$email',
            status: '$status',
            followers: '$followersCount',
          }},
        },
        { $sort: { followers: -1 } },
      ]);
      return result;
  },
  changeStatus: async(body)=>{
    try{

      await UserModel.updateOne({_id:ObjectId(body.userId)},{$set:{"status":body.status}});
      return 
    }catch(e){
      throw e.message;
    };
  },
  getBlogData :async () => {
    const result = await BlogModel.aggregate([
      {
        $project:{
          title:"$title",
          author_id:'$author_id',
          id:'$_id',
          size:{$size:'$like'},
          createdAt:1,
          featured:1
        }
      },
      {
        $sort:{featured:-1,size:-1,createdAt:-1,}
      }
    ]);
  
    return result;
  },
  deleteBlog:async (id)=>{
    await BlogModel.findByIdAndDelete(id);
    
  },
  setFeatured: async(data) =>{
  const result =  await BlogModel.updateOne({_id:ObjectId(data.blogId)},{$set:{"featured":data.featured}});
  console.log(result)
  }
};
