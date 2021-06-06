import { getToken } from 'lib/auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt_decode from 'jwt-decode';
import { parse } from 'graphql';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req, res);

  if (token) {
    res.redirect('/');
  } else {
    res.redirect('/api/auth/login');
  }
};
