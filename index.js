const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port =  process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asxnk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req,res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'UnAuthorization access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
    try{
        await client.connect();
        const productCollection = client.db("style-fabrics").collection("products");
        const orderCollection = client.db("style-fabrics").collection("orders");
        const userCollection = client.db("style-fabrics").collection("users");

        app.get('/product', async(req, res)=>{
            const query = {}
            const cursor =  productCollection.find(query);
            const products= await cursor.toArray()
            res.send(products); 
        });

        /*
        * user api
        */  

        app.get('/user', async(req,res)=>{
          const users = await userCollection.find().toArray();
          res.send(users);
        });

       app.put('/user/:email', async(req,res)=>{
         const email =req.params.email;
         const user = req.body;
         const filter = {email: email};
         const options ={upsert: true};
         const updateDoc = {
           $set: user
         };
         const result = await userCollection.updateOne(filter, updateDoc, options);  
         const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECETE, { expiresIn: '1h' });
         res.send({result, token});
       })

        /*
        * available api
        */  
        app.get('/available', async (req, res) => {
          const producted = await productCollection.find().toArray();
          const query = {};
          const ordered = await orderCollection.find(query).toArray();
          producted.forEach(product => {
            const productOrder = ordered.filter(order => order.productName === product.productName);
             const bookedQuantity = productOrder.map(orderQty=> parseInt(orderQty.quantity));
              if(bookedQuantity[0] == null){
                product.availableQuantity;
              }else{
                const available = parseInt(product.availableQuantity)-bookedQuantity[0];
                product.availableQuantity = available;
              }
          });
    
          res.send(producted);
        })

         /*
        * order api
        */    
        app.get('/order',verifyJWT, async(req,res)=>{
          const user= req.query.user; 
          const decodedEmail = req.decoded.email;
          if(patient === decodedEmail){
            const query = {user:user}
            const cursor =  orderCollection.find(query);
            const orders= await cursor.toArray()
            return res.send(orders); 
          }
          else{
            return res.status(403).send({message: 'Forbidden access'})
          }
        })

       app.post('/order', async(req,res)=>{
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);
      });

    }
    finally{}  
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!, Welcome to style fabrics app...');
})

app.listen(port, () => {
  console.log(`Style Fabrics app listening on port ${port}`)
})