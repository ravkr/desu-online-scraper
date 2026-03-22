import {mkdir, readFile, writeFile} from "node:fs/promises";
import {config} from "../config.js";
import {BrowserController} from "./BrowserController.js";

async function getCachedFile(path: string) {
    const cachePath = `./cache/${path}`;
    try {
        return await readFile(cachePath, 'utf-8');
    } catch (err) {
        return null;
    }
}

async function downloadFile(filepath: string, saveCache: boolean = true) {
    const page = await BrowserController.getInstance().newPage();

    await page.setViewport(null);

    const response = await page.goto(`${config.domain}${filepath}`);

    const data = await response!.text();

    await page.close();

    if (saveCache) {
        const cachePath = `./cache/${filepath}`;
        await mkdir(`./cache`, {recursive: true});
        await writeFile(cachePath, data, 'utf-8');
    }

    return data;
}

export async function getFile(path: string) {
    const cachedData = await getCachedFile(path);
    if (cachedData) {
        return cachedData;
    }

    return downloadFile(path, true);
}
