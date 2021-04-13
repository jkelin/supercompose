import { getAccessToken } from '@auth0/nextjs-auth0';

export async function getToken(req: any, res: any) {
  try {
    const { accessToken } = await getAccessToken(req, res);

    return accessToken;
  } catch (ex) {
    return undefined;
  }
}
