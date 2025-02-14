class APIFeatures {
    constructor(query,queryString) {
      this.query = query
      this.queryString = queryString
    }
    filter(){
      const queryObj = {...this.queryString}
      const exclude = ['page','limit','sort','fields']
      exclude.forEach(el => delete queryObj[el])
       // abhi hum baaki processing bhi karenge to isliye await last me lagayenge
  
      // filtering query with inequality eg greater than and less than
      /*
      normal mongodb query format->{difficulty : 'easy', duration:{$gte:5}}
      query syntax we get from req.query in case  of inequality -> {difficulty: 'easy', duration: {gte : 5}} here $ sign is not present so we have to put this sign 
      */
      let queryStr = JSON.stringify(queryObj)
      queryStr= queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
      // console.log(JSON.parse(queryStr));
      this.query=this.query.find(JSON.parse(queryStr))
      return this
    }
    sort(){
      if(this.queryString.sort){
        // query = query.sort(req.query.sort) //it will sort in ascending order , if you want in descending order then put '-' sign before the property while making the query
        //if you want to sort by multiple properties then you have to put space between them before passing them to sort function but we can't use space in url therefore we seperate them through ',' and here we split the query properties with space
        const sortBy = this.queryString.sort.split(',').join(' ')
        this.query = this.query.sort(sortBy)
        
      }
      else{
        this.query = this.query.sort('-createdAt')
      }
      return this
    }
    limitFields(){
      if(this.queryString.fields){
        const fields = this.queryString.fields.split(',').join(' ')
        this.query = this.query.select(fields)
      }
      else{
        this.query = this.query.select('-__v') // we can also set the select property to false in the schema
      }
      return this
    }
    paginate(){
      const page = this.queryString.page*1 || 1 // multiply by 1 to convert string into number
      const limit = this.queryString.limit*1 || 100 // it is no. of objects per page
      const skip = (page-1)*limit
      this.query = this.query.skip(skip).limit(limit)
  
      // if(this.queryString.page){
      //   const numTours = await Tour.countDocuments()
      //   if(skip>= numTours) throw new Error('This page does not exists')
      // }
      return this
    }
  };
  module.exports = APIFeatures