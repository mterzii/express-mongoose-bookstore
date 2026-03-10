const express = require('express');
const User = require('../models/user');
const { check, body } = require('express-validator');// check Bu alan doğru mu?
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.')
            .normalizeEmail(),

        body('password', 'Password has to be valid.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin
);

router.post('/signup', check('email').isEmail().withMessage('Please enter a valid email')
    .custom((value, { req }) => {
        return User.findOne({ email: value })
            .then(userDoc => {
                if (userDoc) {
                    return Promise.reject('E-Mail exists already, please pick a different one.');
                }
            });
    }).normalizeEmail(),
    //BÜYÜK HARF → küçük harf
    // body('password') req.body.password demek
    body('password', 'Password must be at least 5 characters long').isLength({ min: 5 }).isAlphanumeric().trim()
    ,
    body('confirmPassword').custom((value, { req }) => {
        //Confirm Password value demek 
        if (value !== req.body.password) {
            throw new Error('Password have to match!');
        }
        return true;
    }),
    authController.postSignup);



// check('email')Formdan gelen name="email" i bul
// .isEmail() gerçekten bir e - posta formatında @olup olmadıgını kontrol eder.
router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

module.exports = router;