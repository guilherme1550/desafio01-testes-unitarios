import { app } from "../../../../app";
import request from "supertest";
import { Connection, Repository, createConnection, getRepository } from "typeorm"
import { User } from "@modules/users/entities/User";
import { hash } from "bcryptjs";
import { Statement } from "@modules/statements/entities/Statement";


enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe("Create Statement", () => {
    let connection: Connection;
    let ormUsersRepository: Repository<User>;
    let ormStatementsRepository: Repository<Statement>

    beforeAll( async () => {
        connection = await createConnection();
        
        await connection.query("DROP TABLE IF EXISTS statements");
        await connection.query("DROP TABLE IF EXISTS users");
        await connection.query("DROP TABLE IF EXISTS migrations");
        
        await connection.runMigrations();
        ormUsersRepository = getRepository(User);
        ormStatementsRepository = getRepository(Statement);
    })

    afterAll( async () => {
        // await connection.dropDatabase();
        await connection.close();
    })

    it("Should be able to create a new statement with operation type: Deposit", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

        const amount = 100;
        const description = "Deposito de R$100";
        const depositType = OperationType.DEPOSIT;
        
        //Criação do usuário para gerar o token
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        await ormUsersRepository.save(user);
        const authenticatedUser = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        });
        const { token } = authenticatedUser.body;

        const response = await request(app)
        .post("/api/v1/statements/deposit")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount,
            description
        })
        .expect(201);

        expect(response.body).toHaveProperty("id");
        
        expect(response.body).not.toEqual(expect.objectContaining({
            id: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            id: expect.any(String)
        }))
        
        expect(response.body).toHaveProperty("created_at");
        
        expect(response.body).not.toEqual(expect.objectContaining({
            created_at: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            created_at: expect.any(String)
        }))

        expect(response.body).toHaveProperty("updated_at");
        
        expect(response.body).not.toEqual(expect.objectContaining({
            updated_at: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            updated_at: expect.any(String)
        }))

        expect(response.body).toMatchObject({
            user_id: user.id,
            description,
            amount,
            type: depositType,
        })
    })

    it("Should be able to create a new statement with operation type: Withdraw", async () => {
        const name = "Guilherme2";
        const email = "guilherme2@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

        const depositAmount = 100;
        const depositDescription = "Deposito de R$100";
        const depositType = OperationType.DEPOSIT;

        const withDrawAmount = 50;
        const withDrawDescription = "Saque de R$50";
        const withDrawType = OperationType.WITHDRAW;
        
        //Criação do usuário para gerar o token
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        await ormUsersRepository.save(user);
        const authenticatedUser = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        });
        const { token } = authenticatedUser.body;

        //Criação do depósito
        const deposit = ormStatementsRepository.create({
            user_id: user.id,
            amount: depositAmount,
            description: depositDescription,
            type: depositType
        })
        await ormStatementsRepository.save(deposit);

        const response = await request(app)
        .post("/api/v1/statements/withdraw")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount: withDrawAmount,
            description: withDrawDescription
        })
        .expect(201);

        expect(response.body).toHaveProperty("id");
        
        expect(response.body).not.toEqual(expect.objectContaining({
            id: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            id: expect.any(String)
        }))
        
        expect(response.body).toHaveProperty("created_at");
        
        expect(response.body).not.toEqual(expect.objectContaining({
            created_at: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            created_at: expect.any(String)
        }))

        expect(response.body).toHaveProperty("updated_at");
        
        expect(response.body).not.toEqual(expect.objectContaining({
            updated_at: ""
        }));

        expect(response.body).toEqual(expect.objectContaining({
            updated_at: expect.any(String)
        }))

        expect(response.body).toMatchObject({
            user_id: user.id,
            description: withDrawDescription,
            amount: withDrawAmount,
            type: withDrawType,
        })
    });

    it("Should not be able to create a new statement with operation type: Deposit if user does not exist", async () => {
        const name = "Josué";
        const email = "josue@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

        const amount = 100;
        const description = "Depósito de R$100";

        //Criação do usuário para gerar o token
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
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

        //Criação do depósito, utilizando o usuário excluído
        const response = await request(app)
        .post("/api/v1/statements/deposit")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount,
            description
        })
        .expect(404);

        expect(response.body).toMatchObject({
            message: "User not found"
        })
    });

    it("Should not be able to create a new statement with operation type: WithDraw if user does not exist", async () => {
        const name = "Rivaldo";
        const email = "rivaldo@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

        const depositAmount = 100;
        const depositDescription = "Depósito de R$100";

        const withDrawAmount = 50;
        const withDrawDescription = "Saque de R$50";

        //Criação do usuário para gerar o token
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        await ormUsersRepository.save(user);
        const authenticatedUser = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        });
        const { token } = authenticatedUser.body;

        //Criação do depósito
        await request(app)
        .post("/api/v1/statements/deposit")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount: depositAmount,
            description: depositDescription
        })
        .expect(201);
        
        //Exclusão do usuário
        await connection.query(`DELETE FROM users WHERE id = $1`, [user.id])

        //Criação do saque, utilizando o usuário excluído
        const response = await request(app)
        .post("/api/v1/statements/withdraw")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount: withDrawAmount,
            description: withDrawDescription
        })
        .expect(404);
        
        expect(response.body).toMatchObject({
            message: "User not found"
        })
    });

    it("Should not be able to create a new statement with operation type WithDraw if haven't sufficient funds", async () => {
        const name = "Rogério";
        const email = "rogerio@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

        const depositAmount = 100;
        const depositDescription = "Depósito de R$100";

        const withDrawAmount = 110;
        const withDrawDescription = "Saque de R$110";

        //Criação do usuário para gerar o token
        const user = ormUsersRepository.create({ name, email, password: passwordHash });
        await ormUsersRepository.save(user);
        const authenticatedUser = await request(app)
        .post("/api/v1/sessions")
        .send({
            email,
            password
        });
        const { token } = authenticatedUser.body;

        //Criação do depósito
        await request(app)
        .post("/api/v1/statements/deposit")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount: depositAmount,
            description: depositDescription
        })
        .expect(201);

        //Criação do saque, utilizando o usuário excluído
        const response = await request(app)
        .post("/api/v1/statements/withdraw")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .send({
            amount: withDrawAmount,
            description: withDrawDescription
        })
        .expect(400);
        
        expect(response.body).toMatchObject({
            message: "Insufficient funds"
        })
    });
})