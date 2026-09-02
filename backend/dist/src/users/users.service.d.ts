import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private db;
    constructor(db: any);
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateUserDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
