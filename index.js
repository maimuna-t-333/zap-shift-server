const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials:true,
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@xenpi.9qo9gbb.mongodb.net/?retryWrites=true&w=majority&appName=XenPi`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("zap-shift-user"); 
    const parcelsCollection = database.collection("parcels");

app.get('/parcels', async (req, res) => {
  try {
    // const createdBy = req.query.createdBy;
    // if (!createdBy) {
    //   return res.status(400).send({ message: "createdBy query parameter is required" });
    // }

    // const query = { created_by_email: createdBy };

    const options = {
      sort: { creation_date: -1 } // latest first
    };

    const parcels = await parcelsCollection
      .find({}, options)
      .toArray();

    res.send(parcels);
  } catch (error) {
    console.error('Error fetching parcels:', error);
    res.status(500).send({ message: 'Failed to fetch parcels' });
  }
});




    // POST route
    app.post('/parcels', async (req, res) => {
      try {
        const newParcel = req.body;
        const result = await parcelsCollection.insertOne(newParcel);
        res.status(201).send(result);
      } catch (error) {
        console.error('Error inserting parcel:', error);
        res.status(500).send({ message: 'Failed to create parcel' });
      }
    });

    // Only start listening AFTER DB is ready
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

run();




app.get('/', (req, res) => {
    res.send('Parcel server is running');
})

app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`)
})