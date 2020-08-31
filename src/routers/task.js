const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        const addedTask = await task.save();
        res.status(201).send(addedTask);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/tasks', auth, async (req, res) => {
    try {
        const match = {};
        const sort = {};

        if (req.query.completed)
            match.completed = req.query.completed === 'true';


        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'dsc' ? -1 : 1;
        }

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    try {

        const _id = req.params.id;
        const partialTask = req.body;
        const keys = ["description", "completed"];
        const receivedKeys = Object.keys(partialTask);
        // console.log(keys, receivedKeys);
        const valid = receivedKeys.every(key => keys.includes(key));

        if (!valid) {
            return res.status(400).send({ error: "Invalid Updates" });
        }

        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send({ error: "Task not found" });
        }

        receivedKeys.forEach(key => task[key] = partialTask[key]);
        await task.save();

        res.status(200).send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})


router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        console.log(req.user);
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send({ error: 'No Task Found' });
        }

        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router;