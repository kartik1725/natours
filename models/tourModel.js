const mongoose = require('mongoose')

const slugify = require('slugify')
const Review = require('./reviewModel')
const tourSchema = new mongoose.Schema({
  name:{
    type:String,
    required:[true,"A tour must have a name"],
    unique:true,
    trim:true,
    maxlength:[30,'A tour name must have maximum length of 30'],
    minlength:[7,'A tour name must have more than 7 characters']
  },
  rating :{
    type:Number,
    default:4.5   
  },
  price:{
    type:Number,
    required: [true,"A tour must have a price"]
  },
  duration:{
    type: Number,
    required:[true,'A tour must have a duration']
  },
  maxGroupSize:{
    type:Number,
    required:[true,'A tour must have group size']
  },
  difficulty:{
    type:String,
    required: [true,'A tour must have a difficulty'],
    enum:{
      values:['easy','medium','difficult'],
      message:"Difficulty is either : easy,medium or difficult"
    }
  },
  ratingsAverage:{
    type:Number,
    default: 4.5,
    min:[1,'rating must be above 1.0'],
    max:[5,'rating must be below 5.0']
  },
  ratingsQuantity:{
    type:Number,
    default:0
  },
  priceDiscount: Number,
  summary:{
    type:String,
    trim:true,
    required:[true,'A tour must have a summary']
  },
  description:{
    type:String,
    trim:true
  },
  imageCover:{
    type:String,
    required:[true,'A tour must have a cover image']
  },
  secretTour:{
    type:Boolean,
    default:false
  },
  slug: String,
  images:[String], // array of strings
  startDates:[Date],
  startLocation:{
    type:{
      type:String,
      default:'Point',
      enum:['Point']
    },
    coordinates:[Number],
    address:String,
    description:String
  },
  locations:[
    {
      type:{
        type:String,
        default:'Point',
        enum:['Point']
      },
      coordinates:[Number],
      address:String,
      description:String,
      day:Number
    }
  ],
  guides: [
    {
      type:mongoose.Schema.ObjectId,
      ref:'User'
    }
  ]
},{timestamps:true,toJSON:{virtuals:true},toObject:{virtuals:true}})


tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7  /* can't use query on virtual features as they are not saved in db */
})
tourSchema.virtual('reviews',{
  ref:Review,
  foreignField:'tour',
  localField:'_id'
})

//document middleware : run before .save()
tourSchema.pre('save',function(next){
  this.slug = slugify(this.name,{lower: true})
  next()
})
// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })
/*
document middlware after save
we then have access of the finished document(doc)
tourSchema.post('save',function(doc,next){
  console.log(doc);
  next();
})
*/

// Query middleware

// tourSchema.pre('find',function (next) {   this will not work in case of findById query or any other find query so we use regex
tourSchema.pre('/^find/',function (next) {
  this.find({secretTour: {$ne:true}})
  next()
})
tourSchema.pre(/^find/, function (next){
  this.populate({
    path :'guides',
    select:'-createdAt -__v -updatedAt -passwordChangedAt'
  })
  next()
})

// aggregation pipeline
tourSchema.pre('aggregate',function (next) {
  this.pipeline().unshift({$match:{secretTour: {$ne:true}}})
  next()
})



const Tour = mongoose.model('Tour',tourSchema)
module.exports = Tour;