const express = require('express')
const app = express.Router();
const userController = require('../app/http/controllers/userController')


app.get("/generate", userController().generate)
app.get('/', userController().home);
app.get('/csv/:id', userController().singleFile);

app.post('/addfile/:id', userController().addfile)


module.exports = app