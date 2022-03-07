import { app } from "../../../../app";
import request from "supertest";
import createConnection from "../../../../database";
import { Connection, Repository, getRepository } from "typeorm";

import { User } from "@modules/users/entities/User";
import { hash } from "bcryptjs";
describe("Authenticate User", () => {
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

    it("Should be able to authenticate the user", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);
        
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        
        await ormUsersRepository.save(user);

        const response = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        })
        .expect("Content-Type", /json/)
        .expect(200);
        
        // Podemos utilizar desta maneira, com o expect do Jest, ou da maneira acima com o expect do Supertest
        expect(response.status).toBe(200);
        
        expect(response.body).toEqual(expect.objectContaining({
            user: expect.objectContaining({
                name,
                email
            }),
        }));

        // Para este teste passar, é necessário utilizar da maneira acima(Pois desta maneira, 
        // teria que colocar todas as propriedades que vem no objeto), 
        // ou utilizar com o toMatchObject, igual na linha 67
        // expect(response.body).toEqual(expect.objectContaining({
        //     user: {
        //         name,
        //         email
        //     }
        // }));

        expect(response.body).toMatchObject({
            user: {
                name,
                email
            }
        })
            
        expect(response.body).not.toEqual(expect.objectContaining({
            user: expect.objectContaining({
                id: ""
            }),
        }));

        expect(response.body).not.toEqual(expect.objectContaining({
            token: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            token: expect.any(String)
        }))
    });

    it("Should not be able to authenticate the user with incorrect email ", async () => {
        const name = "Guilherme2";
        const email = "guilherme2@email.com.br";
        const password = "1234";
        const passwordHash = await hash(password, 8);
        
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        
        await ormUsersRepository.save(user);

        const response = await request(app)
        .post("/api/v1/sessions")
        .send({
            email: "Incorrect email",
            password
        })
        .expect("Content-Type", /json/)
        .expect(401);
        
        // Podemos utilizar desta maneira, com o expect do Jest, ou da maneira acima com o expect do Supertest
        expect(response.status).toBe(401);
        
        expect(response.body).toMatchObject({
            message: "Incorrect email or password"
        })
    });

    it("Should not be able to authenticate the user with incorrect password ", async () => {
        const name = "Guilherme3";
        const email = "guilherme3@email.com.br";
        const password = "4321";
        const passwordHash = await hash(password, 8);
        
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        
        await ormUsersRepository.save(user);

        const response = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password: "Incorrect password"
        })
        .expect("Content-Type", /json/)
        .expect(401);
        
        // Podemos utilizar desta maneira, com o expect do Jest, ou da maneira acima com o expect do Supertest
        expect(response.status).toBe(401);
        
        expect(response.body).toMatchObject({
            message: "Incorrect email or password"
        })
    });
});

// describe("teste", () => {
//     it("teste", () => {
//         const a = 1
//         expect(a).toBe(1);
//     })
// })