

export type ActionResult = {
    error: true,
    message: string,
    [key: string]: any
} | {
    success: true,
    [key: string]: any
} | {
    pending: true
}