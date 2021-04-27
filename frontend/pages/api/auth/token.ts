import { getToken } from 'lib/auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt_decode from 'jwt-decode';
import { parse } from 'graphql';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req, res);

  if (token) {
    const parsed: any = jwt_decode(token);
    if (!parsed.exp) {
      console.error('exp not found in access token');
      return res.status(500).send('exp not found in access token');
    }

    return res.json({
      access_token: token,
      expires_at: new Date(parsed.exp * 1000).toISOString(),
    });
  }

  res.status(401).send('Unauthorized');
};
