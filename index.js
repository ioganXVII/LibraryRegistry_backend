const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.port || 3000

const librariesRouter = require('./routes/libraries.routes');
const logRouter = require('./routes/logs.routes');

app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  next();
});
app.use('/api', librariesRouter, logRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})