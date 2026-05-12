import { isEmpty } from 'lodash-es';
import zlib, { constants } from 'zlib';
import { Logger } from '@nestjs/common';

const MIN_COMPRESS = 2048;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const logger = new Logger('CompressString');

/**
 * Expects a base64 encoded string that contains binary brotli compressed data. If it is not
 * base64 encoded or does not contain brotli compressed data it will return the input.
 */
export async function decompressString(compressedString: string): Promise<string> {
  if (isEmpty(compressedString) || !base64Regex.test(compressedString)) {
    return compressedString;
  }
  const base64Decoded = Buffer.from(compressedString, 'base64');

  return new Promise((res, rej) => {
    zlib.brotliDecompress(base64Decoded, (error, decompressedString) => {
      if (error) {
        if ((error as any)?.code === 'Z_DATA_ERROR') {
          //probably not encoded, return original
          res(compressedString);
        } else {
          logger.error({ error }, 'error decompressing auth token');
          rej(error);
        }
      } else {
        res(decompressedString?.toString('utf-8'));
      }
    });
  });
}

/**
 * Tasks a string and compresses using brotli then base64 encodes.
 */
export async function compressString(inputString: string): Promise<string> {
  if (isEmpty(inputString)) {
    return inputString;
  }
  if (inputString.length < MIN_COMPRESS) {
    return inputString;
  }
  return new Promise((res, rej) => {
    zlib.brotliCompress(
      inputString,
      {
        params: {
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
          [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        },
      },
      (error, compressed) => {
        // zlib.gzip(inputString, (error, compressed) => {
        if (error) {
          logger.error({ error }, 'error compressing auth token');
          rej(error);
        }
        res(compressed.toString('base64'));
      },
    );
  });
}
