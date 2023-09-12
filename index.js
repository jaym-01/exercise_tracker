const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bp = require('body-parser')

require('dotenv').config();

// connect to db
mongoose.connect(process.env.MONGO_URI);

// creates schemas
const userSchema = new mongoose.Schema({
    username: String
})

const exerciseSchema = new mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: Date,
    user_id: String
})

// create the models for the schema
const user = mongoose.model('user', userSchema);
const exercise = mongoose.model('exercise', exerciseSchema);

// user post endpoint
app.post("/api/users", bp.urlencoded({ extended: false }), (req, res) => {
    if (req.body != null && req.body.username != null && req.body.username.length > 0) {
        // check if user is present
        user.findOne({
            username: req.body.username
        }).exec()
            .then((data) => {
                if (data != null) {
                    res.json({
                        username: data.username,
                        _id: data.id
                    })
                }
                else {
                    // if not add new user
                    let newUser = new user({
                        username: req.body.username
                    });

                    newUser.save().then((data)=>{
                        res.json({
                            username: data.username,
                            _id: data._id
                        })
                    });
                }
            })
    }
});

app.get("/api/users", (req, res)=>{
    user.find({}).exec().then((data)=>{
        var items = []

        data.forEach(item=>{
            items.push({
                username: item.username,
                _id: item.id
            })
        })

        res.json(items);
    });
});

// exercise post endpoint
app.post("/api/users/:_id/exercises", bp.urlencoded({extended: false}), (req, res)=>{
    user.findById(req.params._id).exec().then((old_data)=>{
        // console.log(req.body.date);
        let add_date;
        
        add_date = new Date(req.body.date);
        
        if(add_date.toDateString() == "Invalid Date"){
            add_date = new Date();
        }

        const new_exercise = new exercise({
            username: old_data.username,
            description: req.body.description,
            duration: req.body.duration,
            date: add_date,
            user_id: req.params._id
        })

        new_exercise.save().then(data=>{
            res.json({
                username: old_data.username,
                description: data.description,
                duration: data.duration,
                date: data.date.toDateString(),
                _id: req.params._id
            })
        })
    })
});

// get data endpoint
app.get("/api/users/:_id/logs", (req, res)=>{

    user.findById(req.params._id).exec().then((user_data)=>{
        var reqObj = {user_id: req.params._id};
        var options = null;

        if(req.query.limit != null) options = {limit: parseInt(req.query.limit)}

        if(req.query.from != null || req.query.to != null){
            reqObj.date = {};

            if(req.query.from != null) reqObj.date.$gte = (new Date(req.query.from));
            if(req.query.to != null) reqObj.date.$lte = (new Date(req.query.to));
        }

        exercise.find(reqObj, null, options).exec().then(exercises=>{
            var exerObjs = [];
            // console.log(exercises);

            exercises.forEach((exer)=>{
                exerObjs.push({
                    description: exer.description,
                    duration: exer.duration,
                    date: exer.date.toDateString()
                })
            });

            res.json({
                username: user_data.username,
                count: exercises.length,
                _id: req.params._id,
                log: exerObjs
            })
        });
    });
    
});


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});



app.listen(process.env.PORT, () => console.log("app listening on port: " + process.env.PORT));