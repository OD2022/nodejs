const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Load environment variables

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://your-frontend.com' }));
app.use(cookieParser());

const connection = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: 5432,
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to SQL: ' + err.stack);
        return;
    }
    console.log('Connected to PostGreSQL');
});

// Middleware for sessions
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true } 
}));

// CSRF protection middleware
const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: true,
    }
});
app.use(csrfProtection);

// Constants for table and column names from .env
const TABLE1 = process.env.TABLE1;
const TABLE2 = process.env.TABLE2;
const TABLE3 = process.env.TABLE3;
const TABLE4 = process.env.TABLE4;
const TABLE5 = process.env.TABLE5;
const TABLE6 = process.env.TABLE6;
const TABLE7 = process.env.TABLE7;

const COLUMN1 = process.env.COLUMN1;
const COLUMN2 = process.env.COLUMN2;
const COLUMN3 = process.env.COLUMN3;
const COLUMN4 = process.env.COLUMN4;
const COLUMN5 = process.env.COLUMN5;
const COLUMN6 = process.env.COLUMN6;
const COLUMN7 = process.env.COLUMN7;
const COLUMN8 = process.env.COLUMN8;
const COLUMN9 = process.env.COLUMN9;
const COLUMN10 = process.env.COLUMN10;
const COLUMN11 = process.env.COLUMN11;
const COLUMN12 = process.env.COLUMN12;
const COLUMN13 = process.env.COLUMN13;
const COLUMN14 = process.env.COLUMN14;
const COLUMN15 = process.env.COLUMN15;
const COLUMN16 = process.env.COLUMN16;
const COLUMN17 = process.env.COLUMN17;
const COLUMN18 = process.env.COLUMN18;
const COLUMN19 = process.env.COLUMN19;
const COLUMN20 = process.env.COLUMN20;
const COLUMN21 = process.env.COLUMN21;
const COLUMN22 = process.env.COLUMN22;
const COLUMN23 = process.env.COLUMN23;
const COLUMN24 = process.env.COLUMN24;
const COLUMN25 = process.env.COLUMN25;
const COLUMN26 = process.env.COLUMN26;
const COLUMN27 = process.env.COLUMN27;
const COLUMN28 = process.env.COLUMN28;

// Sign In
app.post('/sign-in/:role', async (req, res) => {
    const { email, user_password } = req.body;
    const user_role = req.params['role'];

    const result = await connection.query(`SELECT * FROM ${TABLE1} WHERE ${COLUMN1} = $1 AND ${COLUMN2} = $2`, [email, user_role]);

    if (result.rowCount > 0) {
        const user = result.rows[0];
        const match = await bcrypt.compare(user_password, user[COLUMN3]);

        if (match) {
            req.session.userId = user[COLUMN4]; 
            req.session.userRole = user_role; 
            return res.status(200).json({ csrfToken: req.csrfToken() }); 
        }
    }
    res.status(401).send(false);
});

// Check session middleware
const checkSession = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.sendStatus(401);
    }
};

// Register User
app.post('/registerUser/:role', async (req, res) => {
    const { email, first_name, last_name, country, user_password } = req.body;
    const role = req.params['role'];

    if (user_password.length < 10) {
        return res.status(400).send('Password must be at least 10 characters long');
    }

    try {
        const hashedPassword = await bcrypt.hash(user_password, 10);
        await connection.query(`INSERT INTO ${TABLE1}(${COLUMN1}, ${COLUMN5}, ${COLUMN6}, ${COLUMN7}, ${COLUMN3}, ${COLUMN2}) VALUES ($1, $2, $3, $4, $5, $6)`, 
            [email, first_name, last_name, country, hashedPassword, role]);
        res.status(201).send('User successfully added');
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).send('Internal Server Error');
    }
});

// Register Seller
app.post('/registerSeller', async (req, res) => {
    const { email, first_name, last_name, country, seller_password } = req.body;

    if (seller_password.length < 10) {
        return res.status(400).send('Password must be at least 10 characters long');
    }

    try {
        const hashedPassword = await bcrypt.hash(seller_password, 10);
        await connection.query(`INSERT INTO ${TABLE1}(${COLUMN1}, ${COLUMN5}, ${COLUMN6}, ${COLUMN7}, ${COLUMN3}, ${COLUMN2}) VALUES ($1, $2, $3, $4, $5, $6)`, 
            [email, first_name, last_name, country, hashedPassword, 'seller']);
        res.status(201).send('Seller successfully added');
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).send('Internal Server Error');
    }
});

// Register Admin
app.post('/registerAdmin', async (req, res) => {
    const { email, first_name, last_name, country, admin_password } = req.body;

    if (admin_password.length < 10) {
        return res.status(400).send('Password must be at least 10 characters long');
    }

    try {
        const hashedPassword = await bcrypt.hash(admin_password, 10);
        await connection.query(`INSERT INTO ${TABLE1}(${COLUMN1}, ${COLUMN5}, ${COLUMN6}, ${COLUMN7}, ${COLUMN3}, ${COLUMN2}) VALUES ($1, $2, $3, $4, $5, $6)`, 
            [email, first_name, last_name, country, hashedPassword, 'admin']);
        res.status(201).send('Admin successfully added');
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).send('Internal Server Error');
    }
});

// Registering customer
app.post('/registerCustomer', async (req, res) => {
    const { email, customer_password } = req.body;

    if (customer_password.length < 10) {
        return res.status(400).send('Password must be at least 10 characters long');
    }

    try {
        const hashedPassword = await bcrypt.hash(customer_password, 10);
        await connection.query(`INSERT INTO ${TABLE2}(${COLUMN1}, ${COLUMN3}) VALUES ($1, $2)`, 
            [email, hashedPassword]);
        res.status(201).send('Customer successfully added');
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).send('Internal Server Error');
    }
});

// Creating a cart
app.post('/create-cart', checkSession, async (req, res) => {
    const { customer_email } = req.body;
    try {
        await connection.query(`INSERT INTO ${TABLE3}(${COLUMN8}) VALUES($1)`, [customer_email]);
        res.status(201).send('Cart successfully created');
    } catch (error) {
        console.error('Error creating cart', error);
        res.status(500).send('Internal Server Error');
    }
});

// Adding a product to cart
app.post('/add-to-cart', checkSession, async (req, res) => {
    const { cart_id, product_id, quantity } = req.body;
    try {
        await connection.query(`INSERT INTO ${TABLE4}(${COLUMN8}, ${COLUMN9}, ${COLUMN10}) VALUES($1, $2, $3)`, [cart_id, product_id, quantity]);
        res.status(201).send('Product successfully added to cart');
    } catch (error) {
        console.error('Error adding product to cart', error);
        res.status(500).send('Internal Server Error');
    }
});

// Remove item from cart
app.post('/remove-from-cart', checkSession, async (req, res) => {
    const { product_id } = req.body;
    if (!product_id) {
        return res.status(400).send('Product ID is missing in the request body.');
    }
    try {
        await connection.query(`DELETE FROM ${TABLE4} WHERE ${COLUMN9}=$1`, [product_id]);
        res.status(201).send('Product removed from cart');
    } catch (error) {
        console.error('Error removing product from cart', error);
        res.status(500).send('Internal Server Error');
    }
});

// Clearing out a cart
app.post('/clear-cart', checkSession, async (req, res) => {
    const { cart_id } = req.body;
    if (!cart_id) {
        return res.status(400).send('Cart ID is missing in the request body.');
    }
    try {
        await connection.query(`DELETE FROM ${TABLE4} WHERE ${COLUMN8}=$1`, [cart_id]);
        res.status(201).send('Cart successfully emptied');
    } catch (error) {
        console.error('Error clearing cart', error);
        res.status(500).send('Internal Server Error');
    }
});

// Checkout the cart
app.post('/checkout/:cart-id', checkSession, async (req, res) => {
    let cartTotal = 0;
    const cartId = req.params['cart-id'];
    const resultMap = {};
    try {
        const results = await connection.query(`SELECT ${COLUMN11}, Product.price * ${COLUMN10} AS TotalPrice, Seller.${COLUMN12} AS SellerMomo FROM ${TABLE4} JOIN Product ON ${TABLE4}.${COLUMN10} = Product.${COLUMN11} JOIN Seller ON Product.${COLUMN13} = Seller.${COLUMN12} WHERE ${TABLE4}.${COLUMN8} = $1`, [cartId]);
        
        results.rows.forEach((row) => {
            const productId = row[COLUMN11];
            const totalPrice = row.TotalPrice;
            const sellerMomo = row.SellerMomo;

            if (!resultMap.hasOwnProperty(productId)) {
                resultMap[productId] = {};
            }

            resultMap[productId][sellerMomo] = totalPrice;
            cartTotal += totalPrice;
        });

        res.json({ resultMap, cartTotal });
    } catch (error) {
        console.error('Error during checkout', error);
        res.status(500).send('Internal Server Error');
    }
});


// Fetch all custom fabrics
app.get('/customfabrics', async (req, res) => {
    try {
        const results = await connection.query(`SELECT * FROM ${TABLE6}`);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching custom fabrics', error);
        res.status(500).send('Internal Server Error');
    }
});


// User views a single product
app.get('/product/:id', async (req, res) => {
    const productId = req.params['id'];
    try {
        const results = await connection.query(`SELECT * FROM ${TABLE5} WHERE ${COLUMN9} = $1`, [productId]);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching product', error);
        res.status(500).send('Internal Server Error');
    }
});


// Record payment
app.post('/record-payment', checkSession, async (req, res) => {
    const { payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number } = req.body;
    try {
        await connection.query(`INSERT INTO ${TABLE7}(${COLUMN13}, ${COLUMN14}, ${COLUMN15}, ${COLUMN16}, ${COLUMN17}, ${COLUMN18}, ${COLUMN19}) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
            [payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number]);
        res.status(201).send(true);
    } catch (error) {
        console.error('Error recording payment', error);
        res.status(500).send('Internal Server Error');
    }
});


// View all sellers' products
app.get('/sellers/products/:email', async (req, res) => {
    const seller_email = req.params['email'];
    try {
        const results = await connection.query(`SELECT * FROM ${TABLE5} WHERE ${COLUMN15} = $1`, [seller_email]);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching seller products', error);
        res.status(500).send('Internal Server Error');
    }
});

// Adding a new merchant product
app.post('/sellers/products/', checkSession, async (req, res) => {
    const { seller_email, product_name, yards, description, price, image_link } = req.body;
    try {
        await connection.query(`INSERT INTO ${TABLE5}(${COLUMN15}, ${COLUMN20}, ${COLUMN21}, ${COLUMN22}, ${COLUMN23}, ${COLUMN24}) VALUES ($1, $2, $3, $4, $5, $6)`, 
            [seller_email, product_name, yards, description, price, image_link]);
        res.status(201).send('Merchant product successfully added');
    } catch (error) {
        console.error('Error adding merchant product', error);
        res.status(500).send('Internal Server Error');
    }
});

// Adding a new custom fabric
app.post('/admin/customfabric', checkSession, async (req, res) => {
    const { admin_email, description, price, image_link } = req.body;
    try {
        await connection.query(`INSERT INTO ${TABLE6}(${COLUMN25}, ${COLUMN26}, ${COLUMN27}, ${COLUMN28}) VALUES($1, $2, $3, $4)`, [admin_email, description, price, image_link]);
        res.status(201).send('Custom Fabric successfully added');
    } catch (error) {
        console.error('Error adding custom fabric', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
