// 1. Hatanın çözümü: User modelini mutlaka içeri aktarmalısın!
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    // Session bilgisini terminalde kontrol et
    console.log('Session Durumu:', req.session.isLoggedIn);

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        // Artik cookie split ile ugrasmıyoruz, direkt session'dan okuyoruz
        isAuthenticated: req.session.isLoggedIn
    });
};
exports.postLogin = (req, res, next) => {
    User.findById('69a17a290c426225a8581a9c')
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;

            req.session.save(err => {
                console.log(err);
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    // Session'ı imha ediyoruz
    req.session.destroy(err => {
        if (err) {
            console.log('Logout Hatası:', err);
        }
        // Sadece silme işlemi bittikten sonra yönlendiriyoruz
        res.redirect('/');
    });
};