//postgres library
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_db');
//express server
const express = require('express');
const app = express();
//morgan middleware - log moves and detail errors in the node terminal
const morgan = require('morgan');
const { restart } = require('nodemon');
app.use(morgan('dev'));
//express.json middleware to utilize POST successfully
app.use(express.json());

//CRUD functionality:
//GET all employees
app.get('/api/employees', async(req, res, next)=> {
  try{
    const SQL = `
      SELECT *
      FROM employees;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  }
  catch(error){
    next(error);
  }
});

//GET all categories
app.get('/api/categories', async (req, res, next)=> {
  try{
    const SQL = `
      SELECT *
      FROM departments;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  }
  catch(error){
    next(error);
  }
});

//DELETE employee
app.delete('/api/employees/:id', async(req, res, next)=> {
  try{
    const SQL = `
      DELETE FROM employees
      WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  }
  catch(error){
    next(error);
  }
});

//POST a new employee
app.post('/api/employees', async(req, res, next)=> {
  try{
    const SQL = `
      INSERT INTO employees(txt, department_id)
      VALUES($1, $2)
      RETURNING *
    `;
    const response = await client.query(SQL, [req.body.txt, req.body.department_id]);
    res.status(201).send(response.rows[0]);
  }
  catch(error){
    next(error);
  }
});

app.use((error, req, res, next)=> {
  res.status(error.status || 500).send({message: error.message || error});
});

//PUT edit employees
app.put('/api/employees/:id', async(req, res, next)=> {
  try{
    SQL  = `
      UPDATE employees
      SET txt = $1,
      category_id = $2,
      WHERE id = $3
      RETURNING *
    `;
    const response = await client.query(SQL, [req.body.txt, req.body.department_id, req.params.id]);
    res.send(response.rows[0]);
  }
  catch(error){
    next(error);
  }
});

//init to connect to dadtabase we just created
const init = async()=> {
  console.log('connecting to the database');
  await client.connect();
  console.log('connected to the database');

  //create tables
  let SQL = `  
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      txt VARCHAR (60) NOT NULL
    );
    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      txt VARCHAR (80) NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  console.log('tables created');

  //seed data into tables
  SQL = `
      INSERT INTO departments(txt) VALUES('Customer Service Department');
      INSERT INTO departments(txt) VALUES('Accounting Department');
      INSERT INTO departments(txt) VALUES('Lending Department');

      INSERT INTO employees(txt, department_id) VALUES('Chatty Cathy', (SELECT id FROM departments WHERE txt='Customer Service Department'));
      INSERT INTO employees(txt, department_id) VALUES('Karen Balance', (SELECT id FROM departments WHERE txt='Accounting Department'));
      INSERT INTO employees(txt, department_id) VALUES('Bob Moneybags', (SELECT id FROM departments WHERE txt='Lending Department'));
    `;
    await client.query(SQL);
    console.log('data seeded')

    //set up listening port
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
      console.log(`listening on port ${port}`);
      //console logging helpful curl commands to copy and paste from the node terminal to my main terminal for testing
      console.log(`curl localhost:${port}/api/employees`);
      console.log(`curl localhost:${port}/api/categories`);
      console.log(`curl -X DELETE localhost:${port}/api/employees/2`);
      console.log(`curl -X POST localhost:${port}/api/employees -d '{"txt": "Cooper Bossman", "department_id": 2}' -H "Content-Type:application/json"`);
      console.log(`curl -X PUT localhost:${port}/api/employees/2 -d '{"txt":"Karen Johnson", "department_id": 2} -H "Content-Type:application/json"`);
    });
}

init();