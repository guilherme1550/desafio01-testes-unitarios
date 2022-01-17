import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository"
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { hash } from "bcryptjs";
import { User } from "@modules/users/entities/User";
import { CreateStatementError } from "./CreateStatementError";


enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe("Create Statement", () => {
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let createStatementUseCase: CreateStatementUseCase;
    let user: User;

    beforeEach( async () => {
        inMemoryUsersRepository = new InMemoryUsersRepository;
        inMemoryStatementsRepository = new InMemoryStatementsRepository;
        createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);

        const passwordHash = await hash("12344321", 8);

        user = await inMemoryUsersRepository.create({ 
            name: "Guilherme", 
            email: "guilherme@email.com.br", 
            password: passwordHash 
        });
    })
    
    it("Should be able to create a new statement with operation type: Deposit", async () => {
        const user_id = user.id as string;
        const depositType = OperationType.DEPOSIT;
        const depositAmount = 100;
        const depositDescription = "Depositar R$100";

        const statement = await createStatementUseCase.execute({ 
            user_id, 
            type: depositType, 
            amount: depositAmount, 
            description: depositDescription 
        });

        expect(statement).toHaveProperty("id");
        expect(statement).not.toEqual(expect.objectContaining({ id: "" }));
        expect(statement).toEqual(expect.objectContaining({
            description: depositDescription,
            amount: depositAmount,
            type: depositType,
            user_id
        }));
    });

    it("Should be able to create a new statement with operation type: WithDraw", async () => {
        const user_id = user.id as string;
        const depositType = OperationType.DEPOSIT;
        const depositAmount = 100;
        const depositDescription = "Depositar R$100";

        const withDrawType = OperationType.WITHDRAW;
        const withDrawAmount = 100;
        const withDrawDescription = "Sacar R$100";

        await createStatementUseCase.execute({ 
            user_id, 
            type: depositType, 
            amount: depositAmount, 
            description: depositDescription
        });

        const statement = await createStatementUseCase.execute({
            user_id,
            type: withDrawType,
            amount: withDrawAmount,
            description: withDrawDescription
        })

        expect(statement).toHaveProperty("id");
        expect(statement).not.toEqual(expect.objectContaining({ id: "" }));
        expect(statement).toEqual(expect.objectContaining({
            description: withDrawDescription,
            amount: withDrawAmount,
            type: withDrawType,
            user_id
        }));
    });

    it("Should not be able to create a new statement with operation type: Deposit if user does not exist", () => {
        expect( async () => {
            const user_id = "Non existent user";
            const depositType = OperationType.DEPOSIT;
            const depositAmount = 100;
            const depositDescription = "Depositar R$100";

            await createStatementUseCase.execute({ 
                user_id, 
                type: depositType, 
                amount: depositAmount, 
                description: depositDescription 
            });
        }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
    });

    it("Should not be able to create a new statement with operation type: WithDraw if user does not exist", () => {
        expect( async () => {
            const user_id = "Non existent user";
            const withDrawType = OperationType.WITHDRAW;
            const withDrawAmount = 110;
            const withDrawDescription = "Sacar R$110";

            await createStatementUseCase.execute({ 
                user_id, 
                type: withDrawType, 
                amount: withDrawAmount, 
                description: withDrawDescription 
            });
        }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
    });
    

    it("Should not be able to create a new statement with operation type WithDraw if haven't sufficient funds", () => {
        expect( async () => {
            const user_id = user.id as string;
            const depositType = OperationType.DEPOSIT;
            const depositAmount = 100;
            const depositDescription = "Depositar R$100";
    
            const withDrawType = OperationType.WITHDRAW;
            const withDrawAmount = 110;
            const withDrawDescription = "Sacar R$110";
    
            await createStatementUseCase.execute({ 
                user_id, 
                type: depositType, 
                amount: depositAmount, 
                description: depositDescription
            });
    
            await createStatementUseCase.execute({
                user_id,
                type: withDrawType,
                amount: withDrawAmount,
                description: withDrawDescription
            });       
        }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
    });
});