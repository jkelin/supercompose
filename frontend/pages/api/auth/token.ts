import { getToken } from 'lib/auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req, res);

  if (token) {
    res.json({ access_token: token });
  } else {
    res.status(401).send('Unauthorized');
  }
};
