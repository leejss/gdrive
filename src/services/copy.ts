import { OAuth2Client } from 'google-auth-library';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import open from 'open';
import { EventEmitter } from 'events';

export class AuthService extends EventEmitter {
  private readonly TOKEN_DIR: string;
  private readonly TOKEN_PATH: string;
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  private readonly REDIRECT_URI: string;
  private oauthClient: OAuth2Client | null = null;

  constructor(options: {
    scopes: string[];
    appName: string;
    clientId: string;
    clientSecret: string;
    port?: number;
  }) {
    super();

    this.TOKEN_DIR = path.join(os.homedir(), `.${options.appName}`);
    this.TOKEN_PATH = path.join(this.TOKEN_DIR, 'oauth_token.json');
    this.CLIENT_ID = options.clientId;
    this.CLIENT_SECRET = options.clientSecret;
    this.REDIRECT_URI = `http://localhost:${options.port || 3000}/callback`;
  }

  /**
   * OAuth 클라이언트 인스턴스를 가져옵니다
   */
  async getClient(): Promise<OAuth2Client> {
    if (this.oauthClient) {
      return this.oauthClient;
    }

    this.oauthClient = new OAuth2Client(this.CLIENT_ID, this.CLIENT_SECRET, this.REDIRECT_URI);

    // 토큰 디렉토리 확인 및 생성
    try {
      await fs.mkdir(this.TOKEN_DIR, { recursive: true });
    } catch (err) {
      // 이미 존재하는 경우 무시
    }

    // 토큰 존재 확인
    try {
      const tokenData = await fs.readFile(this.TOKEN_PATH, 'utf-8');
      const tokens = JSON.parse(tokenData);
      this.oauthClient.setCredentials(tokens);

      // 토큰 유효성 검사
      if (this.isTokenExpired(tokens)) {
        await this.refreshToken();
      }
    } catch (err) {
      // 토큰이 없거나 유효하지 않음 - 새로운 인증 필요
    }

    return this.oauthClient;
  }

  /**
   * 인증 프로세스 시작
   */
  async authenticate(): Promise<void> {
    const client = await this.getClient();

    try {
      // 토큰 유효성 검사
      await client.getAccessToken();
      this.emit('authenticated', { message: '이미 인증되어 있습니다.' });
      return;
    } catch (error) {
      // 새 인증 필요
    }

    // 인증 URL 생성
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent', // 항상 갱신 동의 요청
    });

    this.emit('auth:url', { url: authUrl });

    // 브라우저 열기
    await open(authUrl);
    this.emit('auth:browser_opened');

    // 로컬 서버 시작하여 콜백 처리
    await this.startCallbackServer();
  }

  /**
   * 콜백을 처리할 로컬 서버 시작
   */
  private startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      let server: http.Server;

      const handleCallback = async (req: http.IncomingMessage, res: http.ServerResponse) => {
        try {
          const reqUrl = req.url || '';

          if (reqUrl.startsWith('/callback')) {
            const parsedUrl = new URL(reqUrl, `http://localhost`);
            const code = parsedUrl.searchParams.get('code');

            if (!code) {
              throw new Error('인증 코드가 없습니다');
            }

            // 코드를 토큰으로 교환
            const { tokens } = await this.oauthClient!.getToken(code);
            this.oauthClient!.setCredentials(tokens);

            // 토큰 저장
            await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokens, null, 2));
            this.emit('auth:token_saved');

            // 응답 전송 및 서버 종료
            res.writeHead(200, { 'Content-Type': 'text/html' });
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

            server.close(() => {
              this.emit('auth:complete');
              resolve();
            });
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
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

          server.close(() => {
            this.emit('auth:error', error);
            reject(error);
          });
        }
      };

      server = http.createServer(handleCallback);

      server.on('error', err => {
        this.emit('auth:server_error', err);
        reject(err);
      });

      // 포트 추출
      const port = parseInt(this.REDIRECT_URI.split(':')[2]);

      server.listen(port, () => {
        this.emit('auth:server_started', { port });
      });
    });
  }

  /**
   * 토큰이 만료되었는지 확인
   */
  private isTokenExpired(tokens: any): boolean {
    if (!tokens.expiry_date) return true;
    return tokens.expiry_date <= Date.now();
  }

  /**
   * 토큰 갱신
   */
  private async refreshToken(): Promise<void> {
    try {
      const result = await this.oauthClient!.refreshAccessToken();
      const tokens = result.credentials;

      // 업데이트된 토큰 저장
      await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokens, null, 2));
      this.emit('auth:token_refreshed');
    } catch (error) {
      this.emit('auth:refresh_error', error);
      throw error;
    }
  }

  /**
   * 로그아웃 (토큰 삭제)
   */
  async logout(): Promise<void> {
    try {
      // 로컬 토큰 삭제
      await fs.unlink(this.TOKEN_PATH);
      this.oauthClient = null;
      this.emit('auth:logged_out');
    } catch (error) {
      // 파일이 없는 경우
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 원격에서 토큰 취소 (선택적)
   */
  async revokeToken(): Promise<void> {
    try {
      const client = await this.getClient();
      const token = (await client.getAccessToken()).token;

      if (token) {
        await client.revokeToken(token as string);
      }

      await this.logout();
      this.emit('auth:token_revoked');
    } catch (error) {
      this.emit('auth:revoke_error', error);
      throw error;
    }
  }
}
