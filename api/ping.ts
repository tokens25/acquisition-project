/**
 * The smallest function this project can deploy.
 *
 * Here to answer one question the outside of a 500 cannot: whether the
 * functions in this folder run at all on this deployment. It imports nothing,
 * reads nothing, and computes nothing — so if it answers, the runtime is fine
 * and the fault is in whatever a given route does; and if it 500s like the
 * rest, no amount of editing those routes was ever going to help.
 *
 * Delete it once that is settled.
 */
export default async function handler(): Promise<Response> {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}
