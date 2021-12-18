const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// USE MIDDLEWARE

app.use(cors());
app.use(express.json());

// FIREBASE Service Account

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// CONNECT WITH MONGODB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2xoju.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyJwtToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const jwt = req.headers.authorization.split(' ')[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(jwt);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }

  next();
}

async function run() {
  try {
    client.connect();
    const database = client.db(`${process.env.DB_NAME}`);
    const productCollection = database.collection('products');
    const reviewCollection = database.collection('reviews');
    const orderCollection = database.collection('orders');
    const userCollection = database.collection('users');

    /* 
    
        ===============================================

                       ALL GET API START

        ===============================================
    
    */

    // GET ALL PRODUCTS

    app.get('/all-products', async (req, res) => {
      const cursor = productCollection.find({});
      const products = await cursor.toArray();
      res.json(products);
    });

    // GET A SINGLE PRODUCT BY ID

    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.json(result);
    });

    /* 
    
        ===============================================

                       ALL GET API END

        ===============================================
    
    */

    /* 
    
        ===============================================

                       ALL POST API START

        ===============================================
    
    */

    /* 
    
        ===============================================

                       ALL POST API END

        ===============================================
    
    */

    /* 
    
        ===============================================

                       ALL PUT API START

        ===============================================
    
    */

    /* 
    
        ===============================================

                       ALL PUT API END

        ===============================================
    
    */

    /* 
    
        ===============================================

                       ALL DELETE API START

        ===============================================
    
    */

    /* 
    
        ===============================================

                       ALL DELETE API END

        ===============================================
    
    */
  } finally {
    // client.close()
  }
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('Welcome to Mobile Store Server API'));
app.listen(port, () => console.log(`Server Running on localhost:${port}`));
