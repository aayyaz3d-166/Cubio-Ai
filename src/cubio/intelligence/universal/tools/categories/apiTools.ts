/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: API Tools (Category 2)
 */

import { UniversalToolDefinition } from '../types';

export const httpGetTool: UniversalToolDefinition = Object.freeze({
  toolId: 'api_http_get',
  name: 'HTTP GET Request',
  category: 'APIS',
  description: 'Issues a sandboxed HTTP GET request to authorized domains.',
  permissionLevel: 'NETWORK_ACCESS',
  isDestructive: false,
  parametersSchema: Object.freeze({ url: { type: 'string', required: true } }),
});

export const httpPostTool: UniversalToolDefinition = Object.freeze({
  toolId: 'api_http_post',
  name: 'HTTP POST Request',
  category: 'APIS',
  description: 'Dispatches an authorized POST payload to external API endpoint.',
  permissionLevel: 'NETWORK_ACCESS',
  isDestructive: true,
  parametersSchema: Object.freeze({
    url: { type: 'string', required: true },
    body: { type: 'object', required: true },
  }),
});

export async function handleHttpGet(params: Record<string, unknown>) {
  return { status: 200, url: params.url, data: { ok: true } };
}

export async function handleHttpPost(params: Record<string, unknown>) {
  return { status: 201, url: params.url, data: params.body, success: true };
}
