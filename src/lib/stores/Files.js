import { writable } from 'svelte/store';

export const files = writable([]);

export function setFiles(newFiles) {
    files.set(newFiles);
}

export let trackers = writable({});

files.subscribe($files => {
    $files.forEach(file => trackers.update(store => ({ ...store, [file.name]: '' })));
});