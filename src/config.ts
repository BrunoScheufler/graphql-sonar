export interface SonarConfig {
  /**
   * Endpoint to send requests against
   */
  endpoint: string;

  /**
   * Optional request headers to include
   */
  headers?: Record<string, string | string[]>;
}
