import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAdmin } from 'src/module/admin/interfaces/admin.interfaces';

@Injectable()
export class UserRolesGuard implements CanActivate {
    constructor(
        @Inject(Reflector) private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 通过反射获取请求路由是否添加了 @UserRoles() 注解，如果没有添加，则代表不需要进行认证
        const roles = this.reflector.get<string>('userRoles', context.getHandler());
        console.log(roles, 'sss')
        if (!roles) {
            return true;
        }
        const role = Number(roles);

        // 在请求对象中获取 user 对象，此 user 对象是 AuthStrategy 中 validate 方法成功执行后的返回值
        const request = context.switchToHttp().getRequest();
        const user: IAdmin = request.user;
        // const role = parseInt(roles);
        // 判断是否为管理员，或当前操作的资源是否是私人的
        return user.role <= role;
    }
}