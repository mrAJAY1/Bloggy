const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

const UserModel = require('../models/model').User;

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
    // pull the data if it exists
    const result = await UserModel.findOneAndUpdate(
      {
        _id: userId,
        'favorites.blogId': new ObjectId(String(id)),
      },
      {
        $pull: { favorites: { blogId: new ObjectId(String(id)) } },
      },
      { new: true }
    );
    if (result) return false;
    // push the data if it doesn't exist
    await UserModel.findOneAndUpdate(
      { _id: userId },
      { $push: { favorites: { blogId: new ObjectId(String(id)) } } },
      { new: true }
    );
    return true;
  },
  findFavorites: async (id) => {
    const result = await UserModel.aggregate([
      {
        $match: { _id: new ObjectId(String(id)) },
      },
      {
        $unwind: {
          path: '$favorites',
        },
      },
      {
        $lookup: {
          from: 'blogs',
          localField: 'favorites.blogId',
          foreignField: '_id',
          as: 'favorites.favorites',
        },
      },
      {
        $unwind: {
          path: '$favorites.favorites',
        },
      },
    ]);

    return result;
  },
  isBlocked: async (id) => {
    const result = await UserModel.findOne({
      _id: id,
      status: { $ne: 'active' },
    });
    return result;
  },
};
