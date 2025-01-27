import { exportVariable, getInput, setFailed } from "@actions/core";
import * as github from "@actions/github";
import { isUrl, isDate } from "./utils.js";
import { saveBookmarks } from "./save-bookmarks";
import { addBookmark, Bookmark } from "./add-bookmark";
import { getMetadata } from "./get-metadata";

export async function action() {
  try {
    // Get client_payload
    const payload = github.context.payload.client_payload;

    // Validate client_payload
    if (!payload) return setFailed("Missing `client_payload`");
    if (!payload.url) return setFailed("Missing `url` in payload");

    const { url, notes } = payload;

    if (!isUrl(url)) {
      return setFailed(`The \`url\` "${url}" is not valid`);
    }

    if (payload.date && !isDate(payload.date)) {
      return setFailed(
        `The \`date\` "${payload.date}" must be in YYYY-MM-DD format`
      );
    }
    const date = payload.date || new Date().toISOString().slice(0, 10);
    exportVariable("DateBookmarked", date);

    const fileName = getInput("fileName");

    const page = (await getMetadata({ url, notes, date })) as Bookmark;
    const bookmarks = await addBookmark(fileName, page);
    if (!bookmarks) {
      setFailed(`Unable to add bookmark`);
      return;
    }
    await saveBookmarks({ fileName, bookmarks });
  } catch (error) {
    setFailed(error.message);
  }
}

export default action();
