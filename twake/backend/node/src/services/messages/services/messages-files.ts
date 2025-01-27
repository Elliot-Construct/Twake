import { Channel } from "../../../services/channels/entities";
import { fileIsMedia } from "../../../services/files/utils";
import { UserObject } from "../../../services/user/web/types";
import { formatUser } from "../../../utils/users";
import { Initializable } from "../../../core/platform/framework";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import gr from "../../../services/global-resolver";
import { MessageFileRef, TYPE as TYPERef } from "../entities/message-file-refs";
import { MessageFile, TYPE } from "../entities/message-files";
import { Message } from "../entities/messages";

export class MessagesFilesService implements Initializable {
  version: "1";
  msgFilesRepository: Repository<MessageFile>;
  msgFilesRefRepository: Repository<MessageFileRef>;

  constructor() {}

  async init() {
    this.msgFilesRepository = await gr.database.getRepository(TYPE, MessageFile);
    this.msgFilesRefRepository = await gr.database.getRepository(TYPERef, MessageFileRef);
    return this;
  }

  /**
   * Delete a message file and test this files belongs to the right user
   * @param message_id
   * @param id
   * @param user_id
   * @returns
   */
  async deleteMessageFile(message_id: string, id: string, user_id: string) {
    const msgFile = await this.getMessageFile(message_id, id);
    if (!msgFile) return null;

    if (msgFile.message.user_id !== user_id) return null;

    await this.msgFilesRepository.remove(msgFile);

    for (const target_type of ["channel_media", "channel_file", "channel"]) {
      const ref = await this.msgFilesRefRepository.findOne({
        target_type,
        company_id: msgFile.channel.company_id,
        target_id: msgFile.channel.id,
        id: msgFile.id,
      });
      if (ref) await this.msgFilesRefRepository.remove(ref);
    }

    return msgFile;
  }

  /**
   * Get a message file and returns more contextual data
   * @param message_id
   * @param id
   * @returns
   */
  async getMessageFile(
    message_id: string,
    id: string,
  ): Promise<
    MessageFile & {
      user: UserObject;
      message: Message;
      channel: Channel;
      navigation: { next: string; previous: string };
    }
  > {
    const msgFile = await this.msgFilesRepository.findOne({ message_id, id });
    if (!msgFile) return null;

    const message = await gr.services.messages.messages.get({
      thread_id: msgFile.thread_id,
      id: message_id,
    });
    const channel = await gr.services.channels.channels.get({
      company_id: message.cache.company_id,
      workspace_id: message.cache.workspace_id,
      id: message.cache.channel_id,
    });
    const user = await formatUser(await gr.services.users.get({ id: message.user_id }));

    const navigationPk = {
      target_type: fileIsMedia(msgFile) ? "channel_media" : "channel_file",
      company_id: channel.company_id,
      target_id: channel.id,
    };
    const next = (
      await this.msgFilesRefRepository.find(navigationPk, {
        pagination: {
          page_token: null,
          limitStr: "2",
          reversed: true,
        },
        $gte: [["id", msgFile.id]],
      })
    )
      .getEntities()
      .filter(a => a.id !== msgFile.id)?.[0]?.id;
    const previous = (
      await this.msgFilesRefRepository.find(navigationPk, {
        pagination: {
          page_token: null,
          limitStr: "2",
          reversed: false,
        },
        $gte: [["id", msgFile.id]],
      })
    )
      .getEntities()
      .filter(a => a.id !== msgFile.id)?.[0]?.id;

    return {
      ...msgFile,
      user,
      message,
      channel,
      navigation: {
        next,
        previous,
      },
    };
  }
}
