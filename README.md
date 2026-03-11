# Bookstore E-Commerce Backend (Payment Trial)

A production-style full-stack bookstore e-commerce backend developed with Node.js, Express, MongoDB, and Mongoose.
The application features authentication and authorization, product management, cart and order processing, Stripe-based payment flow, image upload handling, and automated invoice generation.


## Features

- User authentication (signup / login)
- Session management with MongoDB session store
- CSRF protection
- Product listing and product detail pages
- Shopping cart system
- Order creation and order history
- Stripe Checkout payment integration
- PDF invoice generation
- Image upload with Multer
- MVC architecture


## Tech Stack

Node.js  
Express.js  
MongoDB  
Mongoose  
EJS  
Stripe  
Multer  
PDFKit  
Express Session  
CSRF



## Main Functionalities

### Authentication
Users can create accounts and log in using session-based authentication.

### Products
Products can be created and displayed. Users can view product details.

### Cart
Users can add and remove products from their cart.

### Checkout
Stripe Checkout is used for payment processing.  
The backend creates a checkout session and the user is redirected to Stripe's payment page.

### Orders
After successful payment, the order is stored in MongoDB and the user's cart is cleared.

### Invoices
Users can generate and download invoice PDFs for their orders.

Products Pages
<img width="1911" height="921" alt="image" src="https://github.com/user-attachments/assets/3e44c25d-9391-4880-9146-e01b94b798d8" />
<img width="1919" height="924" alt="image" src="https://github.com/user-attachments/assets/b3f7ada5-993d-4467-8d91-9c7f8df821d3" />

Cart/Order Interface
<img width="1920" height="919" alt="image" src="https://github.com/user-attachments/assets/83bf22b3-2ded-464a-8efb-470c6a2ec435" />
<img width="1916" height="922" alt="image" src="https://github.com/user-attachments/assets/c22b0464-ca6d-4ee5-91f8-b48f2eeddd25" />
Order history
<img width="1912" height="673" alt="image" src="https://github.com/user-attachments/assets/a5728cb4-4c6a-4caa-896f-df28abb3a971" />

Payment Section
<img width="1915" height="921" alt="image" src="https://github.com/user-attachments/assets/ad3aaad5-679f-45de-9b9b-2d64f4222523" />

Signup/LoginSection
<img width="1918" height="920" alt="image" src="https://github.com/user-attachments/assets/7cd0c798-c8f6-451e-aa57-1f85e7641595" />
<img width="1919" height="922" alt="image" src="https://github.com/user-attachments/assets/1c4df8c6-1d71-44aa-8700-91a71d59f385" />



