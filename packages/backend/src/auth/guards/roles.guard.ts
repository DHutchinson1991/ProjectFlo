import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Method-level roles
        context.getClass(),   // Class-level roles (though we might not use this for specific role checks)
      ],
    );
    if (!requiredRoles) {
      return true; // No roles are required, access is granted
    }
    const { user } = context.switchToHttp().getRequest();
    
    // Assuming the user object attached by AuthGuard has a 'role' property (e.g., user.role = 'Admin')
    // Or, if the user can have multiple roles, it might be user.roles = ['Admin', 'Editor']
    // For this example, let's assume user.role is a string representing the user's single role name.
    // You might need to adjust this based on how your JWT payload is structured and what JwtStrategy provides.
    if (!user || !user.role) {
      return false; // User or user.role is not defined, deny access
    }

    return requiredRoles.some((role) => user.role === role);
    // If user.roles is an array: return requiredRoles.some(role => user.roles?.includes(role));
  }
}
