

//  DATE CONSTANTS
export const now = new Date();
export const today        = new Date(); today.setHours(0,0,0,0)
export const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
export const lastOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
export const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

// DEFAULT SETTINGS
export const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
    platform_name:        { value: "PeopleFlow",    description: "Platform Name" },
    platform_email:       { value: "support@peopleflow.io", description: "Support Email" },
    allow_registration:   { value: "true",      description: "Allow New Company Registrations" },
    max_companies:        { value: "100",       description: "Maximum Allowed Companies" },
    maintenance_mode:     { value: "false",     description: "System Maintenance Mode" },
    default_trial_days:   { value: "14",        description: "Default Free Trial Days" },
    smtp_host:            { value: "",          description: "SMTP Server Host" },
    smtp_port:            { value: "587",       description: "SMTP Server Port" },
    smtp_user:            { value: "",          description: "SMTP Username" },
    support_phone:        { value: "",          description: "Platform Support Phone Number" },
    max_employees_limit:  { value: "500",       description: "Default Max Employees Per Company Limit" },
    auto_approve_leaves:  { value: "false",     description: "Auto-approve Leave Requests Globally" },
};
