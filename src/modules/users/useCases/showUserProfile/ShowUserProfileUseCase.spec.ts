import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository"
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";
import { hash } from "bcryptjs";
import { ShowUserProfileError } from "./ShowUserProfileError";

describe("Show user profile", () => {
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let showUserProfileUseCase: ShowUserProfileUseCase;

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository);
    })

    it("Should be able to show user profile", async () => {
        const name = "Guilherme";
        const email = "guilherme@email.com.br";
        const password = "12344321";

        const passwordHash = await hash(password, 8);

        const user = await inMemoryUsersRepository.create({ name, email, password: passwordHash });
        
        const response = await showUserProfileUseCase.execute(user.id as string);

        expect(response).toHaveProperty("id");
        expect(response).not.toEqual(expect.objectContaining({ id: ""}));
        expect(response).toEqual(expect.objectContaining({
            name,
            email,
        }));
    });

    it("Should not be able to show user profile if user_id does not exist", async () => {
        expect(async () => {
            const user_id = "teste"
            await showUserProfileUseCase.execute(user_id);
        }).rejects.toBeInstanceOf(ShowUserProfileError);
    })
})