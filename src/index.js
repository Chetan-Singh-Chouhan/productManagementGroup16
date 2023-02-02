const express = require('express');
const route = require('./routes/route.js');
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose');
const multer=require("multer")

app.use(bodyParser.json());
app.use(multer().any())
mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://Chetan_ProjectClustor:PNr1Fn8OcRu2cGmk@project1.h4p8xqh.mongodb.net/group16Database", { useNewUrlParser: true })
    .then(() => console.log("Mongo db is connected"))
    .catch(err => console.log(err))
app.use('/', route);

app.listen(3000, function () {
    console.log('Express app running on port ' + 3000)
});
