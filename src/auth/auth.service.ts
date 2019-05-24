import { Inject, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/module/users/user.service';
import { AdminService } from 'src/module/admin/admin.service';

export class AuthService {
    constructor(
        @Inject(UserService) private readonly userService: UserService,
        @Inject(AdminService) private readonly adminService: AdminService,
    ) { }

    async validateUser(payload: { type: string, id: string }): Promise<any> {
        if (payload.type === 'user') {
            return await this.userService.findById(payload.id);

        } else {
            return await this.adminService.findById(payload.id);
        }
    }
}