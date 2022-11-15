const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();

/* middleware */
app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('Server is running...........')
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


/* mongodb connection */
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mniec4l.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


/* mongodb CRUD operation */

async function run() {
    try {
        /* create DB in mongoDB */
        const appoinmentOptionsCollection = client.db('simora').collection('AppoinmentOptions');

        /* (READ) get data from mongoDB server */
        app.get('/AppoinmentOptions', async (req, res) => {
            const query = {};
            const options = await appoinmentOptionsCollection.find(query).toArray();
            res.send(options);
        })

    }
    finally {

    }
}

run().catch(console.log)