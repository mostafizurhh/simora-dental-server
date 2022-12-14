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
require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
// const sgmail = require('@sendgrid/mail');
// var sgTransport = require('nodemailer-sendgrid-transport');
const mg = require('nodemailer-mailgun-transport');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")("sk_test_51M5xTOEjKmhiTrYBMHYiby5C3o2rP0RApy4qROYcuPMbgY8V97lON3nzB1No7YQRkn4uhxR3T4byVuwRPOyk7yuc000dfIMeod")

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

/* create JWT verification middleware/function to verify JWT*/
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('Unauthorized Access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next()
    })
}

/* Create transporter for nodemailer to send email to user */
function sendBookingEmail(booking) {
    const { email, treatmentName, bookingDate, slot } = booking;

    /* MailGun */
    const auth = {
        auth: {
            api_key: process.env.SEND_EMAIL_API_KEY,
            domain: process.env.SEND_EMAIL_DOMAIN
        }
    }
    const transporter = nodemailer.createTransport(mg(auth));
    /* *************************************************** */


    //     sgmail.setApiKey(process.env.SENDGRID_API_KEY)
    //     const msg = {
    //         to: email,
    //         from: 'mostafizur.iubat.eee@gmail.com',
    //         subject: `Booking Confirmation for ${treatmentName}`,
    //         html: `
    //          <h3>Your Booking is confirmed</h3>
    //          <div>
    //          <p>Your appoinment for ${treatmentName} on ${bookingDate} at ${slot} is confirmed. Please try to be presnet at our office 15 minutes earlier from your booking time.</p>
    //         <p>If you have any concern don't hesitate to contact us at +8801725353614</p>
    //          <p>Have a lovely day.</p>
    //          <p>Thanks for being connected with Simora Dental</p>
    //          </div> 
    //          `
    //     }

    //     sgmail
    //         .send(msg)
    //         .then(() => { console.log('Email Sent') })
    //         .catch((e) => console.error(e))
    // const options = {
    //     auth: {

    //         api_key: process.env.SENDGRID_API_KEY
    //     }
    // }

    // const transporter = nodemailer.createTransport(sgTransport(options));

    // let transporter = nodemailer.createTransport({
    //     host: 'smtp.sendgrid.net',
    //     port: 587,
    //     auth: {
    //         user: "apikey",
    //         pass: process.env.SENDGRID_API_KEY
    //     }
    // });

    transporter.sendMail({
        from: 'mostafizur.iubat.eee@gmail.com', // verified sender email
        to: email, // recipient email
        subject: `Booking Confirmation for ${treatmentName}`, // Subject line
        text: "Hello world!", // plain text body
        html: `
        <h3>Your Booking is confirmed</h3>
        <div>
        <p>Your appoinment for ${treatmentName} on ${bookingDate} at ${slot} is confirmed. Please try to be presnet at our office 15 minutes earlier from your booking time.</p>
        <p>If you have any concern don't hesitate to contact us at +8801725353614</p>
        <p>Have a lovely day.</p>
        <p>Thanks for being connected with Simora Dental</p>
        </div> 
        `, // html body
    }, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}



/* mongodb connection */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mniec4l.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


/* mongodb CRUD operation */

async function run() {
    try {
        /* Create verifyAdmin middleware/function */
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(401).send({ message: 'Unauthorized Access' })
            }
            next()
        }

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

        /* insert price field to database in appoinmentOptionsCollection */
        // app.get('/addPrice', async (req, res) => {
        //     const query = {};
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             price: 99
        //         }
        //     }
        //     const result = await appoinmentOptionsCollection.updateMany(query, updatedDoc, options)
        //     res.send(result)
        // })

        /* (READ get all services/appoinmentOptions as speciality */
        app.get('/specialities', async (req, res) => {
            const query = {};
            const result = await appoinmentOptionsCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })


        /* (CREATE) create/get single data from client side and create a collection in mongoDB under initial DB from that data */
        const bookingCollection = client.db('simora').collection('userBooking')

        app.post('/booking', async (req, res) => {
            const booking = req.body; //get booking data
            // console.log(booking);

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
            /*-----------------------------------------*/

            const result = await bookingCollection.insertOne(booking);
            /* send booking confirmation email to user */
            sendBookingEmail(booking)
            res.send(result)
        })

        /* (READ) get specific user's booking from DB and show on UI and verify JWT token*/
        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log(email);
            const decodedEmail = req.decoded.email;
            // console.log(decodedEmail)
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' });
            }

            const query = { email: email };
            const userBooking = await bookingCollection.find(query).toArray();
            res.send(userBooking)
        });

        /* (READ) get single booking info of a service of a user */
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.findOne(query);
            res.send(result);
        })

        /* delete a booking */
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })


        /* (READ) create JWT token API from client side info */
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            // console.log(user)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ token: '' })
        })


        /* (CREATE) create/get individual user data from client side and save to DB 'simora' in 'userCollection' */
        const usersCollection = client.db('simora').collection('users');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        /* (READ) get all registered users data */
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        /* (UPDATE) update Admin role for a user by creating an API and verifyJWT */
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        /* (DELETE) delete users data */
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        /* (READ) API to check if a user is admin or not */
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        /* (CREATE) create doctorsCollection and insert data into it from client side */
        const doctorsCollection = client.db('simora').collection('doctors');

        app.post('/doctors', verifyJWT, verifyAdmin, async (req, res) => {
            const doctor = req.body;
            const result = await doctorsCollection.insertOne(doctor);
            res.send(result);
        })

        /* (READ) get all doctors data from DB */
        app.get('/doctors', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const result = await doctorsCollection.find(query).toArray();
            res.send(result);
        })

        /* (DELETE) delete a doctor from server and DB by client side command */
        app.delete('/doctors/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await doctorsCollection.deleteOne(query);
            res.send(result);
        })

        /* create Payment collection to save users payment info */
        const usersPaymentCollection = client.db('simora').collection('userPayments');

        /* crete API for stripe */
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            });
        })

        app.post('/userPayments', async (req, res) => {
            const payment = req.body;
            const result = await usersPaymentCollection.insertOne(payment);
            const id = payment.bookingId;
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(query, updatedDoc);
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(console.log)