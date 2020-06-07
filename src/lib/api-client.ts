import { Logger } from '@nestjs/common';
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export abstract class ApiClient {
  private _axiosInstance: AxiosInstance;

  init(options?: AxiosRequestConfig) {
    this._axiosInstance = Axios.create(options);
  }

  async api(options: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this._axiosInstance(options);
    } catch (error) {
      const errorCtx = this.constructor.name;
      if (error.response) {
        Logger.error(error.response.data, null, errorCtx);
        Logger.error(error.response.status, null, errorCtx);
        Logger.error(error.response.headers, null, errorCtx);
      } else if (error.request) {
        Logger.error(error.request, null, errorCtx);
      } else {
        Logger.error(error.message, null, errorCtx);
      }
      Logger.error(error.config, null, errorCtx);
      throw error;
    }
  }
}
