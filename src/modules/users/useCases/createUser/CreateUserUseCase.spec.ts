import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "./CreateUserUseCase";
import { CreateUserError } from "./CreateUserError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Create a new user", () => {

    beforeEach(() => {
        usersRepositoryInMemory = new InMemoryUsersRepository();
        createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    })
    
    it("Should be able to create a new user", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
        const password = "12344321";
        
        const user = await createUserUseCase.execute({ name, email, password });
        
        expect(user).toHaveProperty("id");
        expect(user).toEqual(expect.objectContaining({            
            email: "guilherme@email.com.br",
        }))
    })

    it ("Should not be able to create a new user if the email exists", () => {
        expect( async () => {
            const name = "Guilherme";
            const email = "guilherme@email.com.br";
            const password = "12344321";
    
            await createUserUseCase.execute({ name, email, password });
            await createUserUseCase.execute({ name, email, password });
        }).rejects.toBeInstanceOf(CreateUserError);
    });
});