// Proxy all /finance/* requests to the moneu-finance Worker
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Proxy to the moneu-finance Worker via workers.dev subdomain
  const workerUrl = `https://moneu-finance.scarmonit.workers.dev${url.pathname}${url.search}`;

  // Clone headers but remove host
  const headers = new Headers(context.request.headers);
  headers.delete('host');

  const response = await fetch(workerUrl, {
    method: context.request.method,
    headers: headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
    redirect: 'manual',
  });

  // Return the response with appropriate headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  return newResponse;
}
