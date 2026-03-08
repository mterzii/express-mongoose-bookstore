require('dotenv').config(); const crypto = require('crypto');
// Şifreleme ve güvenlik işlemleri için kullanılır.
// Rastgele ve kırılması zor token üretmek için kullanıyoruz.

const bcrypt = require('bcryptjs');
// Kullanıcı şifrelerini hashlemek için kullanılır.
// Şifreler düz metin olarak DB'ye kaydedilmez.

const nodemailer = require('nodemailer');
// Node.js içinde email göndermeyi sağlayan ana kütüphane.

// const sendgridTransport = require('nodemailer-sendgrid-transport');
// Nodemailer'ın SendGrid servisi ile konuşmasını sağlayan adapter.

const User = require('../models/user');
// MongoDB'deki User modelini projeye dahil ediyoruz.

const { validationResult } = require('express-validator');// Form doğrulama sonuçlarını almak için kullanılır.
//  validationResult “Kurallar çalıştı, sonuç ne?”



const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // 587 portu için false kalmalı
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


// ===============================
// LOGIN SAYFASI
// ===============================
exports.getLogin = (req, res, next) => {

  // Flash mesajı al
  let message = req.flash('error');

  // Flash array döndürür, mesaj varsa ilk elemanı alıyoruz
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  // Login sayfasını render ediyoruz
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
  });
};



// ===============================
// SIGNUP SAYFASI
// ===============================
exports.getSignup = (req, res, next) => {

  // Flash mesajını al
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0]; // ilk mesaj
  } else {
    message = null;
  }

  // Signup sayfasını render ediyoruz
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
  });
};



// ===============================
// LOGIN İŞLEMİ
// ===============================
exports.postLogin = (req, res, next) => {

  // Formdan gelen email ve password
  const email = req.body.email;
  const password = req.body.password;

  // Email'e göre kullanıcıyı DB'de ara
  User.findOne({ email: email })

    .then(user => {

      // Eğer kullanıcı bulunamazsa
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }

      // Girilen şifre ile DB'deki hash karşılaştırılır
      return bcrypt.compare(password, user.password)

        .then(doMatch => {

          // Şifre doğruysa
          if (doMatch) {

            // Session içine login bilgisini kaydet
            req.session.isLoggedIn = true;

            // BSON hatası çözümü için sadece ID string olarak saklanır
            req.session.user = user._id.toString();

            // Session kaydedilir
            return req.session.save(err => {
              if (err) console.log(err);

              // Ana sayfaya yönlendir
              res.redirect('/');
            });
          }

          // Şifre yanlışsa tekrar login
          res.redirect('/login');
        });
    })

    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
};



// ===============================
// SIGNUP İŞLEMİ
// ===============================
exports.postSignup = (req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  //const errors = validationResult(req) hata var mı diye görünmez listeyi kontrol eder route'ta check ekledigimiz yer

  //Eğer liste boş değilse (yani hata varsa)" demektir.
  if (!errors.isEmpty()) {
    console.log(errors.array());
    //Hata varsa,  veri tabanına kaydedilmesini engeller. auth/signup) geri atar.
    // 422 = Unprocessable Entity  yanlış veri gönderildiğinde kullanılır.
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Sign Up',
      errorMessage: errors.array()[0].msg,
      //errorMessage: errors.array() hatayı gösterir.Kullanıcı nerde hata yaptıgını görür
    });
  }

  // Şifreler eşleşmiyorsa
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }

  // Aynı email DB'de var mı kontrol et
  User.findOne({ email: email })

    .then(userDoc => {

      // Email zaten varsa
      if (userDoc) {
        req.flash('error', 'Email already exists. Please choose a different one.');
        return res.redirect('/signup');
      }

      // Şifreyi hashle
      return bcrypt.hash(password, 12);
    })

    .then(hashedPassword => {

      // Eğer redirect olduysa hashedPassword undefined olabilir
      if (!hashedPassword) return;

      // Yeni kullanıcı oluştur
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });

      return user.save();
    })

    .then(result => {

      // Kullanıcıya mail gönder
      return transporter.sendMail({
        to: 'mertterzi.143@gmail.com', // alıcı
        from: email, // gönderen
        subject: 'Signup succeeded!', // mail konusu
        html: '<h1>You successfully signed up!</h1>' // mail içeriği
      })

        .then(() => {
          // Signup sonrası login sayfasına yönlendir
          res.redirect('/login');
        });
    })

    .catch(err => {
      console.log(err);
    });
};



// ===============================
// LOGOUT
// ===============================
exports.postLogout = (req, res, next) => {

  // Session'ı sil
  req.session.destroy(err => {

    if (err) console.log(err);

    // Ana sayfaya yönlendir
    res.redirect('/');
  });
};



// ===============================
// RESET PASSWORD SAYFASI
// ===============================
exports.getReset = (req, res, next) => {

  // Flash hata mesajını al
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  // Reset sayfasını render et
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
  });
};


// ===============================
// RESET PASSWORD İŞLEMİ
// ===============================
exports.postReset = (req, res, next) => {
  const email = req.body.email.trim();

  // 1. ADIM: Bilgisayardan 32 adet rastgele "karmaşık veri (byte)" vermesini ister.
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }

    // 2. ADIM: Buffer veriyi okunabilir metne (hex) çeviriyoruz.
    const token = buffer.toString('hex');

    // 3. ADIM: Kullanıcıyı MongoDB'de arıyoruz.
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          // EĞER KULLANICI YOKSA (Tanımlanmayan mail durumu):
          req.flash('error', 'No account with that email found.');

          // MESAJIN EKRANDA GÖRÜNMESİ İÇİN: Önce session'ı kaydet, sonra redirect yap.
          // "Hiçbir şey olmuyor" sorununu bu satır çözer.
          return req.session.save(saveErr => {
            if (saveErr) console.log(saveErr);
            res.redirect('/reset');
          });
        }

        // 4. ADIM: Token ve süreyi (1 saat) kullanıcıya atıyoruz.
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;

        // Veritabanına kaydediyoruz.
        return user.save()
          .then(result => {
            // Kayıt başarılıysa kullanıcıyı ana sayfaya atalım ki sayfa takılı kalmasın.
            res.redirect('/');

            // 5. ADIM: Mail gönderme operasyonu (Yeni SMTP Key burada devreye giriyor).
            // postSignup içindeki ilgili kısım
            return transporter.sendMail({
              to: email, // Kayıt olan kullanıcıya gitsin
              from: 'mertterzi.143@gmail.com', // BURAYI email yerine onaylı adresin yap
              subject: 'Signup succeeded!',
              html: '<h1>You successfully signed up!</h1>'
            })
          });
      })
      .catch(err => {
        console.log('Reset işlemi sırasında hata:', err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      let message = req.flash('error');

      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),   // EKLEDİĞİN KISIM
        passwordToken: token
      });
    })
    .catch(err => {
      console.log(err);
    });
};



exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
}