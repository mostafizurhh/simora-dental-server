/* API naming convention or (CRUD) operation for ex. booking collection:::::>>>>:::

(READ) app.get('/booking') >>> to load all booking data
(READ) app.get('/booking/:id) >>> to load a specific booking data
(CREATE) app.post(/booking) >>> to add a new document/object inside booking collection
(UPDATE) app.patch('/booking/:id) >>> to partially edit a specific booking data
(UPDATE) app.put('/booking/:id) >>> to edit/replace a specific booking data
(DELETE) app.delete('/booking/:id) >>> to delete a specific booking data
*/


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

        /* (CREATE) create/get single data from client side and create a collection in mongoDB under initial DB from that data */
        const bookingCollection = client.db('simora').collection('userBooking')

        app.post('/booking', async (req, res) => {
            const booking = req.body; //get booking data
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })
    }
    finally {

    }

}
run().catch(console.log)