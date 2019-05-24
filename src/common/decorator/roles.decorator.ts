import { ReflectMetadata } from '@nestjs/common';
/*
 * 角色映射，自定义注解
 * @param roles 
 */

export const Roles = (...roles: string[]) => ReflectMetadata('roles', roles);