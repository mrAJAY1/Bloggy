require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const createError = require('http-errors');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const flash = require('req-flash');
const mongoose = require('mongoose');

const db = mongoose.connection;

mongoose.connect(
  'mongodb+srv://bloggy:mrAJAY1@cluster0.fo34uzm.mongodb.net/bloggy?retryWrites=true&w=majority&appName=Cluster0'
);

// eslint-disable-next-line no-console
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', () => {
  // eslint-disable-next-line no-console
  console.log('Connected successfully');
});

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
});

const adminRouter = require('./routes/admins');
const usersRouter = require('./routes/users');

const app = express();
const cookieExp = 7 * 24 * 60 * 60 * 1000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    name: 'CookieSaved',
    secret: process.env.Session_Secret_Key,
    cookie: {
      maxAge: cookieExp,
    },
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash({ locals: 'flash' }));

app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
