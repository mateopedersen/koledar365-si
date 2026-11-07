// PDF.js 6 exposes destruction on the loading task, not the document proxy.
// The task owns worker/network resources even if loading or rendering fails.
export async function usingPdfDocument(library, options, useDocument) {
  const task = library.getDocument(options);
  let failed = false;
  try {
    return await useDocument(await task.promise);
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    try {
      await task.destroy();
    } catch (error) {
      // Preserve the original parse/render failure if cleanup also fails.
      if (!failed) throw error;
    }
  }
}
