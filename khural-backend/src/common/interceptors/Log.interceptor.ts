import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

class Log implements NestInterceptor {
	intercept(
		context: ExecutionContext,
		next: CallHandler
	): Observable<any> | Promise<Observable<any>> {
		return next.handle();
	}
}

function log() {}
