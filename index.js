const express = require('express')
const app = express()
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()
const { MongoClient } = require('mongodb');
const port = process.env.PORT|| 5000;




app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.orb6q.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// console.log(uri)

async function verifyToken(req, res, next) {
   if (req.headers?.authorization?.startsWith('Bearer')) {
       const token = req.headers.authorization.split(' ')[1];

       try {
           const decodedUser = await admin.auth().verifyIdToken(token);
           req.decodedEmail = decodedUser.email;
       }
       catch {

       }

   }
   next();
}

async function run(){
try{
 await client.connect();
 const database = client.db("doctors_portal");
 const appointmentsCollection = database.collection("appointments");
 const usersCollection = database.collection("users");
 const addDoctorsCollection = database.collection("addDoctor");


 app.get('/appointments', async(req, res) =>{
  const email = req.query.email;  /*filtering process*/
  const date = new Date(req.query.date). toLocaleDateString();
  // console.log(date); 
  const query = {email: email, date: date}
  // console.log(query)
   const cursor = appointmentsCollection.find(query);
   const appointments = await cursor.toArray();
   res.json(appointments);
 });


 app.post('/appointments', async(req, res) =>{
    const appoinment = req.body;
    const result = await appointmentsCollection.insertOne(appoinment);
    console.log(result);
    res.json(result);
 });

 app.get('/users/:email', async(req,res) =>{
    const email = req.params.email;
    const query = {email:email};
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if(user?.role === 'admin'){
      isAdmin = true;
    }
    res.json({admin: isAdmin});
 });

 app.post('/users', async(req,res) =>{
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    console.log(result);
    res.json(result);
 });

 app.put('/users', async(req,res) =>{
    const user = req.body;
   //  console.log('put', user);
    const filter = { email: user.email};
    const options = {upsert: true};
    const updateDoc = {$set: user};
    const result = await usersCollection.updateOne(filter,updateDoc, options);
    res.json(result);
 });

 app.put('/users/admin', verifyToken, async (req, res) => {
   const user = req.body;
   const requester = req.decodedEmail;
   if (requester) {
       const requesterAccount = await usersCollection.findOne({ email: requester });
       if (requesterAccount.role === 'admin') {
           const filter = { email: user.email };
           const updateDoc = { $set: { role: 'admin' } };
           const result = await usersCollection.updateOne(filter, updateDoc);
           res.json(result);
       }
   }
   else {
       res.status(403).json({ message: 'you do not have access to make admin' })
   }

})

// get api
app.get('/addDoctor', async(req, res)=>{
  const cursor = addDoctorsCollection.find({});
  const addDoctor = await cursor.toArray();
  res.send(addDoctor);
})

//post api
app.post('/addDoctor', async(req, res)=>{
  const addDoctor = req.body;
   console.log('hit the post api', addDoctor);

   const result = await addDoctorsCollection.insertOne(addDoctor);
   console.log(result);
   res.json(result)

  }) ;

  //get single dentist
    app.get('/addDoctor/:id', async(req, res) =>{
      const id = req.params.id;
      console.log('getting specific service', id)
      const query = {_id: ObjectId(id)};
      const addDoctor = await addDoctorsCollection.findOne(query);
      res.json(addDoctor);
    })

}
finally{
//  await client.close();
}
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World from doc relife!')
})

app.listen(port, () => {
  console.log(`listening port ${port}`)
})



// app.get('/users')
// app.post('/users')
// app.get('/users/:id')
// app.put('/users/:id');
// app.delete('/users/:id')
// users: get
// users: post