import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
import { User } from "@modules/users/entities/User";
import { hash } from "bcryptjs";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";

enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe("Get Statement Operation", () => {
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let getStatementOperationUseCase: GetStatementOperationUseCase;
    let user: User;
    

    beforeEach( async () => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        inMemoryStatementsRepository = new InMemoryStatementsRepository();
        getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
        

        const passwordHash = await hash("12344321", 8);

        user = await inMemoryUsersRepository.create({ 
            name: "Guilherme", 
            email: "guilherme@email.com.br", 
            password: passwordHash 
        });
    });

    it("Should be able to get a Statement Operation", async () => {
        const user_id = user.id as string;
        
        const depositType = OperationType.DEPOSIT;
        const depositAmount = 100;
        const depositDescription = "Depositar R$100";

        //Criação do Primeiro Statement
        const statement = await inMemoryStatementsRepository.create({ 
            user_id, 
            description: depositDescription, 
            amount: depositAmount, 
            type: depositType
        });

        const statement_id = statement.id as string;

        const response = await getStatementOperationUseCase.execute({ user_id, statement_id });

        expect(response).toMatchObject({
            id: statement_id,
            user_id,
            description: depositDescription,
            amount: depositAmount,
            type: depositType
        })
    })

    it("Should not be able to get a Statement Operation if user does not exist", async () => {
        expect(async () => {
            const user_id = user.id as string;
        
            const depositType = OperationType.DEPOSIT;
            const depositAmount = 100;
            const depositDescription = "Depositar R$100";

            //Criação do Statement
            const statement = await inMemoryStatementsRepository.create({ 
                user_id, 
                description: depositDescription, 
                amount: depositAmount, 
                type: depositType
            });

            const statement_id = statement.id as string;

            await getStatementOperationUseCase.execute({ user_id: "Non existent user", statement_id });

        }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
    });

    it("Should not be able to get an Statement Operation if statement does not exist", async () => {
        expect(async () => {
            const user_id = user.id as string;
            await getStatementOperationUseCase.execute({ user_id, statement_id: "Non existent statement" });
        }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
    });
});