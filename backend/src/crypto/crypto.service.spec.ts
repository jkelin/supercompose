import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let crypto: CryptoService;

  beforeEach(() => {
    crypto = new CryptoService();
  });

  describe('findAll', () => {
    it('decrtypts what it encrypted', async () => {
      process.env.CRYPTO_KEY = '4ea85c4b-c29f-4e81-8d0a-68bafb874a81';
      const dataIn = "['test']";
      const encrypted = await crypto.encryptSecret(dataIn);
      const decrypted = await crypto.decryptSecret(encrypted);

      expect(dataIn).toEqual(decrypted);
    });
  });
});
