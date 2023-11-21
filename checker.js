const sql = require('./api/sql');
const tatum = require('./api/tatum');

// check there was transaction during day
// if there was transaction change expired date
const job1 = setInterval(async () => {
    try {
        const [row, field] = await sql.query(
            `SELECT * FROM user`
        )

        for (let i = 0; i < row.length; i++) {
            const balance = await tatum.getBalance(row[i].address);
            if (balance.toString() != (row[i].balance).toString()) {
                await sql.query(
                    `UPDATE user SET balance=? WHERE address=?`,
                    [balance.toString(), row[i].address]
                )
                await sql.query(
                    `UPDATE capsule SET expired=DATE_ADD(NOW(), INTERVAL 6 MONTH) WHERE user=?`,
                    [row[i].address]
                )
                console.log(`UPDATE ${row[i].address}`)
            }
        }

    } catch (err) {
        console.error(err)
    }
}, 86400000)

// execute capsule if expired
const job2 = setInterval(async () => {
    try {
        const [row, field] = await sql.query(
            `SELECT * FROM capsule WHERE expired<NOW()` // change
        )

        for (let i = 0; i < row.length; i++) {
            if (Number(row[i].kind) === 0) {
                await tatum.execute_kip7(row[i].user, row[i].asset);
            } else if (Number(row[i].kind === 1)) {
                await tatum.execute_kip7(row[i].user, row[i].asset);
            }

            await sql.query(
                `DELETE FROM capsule WHERE id=?`,
                [row[i].id]
            )

            console.log(`EXECUTE CAPSULE of '${row[i].user} - ${row[i].asset}'`)
        }

    } catch (err) {
        console.error(err)
    }
}, 86411000)

const checker = { job1: job1, job2: job2 }

module.exports = checker;