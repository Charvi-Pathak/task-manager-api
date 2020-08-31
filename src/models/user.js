const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid Email');
            }
        }
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 0)
                throw new Error('Age cannot be negative')
        }
    },
    password: {
        type: String,
        trim: true,
        minlength: [6, 'Password too short'],
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password should not contain the word password');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.password;
    delete user.tokens;
    delete user.avatar;
    return user;
}

//this is a model method.
// Used when you have to work with all the model data
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }
    return user;
}

//this is an instance function
//works on a particular instance
userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });

    await user.save();
    return token;
}


userSchema.pre('save', async function (next) {
    const thisUser = this;
    if (thisUser.isModified('password')) {
        thisUser.password = await bcrypt.hash(thisUser.password, 8);
    }

    next(); // indicates that the pre function has completed it's execution, 
    // continue with the next 
});

userSchema.pre('remove', async function (req, res, next) {

    const user = this;
    await Task.deleteMany({ owner: user._id })

    next();
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

const User = mongoose.model('User', userSchema);

module.exports = User;