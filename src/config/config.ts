import * as path from 'path';
import * as os from 'os';

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

/**
 * 애플리케이션의 설정 정보를 제공하는 클래스
 * 모든 설정은 환경변수에서 가져오며, 없을 경우 기본값 사용
 */
class Config {
  /**
   * 기본 폴더 ID 설정 가져오기
   * 환경변수 GDRIVE_DEFAULT_FOLDER_ID에서 값을 읽어옴
   */
  getDefaultFolderId(): string | undefined {
    return process.env[ENV_KEYS.DEFAULT_FOLDER_ID];
  }

  /**
   * 기본 다운로드 위치 가져오기
   * 환경변수 GDRIVE_DEFAULT_DOWNLOAD_LOCATION에서 값을 읽어오거나 기본값 사용
   */
  getDefaultDownloadLocation(): string {
    return (
      process.env[ENV_KEYS.DEFAULT_DOWNLOAD_LOCATION] || DEFAULT_VALUES.DEFAULT_DOWNLOAD_LOCATION
    );
  }

  /**
   * 상세 로깅 설정 가져오기
   * 환경변수 GDRIVE_VERBOSE에서 값을 읽어오거나 기본값 사용
   */
  isVerbose(): boolean {
    const verboseEnv = process.env[ENV_KEYS.VERBOSE];
    return verboseEnv ? verboseEnv.toLowerCase() === 'true' : DEFAULT_VALUES.VERBOSE;
  }

  /**
   * 설정값 저장하기
   * 현재 환경변수 기반이므로 런타임에만 유효하며 영구 저장되지 않음
   * 필요하다면 .env 파일을 직접 수정해야 함
   */
  setConfig(key: keyof typeof ENV_KEYS, value: string | boolean): void {
    if (typeof value === 'boolean') {
      process.env[ENV_KEYS[key]] = value.toString();
    } else {
      process.env[ENV_KEYS[key]] = value;
    }
    console.log(`설정 ${key}가 ${value}로 변경되었습니다 (런타임에만 유효)`);
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
