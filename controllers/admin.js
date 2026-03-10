const mongoose = require('mongoose');

const fileHelper = require('../util/file');


const { validationResult } = require('express-validator');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file; // Multer dosyayı buraya koyar
  // .single("image") file içine at der o yüzden req.file
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);

  // 1. Manuel Dosya Kontrolü (Multer filtrelemesine takılmış veya seçilmemiş olabilir)
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path.replace(/\\/g, "/"); // "images/dosya-adi.png" gibi bir string

  console.log("DEBUG title:", title);
  console.log("DEBUG price:", price);
  console.log("DEBUG description:", description);
  console.log("DEBUG imageUrl:", imageUrl);
  console.log("DEBUG req.user:", req.user);
  console.log("DEBUG req.user._id:", req.user ? req.user._id : null);

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl, // Artık "images/dosya-adi.png" gibi bir string
    userId: req.user._id
  });

  console.log("DEBUG product before save:", product);

  product
    .save()
    .then(result => {
      console.log('Created Product');
      console.log("DEBUG saved result:", result);
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log("SAVE ERROR RAW:", err);
      console.log("SAVE ERROR MESSAGE:", err.message);
      console.log("SAVE ERROR STACK:", err.stack);
      return next(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }

  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file; // Yeni dosya seçilmiş mi?
  const updatedDesc = req.body.description;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (!product || product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }

      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;

      // EĞER yeni bir resim yüklendiyse yolu güncelle, yoksa eskisini tut
      if (image) {
        fileHelper.deleteFile(product.imageUrl); // Eski resmi sil
        product.imageUrl = image.path;
      }
      console.log(product);
      return product.save();
    })
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => next(new Error(err)));
};
exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found.'));
      }

      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({ message: 'Success!' });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: 'Deleting product failed.' });
    });
};