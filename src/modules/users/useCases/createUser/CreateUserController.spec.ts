import { app } from "../../../../app"
import createConnection from "../../../../database"
import { Connection } from "typeorm"
import request from "supertest"

describe("Create User", () => {
    let connection: Connection

    beforeAll(async () => {
        connection = await createConnection();
        
        await connection.query("DROP TABLE IF EXISTS statements");
        await connection.query("DROP TABLE IF EXISTS users");
        await connection.query("DROP TABLE IF EXISTS migrations");
        
        await connection.runMigrations();
    })

    afterAll(async () => {
        // await connection.dropDatabase()
        await connection.close();
    })

    it("Should be able to create a new user", async () => {
        await request(app)
        .post("/api/v1/users")
        .send({
            name: "Guilherme Bento",
            email: "guilherme@email.com.br",
            password: "12344321"
        })
        .expect(201);
    })

    it("Should not be able to create a new user if email already exists", async () => {
        await request(app)
        .post("/api/v1/users")
        .send({
            name: "Guilherme Bento",
            email: "guilherme2@email.com.br",
            password: "12344321"
        })
        .expect(201);

        const response = await request(app)
        .post("/api/v1/users")
        .send({
            name: "Guilherme Bento dos Santos",
            email: "guilherme2@email.com.br",
            password: "1234"
        })
        .expect(400);

        expect(response.body).toMatchObject({
            message: "User already exists"
        })
    })
})

// describe("teste", () => {
//     it("teste", () => {
//         const a = 1
//         expect(a).toBe(1);
//     })
// })