export declare class SinglePatrolLogDto {
    localId: string;
    sessionId: string;
    checkpointId?: string;
    qrCodeHash?: string;
    scannedAt: string;
}
export declare class SyncPatrolLogsDto {
    logs: SinglePatrolLogDto[];
}
