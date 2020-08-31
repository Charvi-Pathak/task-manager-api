const express = require('express');
require("./db/mongoose"); // You just wanna load this

const app = express();
const port = process.env.PORT;

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('App is up and running on port ' + port);
});