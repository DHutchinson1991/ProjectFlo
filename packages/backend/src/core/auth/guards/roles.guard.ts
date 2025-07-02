import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Method-level roles
        context.getClass(), // Class-level roles (though we might not use this for specific role checks)
      ],
    );
    if (!requiredRoles) {
      return true; // No roles are required, access is granted
    }
    const { user } = context.switchToHttp().getRequest();

    // Check if user exists and has roles array
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role) => user.roles.includes(role));
    // If user.roles is an array: return requiredRoles.some(role => user.roles?.includes(role));
  }
}
