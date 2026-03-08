const express = require("express")
const router = express.Router()
const User = require('../models/userModel');
const verifyToken=require('../middleware');


router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });
        if (!userData) {
            console.log(error);
            return res.json({ message: 'username is not found ' });
        }
        if(userData.isVerified !=true){
          return res.json({ message: 'User is not verified. Please verify before login! ',userData });
        }
        const userPasswordMatch = await bcrypt.compare(password, userData.password);
        //const userPasswordMatch = password === userData.password;
        if (!userPasswordMatch) {
            console.log('password doesnot match ');
            return res.json({ message: 'password is incorrect' });
        }
        const userRole = userData.role;
        // const token = jwt.sign({ email: userData.email }, 'secretKey');
        const token = jwt.sign({ email: userData.email, userId: userData._id , firstName: userData.firstName , phoneNo: userData.phoneNo , userRole: userData.role }, 'secretKey');

        res.json({ message: 'Login Sucessfull', role: userRole, token: token });
    }
    catch (error) {
        res.json({ message: 'something went wrong', error });

    }
})

router.get('/register', (req, res) => {
    User.find()
        .then(data => res.send(data))
        .catch(err => console.log(err))
})


router.get('/getusersdatabyEmail', verifyToken, async (req, res) =>{
    try{
            const { email } = req.user;
            const userdata= await User.findOne({email});
            if(userdata){
                return res.json({ data: userdata });
            }
            else{
                res.status(404).json({message: "data not found"});
            }
    }catch(error)
    {
        res.status(500).json({ messgae: 'something is error', error });
    }
  })