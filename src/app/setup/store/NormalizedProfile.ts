
export type Normalize<T> = {
    ids: number[],
    byId: {
        [key: string]: T
    }
}