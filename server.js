const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const PORT = 5501;

app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname__, '/src/index.html'));
});

app.listen(PORT);
console.info(`Server running on http://localhost:${PORT}/`);