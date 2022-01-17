import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { User } from "@modules/users/entities/User";
import { hash } from "bcryptjs";
import { GetBalanceError } from "./GetBalanceError";

enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe("Get Balance", () => {
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let getBalanceUseCase: GetBalanceUseCase;
    let user: User;

    beforeEach( async () => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        inMemoryStatementsRepository = new InMemoryStatementsRepository();
        getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);

        const passwordHash = await hash("12344321", 8);

        user = await inMemoryUsersRepository.create({ 
            name: "Guilherme", 
            email: "guilherme@email.com.br", 
            password: passwordHash 
        });
    })

    it("Should be able to get balance", async() => {
        const user_id = user.id as string;
        
        const depositType = OperationType.DEPOSIT;
        const depositAmount = 100;
        const depositDescription = "Depositar R$100";

        const withDrawType = OperationType.WITHDRAW;
        const withDrawAmount = 90;
        const withDrawDescription = "Sacar R$90";     
        
        //Criação do Primeiro Statement
        await inMemoryStatementsRepository.create({ 
            user_id, 
            description: depositDescription, 
            amount: depositAmount, 
            type: depositType
        });

        //Criação do Segundo Statement
        await inMemoryStatementsRepository.create({ 
            user_id, 
            description: withDrawDescription, 
            amount: withDrawAmount, 
            type: withDrawType
        });
        
        const balance = await getBalanceUseCase.execute({ user_id })

        expect(balance).toHaveProperty("balance");
        expect(balance).not.toEqual(expect.objectContaining({
            statement: expect.arrayContaining([
                expect.objectContaining({
                    id: ""
                }),
                expect.objectContaining({
                    id: ""
                }),
            ]),
        }));
        expect(balance).not.toBeNull();
        expect(balance).toEqual(expect.objectContaining({ balance: 10 }));
        expect(balance).toEqual(expect.objectContaining({
            statement: expect.arrayContaining([
                expect.objectContaining({
                    user_id,
                    description: depositDescription,
                    amount: depositAmount, 
                    type: depositType
                }),
                expect.objectContaining({
                    user_id,
                    description: withDrawDescription, 
                    amount: withDrawAmount, 
                    type: withDrawType
                })
            ]),
        }));
        expect(balance).toMatchObject({
            statement: [
                {
                    user_id: user_id,
                    description: depositDescription,
                    amount: depositAmount,
                    type: depositType 
                },
                {
                    user_id: user_id,
                    description: withDrawDescription,
                    amount: withDrawAmount,
                    type: withDrawType
                }
            ],
            balance: 10
        });
    });
    it("Should not be able to get balance if user does not exist", () => {
        expect(async () => {
            const user_id = "Non existent user";
            await getBalanceUseCase.execute({ user_id });
        }).rejects.toBeInstanceOf(GetBalanceError);
    });
});