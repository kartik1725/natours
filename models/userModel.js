const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { resetPassword } = require('../controllers/authController')
const userSchema =  new mongoose.Schema({
    name:{
        type: String,
        required: [true,'User must have a name'],

    },
    email:{
        type: String,
        required: [true,'user must have an email'],
        unique:true,
        lowercase: true,
        validate: [validator.isEmail,"Please provide a valid email."]
    },
    photo:{
        type:String
    },
    role:{
        type:String,
        enum:['user','guide','lead-guide','admin'],
        default:'user'
    },
    password:{
        type:String,
        required: [true,'user must have a password'],
        minlength:8,
        select:false
    },
    confirmPassword:{
        type:String,
        required: [true,'user must enter the confirm Password'],
        validate : {
            // this validator runs only when we create user so keep in mind that we have to use save while updating the user so we can also run this validator then
            validator: function(el){
                return el === this.password
            },
            message : 'Password are not same'
        }
    },
    resetPasswordToken: String,
    resetPasswordExpires:Date,
    passwordChangedAt: Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
},{timestamps:true})
userSchema.pre('save',async function (next) {
    if(!this.isModified('password')) return next()
    this.password =await bcrypt.hash(this.password,12)
    this.confirmPassword = undefined
    next()
})
userSchema.pre('save',function(next){
    if(!this.isModified('password')||this.isNew) return next()
    this.passwordChangedAt= Date.now()-1000
    next()
})
userSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}})
    next()
})
//instance method
userSchema.methods.correctPassword = async function (candidatePassword,userPassword) {
    return await bcrypt.compare(candidatePassword,userPassword) // since we use the select to false in password in the schema because password shouldn't be leaked thus we have to hash the given password by user and compare with the hashed version of correct password
}
userSchema.methods.passwordChangedAfter = function (JWTTimestamp){
    // console.log('Method called with JWTTimestamp:', JWTTimestamp);
    // console.log('passwordChangedAt:', this.passwordChangedAt);

    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10)
        // console.log(changedTimeStamp,JWTTimestamp);  
        return JWTTimestamp< changedTimeStamp 
    }
    return false
}
userSchema.methods.createResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.resetPasswordToken= crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpires = Date.now()+10*60*1000
    return resetToken
}
const User = mongoose.model('User',userSchema) 
module.exports = User