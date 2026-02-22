export interface VigilSegment {
    name: string;
    averageMs: number;
    minMs: number;
    maxMs: number;
    runs: number;
}

export interface VigilResult {
    testName: string;
    fullyQualifiedName: string;
    timestamp: string;
    commit: string;
    branch: string;
    runs: number;
    repository: string | null;
    segments: VigilSegment[];
}
