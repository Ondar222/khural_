import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import * as changeCase from "change-case-object";

function removeCircularReferences(obj: any) {
	const seen = new WeakSet();
	return JSON.parse(
		JSON.stringify(obj, (key, value) => {
			if (typeof value === "object" && value !== null) {
				if (seen.has(value)) return;
				seen.add(value);
			}
			return value;
		})
	);
}

class SnakeCaser implements NestInterceptor {
	constructor(private toCamelCase: boolean = false) {}

	intercept(
		_: ExecutionContext,
		next: CallHandler
	): Observable<any> | Promise<Observable<any>> {
		return next.handle().pipe(
			map((data) => {
				try {
					if (data && typeof data === "object") {
						const sanitizedData = removeCircularReferences(data);

						if (this.toCamelCase) {
							return changeCase.camelCase(sanitizedData);
						} else {
							return changeCase.snakeCase(sanitizedData);
						}
					}
					return data;
				} catch (e) {
					console.error("Error during case conversion", e);
					throw e;
				}
			})
		);
	}
}

export { SnakeCaser };
