const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port =  process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asxnk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const productCollection = client.db("style-fabrics").collection("products");
        const orderCollection = client.db("style-fabrics").collection("orders");

        app.get('/product', async(req, res)=>{
            const query = {}
            const cursor =  productCollection.find(query);
            const products= await cursor.toArray()
            res.send(products); 
        });

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
        app.get('/order', async(req,res)=>{
          const user= req.query.user; 
          const query = {user:user}
          const cursor =  orderCollection.find(query);
          const orders= await cursor.toArray()
          res.send(orders); 

          // const user= req.query.user; 
          // const query ={user:user};
          // const orders = await orderCollection.find(query).toArray();
          // res.send(orders);
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