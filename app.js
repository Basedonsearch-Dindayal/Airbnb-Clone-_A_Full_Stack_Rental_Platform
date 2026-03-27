if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("./utils/flash.js");
const passport = require("passport");
const LocalStrategy = require("passport-local")
const User = require("./models/user.js")

// Import Routes
const listingRouter = require("./routes/listings");
const reviewRouter = require("./routes/reviews");
const userRouter = require("./routes/user.js");

// MongoDB Connection
const dbUrl = process.env.ATLASDB_URL;
async function connectDatabase() {
    if (!dbUrl) {
        const msg = "ATLASDB_URL is not set.";
        if (process.env.NODE_ENV === "production") {
            throw new Error(msg);
        }
        console.error(`${msg} Running without database connection in development.`);
        return;
    }

    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        console.error("Verify ATLASDB_URL host/credentials and DNS settings.");
    }
}

connectDatabase();

app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionSecret = process.env.SECRET || "dev-insecure-secret";
if (!process.env.SECRET && process.env.NODE_ENV === "production") {
    console.warn("SECRET is not set. Using fallback secret is insecure.");
}

let store;
if (dbUrl) {
    store = MongoStore.create({
        mongoUrl: dbUrl,
        crypto: {
            secret: sessionSecret,
        },
        touchAfter: 24 * 3600,
        mongoOptions: {
            serverSelectionTimeoutMS: 5000,
        },
    });

    store.on("error", (err) => {
        console.error("ERROR IN MONGO SESSION STORE", err.message);
    });
}

const sessionOptions = {
    secret : sessionSecret,
    resave : false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    },
};

if (store) {
    sessionOptions.store = store;
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// Use Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


// Catch-all Route for 404 Errors
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something Went Wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

//port config
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
