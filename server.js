//postgres library
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_db');
//express server
const express = require('express');
const app = express();
//morgan middleware - log moves and detail errors in the node terminal
const morgan = require('morgan');
app.use(morgan('dev'));

//CRUD functionality:
//GET all employees
app.get('api/employees', async(rerq, res, next)=> {
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
app.get('api/categories', async (req, res, next)=> {
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
      console.log(`curl localhost:${port}/api/employees`)
      console.log(`curl localhost:${port}/api/categories`)
    })
}

init();