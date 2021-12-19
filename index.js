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

    // GET ALL ORDERs AND FILTER ALSO

    app.get('/all-orders', async (req, res) => {
      let query = {};
      const email = req.query.email;
      console.log(email);
      if (email) {
        query = { email };
      }
      const cursor = orderCollection.find(query);
      const allOrders = await cursor.toArray();
      res.json(allOrders);
    });

    // GET ADMIN OR NOT?

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'Admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
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

    // POST A SINGLE PRODUCT

    app.post('/add-product', async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.json(result);
    });

    // POST A SINGLE ORDER

    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    // POST A USER

    app.post('/user', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.json(result);
    });

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

    // PUT USER

    app.put('/user', async (req, res) => {
      const user = req.body;
      const filter = { user: user.email };
      const option = { upsert: true };
      const updateUser = { $set: user };
      const result = await userCollection.updateOne(filter, updateUser, option);
      res.json(result);
    });

    // PUT admin & check with JWT Token  he/she is admin or not ?

    app.put('/user/admin', verifyJwtToken, async (req, res) => {
      const newAdmin = req.body;
      const email = req.decodedEmail;
      if (email) {
        const requester = await usersCollection.findOne({ email });
        if (requester.role === 'Admin') {
          const filter = { email: newAdmin.email };
          const updateUser = { $set: { role: 'Admin' } };
          const result = await usersCollection.updateOne(filter, updateUser);
          res.json(result);
        }
      } else {
        req.status(401).json({ message: 'You do not have access to make admin' });
      }
    });

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
