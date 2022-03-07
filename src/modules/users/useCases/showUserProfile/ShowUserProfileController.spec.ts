import { app } from "../../../../app";
import request from "supertest";
import createConnection from "../../../../database"
import { Connection, Repository, getRepository } from "typeorm";

import { User } from "@modules/users/entities/User";
import { hash } from "bcryptjs";
describe("Show user profile", () => {
    let connection: Connection;
    let ormUsersRepository: Repository<User>;

    beforeAll( async () => {
        connection = await createConnection();

        await connection.query("DROP TABLE IF EXISTS statements");
        await connection.query("DROP TABLE IF EXISTS users");
        await connection.query("DROP TABLE IF EXISTS migrations");

        await connection.runMigrations();
        ormUsersRepository = getRepository(User); 
    })

    afterAll( async () => {
        // await connection.dropDatabase();
        await connection.close();
    })

    it("Should be able to show user profile", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);
        
        const user = ormUsersRepository.create({ name, email, password: passwordHash })
        
        await ormUsersRepository.save(user);

        const authenticatedUser = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        });

        const { token } = authenticatedUser.body;
        
        const response = await request(app)
        .get("/api/v1/profile")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(200);

        expect(response.body).toMatchObject({
            id: user.id,
            name,
            email,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
        });
    });

    it("Should not be able to show user profile if user does not exist", async () => {
        const name = "Guilherme2";
        const email = "guilherme2@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);
        
        //Criação do usuário para gerar o token
        const user = ormUsersRepository.create({ name, email, password: passwordHash })
        await ormUsersRepository.save(user);
        const authenticatedUser = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        });
        const { token } = authenticatedUser.body;

        //Exclusão do usuário
        await connection.query(`DELETE FROM users WHERE id = $1`, [user.id])
        
        const response = await request(app)
        .get("/api/v1/profile")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(404);

        expect(response.body).toMatchObject({
            message: "User not found"
        });
    });
});