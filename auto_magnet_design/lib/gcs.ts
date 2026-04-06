import crypto from "crypto";

export function getSignedJwt(clientEmail: string, privateKey: string) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat
  };

  const encodeBase64Url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signatureInput = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

export async function getAccessToken(clientEmail: string, privateKey: string) {
  const jwt = getSignedJwt(clientEmail, privateKey);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || 'Failed to get GCS access token');
  }
  return data.access_token;
}
