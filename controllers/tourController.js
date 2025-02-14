
const Tour = require('./../models/tourModel')
const APIFeatures = require('./utils/apifeatures')
const appError = require('./utils/appError')
const catchAsync = require('./utils/catchAsync')
exports.aliasTopTours = (req,res,next)=>{
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
  next()
}
exports.getAllTours = catchAsync(async (req, res) => {
  // console.log(req.requestTime);
    //execute query
    const features = new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate()
    const tours = await features.query;
    res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
    });
});

exports.getTour = catchAsync(async(req,res,next) => {
    const tour = await Tour.findById(req.params.id).populate('reviews')
    if(!tour){
      return next(new appError('No tour found with that ID',404))
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  
});
exports.createTour = catchAsync(async(req, res) => {
 
  const newTour =await Tour.create(req.body)
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour // every thing in data which is not present in schema will be ignored
    }
  });
});

exports.updateTour = catchAsync(async(req, res,next) => {
 
    const tour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
      new:true,   // it will return the updated document
      runValidators:true 
    })
    if(!tour){
      return next(new appError('No tour found with that ID',404))
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  
});

exports.deleteTour = catchAsync(async(req, res,next) => {
 
    const newTour =await Tour.findByIdAndDelete(req.params.id)
    if(!newTour){
      return next(new appError('No tour found with that ID',404))
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
    
});


//aggregation pipeline
exports.getTourStats = catchAsync(async(req,res)=>{
 
    const stats = await Tour.aggregate([
      {
        $match : {ratingsAverage:{$gte:4.5}}
      },
      {
        $group : {
          _id : difficulty,
          numTours: {$sum: 1},
          numRatings: {$sum : '$ratingsQuantity'},
          averageRating:{$avg : '$ratingsAverage'},
          averagePrice : {$avg : '$price'},
          minPrice : {$min : '$price'},
          maxPrice : {$max :'$price'}
        }
      },
      {
        $sort: {averagePrice:1}
      },
      // {    // we can use same oprations multiple times
      //   $match:{_id:{$ne:'easy'}} // $ne-> not equal
      // }
    ])
    res.status(201).json({
      status: 'success',
      data: stats
    });
  
})

exports.getMontlyPlan = catchAsync(async(req,res)=>{
 
    const year = req.params.year * 1
    const monthPlan = await Tour.aggregate([
      {
        $unwind : '$startDates'
      },
      {
        $match:{
          startDates:{
            $gte : new Date(`${year}-01-01`),
            $lte : new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group:{
          _id : {$month:'$startDates'},
          numTours:{$add : 1},
          tours: {$push : '$name'}
        }
      },
      {
        $addFields : {month : '$_id'}
      },
      {
        $project : {_id:0}
      },
      {
        $sort:{numTours: -1}
      }

    ])
    res.status(201).json({
      status: 'success',
      data: monthPlan
    });
  
})