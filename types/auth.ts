export type UserRole = 'admin' | 'project_head' | 'employee'

export interface User {
    id: string
    email: string
    name: string
    avatar?: string
    role: UserRole
    permissions: string[]
}

export const MOCK_USERS: Record<UserRole, User> = {
    admin: {
        id: 'admin-1',
        email: 'admin@kriya.dev',
        name: 'Admin User',
        role: 'admin',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=admin',
        permissions: ['all']
    },
    project_head: {
        id: 'head-1',
        email: 'head@kriya.dev',
        name: 'Project Head',
        role: 'project_head',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=head',
        permissions: ['read', 'write', 'deploy', 'manage_team']
    },
    employee: {
        id: 'emp-1',
        email: 'employee@kriya.dev',
        name: 'Employee',
        role: 'employee',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=employee',
        permissions: ['read', 'write']
    }
}
