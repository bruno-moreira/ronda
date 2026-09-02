import { CreateRouteDto } from './dto/create-route.dto';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
export declare class RoutesCheckpointsService {
    private db;
    constructor(db: any);
    createRoute(dto: CreateRouteDto): Promise<any>;
    findAllRoutes(): Promise<any[]>;
    findRouteById(id: string): Promise<any>;
    deleteRoute(id: string): Promise<{
        message: string;
    }>;
    createCheckpoint(dto: CreateCheckpointDto): Promise<any>;
    regenerateQrCodeHash(checkpointId: string): Promise<any>;
    deleteCheckpoint(id: string): Promise<{
        message: string;
    }>;
    private generateQrHash;
}
