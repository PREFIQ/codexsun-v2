export type NotificationChannel = "app" | "email" | "telegram" | "whatsapp";

export type NotificationMessage = {
  channel: NotificationChannel;
  message: string;
  recipient: string;
  tenantId?: string;
  title: string;
};
