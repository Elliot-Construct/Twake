import { Initializable, TwakeServiceProvider } from "../../core/platform/framework";
import { MessageLocalEvent } from "../messages/types";

export interface PreviewServiceAPI extends TwakeServiceProvider, Initializable {
  generateThumbnails(
    document: Pick<PreviewPubsubRequest["document"], "filename" | "mime" | "path">,
    options: PreviewPubsubRequest["output"],
    deleteTmpFile: boolean,
  ): Promise<ThumbnailResult[]>;
}

export interface LinkPreviewServiceAPI extends TwakeServiceProvider, Initializable {
  generatePreviews(links: LinkPreviewPubsubRequest["links"]): Promise<LinkPreview[]>;
}

export type PreviewPubsubRequest = {
  document: {
    id: string;
    provider: string;
    path: string;
    encryption_algo?: string;
    encryption_key?: string;
    chunks?: number;
    mime?: string;
    filename?: string;
  };
  output: {
    provider: string;
    path: string;
    encryption_algo?: string;
    encryption_key?: string;
    pages?: number; //Max number of pages for the document
    width?: number; //Max width for the thumbnails
    height?: number; //Max height for the thumbnails
  };
};

export type PreviewClearPubsubRequest = {
  document: {
    id: string;
    provider: string;
    path: string;
    thumbnails_number: number;
  };
};

export type PreviewPubsubCallback = {
  document: {
    id: string;
    path: string;
    provider: string;
  };
  thumbnails: {
    path: string;
    size: number;
    type: string;
    width: number;
    height: number;
    provider?: string;
    index?: number;
  }[];
};

export type ThumbnailResult = {
  path: string;
  width: number;
  height: number;
  size: number;
  type: string;
};

export type temporaryThumbnailFile = {
  filePath: string;
  fileName: string;
  folder: string;
};

export type LinkPreview = {
  title: string;
  description: string | null;
  domain: string;
  favicon: string | null;
  img: string | null;
  img_height: number | null;
  img_width: number | null;
  url: string;
};

export type LinkPreviewPubsubRequest = {
  links: string[];
  message: MessageLocalEvent;
};

export type LinkPreviewPubsubCallback = {
  message: MessageLocalEvent;
  previews: LinkPreview[];
};
