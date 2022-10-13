const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const api = require('./api');
const checker = require('./checker');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', api)

app.use(express.static(path.join(__dirname, 'front/build')))

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'front/build/index.html'))
});

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'front/build/index.html'));
});

app.listen(8000, function () {
    console.log('8000 port is listening!')
})