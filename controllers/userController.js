const User = require('./../models/userModel');
const appError = require('./utils/appError');
const catchAsync = require('./utils/catchAsync');

const filterObj = (obj,...allowed)=>{
  const newObj={}
  Object.keys(obj).forEach(el =>{
    if(allowed.includes(el)){
      newObj[el] = obj[el]
    }
  })
  return newObj
}

exports.getAllUsers = catchAsync(async (req, res,next) => {
  const users = await User.find()
    res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
    });
});

exports.updateMe = catchAsync(async(req,res,next)=>{
  if(req.body.password|| req.body.confirmPassword){
    return next(new appError('this is not for password updates'))
  }
  const filteredObj = filterObj(req.body,'name','email')
  const updatedUser = await User.findByIdAndUpdate(req.user._id,filteredObj,{
    new:true,
    runValidators:true
  })
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
    });
})
exports.deleteMe = catchAsync(async (req,res,next)=>{
  await User.findByIdAndUpdate(req.user._id,{active:false})
  res.status(204).json({
    status: 'success',
    data: null
    });
})
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
