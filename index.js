const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const { Pool } = require('pg');
const cors = require('cors');
app.use(express.json());
app.use(cors());

const connection = new Pool({
    host: 'berry.db.elephantsql.com',
    user: 'ybaxjnhl',
    password: 'DSoLBzCxz7-Deirvd5pvIAdcklF_ftEi',
    database: 'ybaxjnhl',
    port: 5432, // Your MySQL server port (default is 3306)
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to SQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);

});

app.get('/', async (req, res) => {
    try {
      const client = await connection.connect();
      const result = await client.query('SELECT * FROM Product');
      const products = result.rows;
      client.release();
      res.json(products);
    } catch (error) {
      console.error('Error executing query', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/sign-in/:role', async (req, res) => {
    const { email, user_password } = req.body;
    const user_role = req.params['role'];
    connection.query(
      'SELECT * FROM WovenUsers WHERE email = $1 AND (user_password = $2 AND user_role = $3)',
      [email, user_password, user_role],
      (error, results) => {
        if (error) {
          throw error;
        }
        const rowCount = results.rowCount;
        if (rowCount > 0) {
          res.status(201).send(true);
        } else {
          res.status(401).send(false);
        }
      }
    );
  });

  //Registering user
  app.post('/registerUser/:role', (req, res) => {
        const {
            email,
            first_name,
            last_name,
            country,
            user_password
        } = req.body;
        const role = req.params['role'];
        connection.query('INSERT INTO WovenUsers(email, first_name, last_name, country, user_password, user_role) VALUES ($1,$2,$3,$4,$5,$6)', [email, first_name, last_name, country, user_password, role], (error, results) => {
            if (error) {
              throw error
            }
            res.status(201).send('User succesfuly added');
          })
        });


        app.post('/registerAdmin', (req, res) => {
            const {
                email,
                admin_tel_no,
                address,
                DOB,
                sex
            } = req.body;
            connection.query('INSERT INTO WovenAdmin(email, admin_tel_no, address, dob, sex) VALUES ($1,$2,$3,$4,$5)',[email, admin_tel_no, address, DOB, sex], (error, results) => {
                if (error) {
                  throw error
                }
                res.status(201).send('Admin succesfuly added');
              })
            });

            app.post('/registerSeller', (req, res) => {
                const {
                    email,
                    ghana_region,
                    seller_tel_no,
                    momo_number,
                    address,
                    dob,
                    sex
                } = req.body;
                connection.query('INSERT INTO Seller(email, ghana_region, seller_tel_no, momo_number, address, dob, sex) VALUES ($1,$2,$3,$4,$5,$6,$7)',[email, ghana_region, seller_tel_no, momo_number, address, dob, sex]
                , (error, results) => {
                    if (error) {
                      throw error
                    }
                    res.status(201).send('Seller succesfuly added');
                  })
                });

                app.post('/registerCustomer', (req, res) => {
                    const {
                        email
                    } = req.body;
                    connection.query('INSERT INTO Seller(email) VALUES ($1)',[email]
                    , (error, results) => {
                        if (error) {
                          throw error
                        }
                        res.status(201).send('Customer succesfuly added');
                      })
                    });


//Creating a cart
app.post('/create-cart', async (req, res) => {
        const {customer_email} = req.body;
        connection.query('INSERT INTO Cart(cart_id) VALUES($1)', [customer_email], (error,results) => 
        {
            if (error) {
              throw error
            }
            res.status(201).send('Cart succesfuly created');
          })
        });


//Adding a product to cart
app.post('/add-to-cart', async (req, res) => {
        const {cart_id, product_id, quantity} = req.body;
        connection.query('INSERT INTO CartProduct(cart_id, product_id, quantity) VALUES($1,$2,$3)', [cart_id, product_id, quantity], (error,results) => 
        {
            if (error) {
              throw error
            }
            res.status(201).send('Add to cart succesfuly added');
          })
        });
    

//RemoveItemFrom Cart
app.post('/remove-from-cart', async (req, res) => {
        const { product_id } = req.body;
        if (!product_id) {
            throw new Error('Product ID is missing in the request body.');
        }
        connection.query('DELETE FROM CartProduct WHERE product_id=$1', [product_id], (error,results) => 
        {
            if (error) {
              throw error
            }
            res.status(201).send('Product removed from cart');
          })
        });


//Clearing out a cart
app.post('/clear-cart', async (req, res) => {
        const { cart_id } = req.body;
        if (!cart_id) {
            throw new Error('Product ID is missing in the request body.');
        }
        connection.query('DELETE FROM CartProduct WHERE cart_id=$1', [cart_id], (error,results) => 
        {
            if (error) {
              throw error
            }
            res.status(201).send('Cart succesfully emptied');
          })
        });
        
//Checkout the cart
app.post('/checkout/:cart-id', async (req, res) => {
    let cartTotal = 0;
    const cartId = req.params['cart-id'];
    const resultMap = {};
    connection.query('SELECT Product.product_id, Product.price * CartProduct.quantity AS TotalPrice, Seller.momo_number AS SellerMomo FROM CartProduct JOIN Product ON CartProduct.product_id = Product.product_id JOIN Seller ON Product.seller_id = Seller.seller_id WHERE CartProduct.cart_id = $1', [cartId], (error,results) => 
        {
            if (error) {
              throw error
            }
            results.forEach((row) => {
                const productId = row.product_id;
                const totalPrice = row.TotalPrice;
                const sellerMomo = row.SellerMomo;
    
                // Initialize the inner dictionary if the product ID is not in the resultMap
                if (!resultMap.hasOwnProperty(productId)) {
                    resultMap[productId] = {};
                }
                // Populating the inner dictionary with seller momo number and totalPrice
                resultMap[productId][sellerMomo] = totalPrice;
            });
            Object.values(resultMap).forEach((product) => {
                Object.values(product).forEach((totalPrice) => {
                    cartTotal += totalPrice;
                });
            });
            // Respond with the map
            res.json({resultMap, cartTotal});
          })
        });



app.get('/customer/merchant-order/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const customer_email = req.body;
        const sql = 'SELECT Orders.*, MerchantProductOrder.* FROM Orders JOIN MerchantProductOrder ON Orders.payment_id = MerchantProductOrder.payment_id WHERE Orders.customer_email = $1 ORDER BY Orders.date_created LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [customer_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//Getting stole product orders
app.get('/customer/stole-order/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const customer_email = req.body;
        const sql = 'SELECT Orders.*, StoleProductOrder.* FROM Orders JOIN StoleProductOrder ON Orders.payment_id = StoleProductOrder.payment_id WHERE Orders.customer_email = $1 ORDER BY Orders.date_created LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [customer_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Getting custom product orders
app.get('/customer/customfabric-order/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const customer_email = req.body;
        const sql = 'SELECT Orders.*, CustomFabricOrderDetails.* FROM Orders JOIN CustomFabricOrderDetails ON Orders.payment_id = CustomFabricOrderDetails.payment_id WHERE Orders.customer_email = $1 ORDER BY Orders.date_created LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [customer_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Getting all custom fabric order details by email
app.get('/customfabric-order', async (req, res) => {
    try {
        const customer_email = req.body;
        const sql = 'SELECT Orders.*, CustomFabricOrderDetails.* FROM Orders JOIN CustomFabricOrderDetails ON Orders.payment_id = CustomFabricOrderDetails.payment_id  WHERE Orders.customer_email = $1';
        const result = await connection.query(sql, [customer_email]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Placing an order for a product
app.post('/customer/order', async (req, res) => {
    try {
        const {
            payment_id,
            customer_email,
            country,
            postal_code,
            delivery_address,
            delivery_method,
            total_price
        } = req.body;
        const sql = 'INSERT INTO Orders(payment_id, customer_email, country, postal_code, delivery_address, delivery_method, total_price) VALUES(?,?,?,?,?,?,?)';
        const result = await connection.query(sql, [ payment_id,
            customer_email,
            country,
            postal_code,
            delivery_address,
            delivery_method,
            total_price]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Setting an order for a particular merchant's product
app.post('customer/merchant-order', async (req, res) => {
    try {
        const {
            payment_id,
            product_id,
            product_total,
            quantity,
            seller_fulfilled,
            delivery_status,
            tracking_id,
            order_status
        } = req.body;
        const sql = 'INSERT INTO MerchantProductOrder(payment_id,product_id, product_total,quantity, seller_fulfilled, delivery_status, tracking_id, order_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)';
        const result = await connection.query(sql, [payment_id,product_id, product_total,quantity, seller_fulfilled, delivery_status, tracking_id, order_status]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Setting order for a particular stole
app.post('customer/stole-order', async (req, res) => {
    try {
        const {
            payment_id,
            quantity,
            color,
            logo_link,
            final_design_link,
            delivery_status,
            tracking_id,
            order_status
        } = req.body;
        const sql = 'INSERT INTO StoleProductOrder(payment_id, quantity, color, logo_link, final_design_link, delivery_status, tracking_id, order_status) VALUES(?,?,?,?,?,?,?,?)';
        const result = await connection.query(sql, [payment_id,
            quantity,
            color,
            logo_link,
            final_design_link,
            delivery_status,
            tracking_id,
            order_status]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Setting order details for custom-fabric
app.post('customer/customfabric-order', async (req, res) => {
    try {
        const {
            payment_id,
            product_total,
            final_design_link,
            yards,
            delivery_status,
            tracking_id,
            order_status
        } = req.body;
        const sql = 'INSERT INTO CustomFabricOrderDetails(payment_id,product_total,final_design_link, yards, delivery_status, tracking_id, order_status) VALUES(?,?,?,?,?,?,?)';
        const result = await connection.query(sql, [payment_id,product_total,final_design_link, yards, delivery_status,
            tracking_id,
            order_status]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//User Views All MarketPlace Products
app.get('/products/rows/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const sql = 'SELECT * FROM Product ORDER BY date LIMIT 10 OFFSET $1';
        const result = await connection.query(sql, [userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//User Views All Stole Designs
app.get('/stoles/rows/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const sql = 'SELECT * FROM StoleProduct ORDER BY date LIMIT 10 OFFSET $1';
        const result = await connection.query(sql, [userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//User Gets Fabric Templates
app.get('/customfabrics/rows/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const sql = 'SELECT * FROM CustomFabricProduct ORDER BY date LIMIT 10 OFFSET $1';
        const result = await connection.query(sql, [userProvidedOffset]);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//User views a single product
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM Product WHERE product_id = $1';
    connection.query(sql, [productId], (err, result) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                res.json(result[0]); // Assuming the query returns one student
            } else {
                res.status(404).send('Product not found');
            }
        }
    });
});

//Fetch the stoles
app.get('/stoles/:id', (req, res) => {
    const stoleId = req.params.id;
    // SQL query to fetch a student by ID
    const sql = 'SELECT * FROM StoleProduct WHERE stole_product_id = $1';

    connection.query(sql, [stoleId], (err, result) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.status(404).send('Product not found');
            }
        }
    });
});


//Fetch the fabric
app.get('/customfabric/:id', (req, res) => {
    const customFabricId = req.params.id;
    const sql = 'SELECT * FROM CustomFabricProduct WHERE custom_fabric_product_id = $1';

    connection.query(sql, [customFabricId], (err, result) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).send('Internal Server Error');
        } else {
            if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.status(404).send('Product not found');
            }
        }
    });
});


//View Seller by product
app.get('/seller/:id/products/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const seller_email = req.params.id;
        const sql = 'SELECT * FROM Product WHERE seller_email = $1 ORDER BY date LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [seller_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


app.post('/record-payment', async (req, res) => {
    try{
    const {payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number} = req.body;
    const sql = 'INSERT INTO Payment(payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number) VALUES(?,?,?,?,?,?,?)';
    const result = await connection.query(sql, [payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number]);
      res.json(result.rows);
  } catch (error) {
      console.error(error);
      res.status(500).json({error: 'Internal Server Error'});
  }
});


//Merchant get's to view all their orders based on status
app.get('/merchant-order/:status/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const order_status = req.params.status;
        const seller_email = req.body;
        const sql = 'SELECT Orders.*, MerchantProductOrder.* FROM Orders JOIN MerchantProductOrder ON Orders.payment_id = MerchantProductOrder.payment_id WHERE Orders.seller_email = $1 ORDER BY Orders.date_created LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [seller_email, order_status, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Woven gets to see their stole order based on status
app.get('/stole-order/:status/:offset', async (req, res) => {
    try {
        const order_status = req.params.status;
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const admin_email = req.body;
        const sql = 'SELECT Orders.*, StoleProductOrder.* FROM Orders JOIN StoleProductOrder ON Orders.payment_id = StoleProductOrder.payment_id WHERE Orders.admin_email = $1 ORDER BY Orders.date_created LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [admin_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//Woven gets to see their stole order based on status
app.get('/kente-order/:status/:offset', async (req, res) => {
    try {
        const order_status = req.params.status;
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const admin_email = req.body;
        const sql = 'SELECT Orders.*, CustomFabricOrderDetails.* FROM Orders JOIN CustomFabricOrderDetails ON Orders.payment_id = CustomFabricOrderDetails.payment_id WHERE Orders.admin_email = $1 ORDER BY Orders.date_created LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [admin_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


//View All Sellers Products
app.get('/sellers/products/:offset', async (req, res) => {
    try {
        const userProvidedOffset = parseInt(req.params.offset, 10) || 0;
        const seller_email = req.body;
        const sql = 'SELECT * FROM Product WHERE seller_eamil = $1 ORDER BY date LIMIT 10 OFFSET $2';
        const result = await connection.query(sql, [seller_email, userProvidedOffset]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//Adding a new merchant product
app.post('/sellers/products/', async (req, res) => {
        
        const {seller_email, product_name, yards, description, price, image_link} = req.body;
        const sql = 'INSERT INTO Product(seller_email, product_name, yards, description, price, image_link) VALUES(?,?,?,?,?,?)';
        const result = await connection.query(sql, [seller_email, product_name, yards, description, price, image_link]);
        res.json(result.rows);
    
});









//Adding a new custom fabric
app.post('/admin/customfabric', async (req, res) => {
  try {
      const {admin_email, description, price, image_link} = req.body;
      const sql = 'INSERT INTO CustomFabricProduct(admin_email, description, price, image_link) VALUES(?,?,?,?)';
      const result = await connection.query(sql, [admin_email, description, price, image_link]);
      res.json(result.rows);
  } catch (error) {
      console.error(error);
      res.status(500).json({error: 'Internal Server Error'});
  }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
