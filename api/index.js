const express = require('express');
const api = express.Router();
const sql = require('./sql.js');
const tatum = require('./tatum.js');

api.post('/getCapsules', async (req, res) => {
    try {
        const [row, field] = await sql.query(
            `SELECT * FROM capsule where user=?`,
            [req.body.user]
        )
        res.send({ capsules: row })
    } catch (err) {
        console.error(err);
        res.send({ capsules: [] })
    }
})

api.post('/makeCapsule', async (req, res) => {
    try {
        await sql.query(
            `INSERT INTO capsule (user, name, asset, kind, created, expired) VALUE (?,?,?,?,NOW(),DATE_ADD(NOW(), INTERVAL 6 MONTH))`,
            [req.body.user, req.body.name, req.body.asset, req.body.kind]
        )

        const [row, field] = await sql.query(
            `SELECT * FROM user WHERE address=?`,
            [req.body.user]
        )

        const balance = await tatum.getBalance(req.body.user)

        if (row[0] > 0) {
            await sql.query(
                `UPDATE user SET balance = ? WHERE address = ?`,
                [balance, req.body.user]
            )
        } else {
            await sql.query(
                `INSERT INTO user (address, balance) VALUE (?,?)`,
                [req.body.user, balance]
            )
        }

        res.send({ msg: 'done' })
    } catch (err) {
        console.error(err);
        res.send({ msg: 'error' })
    }
})

api.post('/deleteCapsule', async (req, res) => {
    try {
        await sql.query(
            `DELETE FROM capsule WHERE id=?`,
            [req.body.id]
        )
        res.send({ msg: 'done' })
    } catch (err) {
        console.error(err);
        res.send({ msg: 'error' })
    }
})

module.exports = api;