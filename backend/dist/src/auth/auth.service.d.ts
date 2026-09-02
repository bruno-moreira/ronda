import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService implements OnModuleInit {
    private db;
    private jwtService;
    constructor(db: any, jwtService: JwtService);
    onModuleInit(): Promise<void>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            nome: any;
            email: any;
            role: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<any>;
}
