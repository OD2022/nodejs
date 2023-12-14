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


//Fetch all custom fabrics
app.get('/customfabrics', async (req, res) => {
    connection.query('SELECT * FROM CustomFabricProduct', (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).json(results);
      })
    });


//User views a single product
app.get('/product/:id', (req, res) => {
    const productId = req.params['id'];
    connection.query('SELECT * FROM Product WHERE product_id = $1', [productId], (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).json(results);
      });
    });


app.post('/record-payment', async (req, res) => {
    const {payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number} = req.body;
    connection.query('INSERT INTO Payment(payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number) VALUES ($1,$2,$3,$4,$5,$6,$7)',[payment_id, payment_provider, seller_email, customer_email, transaction_amount, transaction_datetime, payer_number], (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).send(true);
      });
    });


//View All Sellers Products
app.get('/sellers/products/:email', async (req, res) => {
    const seller_email = req.params['email'] 
    connection.query('SELECT * FROM Product WHERE seller_email = $1', [seller_email], (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results); 
    });
});


//Adding a new merchant product
app.post('/sellers/products/', async (req, res) => {
    connection.query('INSERT INTO Prouct(seller_email, product_name, yards, description, price, image_link) VALUES ($1,$2,$3,$4,$5,$6)', [seller_email, product_name, yards, description, price, image_link], (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).send('Merchant product succesfuly added');
      })
    });


//Adding a new custom fabric
app.post('/admin/customfabric', async (req, res) => {
    connection.query('INSERT INTO CustomFabricProduct(admin_email, description, price, image_link) VALUES($1,$2,$3,$4)',[admin_email, description, price, image_link], (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).send('Custom Fabric successfully added');
      })
    });
  


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
