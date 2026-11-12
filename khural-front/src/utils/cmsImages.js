import { AboutApi } from "../api/client.js";
import { normalizeFilesUrl } from "./filesUrl.js";

/**
 * URL файла CMS-блока по его fileId.
 * Файлы, загруженные через бэкенд, отдаются по /files/v2/{id}.
 */
export function cmsFileUrl(fileId) {
  const id = String(fileId ?? "").trim();
  if (!id) return "";
  // Уже готовая ссылка (внешняя или относительная) — только нормализуем.
  if (/^(https?:|data:|blob:|\/)/i.test(id)) return normalizeFilesUrl(id);
  return normalizeFilesUrl(`/files/v2/${id}`);
}

export function cmsImageUrl(fileId) {
  return cmsFileUrl(fileId);
}

/** ID контент-раздела страницы нужной локали (для загрузки файлов блоков). */
export function findPageContentId(page, locale = "ru") {
  const list = Array.isArray(page?.content) ? page.content : [];
  if (list.length === 0) return null;
  const wanted = String(locale || "ru").toLowerCase();
  const match =
    list.find((item) => String(item?.locale || "").toLowerCase() === wanted) || list[0];
  return match?.id ?? null;
}

/**
 * Разбирает блоки из формы:
 * - contentBlocks — блоки, которые сохраняются обычным PATCH/POST страницы;
 * - uploadBlocks + files — блоки с новыми файлами, их нужно добавить через batch;
 * - replacedBlockIds — id существующих блоков, файл которых заменили.
 */
export function collectBlockUploads(blocks) {
  const contentBlocks = [];
  const uploadBlocks = [];
  const files = [];
  const replacedBlockIds = [];

  (Array.isArray(blocks) ? blocks : []).forEach((block, index) => {
    const type = block?.type || "text";
    // Изображение и видео могут содержать выбранный, но ещё не загруженный файл.
    const isMedia = type === "image" || type === "video";
    const mediaField =
      type === "image" ? block?.image : type === "video" ? block?.video : null;
    const pendingFile =
      mediaField?.file && typeof File !== "undefined" && mediaField.file instanceof File
        ? mediaField.file
        : null;
    // Для медиа источник fileId — только поле формы. Если пользователь удалил
    // файл, поле становится пустым и старый fileId не возвращается.
    const fileId = String(
      isMedia ? mediaField?.fileId || "" : block?.fileId || ""
    ).trim();

    const payload = {
      type,
      order: block?.order !== undefined ? block.order : index,
      content: block?.content || null,
      caption: block?.caption || null,
      alt: block?.alt || null,
      fileId: fileId || null,
      metadata: block?.metadata || null,
    };
    if (Array.isArray(block?.fileIds)) payload.fileIds = block.fileIds;

    if (pendingFile) {
      if (block?.id != null) replacedBlockIds.push(block.id);
      const uploadBlock = { ...payload };
      delete uploadBlock.fileId;
      uploadBlocks.push(uploadBlock);
      files.push(pendingFile);
      return;
    }

    contentBlocks.push(payload);
  });

  return { contentBlocks, uploadBlocks, files, replacedBlockIds };
}

/**
 * После создания/сохранения страницы догружает файлы новых блоков через
 * POST /pages/{id}/content/{contentId}/blocks/batch и удаляет блоки, которые
 * заменили или убрали в форме.
 */
export async function applyBlockUploads({
  pageId,
  page,
  locale = "ru",
  uploadBlocks = [],
  files = [],
  removedBlockIds = [],
  reloadPage,
}) {
  const hasUploads = uploadBlocks.length > 0 && files.length > 0;
  if (!hasUploads && removedBlockIds.length === 0) return;

  let currentPage = page;
  let contentId = findPageContentId(currentPage, locale);

  if (contentId == null && typeof reloadPage === "function") {
    currentPage = await reloadPage();
    contentId = findPageContentId(currentPage, locale);
  }

  if (contentId == null) {
    if (hasUploads) {
      throw new Error("Не удалось определить раздел контента для загрузки файла");
    }
    return;
  }

  if (hasUploads) {
    if (uploadBlocks.length !== files.length) {
      throw new Error("Не удалось сопоставить файлы и блоки");
    }
    await AboutApi.addBlocksWithFiles(pageId, contentId, uploadBlocks, files);
  }

  // Старые блоки удаляем только после успешной загрузки новых файлов,
  // чтобы при ошибке загрузки не потерять уже существующее изображение.
  for (const blockId of removedBlockIds) {
    if (blockId == null) continue;
    try {
      await AboutApi.deletePageBlock(pageId, contentId, blockId);
    } catch (error) {
      // 404 — блок уже удалён вместе с сохранением страницы.
      if (error?.status !== 404) {
        console.warn("Не удалось удалить старый блок страницы:", error);
      }
    }
  }
}
