import { getToken } from 'lib/auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt_decode from 'jwt-decode';
import { parse } from 'graphql';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ status: 'ok' });
};
