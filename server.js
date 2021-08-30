if(process.env.NODE_ENV!== 'production'){
    require('dotenv').config();     
}

const  jwt = require('jsonwebtoken');

const express = require('express')
const app = express()
app.use(express.json());

const bcrypt=require("bcrypt");
// importing mongodb
const mongodb=require("mongodb");

var ObjectId = require('mongodb').ObjectID; 

//The MongoClient class is where the initial connection to the MongoDB server is defined.
const mongoClient=mongodb.MongoClient; 


//here we are fetching runtime PORT ,if not hardcoded port number
const port=process.env.PORT || 3000;
//here we are trying to fetch databse url from environment variable
const dburl=process.env.DATABASE_URL || "mongodb://127.0.0.1:27017";



// The get method is bydefault method it is used to fetch the data from the database
app.get('/',authenticate,async(req,res)=>{
    try{
        // connecting mongodb using mongodb driver which is mongoclient , not to get any error in old versions of mongodb we mention
       // useunifiedtopology as true
        let clientInfo=await mongoClient.connect(dburl,{useUnifiedTopology: true });

         // getting coonected to db name Movies Db Data
        let db=clientInfo.db("MoviesDb");

        //fetching the particular data from collection which matches the given query
        let data=await db.collection("movieslist").find({}).toArray();

       // if success data is sent to server
        res.status(200).json(data);

        //closing the mongodb connection
        clientInfo.close();
    }
    catch(error){  // it displays the error if any error oocurs or exception occurs
        console.log(error);
    }

 })




 //The post method is used to insert the data or import the data into mongodb
 app.post("/MovieDetails",async(req,res)=>{
    try{
        // connecting mongodb using mongodb driver which is mongoclient , not to get any error in old versions of mongodb we mention
       // useunifiedtopology as true
        let client=await mongoClient.connect(dburl,{useUnifiedTopology: true });

         // getting coonected to db name Movies Db Data
        let db=client.db("MoviesDb");

           //inserting the Movies related details
        await db.collection("movieslist").insertMany(req.body);

        // if success data is inserted into database and message is displayed
        res.status(200).json({message:"MovieDetails posted successfuly"});

        
        //closing the mongodb connection
        client.close();
    }
    catch(error){           // it displays the error if any error oocurs or exception occurs
        console.log(error);
    }

   
});




//Authentication Registration API

app.post('/register',async(req,res)=>{
    try{
   
       // connecting mongodb using mongodb driver which is mongoclient , not to get any error in old versions of mongodb we mention
       // useunifiedtopology as true
       let clientInfo=await mongoClient.connect(dburl,{useUnifiedTopology: true });
   
          // getting coonected to db name Movies Db Data
          let db=clientInfo.db("MoviesDb");
   
         // fetchig email id and verifying whether it exists or not
       let dataFound=await db.collection("users").findOne({email:req.body.email});
           if(dataFound){
               res.status(400).json({message:"User already exists!!"})
           }
           else{
               // encypting the password and storing into the database
               let salt=await bcrypt.genSalt(10);
               let hash=await bcrypt.hash(req.body.password,salt);
               req.body.password=hash;
               await db.collection("users").insertOne(req.body);
               res.status(200).json({message:"User registered Successfully!!"});
              }
              clientInfo.close();
          }
    
           catch(error)  // if any error it displays the error
           {
               console.log(error);
           }
       });






  //    User Login Api

  app.post("/login",async(req,res)=>{

    try{
        // connecting mongodb using mongodb driver which is mongoclient , not to get any error in old versions of mongodb we mention
       // useunifiedtopology as true
        let clientInfo=await mongoClient.connect(dburl,{useUnifiedTopology: true });

      // getting coonected to db name Movies Db Data
         let db=clientInfo.db("MoviesDb");

         
      // fetchig email id matched data and verifying whether it exists or not
        let data=await db.collection("users").findOne({email:req.body.email});
        if(data){
            // decypting the password and comapring it, which fianlly returns the boolean value
            let isValid=await bcrypt.compare(req.body.password,data.password);
                if(isValid)
                {
                    let token=await jwt.sign({user_id:data._id},process.env.JWT_KEY);
                    res.status(200).json({message:"login successfull"});
                }
                else{
                    res.status(400).json({message:"login unsuccessfull"})
                }
        }
        else{
            res.status(404).json({message:"user not registred"});
        }
    }
        catch(eeror){
            console.log(error);
        }
    })

async function authenticate(req,res,next){
    
            if(req.headers.authorization!==undefined)
            {
                    jwt.verify(
                        req.headers.authorization,
                        process.env.JWT_KEY,
                        (err,decode)=>{
                                if(decode!==undefined)
                                {
                                    next();
                                }
                                else{
                                    res.status(401).json({message:"invalid token"});
                                }
                        }
                    );
            
            }
        else{
            res.status(401).json({message:"No token in headers"});
        }


app.listen(port);
