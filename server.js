//postgres library
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_db');
//express server


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

      INSERT INTO employees(txt, department_id) VALUES('Answer Calls', (SELECT id FROM departments WHERE txt='Customer Service Department'));
      INSERT INTO employees(txt, department_id) VALUES('Tracks Money', (SELECT id FROM departments WHERE txt='Accounting Department'));
      INSERT INTO employees(txt, department_id) VALUES('Fscilitates Customer Loans', (SELECT id FROM departments WHERE txt='Lending Department'));
    `;
    await client.query(SQL);
    console.log('data seeded')
}

init();