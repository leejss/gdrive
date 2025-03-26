import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as open from 'open';
import { Config } from '../config/config.js';

export class AuthService {
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
  ];

  private readonly CREDENTIALS_DIR = path.join(os.homedir(), '.gup');
  private readonly TOKEN_PATH = path.join(this.CREDENTIALS_DIR, 'token.json');
  private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private readonly REDIRECT_URI = 'http://localhost:3000/oauth2callback';

  private config: Config;

  constructor() {
    this.config = new Config();

    // Ensure credentials directory exists
    if (!fs.existsSync(this.CREDENTIALS_DIR)) {
      fs.mkdirSync(this.CREDENTIALS_DIR, { recursive: true });
    }
  }

  /**
   * Get OAuth2 client
   */
  getAuthClient(): OAuth2Client {
    const client = new google.auth.OAuth2(this.CLIENT_ID, this.CLIENT_SECRET, this.REDIRECT_URI);

    // Check for existing token
    if (fs.existsSync(this.TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(this.TOKEN_PATH, 'utf8'));
      client.setCredentials(token);
    }

    return client;
  }

  /**
   * Start authentication process
   */
  async authenticate(): Promise<void> {
    const client = this.getAuthClient();

    // Check if already authenticated
    try {
      await client.getAccessToken();
      // If we get here, token is valid
      return;
    } catch (error) {
      // Token is invalid or doesn't exist, continue with auth flow
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
      const http = require('http');
      const url = require('url');

      const server = http.createServer(async (req: any, res: any) => {
        try {
          if (req.url?.startsWith('/oauth2callback')) {
            const queryParams = url.parse(req.url, true).query;
            const code = queryParams.code;

            if (code) {
              // Exchange code for tokens
              const { tokens } = await client.getToken(code);
              client.setCredentials(tokens);

              // Save token
              fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(tokens));

              // Send success response
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(
                '<h1>Authentication successful!</h1><p>You can close this window and return to the command line.</p>'
              );

              // Close server and resolve promise
              server.close();
              resolve();
            } else {
              throw new Error('No authorization code received');
            }
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed</h1><p>Please try again.</p>');
          server.close();
          reject(error);
        }
      });

      server.listen(3000, () => {
        console.log('Waiting for authentication response...');
      });

      server.on('error', (error: Error) => {
        reject(error);
      });
    });
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
