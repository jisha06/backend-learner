const Express = require("express");
const Bodyparser = require("body-parser");
const Cors = require("cors");
const Mongoose = require("mongoose");
const learnerModel = require("./models/students")
const UserModel = require('./models/User')
const AdminModel = require('./models/Admin')
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const { json } = require("body-parser");



const app = new Express();
app.use(Bodyparser.json());
app.use(Bodyparser.urlencoded({ extended: true }))
app.use(Cors());

Mongoose.connect("mongodb+srv://jisha:jisha@cluster0.a2wdl3u.mongodb.net/employeeDB?retryWrites=true&w=majority", { useNewUrlParser: true })
//const serverurl ="api"
const serverurl=""
//Login
app.post(`${serverurl}/signin`, async (req, res) => {
    var getEmailid = req.body.emailid
    var getpassword = req.body.password
    let data= []
    const adminuser = await AdminModel.find({ emailid: getEmailid })
    const learnerUser =  await UserModel.find({ emailid: getEmailid })
   if(adminuser.length>0){data = adminuser}
   else{  data = learnerUser }
   
        if (data.length > 0) {
            console.log(data)
            const passwordValidator = bcrypt.compareSync(getpassword, data[0].password)

            if (passwordValidator) {

                jwt.sign({ email: getEmailid }, "Learner", { expiresIn: "1d" },
                    (err, token) => {
                        if (err) {
                            res.json({ "status": "error", "error": err })
                        } else {
                            res.json({ "status": "success", "data": data, "token": token })
                        }
                    })
            }
            else {
                res.json({ "status": "failed", "data": "Invalid password" })
            }
        }
        else {
            res.json({ "status": "failed", "data": "Invalid Email id" })
        }    

})


// app.post('/signup', async (req, res) => {
//     let data = new AdminModel({
//         name: req.body.name,
//         emailid: req.body.emailid,
//         password: bcrypt.hashSync(req.body.password, 10),
//         position: req.body.position
//     })
//     console.log(data)
//     await data.save()

//     res.json({ "status": "success", "data": data })
// })


//View User List
app.post(`${serverurl}/viewuser/:query`, async (req, res) => {
    var data = req.body
    console.log(data)
    var q = req.params.query;

    const keys = ["name", "emailid", "location", "position"]
    const search = (data) => {
        return data.filter((item) =>
            keys.some((key) => item[key].toLowerCase().includes(q))
        );
    };
    try {
        var result = await UserModel.find();
        if (q == 0) {
            res.send(result)
        }
        else {
            res.send(search(result))
        }

    } catch (error) {
        res.status(500).send(error)
    }
})

//Add Users
app.post(`${serverurl}/addUser`, async (req, res) => {
    console.log(req.body)

    const newUser = new UserModel({
        name: req.body.name,
        emailid: req.body.emailid,
        password: bcrypt.hashSync(req.body.password, 10),
        location: req.body.location,
        position: req.body.position
    })
    await newUser.save((error, data) => {
        if (data) {
            res.json({ "status": "Success", "Data": data })
        }
        else {
            res.json({ "status": "error", "Error": error })
        }
    })
})

//get user by id
app.post(`${serverurl}/getuser`, async (req, res) => {
    var data = req.body

    console.log(data._id)
    try {
        var result = await UserModel.findById(data)
        res.send(result);
        console.log(result)
    } catch (error) {
        res.status(500).send(error)
    }
})

//update user
app.put(`${serverurl}/updateUser`, async (req, res) => {
    let data = req.body
    console.log(data.name, data.emailid, data.location, data.position, data.salary)

    let empid = data._id
    let uname = data.name
    let uemailid = data.emailid
    let ulocation = data.location
    let uposition = data.position
    let usalary = data.salary
    try {
        UserModel.findOneAndUpdate({ _id: empid }, { $set: { name: uname, emailid: uemailid, location: ulocation, position: uposition, salary: usalary } }, { new: true }, (err, data) => {
            if (data) {
                res.json({ "status": "Success", "Data": data })
            }
            else {
                res.json({ "status": "error" })
            }
        })

    } catch (err) {
        res.send('Error')
    }

})

//delete User
app.delete(`${serverurl}/deleteUser/:id`, (req, res) => {
    var data = req.params.id;
    console.log(req.params.id)
    console.log(data)

    UserModel.findByIdAndDelete(req.params.id, (err, data) => {
        console.log(data);
        if (err) {
            res.json({ "status": "Error", "Error": err });
        }
        else {
            res.send({ "status": "Deleted", "Data": data });
        }

    })
})

//Student
app.post(`${serverurl}/addlearner`, async (req, res) => {
    let data = new learnerModel(req.body)
    console.log(data)
    await data.save()
    res.json({ "status": "success", "data": data })
})
app.get(`${serverurl}/data`, async (req, res) => {
    try {
        const data = await learnerModel.find();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.put(`${serverurl}/learners/:id/placement`, async (req, res) => {
    try {
        const updatedLearner = await learnerModel.updateOne(
            { _id: req.params.id },
            { placementStatus: req.body.placementStatus }
        );
        res.json(updatedLearner);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post(`${serverurl}/cvupload`, async (req, res) => {
    var data = req.body;
   
    console.log(data)
    if (data) {
        await learnerModel.insertMany(data)
        if (data) {
            res.json({ "status": "Success", "Data": data })
        }
        else {
            res.json({ "status": "error", "Error": error })
        }
    }
    else
    {
        res.json({ "status": "error", "Error": "Data is null" })
    }

})
//jwt token verification
// app.post("/students",(req,res)=>{
//     jwt.verify(req.body.token,"Learner",(error,decoded)=>{
//         if(decoded && decoded.emailid)
//         {
//             let data = new studenModel ({studentId: req.body.id})
//             data.save()
//             res.json({"status": "Added Successfuly"})
//         }
//         else{
//             res.json({"status": "unauthorsied user"})
//         }
//     })
// })
// jwt.verify(req.body.token, "Learner", (error, decoded) => {
//     if (decoded && decoded.email) {
//         console.log(decoded.email)
//         var result = UserModel.find();
//         if (q == 0) {
//             res.send(result)
//         }
//         else {
//             res.send(search(result))
//         }
//     }

//     else {
//         res.json({ "status": "unauthorsied user" })
//     }
// })

app.listen((3001), () => {
    console.log("server started")
})