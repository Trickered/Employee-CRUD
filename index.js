require('dotenv').config();
const express = require('express')
const mysql = require('mysql2')
const app = express();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const port = 3000
app.use(express.json());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, Try again Later.'
})

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || '3306', 
    database: process.env.DB_NAME || 'General_Store'
})

db.connect((err)=>{
    if(err){
        console.error('There is an error in Connection.', err)
        return
    }
    console.log('Connected to Database!')
})

app.use(limiter);

//==========
// CRUD
app.get('/employee',(req,res)=> {
    const query = 'SELECT * FROM employee';

    db.query(query,(err,results) => {
        if(err){
            console.error('There is an error in query', err);
            res.status(500).send('Error Occuired');
            return;
        }
        res.json(results);
    });
});

app.post('/employee/create',
    [
        body('fname').isAlpha().withMessage('First name must contain only letters').notEmpty().withMessage('First name is required'),
        body('lname').isAlpha().withMessage('Last name must contain only letters').notEmpty().withMessage('Last name is required'),
        body('age').isInt({ min: 18 }).withMessage('Age must be a number and at least 18'),
        body('gender').isIn(['Male','Female','Other']).withMessage('Gender must be either Male, Female or Other'),
        body('role').notEmpty().withMessage('Role is required')
    ],(req,res)=> {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array()});
        }

        const {fname,lname,age,gender,role} = req.body;
        const query = 'INSERT into employee (firstname , lastname , age , gender , role) VALUES (? , ? , ? , ? , ?)';
        db.query(query,[fname , lname , age , gender , role],(err,result) => {
            if(err){
                console.error('There is error while Creating a Profile!', err);
                res.status(500).send('Error Occuired');
                return;
            }
            res.status(201).send(`User added with ID: ${result.insertId}`);
        });
});

app.put('/employee/users/:id',
    [
        body('fname').isAlpha().withMessage('First name must contain only letters').notEmpty().withMessage('First name is required'),
        body('lname').isAlpha().withMessage('Last name must contain only letters').notEmpty().withMessage('Last name is required'),
        body('age').isInt({ min: 18 }).withMessage('Age must be a number and at least 18'),
        body('gender').isIn(['Male','Female','Other']).withMessage('Gender must be either Male, Female or Other'),
        body('role').notEmpty().withMessage('Role is required')
    ],(req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array()});
        }

        const {id} = req.params;
        const {fname,lname,age,gender,role} = req.body;
        const query = 'UPDATE employee SET firstname = ? , lastname = ? , age = ? , gender = ? , role = ? WHERE ID = ?';
        db.query(query,[fname , lname , age , gender , role , id],(err,result) => {
            if(err){
                console.error('There is an error while Updating Profile!', err);
                res.status(500).send('Error Occuired');
                return;
            }
            if (result.affectedRows === 0){
                res.status(404).send('User not found.');
                return
            }
            res.status(200).send('User Updated Successfully!')
        })
})

app.delete('/employee/delete/:id',(req,res) => {
    const {id} = req.params;
    const query = 'DELETE FROM employee WHERE ID = ?';
    db.query(query, [id],(err,result) => {
        if(err){
            console.error('There is an error when Deleting!', err);
            res.status(500).send('Error Occuired');
            return;
        }
        if (result.affectedRows === 0){
            res.status(404).send('User not found.');
            return
        }
        res.status(200).send('User data Deleted Successfully!')
    });
});
//==========

// Additional Functions

// Find employee by name
app.get('/employee/search/:letter',(req,res) => {
    const {letter} = req.params;
    const query = 'SELECT * FROM employee WHERE firstname LIKE ?';

    db.query(query,[`${letter}%`],(err,results) => {
        if(err){
            console.error('There is Error in searching Process', err);
            res.status(500).send('Error Occuired');
            return;
        }
        if (results.length === 0){
            res.status(404).send('No Employee Found!');
            return;
        } 
        res.json(results);
    })
})

app.listen(port,() => {
    console.log(`Server is Running in Port ${port}`)
})
