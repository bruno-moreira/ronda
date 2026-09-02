import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateUserDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
