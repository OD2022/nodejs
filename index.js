const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://your-frontend.com' })); 
app.use(cookieParser());

const connection = new Pool({
    host: '',
    user: '',
    password: '',
    database: '',
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

// Sign In
app.post('/sign-in/:role', async (req, res) => {
    const { email, user_password } = req.body;
    const user_role = req.params['role'];

    const result = await connection.query('SELECT * FROM WovenUsers WHERE email = $1 AND user_role = $2', [email, user_role]);

    if (result.rowCount > 0) {
        const user = result.rows[0];
        const match = await bcrypt.compare(user_password, user.user_password);

        if (match) {
            req.session.userId = user.id; 
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
        await connection.query('INSERT INTO WovenUsers(email, first_name, last_name, country, user_password, user_role) VALUES ($1, $2, $3, $4, $5, $6)', 
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
        await connection.query('INSERT INTO WovenUsers(email, first_name, last_name, country, user_password, user_role) VALUES ($1, $2, $3, $4, $5, $6)', 
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
        await connection.query('INSERT INTO WovenUsers(email, first_name, last_name, country, user_password, user_role) VALUES ($1, $2, $3, $4, $5, $6)', 
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
        await connection.query('INSERT INTO Customer(email, customer_password) VALUES ($1, $2)', 
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
        await connection.query('INSERT INTO Cart(cart_id) VALUES($1)', [customer_email]);
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
        await connection.query('INSERT INTO CartProduct(cart_id, product_id, quantity) VALUES($1, $2, $3)', [cart_id, product_id, quantity]);
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
        await connection.query('DELETE FROM CartProduct WHERE product_id=$1', [product_id]);
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
        await connection.query('DELETE FROM CartProduct WHERE cart_id=$1', [cart_id]);
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
        const results = await connection.query('SELECT Product.product_id, Product.price * CartProduct.quantity AS TotalPrice, Seller.momo_number AS SellerMomo FROM CartProduct JOIN Product ON CartProduct.product_id = Product.product_id JOIN Seller ON Product.seller_id = Seller.seller_id WHERE CartProduct.cart_id = $1', [cartId]);
        
        results.rows.forEach((row) => {
            const productId = row.product_id;
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
        const results = await connection.query('SELECT * FROM CustomFabricProduct');
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
        const results = await connection.query('SELECT * FROM Product WHERE product_id = $1', [productId]);
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
        await connection.query('INSERT INTO Payment(payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
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
        const results = await connection.query('SELECT * FROM Product WHERE seller_email = $1', [seller_email]);
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
        await connection.query('INSERT INTO Product(seller_email, product_name, yards, description, price, image_link) VALUES ($1, $2, $3, $4, $5, $6)', 
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
        await connection.query('INSERT INTO CustomFabricProduct(admin_email, description, price, image_link) VALUES($1, $2, $3, $4)', [admin_email, description, price, image_link]);
        res.status(201).send('Custom Fabric successfully added');
    } catch (error) {
        console.error('Error adding custom fabric', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
