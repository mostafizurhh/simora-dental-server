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




const uri = "mongodb+srv://<username>:<password>@cluster0.mniec4l.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
});
