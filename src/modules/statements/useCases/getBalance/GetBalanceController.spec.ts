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

describe("Get Balance", () => {
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

    it("Should be able to get balance", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
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

        //Criação do saque
        const withDraw = ormStatementsRepository.create({
            user_id: user.id,
            amount: withDrawAmount,
            description: withDrawDescription,
            type: withDrawType
        })
        await ormStatementsRepository.save(withDraw);

        const response = await request(app)
        .get("/api/v1/statements/balance")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(200);

        expect(response.body).toMatchObject({
            statement: [
                {
                    id: deposit.id,
                    amount: depositAmount,
                    description: depositDescription,
                    type: depositType,
                    created_at: deposit.created_at.toISOString(),
                    updated_at: deposit.updated_at.toISOString()
                },
                {
                    id: withDraw.id,
                    amount: withDrawAmount,
                    description: withDrawDescription,
                    type: withDrawType,
                    created_at: withDraw.created_at.toISOString(),
                    updated_at: withDraw.updated_at.toISOString()
                }
            ],
            balance: 50
        });
    });

    it("Should not be able to get balance if user does not exist", async () => {
        const name = "João";
        const email = "joao@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

        const depositAmount = 100;
        const depositDescription = "Deposito de R$100";
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

        //Criação do depósito
        const deposit = ormStatementsRepository.create({
            user_id: user.id,
            amount: depositAmount,
            description: depositDescription,
            type: depositType
        })
        await ormStatementsRepository.save(deposit);

        //Exclusão do usuário
        await connection.query("DELETE FROM users WHERE id = $1", [user.id])

        const response = await request(app)
        .get("/api/v1/statements/balance")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(404);

        expect(response.body).toMatchObject({
            message: "User not found"
        });
    });

    it("Should be able to get balance if no statement exists", async () => {
        const name = "Ramalho";
        const email = "ramalho@email.com.br";
        const password = "12344321";
        const passwordHash = await hash(password, 8);

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
        .get("/api/v1/statements/balance")
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(200);

        expect(response.body).toMatchObject({
            statement: [],
            balance: 0
        });
    });
})