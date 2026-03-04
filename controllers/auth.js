const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',

  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error'); // Flash mesajı al
  if (message.length > 0) {
    message = message[0]; // İlk mesajı al
  } else {
    message = null; // Mesaj yoksa null yap
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password.'); // Flash mesaj ekle
        return res.redirect('/login');
      }
      return bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            // BSON HATASI ÇÖZÜMÜ: Sadece ID'yi string olarak sakla
            req.session.user = user._id.toString();

            return req.session.save(err => {
              if (err) console.log(err);
              res.redirect('/');
            });
          }
          res.redirect('/login');
        });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
};





exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }

  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'Email already exists. Please choose a different one.');
        return res.redirect('/signup');
      }
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      // Eğer redirect döndüyse hashedPassword undefined olabilir. Güvenli çık:
      if (!hashedPassword) return;

      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(result => {
      if (!result) return;
      res.redirect('/login');
    })
    .catch(err => console.log(err));
};
exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/');
  });
};