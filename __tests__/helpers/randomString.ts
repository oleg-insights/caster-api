export const randomString = (length: number) => {
    return Math.random().toString(36).slice(2, 2 + length)
}