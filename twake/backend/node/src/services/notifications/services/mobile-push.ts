import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { PushNotificationMessage } from "../types";
import User, { TYPE as UserType } from "../../user/entities/user";
import { CrudException } from "../../../core/platform/framework/api/crud-service";
import gr from "../../global-resolver";

export class MobilePushService {
  name: "MobilePushService";
  version: "1";
  userRepository: Repository<User>;

  async init(): Promise<this> {
    this.userRepository = await gr.database.getRepository<User>(UserType, User);
    return this;
  }

  //Fixme: add a bulk system to group requests to fcm
  async push(message: PushNotificationMessage): Promise<void> {
    // Get devices and loop over devices
    const userId = message.user;

    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw CrudException.notFound(`User ${userId} not found`);
    }

    const notification = {
      title: message.title,
      body: message.text,
      sound: "default",
      badge: message.badge_value,
    };

    const options = {
      notification_data: {
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        channel_id: message.channel_id,
        message_id: message.message_id,
        thread_id: message.thread_id,
      },
      collapse_key: message.channel_id,
    };

    await gr.platformServices.push.push(user.devices, notification, options);
  }
}
