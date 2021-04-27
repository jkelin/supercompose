import {
  getAccessToken,
  handleAuth,
  handleCallback,
  handleLogin,
  handleProfile,
  Session,
} from '@auth0/nextjs-auth0';
import axios from 'axios';
import { SupercomposeConfig } from 'lib/config';
import { NextApiRequest, NextApiResponse } from 'next';

async function updateSession(
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session,
) {
  const profile = await axios.get('/api/auth/profile', {
    baseURL: SupercomposeConfig.BACKEND_URI,
    headers: {
      Authorization: 'Bearer ' + session.accessToken,
    },
  });

  session.user = profile.data;

  return session;
}

export default handleAuth({
  callback(req, res) {
    return handleCallback(req, res, {
      afterCallback: updateSession,
    });
  },

  profile(req, res) {
    return handleProfile(req, res, {
      afterRefetch: updateSession,
    });
  },
  // async profile(req, res) {
  //   try {
  //     const token = await getAccessToken(req, res);
  //     if (!token || !token.accessToken) {
  //       return await handleProfile(req, res, {
  //         afterRefetch: (req, res, profile) {

  //       } });
  //     }

  //     const profile = await axios.get('/api/auth/profile', {
  //       baseURL: SupercomposeConfig.BACKEND_URI,
  //       headers: {
  //         Authorization: 'Bearer ' + token.accessToken,
  //       },
  //     });

  //     return res.status(200).json(profile.data);
  //   } catch (ex) {
  //     if (ex.code === 'invalid_session')
  //       return res.status(401).json({ error: 'invalid_session' });
  //     else throw ex;
  //   }
  // },
  async login(req, res) {
    return handleLogin(req, res, {
      returnTo: '/dashboard',
    });
  },
});
