const fs = require('fs')
const Tour = require('./../../models/tourModel');

const mongoose = require('mongoose')
const dotenv = require('dotenv');


dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)
mongoose.connect(DB,{
  useCreateIndex:true,
  useNewUrlParser:true,
  useFindAndModify:false
}).then(()=>{
  console.log("db connected succesfully!");
})

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'))
const importData = async()=>{
    try {
        await Tour.create(tours)
        console.log("imported successfully!");
        process.exit()
    } catch (error) {
        console.log(error);
    }
    
}
const deleteData = async()=>{
    try {
        await Tour.deleteMany()
        console.log("deleted successfully!");
        process.exit()
    } catch (error) {
        console.log(error);
    }
    
}
console.log(process.argv)
if(process.argv[2] == '--import'){
    importData()
}
if(process.argv[2]== '--delete'){
    deleteData();
}