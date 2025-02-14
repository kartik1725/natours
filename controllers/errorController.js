const { stack } = require("../app")
const appError = require("./utils/appError")
const handleCastError = (err)=>{
    const message = `Invalid ${err.path} : ${err.value}.`
    return new appError(message,400)
}
const handleDuplicateFileDB = (err)=>{
    const value = err.keyValue.name
    console.log(value)
    const message= `Duplicate field value: ${value} . Please use any other value`
    return new appError(message,400)
}
const handleValidationErrorDB = (err)=>{
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid Input data : ${errors.join('. ')}`
    return new appError(message,400)
}
const handleJWTError = ()=>  new appError('invalid token. Please login again',401)
const handleJWTExpiredError = () => new appError('Your token has expired. Please login again',401)
const sendErrorProd=(res,err) =>{
    if(err.isOperational){
        res.status(err.statusCode).json({
            status : err.status,
            message: err.message
          })
    }
    else{ //some unknown programming error 
        console.error('ERROR',err)
        res.status(500).json({
            status : 'error',
            message: 'Something went wrong'
          })
    }
}
const sendErrorDev = (res,err)=>{
    res.status(err.statusCode).json({
        status : err.status,
        error:err,
        message: err.message,
        stack: err.stack
      })
}
module.exports = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'fail'
    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(res,err)
    }
    else if(process.env.NODE_ENV === 'production'){
        let error = {... err}
        if(err.name === 'CastError') {
            error = handleCastError(error)
        }
        if(err.code === 11000) error = handleDuplicateFileDB(error)
        if(err.name === 'ValidationError') error = handleValidationErrorDB(error)
        if(err.name === 'JsonWebTokenError') error = handleJWTError()
        if(err.name === 'TokenExpiredError') error = handleJWTExpiredError()
        sendErrorProd(res,error)
    }
  }