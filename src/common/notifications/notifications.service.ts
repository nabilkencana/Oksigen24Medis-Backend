import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, initializeApp, cert } from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: App | null = null;

  onModuleInit() {
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        this.firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase Admin SDK initialized successfully ✓');
      } catch (err) {
        this.logger.error('Failed to initialize Firebase Admin SDK:', err);
      }
    } else {
      this.logger.warn(
        'firebase-service-account.json NOT found at root. Push notifications via FCM will be skipped gracefully.',
      );
    }
  }

  /**
   * Send a push notification to a list of device registration tokens.
   */
  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    if (!this.firebaseApp) {
      this.logger.debug('Skipping push notification (Firebase Admin SDK not initialized)');
      return;
    }

    const validTokens = tokens.filter((t) => t && t.trim().length > 0);
    if (validTokens.length === 0) return;

    // Send messages in multicast
    try {
      const response = await getMessaging(this.firebaseApp).sendEachForMulticast({
        tokens: validTokens,
        notification: {
          title,
          body,
        },
        data,
      });

      this.logger.log(
        `Sent FCM push notification: ${response.successCount} successful, ${response.failureCount} failed`,
      );

      // Log failure reasons if any
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(
              `FCM failed for token ${validTokens[idx]}: ${resp.error?.message}`,
            );
          }
        });
      }
    } catch (error) {
      this.logger.error('Error sending multicast FCM notification:', error);
    }
  }
}
