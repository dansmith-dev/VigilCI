export interface Repo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
    private: boolean;
}
