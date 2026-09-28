import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class httpInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(this.addAuthToken(request));
  }

  addAuthToken(request: HttpRequest<any>) {
    const token = '3ebe72d1b695d525fe0c91c099fc87f663ba5dcd9395b1432f0a17e47c452079c7e76b8ac925155fb8cee72b786515f295d86125f3c266255321a79b149c90fc8c88742e3da1056a42dfdc1adeced4f3557bc80e8c81a1e538a9302f63d62d3795934c6c195faad1c28d2f7e5b96744324f4e2d5d0541c8687e83defa274e34c';

    return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
    })
  }
}
