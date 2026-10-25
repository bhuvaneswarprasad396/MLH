/** Screenshots are kept only in this browser as data URLs. */
export async function signPrivateFile(fileUri) {
  return fileUri;
}

export async function uploadPrivate(file) {
  if (!file) throw new Error('Choose a screenshot first.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The screenshot could not be read.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}