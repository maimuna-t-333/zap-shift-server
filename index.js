const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config();


const stripe = require('stripe')(process.env.PAYMENT_GATEWAY_kEY)

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
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

const { ObjectId } = require("mongodb");

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const database = client.db("zap-shift-user");
        const parcelsCollection = database.collection("parcels");

        app.get('/parcels', async (req, res) => {
            try {
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

        app.delete('/parcels/:id', async (req, res) => {
            try {
                const { id } = req.params;



                // Delete the parcel
                const result = await parcelsCollection.deleteOne({ _id: new ObjectId(id) });


                res.json(result);
            } catch (error) {
                console.error('Error deleting parcel:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        // GET: Get a specific parcel by ID
        app.get('/parcels/:id', async (req, res) => {

            try {

                const id = req.params.id;


                const parcel = await parcelsCollection.findOne({ _id: new ObjectId(id) });

                if (!parcel) {
                    return res.status(404).send({ message: 'Parcel not found' });
                }

                res.send(parcel);
            } catch (error) {
                console.error('Error fetching parcel:', error);
                res.status(500).send({ message: 'Failed to fetch parcel' });
            }
        });


        // app.post('/create-payment-intent', async (req, res) => {
        //     const amountInCents = req.body.amountInCents
        //     try {
        //         const paymentIntent = await stripe.paymentIntents.create({
        //             amount: amountInCents, // Amount in cents
        //             currency: 'usd',
        //             payment_method_types: ['card'],
        //         });

        //         res.json({ clientSecret: paymentIntent.client_secret });
        //     } catch (error) {
        //         res.status(500).json({ error: error.message });
        //     }
        // });

        app.post('/create-payment-intent', async (req, res) => {
            const { amount } = req.body;
            console.log('Creating payment intent with amount:', amount);

            if (!amount || isNaN(amount)) {
                return res.status(400).send({ message: 'Invalid amount' });
            }

            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: parseInt(amount),
                    currency: 'usd',
                    payment_method_types: ['card'],
                });

                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                console.error('Stripe error:', error);
                res.status(500).send({ message: error.message });
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