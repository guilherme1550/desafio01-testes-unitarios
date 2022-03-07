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

describe("Get Statement Operation", () => {
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

    it("Should be able to Get a Statement Operation", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
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

        const response = await request(app)
        .get(`/api/v1/statements/${deposit.id}`)
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(200);

        expect(response.body).toMatchObject({
            id: deposit.id,
            user_id: user.id,
            description: depositDescription,
            amount: depositAmount.toFixed(2).toString(),
            type: depositType,
            created_at: deposit.created_at.toISOString(),
            updated_at: deposit.updated_at.toISOString()
        })
    });

    it("Should not be able to Get a Statement Operation if user does not exists", async () => {
        const name = "Alan";
        const email = "alan@email.com.br";
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
        connection.query("DELETE FROM users WHERE id = $1", [user.id])

        const response = await request(app)
        .get(`/api/v1/statements/${deposit.id}`)
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(404);

        expect(response.body).toMatchObject({
            message: "User not found"
        })
    });

    it("Should not be able to Get a Statement Operation if statement does not exists", async () => {
        const name = "Bruno";
        const email = "bruno@email.com.br";
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

        //Criação do depósito(statement)
        const deposit = ormStatementsRepository.create({
            user_id: user.id,
            amount: depositAmount,
            description: depositDescription,
            type: depositType
        })
        await ormStatementsRepository.save(deposit);

        //Exclusão do depósito(statement)
        connection.query("DELETE FROM statements WHERE id = $1", [deposit.id])

        const response = await request(app)
        .get(`/api/v1/statements/${deposit.id}`)
        .set({
            "authorization": `Bearer: ${token}`
        })
        .expect(404);

        expect(response.body).toMatchObject({
            message: "Statement not found"
        })
    });
})