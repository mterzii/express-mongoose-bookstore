const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/products');
            }

            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products'
            });
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                totalProducts: totalItems,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
};

exports.getCart = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        })
        .catch(err => {
            console.log('GET CART ERROR:', err);
            next(err);
        });
};

exports.postCart = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const prodId = req.body.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/products');
            }
            return req.user.addToCart(product);
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const prodId = req.body.productId;

    req.user
        .removeFromCart(prodId)
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
};

exports.getCheckout = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    let products;
    let total = 0;

    req.user
        .populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;

            if (!products || products.length === 0) {
                return res.render('shop/checkout', {
                    path: '/checkout',
                    pageTitle: 'Checkout',
                    products: [],
                    totalSum: 0,
                    sessionId: null,
                    stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
                });
            }

            total = 0;
            products.forEach(p => {
                total += p.quantity * Number(p.productId.price);
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: products.map(p => {
                    return {
                        quantity: p.quantity,
                        price_data: {
                            currency: 'usd',
                            unit_amount: Math.round(Number(p.productId.price) * 100),
                            product_data: {
                                name: p.productId.title,
                                description: p.productId.description || ''
                            }
                        }
                    };
                }),
                success_url:
                    req.protocol +
                    '://' +
                    req.get('host') +
                    '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url:
                    req.protocol +
                    '://' +
                    req.get('host') +
                    '/checkout/cancel'
            });
        })
        .then(session => {
            if (!session) {
                return;
            }

            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
                sessionId: session.id,
                stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
            });
        })
        .catch(err => {
            console.log('GET CHECKOUT ERROR:', err);
            next(err);
        });
};

exports.getCheckoutSuccess = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc }
                };
            });

            const order = new Order({
                user: {
                    name: req.user.email,
                    userId: req.user._id
                },
                products: products
            });

            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.log('POST ORDER ERROR:', err);
            next(err);
        });
};

exports.getCheckoutCancel = (req, res, next) => {
    res.redirect('/checkout');
};

exports.postOrder = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc }
                };
            });

            const order = new Order({
                user: {
                    name: req.user.email,
                    userId: req.user._id
                },
                products: products
            });

            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.log('POST ORDER ERROR:', err);
            next(err);
        });
};

exports.getOrders = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch(err => {
            console.log(err);
            next(err);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found.'));
            }

            if (!req.user || order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }

            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '"'
            );

            const pdfDoc = new PDFDocument();
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', { underline: true });
            pdfDoc.text('-----------------------');

            let totalPrice = 0;

            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc.text(
                    prod.product.title +
                    ' - ' +
                    prod.quantity +
                    ' x $' +
                    prod.product.price
                );
            });

            pdfDoc.text('---');
            pdfDoc.fontSize(20).text('TOTAL PRICE: $' + totalPrice);

            pdfDoc.end();
        })
        .catch(err => next(err));
};