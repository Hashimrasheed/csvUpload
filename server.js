const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./app/config/connection');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash')
const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 3000

const app = express();
app.use(flash())
app.use(fileUpload());
app.use(express.static('public'))

//database connection
db.connect((err) => {
    if(err) console.log("Connection failed" + err);
    else console.log("Database connected");
});


//user session
app.use('/user', session({
    name: 'userCookie',
    secret: 'usersecret',
    store: new MongoStore({
         url: 'mongodb://localhost:27017/jobBoard',
         collection: 'userSession'
    }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

//admin session
app.use('/admin', session({
    name: 'adminCookie',
    secret: 'adminsecret',
    store: new MongoStore({
         url: 'mongodb://localhost:27017/jobBoard',
         collection: 'adminSession'
    }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

// locals middlewares
app.use('/user', (req, res, next) => {
      res.locals.usersession = req.session.user;
    next();
});

//view engine setup
app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')

//body parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.redirect('/user')
});
// app.use('/user', jobseekerRouter);
// app.use('/admin', adminRouter);


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
})