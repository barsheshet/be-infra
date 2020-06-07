type ErrorData = {
  message?: string;
  name?: string;
};

export class ServiceError extends Error {
  code: string;
  constructor(data: ErrorData) {
    super(data.message);
    this.name = data.name;
  }
}
