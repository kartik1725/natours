const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const rateLimit = require('express-rate-limit')
const userRouter = require('./routes/userRoutes');
const helmet = require('helmet')
const appError = require('./controllers/utils/appError')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const reviewRouter = require('./routes/reviewRoutes')
const app = express();

// 1) MIDDLEWARES
//set security headers
app.use(helmet())
//development logging 
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//limit request from same api
const limiter = rateLimit({
  max:100,
  windowMs:60*60*1000,
  message :'Too many requests from this IP . Please try again after an hour'
})
app.use('/api',limiter)
//body parser,reading data from req.body
app.use(express.json({limit:'10kb'}));
//date sanitize against nosql injection
app.use(mongoSanitize())
//data sanitize agiinst xss
app.use(xss())
// prevent parameter pollution
app.use(hpp({
  whitelist:['duration','ratingsAverage','ratingsQuantity','maxGroupSize','difficulty','price']
}))
//serving static files
app.use(express.static(`${__dirname}/public`));
// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


app.all('*',(req,res,next)=>{
  // res.status(404).json({
  //   status:'fail',
  //   message: `there is no ${req.originalUrl} on this server!`
  // })

  // const err = new Error(`there is no ${req.originalUrl} on this server!`)
  // err.statusCode = 404
  // err.status = 'fail'
  // next(err)

  next(new appError(`there is no ${req.originalUrl} on this server!`,404))

})

app.use(globalErrorHandler)
module.exports = app;
