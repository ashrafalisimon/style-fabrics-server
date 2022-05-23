const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.asxnk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const productCollection = client.db("style-fabrics").collection("products");

        app.get('/product', async(req, res)=>{
            const query = {}
            const cursor =  productCollection.find(query);
            const products= await cursor.toArray()
            res.send(products); 
        })
    }
    finally{}
    
}
run().catch(console.dir())

app.get('/', (req, res) => {
  res.send('Hello World!, Welcome to style fabrics app...')
})

app.listen(port, () => {
  console.log(`Style Fabrics app listening on port ${port}`)
})