import {
  getAccessToken,
  handleAuth,
  handleCallback,
  handleLogin,
  handleProfile,
} from '@auth0/nextjs-auth0';
import axios from 'axios';
import { SupercomposeConfig } from 'lib/config';

export default handleAuth({
  async callback(req, res) {
    await handleCallback(req, res);
    const token = await getAccessToken(req, res);
    await axios.get('/api/auth/me', {
      baseURL: SupercomposeConfig.BACKEND_URI,
      headers: {
        Authorization: 'Bearer ' + token.accessToken,
      },
    });
  },
  async profile(req, res) {
    const token = await getAccessToken(req, res);
    if (!token || !token.accessToken) {
      return await handleProfile(req, res);
    }

    const profile = await axios.get('/api/auth/profile', {
      baseURL: SupercomposeConfig.BACKEND_URI,
      headers: {
        Authorization: 'Bearer ' + token.accessToken,
      },
    });

    return res.status(200).json(profile.data);
  },
  async login(req, res) {
    return handleLogin(req, res, {
      returnTo: '/dashboard',
    });
  },
});
