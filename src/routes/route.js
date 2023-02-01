const express = require('express');
const router = express.Router();



//url's

router.all('/*', function (req, res) {
    res.status(404).send({ status: false, message: 'page not found' });
});

module.exports = router