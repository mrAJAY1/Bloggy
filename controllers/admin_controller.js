const adminHelper = require('../helpers/adminHelper');

const access = 1;
module.exports = {
  getHome: async (req, res) => {
    if(!req.session.adminSignedIn)res.redirect('/')
    const userdata = await adminHelper.getUserData();
    const blogdata = await adminHelper.getBlogData();
    res.render('admins/index', {userdata,access,blogdata});
  },
  setStatus: async (req,res) => {
    if(!req.session.adminSignedIn)res.redirect('/')
    try{
          await adminHelper.changeStatus(req.body)
          res.send({result:true})
    }catch (e){
      res.send({result:false})
    }
  },
  deleteBlog: async (req,res) => {
    if(!req.session.adminSignedIn)res.redirect('/')
    await adminHelper.deleteBlog(req.params.id)
    res.redirect('/admin')
  },
  setFeatured: async (req,res) => {
    if(!req.session.adminSignedIn)res.redirect('/')
    await adminHelper.setFeatured(req.body)
    res.redirect('/admin')
  }
};
