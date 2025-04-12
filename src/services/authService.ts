import { type OAuth2Client, type Credentials } from 'google-auth-library';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as open from 'open';
import * as http from 'http';

const CREDENTIAL_LOCATION = '.gdrive-credentials';

class AuthService {
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
  ];

  private readonly CREDENTIALS_DIR = path.join(os.homedir(), CREDENTIAL_LOCATION);
  private readonly TOKEN_PATH = path.join(this.CREDENTIALS_DIR, 'token.json');
  private readonly PORT = 3000;
  private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private readonly REDIRECT_URI = `http://localhost:${this.PORT}/oauth2callback`;
  private oauthClient: OAuth2Client | null = null;
  static create(): AuthService {
    return new AuthService();
  }

  constructor() {
    // Ensure credentials directory exists
    if (!fs.existsSync(this.CREDENTIALS_DIR)) {
      fs.mkdirSync(this.CREDENTIALS_DIR, { recursive: true });
    }

    // check env variables
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('CLIENT_ID and CLIENT_SECRET must be set');
    }
  }

  /**
   * Get OAuth2 client
   */
  async getAuthClient(): Promise<OAuth2Client> {
    if (this.oauthClient) {
      return this.oauthClient;
    }

    this.oauthClient = new google.auth.OAuth2(
      this.CLIENT_ID,
      this.CLIENT_SECRET,
      this.REDIRECT_URI
    );

    if (fs.existsSync(this.TOKEN_PATH)) {
      // const token = JSON.parse(fs.readFileSync(this.TOKEN_PATH, 'utf8'));
      const token = this.loadToken();
      this.oauthClient.setCredentials(token);

      if (this.isTokenExpired(token)) {
        await this.refreshToken();
      }

      return this.oauthClient;
    }

    return this.oauthClient;
  }

  /**
   * Start authentication process
   */
  async authenticate(): Promise<void> {
    const client = await this.getAuthClient();

    try {
      await client.getAccessToken();
      return;
    } catch (error) {
      console.log('No token found, starting authentication process...');
    }

    // Generate auth URL
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent',
    });

    // Open browser for authentication
    console.log('Opening browser for authentication...');
    await open.default(authUrl);

    // Use server to receive callback
    await this.startCallbackServer(client);
  }

  /**
   * Start local server to handle OAuth callback
   */
  private startCallbackServer(client: OAuth2Client): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = http.createServer(
        async (req: http.IncomingMessage, res: http.ServerResponse) => {
          try {
            const reqUrl = req.url || '';

            if (reqUrl.startsWith('/oauth2callback')) {
              const parsedUrl = new URL(reqUrl, `http://localhost:${this.PORT}`);
              const code = parsedUrl.searchParams.get('code');

              if (!code) {
                throw new Error('No authorization code received');
              }

              // Exchange code for tokens
              const { tokens } = await client.getToken(code as string);
              client.setCredentials(tokens);

              // Save token
              this.saveToken(tokens);

              // Send success response
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>인증 성공</title>
                    <style>
                      body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                      h1 { color: #4CAF50; }
                    </style>
                  </head>
                  <body>
                    <h1>인증 성공!</h1>
                    <p>이 창을 닫고 애플리케이션으로 돌아가세요.</p>
                    <script>setTimeout(() => window.close(), 3000);</script>
                  </body>
                </html>
              `);

              // Close server and resolve promise
              server.close();
              resolve();
            }
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>인증 실패</title>
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #F44336; }
                  </style>
                </head>
                <body>
                  <h1>인증 실패</h1>
                  <p>오류가 발생했습니다. 다시 시도해주세요.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);
            server.close();
            reject(error);
          }
        }
      );

      server.listen(this.PORT, () => {
        console.log('Waiting for authentication response...');
      });

      server.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  private isTokenExpired(credentials: Credentials): boolean {
    if (!credentials.expiry_date) return true;
    return credentials.expiry_date <= Date.now();
  }

  private async refreshToken(): Promise<void> {
    const result = await this.oauthClient?.refreshAccessToken();
    const credentials = result?.credentials;

    if (!credentials) {
      throw new Error('Failed to refresh token');
    }

    fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(credentials, null, 2));
  }

  private loadToken(): Credentials {
    if (fs.existsSync(this.TOKEN_PATH)) {
      return JSON.parse(fs.readFileSync(this.TOKEN_PATH, 'utf8'));
    }

    throw new Error(`Token file not found at ${this.TOKEN_PATH}`);
  }

  private saveToken(token: Credentials): void {
    fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(token));
  }

  /**
   * Revoke authentication
   */
  async logout(): Promise<void> {
    if (fs.existsSync(this.TOKEN_PATH)) {
      fs.unlinkSync(this.TOKEN_PATH);
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return fs.existsSync(this.TOKEN_PATH);
  }
}

const authService = AuthService.create();
export default authService;
