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

            /* use Aggregate to query multiple collection and then merge data */

            /* get all bookings for the selected date */
            const date = req.query.date;
            // console.log(date)
            const bookingQuery = { bookingDate: date }
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

            /* find already booked time slots for each day and for each treatmentName  */
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatmentName === option.name);
                const bookedSlots = optionBooked.map(book => book.slot)

                /* find remaining time slots for each day for each treatmentName */
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots
                // console.log(date, option.name, remainingSlots.length)
            })

            res.send(options);
        })


        /* (CREATE) create/get single data from client side and create a collection in mongoDB under initial DB from that data */
        const bookingCollection = client.db('simora').collection('userBooking')

        app.post('/booking', async (req, res) => {
            const booking = req.body; //get booking data
            console.log(booking);

            /* limit 1 booking per user, per treatmentName/service, per day  */
            const query = {
                bookingDate: booking.bookingDate,
                treatmentName: booking.treatmentName,
                email: booking.email
            }

            const alreadyBooked = await bookingCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a bookiong on ${booking.bookingDate} for ${booking.treatmentName}`;
                return res.send({ acknowledged: false, message });
            }
            /*-------------------------------------------*/

            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })

        /* get specific user's booking from DB and show on UI */
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email: email };
            const userBooking = await bookingCollection.find(query).toArray();
            res.send(userBooking)
        });

        /* get data from client side and save to DB 'simora' in 'userCollection' */
        const usersCollection = client.db('simora').collection('users')
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.log)