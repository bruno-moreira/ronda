import { StartPatrolDto } from './dto/start-patrol.dto';
import { SyncPatrolLogsDto } from './dto/sync-patrol-log.dto';
export declare class PatrolService {
    private db;
    constructor(db: any);
    startSession(userId: string, dto: StartPatrolDto): Promise<any>;
    getActiveSessions(userId?: string): Promise<any>;
    getSessionDetails(id: string): Promise<any>;
    getPatrolReport(filters: {
        startDate?: string;
        endDate?: string;
        routeId?: string;
        userId?: string;
    }): Promise<any>;
    syncPatrolLogs(dto: SyncPatrolLogsDto): Promise<{
        sessionsSummary: any[];
        totalReceived: number;
        processedCount: number;
        errors: {
            localId: string;
            error: string;
        }[];
        affectedSessions: string[];
    }>;
    private evaluateAndFinalizeSession;
}
