export const API = {
  auth: {
    session: "/api/auth/session",
  },
  user: {
    profile: "/api/user/profile",
    households: "/api/user/households",
  },
  household: (id: string) => ({
    detail: `/api/household/${id}`,
    transfer: `/api/household/${id}/transfer`,
    items: {
      list: `/api/household/${id}/items`,
      detail: (itemId: string) => `/api/household/${id}/items/${itemId}`,
      tags: `/api/household/${id}/items/tags`,
    },
    routines: {
      list: `/api/household/${id}/routines`,
      detail: (taskId: string) => `/api/household/${id}/routines/${taskId}`,
      toggle: (taskId: string) =>
        `/api/household/${id}/routines/${taskId}/toggle`,
    },
    reminders: {
      list: `/api/household/${id}/reminders`,
      detail: (reminderId: string) =>
        `/api/household/${id}/reminders/${reminderId}`,
      toggle: (reminderId: string) =>
        `/api/household/${id}/reminders/${reminderId}/toggle`,
    },
    urgent: {
      list: `/api/household/${id}/urgent`,
      detail: (problemId: string) =>
        `/api/household/${id}/urgent/${problemId}`,
    },
    members: {
      list: `/api/household/${id}/members`,
      detail: (memberId: string) =>
        `/api/household/${id}/members/${memberId}`,
      leave: `/api/household/${id}/members/leave`,
    },
    invites: {
      list: `/api/household/${id}/invites`,
      revoke: (inviteId: string) =>
        `/api/household/${id}/invites/${inviteId}/revoke`,
    },
  }),
  invites: {
    accept: "/api/invites/accept",
  },
  upload: "/api/upload",
} as const;
