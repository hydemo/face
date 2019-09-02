import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from 'src/module/role/role.service';

@Injectable()
export class UserRolesGuard implements CanActivate {
    constructor(
        @Inject(Reflector) private readonly reflector: Reflector,
        @Inject(RoleService) private readonly roleService: RoleService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 通过反射获取请求路由是否添加了 @UserRoles() 注解，如果没有添加，则代表不需要进行认证
        const roles = this.reflector.get<number[]>('userRoles', context.getHandler());
        if (!roles) {
            return true
        }
        const request = context.switchToHttp().getRequest();
        const roleExist = await this.roleService.checkRoles({ user: request.user._id, isDelete: false, role: { $in: roles } })
        if (!roleExist) {
            return false;
        }
        return true;
    }
}