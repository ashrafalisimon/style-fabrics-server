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
  const authorization =req.headers.authorization;
  if(!authorization){
    return res.status(401).send({message: 'UnAuthorization access'});
  }
  const token = authorization.split(' ')[1];
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
        const reviewCollection = client.db("style-fabrics").collection("reviews");




        app.get('/product', async(req, res)=>{
            const query = {}
            const cursor =  productCollection.find(query);
            const products= await cursor.toArray()
            res.send(products); 
        });

        app.post('/product', async(req,res)=>{
          const review = req.body;
          const result = await productCollection.insertOne(review);
          res.send(result);
        });

         /*
        * review api
        */ 
       app.get('/review', async(req,res)=>{
         const query ={};
         const cursor= reviewCollection.find(query);
         const reviews = await cursor.toArray();
         res.send(reviews);
       });

       app.post('/review', async(req,res)=>{
         const review = req.body;
         const result = await reviewCollection.insertOne(review);
         res.send(result);
       });


        /*
        * user api
        */  

        app.get('/user',verifyJWT, async(req,res)=>{
          const users = await userCollection.find().toArray();
          res.send(users);
        });

        app.get('/user/:email', async(req,res)=>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          res.send(user) 
        })


        app.get('/admin/:email', async(req, res) =>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin})
        });

        
        app.put('/user/admin/:email',verifyJWT, async(req,res)=>{
            const email = req.params.email;
            const requester =req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
              const filter ={email: email};
              const updateDoc= {
                $set:{role:'admin'}
              }
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            }
            else{
              res.status(403).send({message: 'forbidden'})
            }
           
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
         const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
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
         app.get('/allOrder', async(req, res)=>{
          const query = {}
          const cursor =  orderCollection.find(query);
          const allOrders= await cursor.toArray()
          res.send(allOrders); 
      });
         
        app.get('/order',verifyJWT, async(req,res)=>{
          const user= req.query.user;
          const decodedMail = req.decoded.email;
          if(user===decodedMail){
            const query = {user:user}
            const orders = await orderCollection.find(query).toArray();
            return res.send(orders);  
          }
          else{
            return res.status(403).send({message: 'Forbidden Access'})
          }
        });

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