const bcrypt = require('bcrypt');

const UserModel = require('../model').User;

module.exports = {
  doSignup: async (userData) => {
    const user = await new UserModel(userData);
    const emailExist = await UserModel.exists({ email: user.email });
    if (emailExist) {
      const err = 'email';
      throw err;
    }
    const userNameExist = await UserModel.exists({
      username: user.username,
    });
    if (userNameExist) {
      const err = 'username';
      throw err;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    try {
      await user.save();
      return user;
    } catch (err) {
      throw Error(err.message);
    }
  },
  doSignIn: async (userData) => {
    const emailError = true;
    try {
      const emailExist = await UserModel.findOne({
        $or: [
          { email: userData.signInValue },
          { username: userData.signInValue },
        ],
      });
      if (emailExist) {
        const status = await bcrypt.compare(
          userData.password,
          emailExist.password
        );
        if (status) return emailExist;
        throw emailError;
      }
    } catch (error) {
      throw emailError;
    }
    return 0;
  },
  findById: async (id) => {
    const userData = await UserModel.findById(id);
    return userData;
  },
  fav: async (id, userId) => {
    const result = await UserModel.findOne({
      $and: [
        {
          _id: userId,
        },
        {
          'favorites.blogId': id,
        },
      ],
    });
    const data = { blogId: id };
    if (!result) {
      await UserModel.findOneAndUpdate(
        { _id: userId },
        { $push: { favorites: data } }
      );
      return true;
    }
    await UserModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { favorites: data } }
    );
    return false;
  },
  // findFavorites: async (id) => {
  //   const result = await UserModel.aggregate([
  //     {
  //       $match: { _id: ObjectId(id) },
  //     },
  //     {
  //       $unwind:'$favorites',

  //     },
  //     {
  //       $lookup:{
  //         from:'Blog',
  //         localField:'favorites.blogId',
  //         foreignField:'_id',
  //         as:'favorites'
  //       },
       
  //     } 
  //   ]);
  //   console.log(result);
  //   return result;
  // },
  isBlocked:async (id)=>{
    const result = await UserModel.findOne({_id:id,status:{$ne:"active"}})
    return result;
  }
};
