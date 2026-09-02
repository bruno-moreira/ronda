import { RoutesCheckpointsService } from './routes-checkpoints.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
export declare class RoutesCheckpointsController {
    private readonly service;
    constructor(service: RoutesCheckpointsService);
    findAllRoutes(): Promise<any[]>;
    findRouteById(id: string): Promise<any>;
    createRoute(dto: CreateRouteDto): Promise<any>;
    deleteRoute(id: string): Promise<{
        message: string;
    }>;
    createCheckpoint(dto: CreateCheckpointDto): Promise<any>;
    regenerateQrHash(id: string): Promise<any>;
    deleteCheckpoint(id: string): Promise<{
        message: string;
    }>;
}
