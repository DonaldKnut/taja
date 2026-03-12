import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

type ResponseShape<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseShape<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseShape<T>> {
    return next.handle().pipe(
      map((response: ResponseShape<T> | T) => {
        if (
          response &&
          typeof response === 'object' &&
          ('success' in response || 'data' in response || 'message' in response)
        ) {
          return {
            success: true,
            ...(response as ResponseShape<T>),
          };
        }

        return {
          success: true,
          data: response as T,
        };
      }),
    );
  }
}
