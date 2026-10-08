const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { pool } = require("../config/database");
const { createBorrowRequest } = require("../controllers/borrowRequestController");

const originalExecute = pool.execute;

afterEach(() => {
    pool.execute = originalExecute;
});

function dateAfterDays(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

async function submitRequest(expectedReturnDate) {
    const response = {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };

    await createBorrowRequest({
        user: { user_id: 12 },
        body: {
            resource_id: 34,
            expected_return_date: expectedReturnDate,
            message: "Need this resource"
        }
    }, response);

    return response;
}

test("rejects a return date more than 30 days away before querying the database", async () => {
    let queryCount = 0;
    pool.execute = async () => {
        queryCount += 1;
        return [[], []];
    };

    const response = await submitRequest(dateAfterDays(365));

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /within the next 30 days/);
    assert.equal(queryCount, 0);
});

test("accepts a return date exactly 30 days away", async () => {
    let insertReached = false;
    pool.execute = async (query) => {
        if (query.includes("FROM resources")) {
            return [[{
                resource_id: 34,
                owner_id: 56,
                availability: "Available"
            }], []];
        }

        if (query.includes("FROM borrow_requests")) {
            return [[], []];
        }

        if (query.includes("INSERT INTO borrow_requests")) {
            insertReached = true;
            return [{ insertId: 78 }, []];
        }

        throw new Error(`Unexpected SQL query: ${query}`);
    };

    const response = await submitRequest(dateAfterDays(30));

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.success, true);
    assert.equal(insertReached, true);
});
