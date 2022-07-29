const path = require('path');
const express = require('express');
const app = express();

const PORT = 5501;

app.use(express.static(__dirname + '/src/'));

app.get('/', (req, res) => {
    res.status(200).sendFile(__dirname + '/src/index.html');
});

app.listen(PORT);
console.info(`Server running on http://localhost:${PORT}/`);