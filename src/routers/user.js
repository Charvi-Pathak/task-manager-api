const express = require('express');
const multer = require('multer');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendAccountCancellationEmail } = require('../emails/accounts');

const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        const addedUser = await user.save();
        sendWelcomeEmail(addedUser.email, addedUser.name);
        const token = await user.generateAuthToken();
        res.send({ user: addedUser, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    }
    catch (e) {
        res.status(400).send();
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token != req.token);
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/users/me', auth, async (req, res) => {
    try {
        const partialUser = req.body;
        const keys = ['name', 'email', 'age', 'password'];
        const receivedKeys = Object.keys(partialUser);

        const isValid = receivedKeys.every(key => keys.includes(key));

        if (!isValid) {
            return res.status(400).send({ error: 'Invalid update' });
        }

        receivedKeys.forEach(key => req.user[key] = partialUser[key])

        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.delete('/users/me', auth, async (req, res) => {

    try {

        await req.user.remove();
        sendAccountCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    }
    catch (error) {
        res.status(500).send(error);
    }
})

const upload = multer({
    /* if we define dest here, the middleware function called, will save the image's binary data
    to the specified location and not pass it further to the router's callback function */
    // dest: 'avatar',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!(file.originalname.match(/\.(jpg|jpeg|png)$/))) {
            return cb(new Error('File must be jpg, jpeg or png'));
        }
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png').send(user.avatar);
    } catch (e) { res.status(404).send({ error: 'requested resource not found' }) }
});

router.get('/users/:id', async (req, res) => {
    console.log(req.params.id);
    res.send(req.params.id);
});

module.exports = router;