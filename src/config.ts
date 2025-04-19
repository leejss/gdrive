import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { z } from 'zod';

export const ENV_KEYS = {
  DEFAULT_FOLDER_ID: 'GDRIVE_DEFAULT_FOLDER_ID',
  DEFAULT_DOWNLOAD_LOCATION: 'GDRIVE_DEFAULT_DOWNLOAD_LOCATION',
  VERBOSE: 'GDRIVE_VERBOSE',
};

// 기본값 정의
const DEFAULT_VALUES = {
  DEFAULT_DOWNLOAD_LOCATION: path.join(os.homedir(), 'Downloads'),
  VERBOSE: false,
};

// 설정 파일 경로
export const CONFIG_PATH = path.join(os.homedir(), '.gdrive-config');
export const CONFIG_FILE = path.join(CONFIG_PATH, 'config.json');

const ConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  defaultFolderId: z.string(),
  defaultDownloadLocation: z.string().default(DEFAULT_VALUES.DEFAULT_DOWNLOAD_LOCATION),
  verbose: z.boolean().default(DEFAULT_VALUES.VERBOSE),
});

type ConfigValues = z.infer<typeof ConfigSchema>;

// loadConfig, saveConfig, getConfig
class Config {
  private static instance: Config | null = null;
  private configValues: ConfigValues = {} as ConfigValues;
  private initialized: boolean = false;

  private constructor() {
    // 생성자는 private으로 설정하여 외부에서 new 키워드로 인스턴스 생성을 방지
    this.ensureConfigDirectoryExists();
  }

  /**
   * Config 클래스의 싱글톤 인스턴스를 가져옵니다.
   * 이미 설정이 로드되어 있다면 그 인스턴스를 반환하고,
   * 그렇지 않다면 저장된 설정을 확인하여 반환합니다.
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * 설정 디렉토리와 파일이 존재하는지 확인하고, 없으면 생성합니다.
   */
  private ensureConfigDirectoryExists(): void {
    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        fs.mkdirSync(CONFIG_PATH, { recursive: true });
        console.log(`설정 디렉토리 생성됨: ${CONFIG_PATH}`);
      }
    } catch (error) {
      console.error('설정 디렉토리 생성 중 오류가 발생했습니다:', error);
    }
  }

  /**
   * 설정이 초기화되었는지 확인합니다.
   * 설정이 초기화되지 않았다면 false를 반환하여 외부에서 설정을 입력받을 수 있도록 합니다.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 사용자 입력으로부터 설정을 초기화합니다.
   * @param configValues 설정 값
   */
  public initialize(configValues: {
    clientId: string;
    clientSecret: string;
    defaultFolderId: string;
    defaultDownloadLocation?: string;
    verbose?: boolean;
  }): void {
    try {
      const validated = this.validateConfig(configValues);
      this.configValues = validated;
      this.saveConfig();
      this.initialized = true;
      console.log('설정이 성공적으로 초기화되었습니다.');
    } catch (error) {
      console.error('설정 초기화 중 오류가 발생했습니다:', error);
      throw error;
    }
  }

  /**
   * 저장된 설정을 로드합니다.
   * 저장된 설정이 있으면 true, 없으면 false를 반환합니다.
   */
  public loadSavedConfig(): boolean {
    try {
      // 설정 파일 존재 여부만 확인 (디렉토리는 이미 생성됨)
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        const loaded = JSON.parse(data);

        try {
          const validated = this.validateConfig(loaded);
          this.configValues = validated;
          this.initialized = true;
          return true;
        } catch (error) {
          // Invalid config
          console.error('저장된 설정이 유효하지 않습니다:', error);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('설정 파일을 로드하는 중 오류가 발생했습니다:', error);
      return false;
    }
  }

  private validateConfig(config: Record<string, unknown>) {
    try {
      return ConfigSchema.parse(config);
    } catch (error) {
      console.error('Config의 유효성 검사 중 오류가 발생했습니다', error);
      throw error;
    }
  }

  private saveConfig() {
    try {
      // 디렉토리는 이미 생성되어 있으므로 파일만 저장
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.configValues, null, 2));
      return this.configValues;
    } catch (error) {
      console.error('설정 파일을 저장하는 중 오류가 발생했습니다:', error);
      throw error;
    }
  }

  /**
   * 기본 폴더 ID 설정 가져오기
   * 환경변수 > 설정 파일 > undefined 순으로 확인
   */
  getDefaultFolderId(): string | undefined {
    return process.env[ENV_KEYS.DEFAULT_FOLDER_ID] || this.configValues.defaultFolderId;
  }

  /**
   * 기본 다운로드 위치 가져오기
   * 환경변수 > 설정 파일 > 기본값 순으로 확인
   */
  getDefaultDownloadLocation(): string {
    return (
      process.env[ENV_KEYS.DEFAULT_DOWNLOAD_LOCATION] ||
      this.configValues.defaultDownloadLocation ||
      DEFAULT_VALUES.DEFAULT_DOWNLOAD_LOCATION
    );
  }

  /**
   * 상세 로깅 설정 가져오기
   * 환경변수 > 설정 파일 > 기본값 순으로 확인
   */
  isVerbose(): boolean {
    const verboseEnv = process.env[ENV_KEYS.VERBOSE];
    if (verboseEnv !== undefined) {
      return verboseEnv.toLowerCase() === 'true';
    }
    return this.configValues.verbose !== undefined
      ? this.configValues.verbose
      : DEFAULT_VALUES.VERBOSE;
  }

  /**
   * 설정값 저장하기
   * 환경변수와 설정 파일에 모두 저장
   * @param key 설정 키
   * @param value 설정 값
   * @param persistent 영구 저장 여부 (기본값: true)
   */
  setConfig(key: keyof typeof ENV_KEYS, value: string | boolean, persistent: boolean = true): void {
    // 환경변수에 저장 (런타임)
    if (typeof value === 'boolean') {
      process.env[ENV_KEYS[key]] = value.toString();
    } else {
      process.env[ENV_KEYS[key]] = value;
    }

    // 설정 파일에 저장 (영구)
    if (persistent) {
      const configKey = key.charAt(0).toLowerCase() + key.slice(1);
      this.configValues[configKey as keyof ConfigValues] = value as any;
      this.saveConfig();
      console.log(`설정 ${key}가 ${value}로 변경되었습니다 (영구 저장됨)`);
    } else {
      console.log(`설정 ${key}가 ${value}로 변경되었습니다 (런타임에만 유효)`);
    }
  }

  getAllConfig(): Record<string, string | boolean | undefined> {
    return {
      defaultFolderId: this.getDefaultFolderId(),
      defaultDownloadLocation: this.getDefaultDownloadLocation(),
      verbose: this.isVerbose(),
    };
  }
}

// 싱글턴 인스턴스 가져오기 함수 내보내기
export const getConfig = (): Config => {
  return Config.getInstance();
};

// 설정 초기화 함수 내보내기
export const initializeConfig = (configValues: {
  clientId: string;
  clientSecret: string;
  defaultFolderId: string;
  defaultDownloadLocation?: string;
  verbose?: boolean;
}): Config => {
  const config = Config.getInstance();
  config.initialize(configValues);
  return config;
};
