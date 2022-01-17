import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { hash } from "bcryptjs";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

describe("Authenticate User", () => {
    let usersRepositoryInMemory: InMemoryUsersRepository;
    let authenticateUserUseCase: AuthenticateUserUseCase;

    beforeEach(() => {
        usersRepositoryInMemory = new InMemoryUsersRepository();
        authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    })

    it("Should be able to authenticate a user", async () => {
        const email = "guilherme@email.com.br";
        const password = "12344321";

        const passwordHash = await hash(password, 8);
        await usersRepositoryInMemory.create({ name: "Guilherme", email: email, password: passwordHash });
        
        
        const response = await authenticateUserUseCase.execute({ email, password });

        expect(response).toHaveProperty("user");
        expect(response).toHaveProperty("token");
        expect(response).not.toEqual(expect.objectContaining({ token: ""}));
        expect(response).toEqual(expect.objectContaining({ 
            "user": expect.objectContaining({
                "email": "guilherme@email.com.br"
            }) 
            }
        ));
    })

    it("Should not be able to authenticate with incorret email", async () => {
        expect( async () => {
            const email = "guilherme@email.com.br";
            const password = "12344321";

            const passwordHash = await hash(password, 8);
            await usersRepositoryInMemory.create({ name: "Guilherme", email: email, password: passwordHash });

            await authenticateUserUseCase.execute({ email: "guilherme@email.com.br123", password });
        }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
    })

    it("Should not be able to authenticate with incorrect password", () => {
        expect( async () => {
            const email = "guilherme@email.com.br";
            const password = "12344321";

            const passwordHash = await hash(password, 8);
            await usersRepositoryInMemory.create({ name: "Guilherme", email: email, password: passwordHash });

            await authenticateUserUseCase.execute({ email: "guilherme@email.com.br", password: "1234" });
        }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
    });
});