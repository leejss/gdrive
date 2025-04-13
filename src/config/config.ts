import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// 환경변수 키 정의 - 중앙에서 관리하여 오타 방지
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
const CONFIG_FOLDER_NAME = '.gdrive-config';
const CONFIG_DIR = path.join(os.homedir(), CONFIG_FOLDER_NAME);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 설정 인터페이스
interface ConfigData {
  defaultFolderId?: string;
  defaultDownloadLocation?: string;
  verbose?: boolean;
  [key: string]: any;
}

/**
 * 애플리케이션의 설정 정보를 제공하는 클래스
 * 설정은 환경변수, 설정 파일, 기본값 순으로 우선순위를 가짐
 */
class Config {
  private configData: ConfigData = {};

  constructor() {
    this.loadConfig();
  }

  /**
   * 설정 파일 로드
   */
  private loadConfig(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        this.configData = JSON.parse(data);
      }
    } catch (error) {
      console.error('설정 파일을 로드하는 중 오류가 발생했습니다:', error);
      this.configData = {};
    }
  }

  /**
   * 설정 파일 저장
   */
  private saveConfig(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.configData, null, 2));
    } catch (error) {
      console.error('설정 파일을 저장하는 중 오류가 발생했습니다:', error);
    }
  }

  /**
   * 기본 폴더 ID 설정 가져오기
   * 환경변수 > 설정 파일 > undefined 순으로 확인
   */
  getDefaultFolderId(): string | undefined {
    return process.env[ENV_KEYS.DEFAULT_FOLDER_ID] || this.configData.defaultFolderId;
  }

  /**
   * 기본 다운로드 위치 가져오기
   * 환경변수 > 설정 파일 > 기본값 순으로 확인
   */
  getDefaultDownloadLocation(): string {
    return (
      process.env[ENV_KEYS.DEFAULT_DOWNLOAD_LOCATION] ||
      this.configData.defaultDownloadLocation ||
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
    return this.configData.verbose !== undefined ? this.configData.verbose : DEFAULT_VALUES.VERBOSE;
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
      this.configData[configKey] = value;
      this.saveConfig();
      console.log(`설정 ${key}가 ${value}로 변경되었습니다 (영구 저장됨)`);
    } else {
      console.log(`설정 ${key}가 ${value}로 변경되었습니다 (런타임에만 유효)`);
    }
  }

  /**
   * 모든 설정값 가져오기
   */
  getAllConfig(): Record<string, string | boolean | undefined> {
    return {
      defaultFolderId: this.getDefaultFolderId(),
      defaultDownloadLocation: this.getDefaultDownloadLocation(),
      verbose: this.isVerbose(),
    };
  }
}

// 싱글턴 인스턴스 생성 및 내보내기
export const config = new Config();
