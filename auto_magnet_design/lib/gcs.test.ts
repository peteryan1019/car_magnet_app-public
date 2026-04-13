import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { getSignedJwt, getAccessToken } from "./gcs";

// Generate a real RSA key pair for testing
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GCS Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSignedJwt", () => {
    it("returns a JWT with three dot-separated parts", () => {
      const jwt = getSignedJwt("test@gcs.iam.gserviceaccount.com", privateKey);
      const parts = jwt.split(".");

      expect(parts).toHaveLength(3);
    });

    it("includes correct issuer in JWT payload", () => {
      const jwt = getSignedJwt("myemail@gcs.iam.gserviceaccount.com", privateKey);
      const payloadPart = jwt.split(".")[1];
      const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString());

      expect(payload.iss).toBe("myemail@gcs.iam.gserviceaccount.com");
      expect(payload.scope).toBe("https://www.googleapis.com/auth/devstorage.read_write");
      expect(payload.aud).toBe("https://oauth2.googleapis.com/token");
    });

    it("sets expiration to 1 hour after issued time", () => {
      const jwt = getSignedJwt("test@gcs.iam.gserviceaccount.com", privateKey);
      const payloadPart = jwt.split(".")[1];
      const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString());

      expect(payload.exp - payload.iat).toBe(3600);
    });

    it("produces a verifiable RSA-SHA256 signature", () => {
      const jwt = getSignedJwt("test@gcs.iam.gserviceaccount.com", privateKey);
      const [headerB64, payloadB64, signatureB64] = jwt.split(".");

      const verify = crypto.createVerify("RSA-SHA256");
      verify.update(`${headerB64}.${payloadB64}`);
      const isValid = verify.verify(publicKey, signatureB64, "base64url");

      expect(isValid).toBe(true);
    });
  });

  describe("getAccessToken", () => {
    it("returns access token on successful exchange", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "ya29.mock-token" }),
      });

      const token = await getAccessToken("test@gcs.iam.gserviceaccount.com", privateKey);
      expect(token).toBe("ya29.mock-token");
    });

    it("throws with error_description when token exchange fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "invalid_grant",
            error_description: "Token expired",
          }),
      });

      await expect(
        getAccessToken("test@gcs.iam.gserviceaccount.com", privateKey)
      ).rejects.toThrow("Token expired");
    });

    it("throws default message when error_description is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "server_error" }),
      });

      await expect(
        getAccessToken("test@gcs.iam.gserviceaccount.com", privateKey)
      ).rejects.toThrow("Failed to get GCS access token");
    });
  });
});
