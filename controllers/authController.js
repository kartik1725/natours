const jwt = require('jsonwebtoken')
const catchAsync = require('./utils/catchAsync')
const User = require('./../models/userModel');
const appError = require('./utils/appError')
const crypto  = require('crypto')
const {promisify} = require('util')
const { appendFile } = require('fs')
const sendEmail = require('./utils/email')
const { log } = require('console')

const createSendToken = (user,statusCode,res)=>{
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly:true
    }
    if(process.env.NODE_ENV === 'production' ) cookieOptions.secure = true
    res.cookie('jwt',token,cookieOptions)
    user.password = undefined
    res.status(statusCode).json({
        status:'success',
        token,
        data: {
            user
        }
    })
}

const signToken = id =>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}
exports.signup = catchAsync(async(req,res,next)=>{
    console.log(req.body.passwordChangedAt)
    const newUser = await User.create({
        name:req.body.name,
        email: req.body.email,
        password:req.body.password,
        confirmPassword: req.body.confirmPassword,
        passwordChangedAt: req.body.passwordChangedAt,
        role:req.body.role
    })
    createSendToken(newUser,201,res)
    
})
exports.login = catchAsync(async(req,res,next)=>{
    console.log(User);
    
    const {email,password} = req.body
    // 1) checking if the password exists
    if(!email || !password) {
       return next(new appError('Please provide email and password',400))
    }
    // 2) check if the user exits and passowod correct or not
    const user = await User.findOne({email}).select('+password')
   
    if(!user || !(await user.correctPassword(password,user.password))) {
        return next(new appError("Please enter a correct email or Password",401))
    }
    // 3) send token to user
    createSendToken(user,200,res)
   
})

exports.protect = catchAsync(async(req,res,next)=>{
    // getting token
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer') ){
        token = req.headers.authorization.split(' ')[1]
    }
    if(!token){
        return next(new appError('Please login to get access',401))
    }
    //verification of token
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)
    console.log(decoded);
    
    //check if user still exist after the issue of token
    const currentUser = await User.findById(decoded.id)
    // console.log(currentUser);
    
    if(!currentUser) {
        return next(new appError('User with this token no longer exist',401))
    }
    if(currentUser.passwordChangedAfter(decoded.iat)){
        return next(new appError('User changed password recently please login again',401))
    }
    req.user = currentUser
    next()
})
exports.restrictTo = (...roles)=>{
    return (req,res,next)=>{
        console.log(req.user.role);
        
        if(!roles.includes(req.user.role)){
            return next(new appError('You do not have the permission to perform this action',403))
        }
        next()
    }   
}
exports.forgotPassword =catchAsync(async (req,res,next)=>{
    //get user based on email
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return next(new appError('no user exist with this email',404))
    }
    // generate the reset token
    const resetToken = user.createResetPasswordToken()
    await user.save({validateBeforeSave:false}) //****** update the documents without running validators such as email & password
    //send email to user
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `forgot your password? submit a patch request to :${resetURL}`
    try {
        await sendEmail({
            email:user.email,
            subject:'Your password reset token (valid for 10 min)',
            message
        })
        res.status(200).json({
            status:'success',
            message:'Token sent to email'
        })
    } catch (err) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        await user.save({validateBeforeSave:false})
        return next(new appError('there was an error in sending email',500))
    }
})
exports.resetPassword = catchAsync(async(req,res,next)=>{
    //get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({resetPasswordToken:hashedToken,resetPasswordExpires:{$gt:Date.now()}})
    if(!user){
        return next(new appError('token invalid or expired',400))
    }
    user.password = req.body.password
    user.confirmPassword = req.body.confirmPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    //update the password changed at property in usermodel through middleware
    //  send token to user
    createSendToken(user,200,res)
    
})

exports.updatePassword =catchAsync( async(req,res,next)=>{
    //get the user
    const user = await User.findOne(req.user._id).select('+password')
    //match the current password
    if(!( user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new appError("Please enter a correct current Password",401))
    }
    //if matched update the password
    user.password = req.body.password
    user.confirmPassword = req.body.confirmPassword
    await user.save()
    //send the token
    createSendToken(user,200,res)
})
