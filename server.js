const mongoose = require('mongoose')
const dotenv = require('dotenv');
process.on('uncaughtException', err =>{
  console.log(err.name,err.message)
  process.exit(1)
})
dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)
mongoose.connect(DB,{
  useCreateIndex:true,
  useNewUrlParser:true,
  useFindAndModify:false
}).then(()=>{
  console.log("db connected succesfully!");
})

// const testTour = new Tour({
//   name:"The Forest Hiker",
//   rating:4.9,
//   price:566
// })
// testTour.save().then((doc)=>{
//   console.log(doc);
// }).catch((err)=>{
//   console.log('ERROR',err);
// })



const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection',err =>{
  console.log(err.name,err.message)
  server.close(()=>{
    process.exit(1)
  })
})

