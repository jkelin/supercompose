import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { Field, Message, Type } from 'protobufjs';

const ALG = 'aes-256-gcm';
const IV_LENGTH = 16;

export enum EncAlg {
  AES_256_GCM = 1,
}

export enum KeyAlg {
  PBKDF2_SHA256_1000_32 = 1,
}

@Type.d('EncryptedContainer')
export class EncryptedContainer extends Message<EncryptedContainer> {
  @Field.d(1, EncAlg, 'required')
  public encAlg: EncAlg;

  @Field.d(2, KeyAlg, 'required')
  public keyAlg: KeyAlg;

  @Field.d(3, 'bytes', 'optional')
  public salt: Buffer;

  @Field.d(4, 'bytes', 'required')
  public iv: Buffer;

  @Field.d(5, 'bytes', 'required')
  public data: Buffer;
}

@Injectable()
export class CryptoService {
  private async key(salt: Buffer) {
    const key = Buffer.from(process.env.CRYPTO_KEY, 'utf-8');
    return crypto.pbkdf2Sync(key, salt, 1000, 32, 'sha256');
  }

  public async encryptSecret(secret: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(64);
    const key = await this.key(salt);

    const cipher = crypto.createCipheriv(ALG, key, iv);

    const data = Buffer.concat([
      cipher.update(Buffer.from(secret, 'utf-8')),
      cipher.final(),
    ]);

    return Buffer.from(
      EncryptedContainer.encode(
        new EncryptedContainer({
          encAlg: EncAlg.AES_256_GCM,
          keyAlg: KeyAlg.PBKDF2_SHA256_1000_32,
          iv,
          salt,
          data,
        }),
      ).finish(),
    );
  }

  public async decryptSecret(secret: Buffer) {
    const container = EncryptedContainer.decode(secret);

    const key = await this.key(container.salt);

    const decipher = crypto.createDecipheriv(ALG, key, container.iv);

    return decipher.update(container.data).toString('utf-8');
  }
}
