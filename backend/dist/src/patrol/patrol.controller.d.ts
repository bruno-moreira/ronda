import { PatrolService } from './patrol.service';
import { StartPatrolDto } from './dto/start-patrol.dto';
import { SyncPatrolLogsDto } from './dto/sync-patrol-log.dto';
export declare class PatrolController {
    private readonly patrolService;
    constructor(patrolService: PatrolService);
    startSession(req: any, dto: StartPatrolDto): Promise<any>;
    getSessions(req: any): Promise<any>;
    getSessionDetails(id: string): Promise<any>;
    getReport(req: any, body?: any): Promise<any>;
    syncLogs(dto: SyncPatrolLogsDto): Promise<{
        sessionsSummary: any[];
        totalReceived: number;
        processedCount: number;
        errors: {
            localId: string;
            error: string;
        }[];
        affectedSessions: string[];
    }>;
}
