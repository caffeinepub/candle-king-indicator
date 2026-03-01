import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PatternConfig {
    confidenceThreshold: bigint;
    patternName: string;
    enabled: boolean;
    symbol: string;
}
export type Time = bigint;
export interface SignalHistoryEntry {
    timeframe: string;
    patternName: string;
    timestamp: Time;
    confidence: bigint;
    symbol: string;
    signalType: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getPatternConfigs(): Promise<Array<PatternConfig>>;
    getRecentSignalHistory(limit: bigint): Promise<Array<SignalHistoryEntry>>;
    getSignalHistory(): Promise<Array<SignalHistoryEntry>>;
    isCallerAdmin(): Promise<boolean>;
    savePatternConfig(symbol: string, patternName: string, enabled: boolean, confidenceThreshold: bigint): Promise<void>;
    saveSignalHistory(symbol: string, timeframe: string, patternName: string, signalType: string, confidence: bigint): Promise<void>;
}
