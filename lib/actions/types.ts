
/**
 * Discriminated union returned by all server actions.
 *
 * Consumers should narrow on the `error`, `success`, or `pending` discriminant
 * before accessing other properties. The index signature on the error and
 * success variants allows actions to attach arbitrary extra data (e.g.
 * `redirectTo`, `course`, `session`) without extending this type.
 */
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