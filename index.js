const express = require('express')
const app = express()
const cors = require('cors')
const mongoose=require('mongoose')
const bodyParser = require("body-parser");

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema=new mongoose.Schema({
  username:{
    type:String,
    required:true
  }
});
const exerciseSchema= new mongoose.Schema({
  userId:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,
    required:true
  },
  date:Date
});

let User=mongoose.model('User',userSchema);
let Exercise=mongoose.model('Exercise',exerciseSchema);


app.post('/api/users',(req,res)=>{
  const userNameBody=req.body.username;
  User.find({username:userNameBody}).exec().then((data)=>{
    if(data.length!==0)
      {
        res.json({
          username:data[0].username,
          _id:data[0]._id
        });
      }
      else
      {
        new User({
          username:userNameBody
        })
        .save()
        .then(data=>{
          res.json({
            username:data.username,
          _id:data._id
          })
          
        })
      }
  })
});

app.post('/api/users/:_id/exercises',(req,res)=>{
  const idBody=req.params._id;
  const {description,duration}=req.body;
  const date=(req.body.date==='')||req.body.date===undefined? new Date():new Date(req.body.date.split('-'));
  User.findById(idBody).then(dataFind=>{
              if(dataFind.length===0)
                {
                  res.json({error:'id doesnt exist'})
                }
              else
                {
                    new Exercise({
                      userId:idBody,
                      description:description,
                      duration:parseInt(duration),
                      date:date.toDateString()
                    }).save()
                      .then(data=>{
                        
                        res.json({
                          _id:data.userId,
                          username:dataFind.username,
                          date:data.date.toDateString(),
                          duration:data.duration,
                          description:data.description
                        })
                      }).catch(err => {
                          res.json(err)
                      })
                }
        })
});

app.get('/api/users',(req,res)=>{
  User.find({}).then(data=>{
    res.json(data)
  })
});

app.get('/api/users/:_id/logs',(req,res)=>{
  console.log(req.query)
  const idUser=req.params._id;
  const {to}=req.query;
  const limit=req.query.limit===undefined?'':req.query.limit;
  let query={userId:idUser};
  if (req.query.from!==undefined && req.query.to!==undefined)
     query={userId:idUser,
          date:  {$gte:new Date((req.query.from.split("-"))),
                   $lte:new Date((req.query.to.split("-")))
                  }}
    
  console.log(query)
  console.log(idUser)
  User.findById(idUser).then(data=>{
    if(data===null)
      {
        res.json({error:"userId doesnt exist "})
      }
    else 
    {
      Exercise.find(query).sort({date:-1}).limit(limit).select({_id:0,description:1,duration:1,date:1})
            .then((dataE)=>{
              console.log({
                
                username:data.username,
                count:dataE.length,
                _id:idUser,
                log:dataE
              })
              let resultD=[];
              dataE.map((log)=>{resultD.push({description:log.description,duration:log.duration,date:log.date.toDateString()})});
              res.json({
                username:data.username,
                count:dataE.length,
                _id:idUser,
                log:resultD
              })
            })
            }
  })
});


app.get('/api/users/:_id/logs')

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
