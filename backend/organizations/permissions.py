from users.roles import UserRole

DEFAULT_ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        "user:invite",
        "user:remove",
        "role:manage",
        "org:settings",
        "assessment:create",
        "assessment:view",
        "assessment:edit",
        "assessment:delete",
        "assessment:approve",
        "report:view",
        "report:export",
        "evidence:upload",
        "evidence:approve",
    ],
    UserRole.COORDINATOR: [
        "assessment:create",
        "assessment:view",
        "assessment:edit",
        "report:view",
        "report:export",
        "evidence:upload",
        "user:invite",
    ],
    UserRole.ASSESSOR: [
        "assessment:view",
        "assessment:edit",
        "evidence:upload",
        "evidence:review",
        "report:view",
    ],
    UserRole.CONSULTANT: [
        "assessment:view",
        "assessment:edit",
        "evidence:upload",
        "report:view",
    ],
    UserRole.EXECUTIVE: [
        "assessment:view",
        "report:view",
        "report:export",
    ],
    UserRole.OPERATOR: [
        "assessment:view",
        "evidence:upload",
    ],
}